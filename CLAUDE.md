# @scayle/nuxt-opentelemetry

OpenTelemetry integration for Nuxt and Nitro.

## Critical Constraints

- Uses `import-in-the-middle` for Node.js module hook registration. This ONLY works server-side. Browser builds MUST tree-shake this code.
- Instrumentation registers via `module.register()` at Nitro initialization, BEFORE application code runs.
- With the `node-server` preset, the instrumented entry imports `runtime/nitro/nodeInstrumentations` before the application (in dev, see below), and `sdkInitNode.ts` passes those instances to `NodeSDK`. An instrumentation only patches modules loaded after it is constructed, and the server bundle loads its dependencies (e.g. `redis` via a storage plugin) before any Nitro plugin runs. NEVER create the auto-instrumentations inside the plugin again.
- `prepareEntry` gives that module its own Rollup chunk (`nitro/instrumentations`). Without it, Rollup merges the module into the `nitro` chunk, and importing it would evaluate the whole server first. Keep the module free of imports that the `nitro` chunk also uses.
- In dev (`nitro-dev` preset), the server is one bundle (`inlineDynamicImports`), so it cannot be split. `prepareEntry` renames it to `server.mjs` and emits an `index.mjs` (Nitro's hardcoded dev worker entry) that imports `nodeInstrumentations` from the package's own file first. The bundle has a second copy of the module, so the instrumentations live on a `globalThis` symbol and the module must not import anything Nitro-virtual (like `#opentelemetry/public-assets`): the static-asset filter is passed in by `sdkInitNode.ts` through `setPathFilter`.
- The `./instrumentation` export is for server entry points only. NEVER import it in client code.
