import { $fetchRaw, setup } from 'nitro-test-utils/e2e'
import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'
import { context, SpanStatusCode, trace } from '@opentelemetry/api'
import type { ReadableSpan } from '@opentelemetry/sdk-trace-node'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { fileURLToPath } from 'node:url'
import { NitroInstrumentation } from '../src/runtime/instrumentation'
import { getReplace, getFilter } from '../src/runtime/utils'

interface SpanGroup {
  nitroSpan?: ReadableSpan
  httpSpan?: ReadableSpan
  otherSpans: ReadableSpan[]
}

function getImportantSpans(spans: ReadableSpan[]): SpanGroup {
  const grouped: SpanGroup = {
    nitroSpan: undefined,
    httpSpan: undefined,
    otherSpans: [],
  }
  for (const span of spans) {
    if (
      span.instrumentationScope.name === '@opentelemetry/instrumentation-http'
    ) {
      grouped.httpSpan = span
    } else if (
      span.instrumentationScope.name === '@scayle/nuxt-opentelemetry'
    ) {
      grouped.nitroSpan = span
    } else {
      grouped.otherSpans.push(span)
    }
  }
  return grouped
}

function validateSpans(
  httpSpan?: ReadableSpan,
  nitroSpan?: ReadableSpan,
): asserts nitroSpan is ReadableSpan {
  expect(nitroSpan).toBeDefined()
  expect(httpSpan).toBeDefined()
  expect(nitroSpan?.parentSpanContext?.spanId).toEqual(
    httpSpan?.spanContext().spanId,
  )
  expect(nitroSpan?.attributes['http.route']).toEqual(
    httpSpan?.attributes['http.route'],
  )
}

