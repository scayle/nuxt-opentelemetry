import { registerOTel } from '@vercel/otel'
import { NitroInstrumentation } from './instrumentation'
import { useRuntimeConfig } from 'nitropack/runtime'
import { getReplace, getRouteName, getFilter } from './utils'

const config = useRuntimeConfig()

const replace = getReplace(config.opentelemetry.pathReplace)
const filter = getFilter(config.opentelemetry.pathBlocklist)

// Register the OpenTelemetry.
registerOTel({
  instrumentations: [
    new NitroInstrumentation({
      ...config.opentelemetry,
      routeNameHook: (event) => {
        return getRouteName(event, replace)
      },
      ignoreRequestHook: (event) => filter(event.path),
    }),
  ],
})
