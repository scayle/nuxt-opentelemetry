import { context, trace, SpanStatusCode } from '@opentelemetry/api'
import type { Context, Span } from '@opentelemetry/api'
import { getRPCMetadata, RPCType } from '@opentelemetry/core'
import { InstrumentationBase } from '@opentelemetry/instrumentation'
import type { InstrumentationModuleDefinition } from '@opentelemetry/instrumentation'
import {
  getRequestURL,
  getRequestIP,
  getRequestHeader,
  getResponseHeader,
  getResponseStatus,
  isError,
} from 'h3'
import type { H3Event } from 'h3'
import type { NitroApp } from 'nitropack/types'
import { subscribe, unsubscribe } from 'node:diagnostics_channel'
import type { ChannelListener } from 'node:diagnostics_channel'

interface NitroInstrumentationConfig {
  enabled?: boolean

  routeNameHook?: RouteNameHook
  ignoreRequestHook?: (event: H3Event) => boolean

  requestHeaders?: string[]
  responseHeaders?: string[]
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

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var __nitro__: {
    app: NitroApp
    [key: string]: any
  }
  // eslint-disable-next-line no-var, vars-on-top
  var __package_name: string
  // eslint-disable-next-line no-var, vars-on-top
  var __package_version: string
}

const PACKAGE_NAME = __package_name
const PACKAGE_VERSION = __package_version

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

type EventHook = (event: H3Event, span: Span) => void
type RouteNameHook = (event: H3Event) => string | undefined

export class NitroInstrumentation
  extends InstrumentationBase<NitroInstrumentationConfig>
{
  isInstalled: boolean = false

  requestHook?: EventHook
  responseHook?: EventHook
  routeNameHook?: RouteNameHook
  ignoreRequestHook?: (event: H3Event) => boolean

  _initHandler?: ChannelListener

  constructor(config?: NitroInstrumentationConfig) {
    super(PACKAGE_NAME, PACKAGE_VERSION, config ?? { enabled: true })
    this.ignoreRequestHook = config?.ignoreRequestHook
    this.routeNameHook = config?.routeNameHook
  }

  updateRouteAttributes(event: H3Event, span: Span) {
    const route = this.getRouteName(event)

    span.updateName(`${event.method} ${route}`)
    span.setAttribute('http.route', route)

    const rpcMetadata = getRPCMetadata(context.active())
    if (rpcMetadata?.type === RPCType.HTTP) {
      rpcMetadata.route = route ?? '/'
    }
  }

  getRouteName(event: H3Event) {
    return this.routeNameHook
      ? this.routeNameHook(event) ?? event.path
      : event.path
  }

  install(nitroApp: NitroApp): void {
    if (!this.isInstalled) {
      // Find the h3 handler which is the nitro router
      const index = nitroApp.h3App.stack.findIndex(
        (layer) => layer.handler.__resolve__,
      )
      const router = nitroApp.h3App.stack[index]

      if (!router) {
        console.warn('Unable to find router handler')
        return
      }

      // Use the beforeResponse hook to update the route information
      // At this point we have the matchedRoute informationw which is not available
      // in the request hook, but afterResponse is too late to affect the http span.
      nitroApp.hooks.hook('beforeResponse', (event) => {
        if (!event.context.otel?.span) {
          return
        }
        const span = event.context.otel.span
        this.updateRouteAttributes(event, span)
      })

      // In the response hook, we alter attributes to include information from the response and end the span
      nitroApp.hooks.hook('afterResponse', (event) => {
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
            this.getConfig().responseHeaders ?? [],
          ),
        )

        span.end(event.context.otel._endTime)
      })

      nitroApp.hooks.hook('error', (e, { event }) => {
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
            this.getConfig().responseHeaders ?? [],
          ),
        )

        this.updateRouteAttributes(event, span)
        span.end(event.context.otel._endTime)
      })

      // Patch Nitro to wrap all handler calls inside `context.with` so the span is used as the parent
      // Here we create the span, add initial attributes and extend the h3 event
      const originalHandler = router.handler
      nitroApp.h3App.stack.splice(index, 1, {
        ...router,
        handler: async (event) => {
          if (!this.isEnabled() || this.ignoreRequestHook?.(event)) {
            return await originalHandler(event)
          }

          const url = getRequestURL(event)

          const route = this.getRouteName(event)

          const span = this.tracer.startSpan(
            `${event.method} ${route}`,
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
                ...(url.search ? { 'url.query': url.search.substring(1) } : {}),

                // Headers
                ...getRequestHeaderAttributes(
                  event,
                  this.getConfig().requestHeaders ?? [],
                ),
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

      this.isInstalled = true
    }
  }

  override enable(): void {
    if (!this._initHandler) {
      this._initHandler = () => {
        this.install(globalThis.__nitro__.app)
      }
      subscribe('nitro.init', this._initHandler)
    }

    if (globalThis.__nitro__?.app) {
      this.install(globalThis.__nitro__.app)
    }

    super.enable()
  }

  override disable(): void {
    if (this._initHandler) {
      unsubscribe('nitro.init', this._initHandler)
      this._initHandler = undefined
    }

    super.disable()
  }

  override setConfig(config: NitroInstrumentationConfig): void {
    this.routeNameHook = config?.routeNameHook
    this.ignoreRequestHook = config?.ignoreRequestHook

    super.setConfig(config)
  }

  protected override init():
    | InstrumentationModuleDefinition
    | InstrumentationModuleDefinition[]
    | void
  {
    return []
  }
}
