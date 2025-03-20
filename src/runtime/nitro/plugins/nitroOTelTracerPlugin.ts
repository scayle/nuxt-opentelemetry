import type { H3Event } from 'h3'
import {
  getRequestHeader,
  getRequestIP,
  getRequestURL,
  getResponseHeader,
  getResponseStatus,
  isError,
} from 'h3'
import type { NitroApp } from 'nitropack/types'
import { SpanStatusCode, trace, context } from '@opentelemetry/api'
import { getRPCMetadata, RPCType } from '@opentelemetry/core'
import type { Span, Context } from '@opentelemetry/api'
// NOTE: We need to import here from the Nuxt server-specific #imports to mitigate
// unresolved dependencies in the imported composables from Nitro(nitropack).
// This results in `nuxi typecheck` not being able to properly infer the correct
// import and throw an error without explicit `@ts-expect-error`
// @ts-expect-error TS2724: '"#imports"' has no exported member named 'defineNitroPlugin'. Did you mean 'defineNuxtPlugin'?
import { defineNitroPlugin, useRuntimeConfig } from '#imports'

const tracer = trace.getTracer(
  '__otel_package_name',
  '__otel_version',
)

function getFilter(pathBlocklist?: string): (path: string) => boolean {
  if (!pathBlocklist) {
    return (_path: string) => true
  }

  try {
    const regex = new RegExp(pathBlocklist)
    return (path: string) => regex.test(path)
  } catch {
    return (path: string) => path.includes(pathBlocklist)
  }
}

function getReplace(pathReplace?: string[]): (path: string) => string {
  if (!pathReplace || pathReplace.length !== 2) {
    return (path: string) => path
  }

  try {
    const regex = new RegExp(pathReplace[0])
    return (path: string) => path.replace(regex, pathReplace[1])
  } catch {
    return (path: string) => path.replace(pathReplace[0], pathReplace[1])
  }
}

declare module 'h3' {
  export interface H3EventContext {
    otel?: {
      ctx: Context
      span: Span
      _endTime?: number
    }
  }
}

/**
 * Extract the request header attributes from an H3 event according to the configuration and OTEL specification
 * @param event The H3 request event
 * @param headers A list of headers to include
 * @see https://opentelemetry.io/docs/specs/semconv/http/http-spans/#http-server-semantic-conventions
 * @returns An object with the request header attributes
 */
function getRequestHeaderAttributes(
  event: H3Event,
  headers: string[],
): Record<string, string[]> {
  return headers.reduce<Record<string, string[]>>((attributes, header) => {
    const headerValue = getRequestHeader(event, header)
    if (headerValue) {
      // Note: The OTEL spec requires the value to be an array
      attributes[`http.request.header.${header.toLowerCase()}`] = [headerValue]
    }
    return attributes
  }, {})
}

/**
 * Extract the response header attributes from an H3 event according to the configuration and OTEL specification
 * @param event The H3 request event
 * @param headers A list of headers to include
 * @see https://opentelemetry.io/docs/specs/semconv/http/http-spans/#http-server-semantic-conventions
 * @returns An object with the response header attributes
 */
function getResponseHeaderAttributes(
  event: H3Event,
  headers: string[],
): Record<string, string[]> {
  return headers.reduce<Record<string, string[]>>((attributes, header) => {
    const headerValue = getResponseHeader(event, header)
    if (headerValue) {
      // Note: The OTEL spec requires the value to be an array
      attributes[`http.response.header.${header.toLowerCase()}`] =
        Array.isArray(headerValue) ? headerValue : [String(headerValue)]
    }
    return attributes
  }, {})
}

/**
 * Update the route attributes based on the matched route in the h3 or vue router
 * @param event The H3Event for the request
 * @param replace The configured replacement function for route names
 * @param span The span representing the nitro request
 */
function addRouteAttributes(
  event: H3Event,
  replace: (path: string) => string,
  span: Span,
) {
  // The matchedRoute exists after the handler has run
  const matchedRoute = event.context.matchedVueRoute?.[event.path]?.path ??
    event.context.matchedRoute?.path
  const routeName = replace(matchedRoute ?? event.path)

  span.updateName(`${event.method} ${routeName}`)
  span.setAttribute('http.route', routeName)

  const rpcMetadata = getRPCMetadata(context.active())
  if (rpcMetadata?.type === RPCType.HTTP) {
    rpcMetadata.route = routeName ?? '/'
  }
}

/**
 * Instrument Nitro to create spans for each request
 * Spans are created according to the semantic conventions for HTTP
 * https://opentelemetry.io/docs/specs/semconv/http/http-spans/
 */
