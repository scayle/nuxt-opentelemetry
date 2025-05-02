import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import type { NitroApp } from 'nitropack/types'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto'
import { NitroInstrumentation } from '../../instrumentation'
import { useRuntimeConfig } from 'nitropack/runtime'
import { getReplace, getRouteName, getFilter } from '../../utils'
// @ts-expect-error import aliases are currently unable to be properly resolved during typechecking
import { assets } from '#opentelemetry/public-assets'

function ignorePath(path: string): boolean {
  return path.startsWith('/_nuxt') ||
    path.startsWith('/_fonts') ||
    path.startsWith('/__nuxt_vite_node__') ||
    (assets as Set<string>).has(path)
}

export default defineNitroPlugin((_nitroApp: NitroApp) => {
  const config = useRuntimeConfig()
  const replace = getReplace(config.opentelemetry.pathReplace)
  const filter = getFilter(config.opentelemetry.pathBlocklist)

  // In this file we initialize the Node OpenTelemetry SDK and the OTLP Exporter
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter(),
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': {
          // Filter out static _nuxt requests
          ignoreIncomingRequestHook: (req) => {
            if (!req.url) {
              return false
            }
            return ignorePath(req.url) || filter(req.url)
          },
        },
        '@opentelemetry/instrumentation-undici': {
          // Filter out static _nuxt requests
          ignoreRequestHook({ path }) {
            return ignorePath(path) || filter(path)
          },
        },
      }),
      new NitroInstrumentation({
        ...config.opentelemetry,
        routeNameHook: (event) => {
          return getRouteName(event, replace)
        },
        ignoreRequestHook: (event) => filter(event.path),
      }),
    ],
  })

  sdk.start()
})
