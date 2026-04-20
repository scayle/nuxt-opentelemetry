# @scayle/nuxt-opentelemetry

OpenTelemetry integration for Nuxt and Nitro.

## Critical Constraints

- Uses `import-in-the-middle` for Node.js module hook registration. This ONLY works server-side. Browser builds MUST tree-shake this code.
- Instrumentation registers via `module.register()` at Nitro initialization, BEFORE application code runs.
- The `./instrumentation` export is for server entry points only. NEVER import it in client code.
