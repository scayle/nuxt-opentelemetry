import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { NodeSDK } from '@opentelemetry/sdk-node'

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { NitroInstrumentation } from './instrumentation'
import { useRuntimeConfig } from 'nitropack/runtime'
import { getReplace, getRouteName, getFilter } from './utils'

const config = useRuntimeConfig()

const replace = getReplace(config.opentelemetry.pathReplace)
const filter = getFilter(config.opentelemetry.pathBlocklist)

// In this file we initialize the Node OpenTelemetry SDK and the OTLP Exporter
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        // Filter out static _nuxt requests
        ignoreIncomingRequestHook: (req) => {
          if (!req.url) {
            return false
          }
          return req.url.startsWith('/_nuxt') ||
            req.url.startsWith('/_fonts') || req.url.startsWith('/favicon')
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
