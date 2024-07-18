import {
  getRequestHeader,
  getRequestIP,
  getRequestURL,
  getResponseStatus,
} from 'h3'
import type { NitroApp } from 'nitropack'
import { type Span, SpanStatusCode, context, trace } from '@opentelemetry/api'
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

/**
 * Instrument Nitro to create spans for each request
 * Spans are created according to the semantic conventions for HTTP
 * https://opentelemetry.io/docs/specs/semconv/http/http-spans/
 */
export default defineNitroPlugin((nitro: NitroApp) => {
  const config = useRuntimeConfig().opentelemetry

  // Find the h3 handler which is the nitro router
  const index = nitro.h3App.stack.findIndex(
    (layer) => layer.handler.__resolve__,
  )
  const router = nitro.h3App.stack[index]

  if (!router) {
    console.warn('Unable to find router handler')
    return
  }

  if (!config.enabled) {
    return
  }

  const filter = getFilter(config.pathBlocklist)
  const replace = getReplace(config.pathReplace)

  // Wrap the nitro router with code which adds a span
  nitro.h3App.stack.splice(index, 1, {
    ...router,
    handler: async (event) => {
      const url = getRequestURL(event)

      if (filter(url.pathname)) {
        return await router?.handler(event)
      }

      const ctx = context.active()
      const currentSpan = trace.getSpan(ctx)

      return await tracer.startActiveSpan(
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
          },
        },
        async (span: Span) => {
          let result
          try {
            result = await router?.handler(event)
          } catch (e) {
            if (e instanceof Error) {
              span.recordException(e)
              span.setAttribute('error.type', e.name)
            } else {
              span.setAttribute('error.type', 'Unknown Error')
            }
            span.setStatus({ code: SpanStatusCode.ERROR })
          }

          // Only 5xx errors should mark the span as Error for a server-side span
          // https://opentelemetry.io/docs/specs/semconv/http/http-spans/#status
          if (
            result instanceof Response && !result.ok && result.status >= 500 &&
            result.status <= 599
          ) {
            span.setAttribute('error.type', 'Unknown Error')
            span.setStatus({ code: SpanStatusCode.ERROR })
          }

          // The matchedRoute exists after the handler has run
          const matchedRoute = event.context.matchedRoute?.path
          const matchedVueRoute = event.context.matchedVueRoute?.path

          if (matchedRoute) {
            // For the top-most nitro span, we use the vue router route if present.
            // Inner requests sent from the SSR rendering will use the nitro route as their name.
            if (
              (!currentSpan ||
                // @ts-expect-error Property 'instrumentationLibrary' does not exist on type 'Span'.
                currentSpan.instrumentationLibrary?.name !== 'nitro') &&
              matchedVueRoute
            ) {
              span.updateName(`${event.method} ${replace(matchedVueRoute)}`)
              span.setAttribute('http.route', replace(matchedVueRoute))
            } else {
              span.updateName(`${event.method} ${replace(matchedRoute)}`)
              span.setAttribute('http.route', replace(matchedRoute))
            }
          }

          span.setAttribute(
            'http.response.status_code',
            getResponseStatus(event),
          )

          span.end()

          return result
        },
      )
    },
  })
})