// NOTE: This test suite requires careful handling of the Nitro server initialization
// to prevent timeout issues in CI environments.
//
// Timeout Mitigation Strategy:
// 1. Increased timeout to 60s (from 20s) to accommodate slower CI environments
// 2. Nitro server setup MUST remain in the describe block's initialization phase
//      - Moving it to beforeAll or beforeEach causes "server not running" errors
//      - This ensures proper server state for all test cases
// 3. Proper cleanup in afterEach to prevent memory leaks and state pollution
//      - Disabling instrumentations
//      - Resetting configurations
//      - Flushing span processor
//      - Clearing exporter data
describe('test instrumentation', { timeout: 60000 }, async () => {
  // Initialize all instrumentation and tracing components
  const httpInstrumentation = new HttpInstrumentation()
  const instrumentation = new NitroInstrumentation()
  const contextManager = new AsyncHooksContextManager()
  const memoryExporter = new InMemorySpanExporter()
  const spanProcessor = new SimpleSpanProcessor(memoryExporter)
  const provider = new NodeTracerProvider({
    spanProcessors: [spanProcessor],
  })

  // Set up the Nitro test environment.
  // This needs to run in the describe block to ensure proper server initialization
  await setup({
    rootDir: fileURLToPath(new URL('fixture', import.meta.url)),
    mode: 'production',
  })

  // Configure necessary OpenTelemetry providers and instrumentations.
  trace.setGlobalTracerProvider(provider)
  context.setGlobalContextManager(contextManager)
  httpInstrumentation.setTracerProvider(provider)
  instrumentation.setTracerProvider(provider)

  // Reset hook that runs before each test.
  // Ensures each test starts with clean instrumentation state.
  beforeEach(() => {
    instrumentation.enable()
    httpInstrumentation.enable()
    contextManager.enable()
  })

  // Cleanup hook that runs after each test.
  // Properly tears down instrumentation and cleans up spans
  // to prevent memory leaks and state pollution between tests.
  afterEach(() => {
    contextManager.disable()
    instrumentation.disable()
    instrumentation.setConfig({})
    httpInstrumentation.disable()
    spanProcessor.forceFlush()
    memoryExporter.reset()
  })

  it('successful request', async () => {
    await $fetchRaw('/hello')

    const spans = memoryExporter
      .getFinishedSpans()

    const { nitroSpan, httpSpan } = getImportantSpans(spans)
    validateSpans(httpSpan, nitroSpan)

    expect(nitroSpan.attributes).toMatchObject({
      'http.request.method': 'GET',
      'url.path': '/hello',
      'url.scheme': 'http',
      'http.response.status_code': 200,
    })
    expect(nitroSpan.parentSpanContext).toBeDefined()
    expect(nitroSpan.status.code).toEqual(SpanStatusCode.OK)
  })

  it('includes search query attribute', async () => {
    await $fetchRaw('/hello?param=true')

    const spans = memoryExporter
      .getFinishedSpans()

    const { nitroSpan, httpSpan } = getImportantSpans(spans)
    validateSpans(httpSpan, nitroSpan)

    expect(nitroSpan.attributes).toMatchObject({
      'http.request.method': 'GET',
      'url.path': '/hello',
      'url.scheme': 'http',
      'http.response.status_code': 200,
      'url.query': 'param=true',
    })
    expect(nitroSpan.parentSpanContext).toBeDefined()
    expect(nitroSpan.status.code).toEqual(SpanStatusCode.OK)
  })

  it('successful request with alternative status code', async () => {
    await $fetchRaw('/created')

    const spans = memoryExporter
      .getFinishedSpans()

    const { nitroSpan, httpSpan } = getImportantSpans(spans)
    validateSpans(httpSpan, nitroSpan)

    expect(nitroSpan.attributes).toMatchObject({
      'http.request.method': 'GET',
      'url.path': '/created',
      'url.scheme': 'http',
      'http.response.status_code': 204,
    })
    expect(nitroSpan.parentSpanContext).toBeDefined()
    expect(nitroSpan.status.code).toEqual(SpanStatusCode.OK)
  })

  it('thrown error in handler', async () => {
    await $fetchRaw('/throw')

    const spans = memoryExporter
      .getFinishedSpans()

    const { nitroSpan, httpSpan } = getImportantSpans(spans)
    validateSpans(httpSpan, nitroSpan)

    expect(nitroSpan.attributes).toMatchObject({
      'http.request.method': 'GET',
      'url.path': '/throw',
      'url.scheme': 'http',
      'http.response.status_code': 500,
    })
    expect(nitroSpan.parentSpanContext).toBeDefined()
    expect(nitroSpan.status.code).toEqual(SpanStatusCode.ERROR)
  })

  it('thrown h3 error in handler', async () => {
    await $fetchRaw('/throw_h3')

    const spans = memoryExporter
      .getFinishedSpans()

    const { nitroSpan, httpSpan } = getImportantSpans(spans)
    validateSpans(httpSpan, nitroSpan)

    expect(nitroSpan.attributes).toMatchObject({
      'http.request.method': 'GET',
      'url.path': '/throw_h3',
      'url.scheme': 'http',
      'http.response.status_code': 503,
    })
    expect(nitroSpan.parentSpanContext).toBeDefined()
    expect(nitroSpan.status.code).toEqual(SpanStatusCode.ERROR)
  })

  it('thrown error in response hook', async () => {
    await $fetchRaw('/plugin_error')

    const spans = memoryExporter
      .getFinishedSpans()

    const { nitroSpan, httpSpan } = getImportantSpans(spans)
    validateSpans(httpSpan, nitroSpan)

    expect(nitroSpan.attributes).toMatchObject({
      'http.request.method': 'GET',
      'url.path': '/plugin_error',
      'url.scheme': 'http',
      'http.response.status_code': 500,
    })
    expect(nitroSpan.parentSpanContext).toBeDefined()
    expect(nitroSpan.status.code).toEqual(SpanStatusCode.ERROR)
  })

  it('response with 4xx status code', async () => {
    await $fetchRaw('/missing')

    const spans = memoryExporter
      .getFinishedSpans()

    const { nitroSpan, httpSpan } = getImportantSpans(spans)
    validateSpans(httpSpan, nitroSpan)

    expect(nitroSpan.attributes).toMatchObject({
      'http.request.method': 'GET',
      'url.path': '/missing',
      'url.scheme': 'http',
      'http.response.status_code': 404,
    })
    expect(nitroSpan.parentSpanContext).toBeDefined()
    expect(nitroSpan.status.code).toEqual(SpanStatusCode.OK) // 4xx errors should be reported as OK
  })

  it('response with 5xx status code', async () => {
    await $fetchRaw('/bad_gateway')

    const spans = memoryExporter
      .getFinishedSpans()

    const { nitroSpan, httpSpan } = getImportantSpans(spans)
    validateSpans(httpSpan, nitroSpan)

    expect(nitroSpan.attributes).toMatchObject({
      'http.request.method': 'GET',
      'url.path': '/bad_gateway',
      'url.scheme': 'http',
      'http.response.status_code': 502,
    })
    expect(nitroSpan.parentSpanContext).toBeDefined()
    expect(nitroSpan.status.code).toEqual(SpanStatusCode.ERROR) // 4xx errors should be reported as OK
  })

  it('filtered routes', async () => {
    instrumentation.setConfig({
      ignoreRequestHook: (event) => getFilter('hello')(event.path),
    })

    await $fetchRaw('/hello')

    const spans = memoryExporter
      .getFinishedSpans()

    const { nitroSpan, httpSpan } = getImportantSpans(spans)
    expect(httpSpan).toBeDefined()
    expect(nitroSpan).toBeUndefined()

    // There should be no nitro span
    expect(spans.length).toBe(1)
  })

  it('filtered routes - non-regex', async () => {
    instrumentation.setConfig({
      ignoreRequestHook: (event) => getFilter('hello_:)')(event.path),
    })

    await $fetchRaw('/hello_:)')

    const spans = memoryExporter
      .getFinishedSpans()

    const { nitroSpan, httpSpan } = getImportantSpans(spans)
    expect(httpSpan).toBeDefined()
    expect(nitroSpan).toBeUndefined()

    // There should be no nitro span
    expect(spans.length).toBe(1)
  })

  it('disabled instrumentation', async () => {
    instrumentation.disable()

    await $fetchRaw('/hello_:)')

    const spans = memoryExporter
      .getFinishedSpans()

    const { nitroSpan, httpSpan } = getImportantSpans(spans)
    expect(httpSpan).toBeDefined()
    expect(nitroSpan).toBeUndefined()

    // There should be no nitro span
    expect(spans.length).toBe(1)
  })

  it('child spans', async () => {
    await $fetchRaw('/with_children')

    const spans = memoryExporter
      .getFinishedSpans()

    const { nitroSpan, httpSpan } = getImportantSpans(spans)
    validateSpans(httpSpan, nitroSpan)

    expect(spans.length).toBe(3)
  })

  it('records request headers in span attributes', async () => {
    instrumentation.setConfig({
      requestHeaders: ['x-my-header', 'accept'],
    })
    await $fetchRaw('/hello', {
      headers: {
        'x-my-header': 'value1',
        'x-skipped-header': 'value2',
      },
    })

    const spans = memoryExporter
      .getFinishedSpans()

    const { nitroSpan, httpSpan } = getImportantSpans(spans)
    validateSpans(httpSpan, nitroSpan)

    expect(nitroSpan.attributes).toMatchObject({
      'http.request.method': 'GET',
      'url.path': '/hello',
      'url.scheme': 'http',
      'http.response.status_code': 200,
      'http.request.header.accept': ['application/json'],
      'http.request.header.x-my-header': ['value1'],
    })
    expect(nitroSpan.attributes['http.request.header.x-skipped-header'])
      .toBeUndefined()
    expect(nitroSpan.parentSpanContext).toBeDefined()
    expect(nitroSpan.status.code).toEqual(SpanStatusCode.OK)
  })

  it('records request headers in span attributes - doubled headers', async () => {
    instrumentation.setConfig({
      requestHeaders: ['x-doubled-header'],
    })
    const headers = new Headers()
    headers.append('x-doubled-header', 'value1')
    headers.append('x-doubled-header', 'value2')

    await $fetchRaw('/hello', {
      headers,
    })

    const spans = memoryExporter
      .getFinishedSpans()

    const { nitroSpan, httpSpan } = getImportantSpans(spans)
    validateSpans(httpSpan, nitroSpan)

    expect(nitroSpan.attributes).toMatchObject({
      'http.request.method': 'GET',
      'url.path': '/hello',
      'url.scheme': 'http',
      'http.response.status_code': 200,
      'http.request.header.x-doubled-header': ['value1, value2'],
    })
    expect(nitroSpan.parentSpanContext).toBeDefined()
    expect(nitroSpan.status.code).toEqual(SpanStatusCode.OK)
  })

  it('records response headers in span attributes', async () => {
    instrumentation.setConfig({
      responseHeaders: ['content-type'],
    })
    await $fetchRaw('/hello')

    const spans = memoryExporter
      .getFinishedSpans()

    const { nitroSpan, httpSpan } = getImportantSpans(spans)
    validateSpans(httpSpan, nitroSpan)

    expect(nitroSpan.attributes).toMatchObject({
      'http.request.method': 'GET',
      'url.path': '/hello',
      'url.scheme': 'http',
      'http.response.status_code': 200,
      'http.response.header.content-type': ['text/html'],
    })
    expect(nitroSpan.parentSpanContext).toBeDefined()
    expect(nitroSpan.status.code).toEqual(SpanStatusCode.OK)
  })

  it('route name hook', async () => {
    instrumentation.setConfig({
      routeNameHook(event) {
        if (event.path === '/hello') {
          return 'hello-world'
        }
      },
    })
    await $fetchRaw('/hello')

    const spans = memoryExporter
      .getFinishedSpans()

    const { nitroSpan, httpSpan } = getImportantSpans(spans)
    validateSpans(httpSpan, nitroSpan)

    expect(nitroSpan.attributes).toMatchObject({
      'http.request.method': 'GET',
      'url.path': '/hello',
      'url.scheme': 'http',
      'http.response.status_code': 200,
      'http.route': 'hello-world',
    })
    expect(nitroSpan.parentSpanContext).toBeDefined()
    expect(nitroSpan.status.code).toEqual(SpanStatusCode.OK)
    expect(nitroSpan.name).toEqual('GET hello-world')
  })

  it('replace path function', async () => {
    instrumentation.setConfig({
      routeNameHook: (event) =>
        getReplace(['^/(en|de|fr)/', '/:locale/'])(event.path),
    })
    await $fetchRaw('/de/hello')

    const spans = memoryExporter
      .getFinishedSpans()

    const { nitroSpan, httpSpan } = getImportantSpans(spans)
    validateSpans(httpSpan, nitroSpan)

    expect(nitroSpan.attributes).toMatchObject({
      'http.request.method': 'GET',
      'url.path': '/de/hello',
      'url.scheme': 'http',
      'http.response.status_code': 200,
      'http.route': '/:locale/hello',
    })
    expect(nitroSpan.parentSpanContext).toBeDefined()
    expect(nitroSpan.status.code).toEqual(SpanStatusCode.OK)
    expect(nitroSpan.name).toEqual('GET /:locale/hello')
  })

  it('replace path function - non-regex', async () => {
    instrumentation.setConfig({
      routeNameHook: (event) => getReplace(['_:)', '_smile'])(event.path),
    })

    await $fetchRaw('/hello_:)')

    const spans = memoryExporter
      .getFinishedSpans()

    const { nitroSpan, httpSpan } = getImportantSpans(spans)
    validateSpans(httpSpan, nitroSpan)

    expect(nitroSpan.attributes).toMatchObject({
      'http.request.method': 'GET',
      'url.path': '/hello_:)',
      'url.scheme': 'http',
      'http.response.status_code': 200,
      'http.route': '/hello_smile',
    })
    expect(nitroSpan.parentSpanContext).toBeDefined()
    expect(nitroSpan.status.code).toEqual(SpanStatusCode.OK)
    expect(nitroSpan.name).toEqual('GET /hello_smile')
  })
})
