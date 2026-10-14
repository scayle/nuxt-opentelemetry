import type { Instrumentation } from '@opentelemetry/instrumentation'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

interface NodeInstrumentationsState {
  instrumentations: Instrumentation[]
  pathFilter: (path: string) => boolean
}

// In dev, the worker entry loads this file from the package before the
// single-file server bundle, which contains its own copy of this module. The
// state lives on `globalThis` so both copies share one set of
// instrumentations instead of patching every module twice.
const STATE_KEY = Symbol.for('@scayle/nuxt-opentelemetry/node-instrumentations')

const globalState = globalThis as typeof globalThis & {
  [STATE_KEY]?: NodeInstrumentationsState
}

const createState = (): NodeInstrumentationsState => {
  // The path filter depends on runtime config and the public assets, which
  // are not available yet when this module is evaluated from the entry. The
  // SDK plugin sets it before the server handles its first request.
  const state: NodeInstrumentationsState = {
    instrumentations: [],
    pathFilter: (_path) => false,
  }
  state.instrumentations = getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-http': {
      ignoreIncomingRequestHook: (req) =>
        req.url ? state.pathFilter(req.url) : false,
    },
    '@opentelemetry/instrumentation-undici': {
      ignoreRequestHook: ({ path }) => state.pathFilter(path),
    },
  })
  return state
}

const state = (globalState[STATE_KEY] ??= createState())

/**
 * Sets the filter that drops HTTP and undici spans for a path.
 *
 * Called by the SDK plugin once the runtime config is available, because the
 * instrumentations in {@link nodeInstrumentations} are created before it.
 *
 * @param filter Returns `true` for paths that should not produce spans
 */
export function setPathFilter(filter: (path: string) => boolean): void {
  state.pathFilter = filter
}

/**
 * The auto-instrumentations for the Node.js server.
 *
 * An instrumentation installs its module hooks when it is constructed and can
 * only patch modules loaded after that. The Nitro server bundle loads its
 * dependencies (for example `redis` through a storage plugin) before any Nitro
 * plugin runs, so the server entry loads this module before the application.
 * The SDK plugin passes these same instances to `NodeSDK`, which attaches the
 * tracer and meter providers.
 */
export const nodeInstrumentations = state.instrumentations