export default defineNitroPlugin((nitro: NitroApp) => {
  const config = useRuntimeConfig().opentelemetry

  if (!config.enabled) {
    return
  }

  // Find the h3 handler which is the nitro router
  const index = nitro.h3App.stack.findIndex(
    (layer) => layer.handler.__resolve__,
  )
  const router = nitro.h3App.stack[index]

  if (!router) {
    console.warn('Unable to find router handler')
    return
  }

  const filter = getFilter(config.pathBlocklist)
  const replace = getReplace(config.pathReplace)

  nitro.hooks.hook('afterResponse', (event) => {
    if (!event.context.otel?.span) {
      return
    }

    const span = event.context.otel.span
    const status = getResponseStatus(event)

    // Only 5xx errors should mark the span as Error for a server-side span
    // https://opentelemetry.io/docs/specs/semconv/http/http-spans/#status
    if (status >= 500 && status <= 599) {
      span.setAttribute('error.type', 'Unknown Error')
      span.setStatus({ code: SpanStatusCode.ERROR })
    } else {
      span.setStatus({ code: SpanStatusCode.OK })
    }

    span.setAttribute(
      'http.response.status_code',
      status,
    )

    span.setAttributes(
      getResponseHeaderAttributes(
        event,
        config.responseHeaders ?? [],
      ),
    )

    addRouteAttributes(event, replace, span)

    span.end(event.context.otel._endTime)
  })

  nitro.hooks.hook('error', (e, { event }) => {
    if (!event) {
      const span = trace.getActiveSpan()
      if (span) {
        span.recordException(e)
        span.end()
      }
      return
    }

    if (!event.context.otel?.span) {
      return
    }

    const { span } = event.context.otel

    if (isError(e)) {
      // Only 5xx errors should mark the span as Error for a server-side span
      // https://opentelemetry.io/docs/specs/semconv/http/http-spans/#status
      if (e.statusCode >= 500 && e.statusCode <= 599) {
        span.setAttribute('error.type', 'Unknown Error')
        span.setStatus({ code: SpanStatusCode.ERROR })
      }
      span.setAttribute(
        'http.response.status_code',
        e.statusCode,
      )
      if (e.cause instanceof Error) {
        span.recordException(e.cause)
        span.setAttribute('error.type', e.cause.name)
      }
    } else {
      if (e instanceof Error) {
        span.recordException(e)
        span.setAttribute('error.type', e.name)
      }
      span.setStatus({ code: SpanStatusCode.ERROR })
      // Unknown errors will be 500, but if we were to call getResponseStatus
      // at this point, it would return 200 as the error has not been processed at this point.
      span.setAttribute(
        'http.response.status_code',
        500,
      )
    }

    span.setAttributes(
      getResponseHeaderAttributes(
        event,
        config.responseHeaders ?? [],
      ),
    )

    addRouteAttributes(event, replace, span)
    span.end(event.context.otel._endTime)
  })

  const originalHandler = router.handler
  // Wrap the nitro router with code which adds a span
  nitro.h3App.stack.splice(index, 1, {
    ...router,
    handler: async (event) => {
      const url = getRequestURL(event)

      if (filter(url.pathname)) {
        return await originalHandler(event)
      }

      const span = tracer.startSpan(
        `${event.method} ${replace(event.path)}`,
        {
          attributes: {
            // Required
            'http.request.method': event.method,
            'url.path': url.pathname,
            'url.scheme': url.protocol.replace(':', ''),
            'network.protocol.name': 'http',

            // Recommended
            'client.address': getRequestIP(event, { xForwardedFor: true }),
            'client.port': event.node.req.socket.remotePort,
            'server.address': url.hostname,
            'server.port': url.port,
            'network.peer.address': getRequestIP(event, {
              xForwardedFor: true,
            }),
            'network.peer.port': event.node.req.socket.remotePort,

            'user_agent.original': getRequestHeader(event, 'User-Agent'),
            'network.protocol.version': event.node.req.httpVersion,

            // Conditionally Required
            ...(url.search ? { 'url.query': url.search } : {}),

            // Headers
            ...getRequestHeaderAttributes(event, config.requestHeaders ?? []),
          },
        },
      )

      const ctx = trace.setSpan(context.active(), span)

      event.context.otel = {
        span,
        ctx,
        _endTime: undefined,
      }

      return await context.with(trace.setSpan(ctx, span), async () => {
        const result = await originalHandler(event)
        if (event.context.otel) {
          event.context.otel._endTime = Date.now()
        }
        return result
      })
    },
  })
})
