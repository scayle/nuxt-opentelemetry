# @scayle/nuxt-opentelemetry

## 0.12.0

### Minor Changes

- Do not trace requests for files located within the nuxt `public` directory.

## 0.11.0

### Minor Changes

- Initialize the OTel SDK in a Nitro plugin instead of the entrypoint to support usage in dev builds. However, not all instrumentations will be available in dev mode as they require `import-in-the-middle` hooks.

## 0.10.1

### Patch Changes

- Updated dependency `@opentelemetry/auto-instrumentations-node@0.57.1` to `@opentelemetry/auto-instrumentations-node@0.58.0`

## 0.10.0

### Minor Changes

- Update to `@nuxt/module-builder@1`. This version of Nuxt Module Builder is ESM-only, so CommonJS (`.cjs`) files will no longer be built or distributed with the package. However as of Nuxt 3, only esm is used so this should not have any impact as this module does not support Nuxt 2.

## 0.9.4

### Patch Changes

- Updated dependency `@vercel/otel@1.10.4` to `@vercel/otel@1.11.0`

## 0.9.3

### Patch Changes

- Updated dependency `@opentelemetry/semantic-conventions@1.30.0` to `@opentelemetry/semantic-conventions@1.32.0`

## 0.9.2

### Patch Changes

- Updated dependency `@opentelemetry/auto-instrumentations-node@0.57.0` to `@opentelemetry/auto-instrumentations-node@0.57.1`

## 0.9.1

### Patch Changes

- Added dependency `@opentelemetry/sdk-trace-base@2.0.0`
- Added dependency `@opentelemetry/sdk-trace-node@2.0.0`
- Added dependency `import-in-the-middle@1.13.1`

## 0.9.0

### Minor Changes

- Enable the exporting of metrics in the SDK initialization. Like traces, metrics will be exported via the OTLP protocol (using `@opentelemetry/exporter-metrics-otlp-proto`) so your existing collector will likely be able to collect metrics automatically without additional configuration.

### Patch Changes

- Added dependency `@opentelemetry/exporter-metrics-otlp-proto@0.200.0`
- Added dependency `@opentelemetry/sdk-metrics@2.0.0`

## 0.8.0

### Minor Changes

- This release refactors the implementation to use a `NitroInstrumentation` class rather than a Nitro plugin. The change enables better testing and in the future may provide more flexibility for customization. The module should continue to work as before without any necessary changes for module users.

### Patch Changes

- The `?` character is no longer included in the `url.query` span attribute
- When no `pathBlocklist` is provided, the default should be to allow everything instead of blocking everything.
- Configure the HTTP instrumentation to ignore requests for static assets

## 0.7.2

### Patch Changes

- Added dependency `@opentelemetry/core@2.0.0`
- Removed dependency `@opentelemetry/resources@1.30.1`
- Updated dependency `@opentelemetry/auto-instrumentations-node@0.56.1` to `@opentelemetry/auto-instrumentations-node@0.57.0`
- Updated dependency `@opentelemetry/exporter-trace-otlp-proto@0.57.2` to `@opentelemetry/exporter-trace-otlp-proto@0.200.0`
- Updated dependency `@opentelemetry/instrumentation@0.57.2` to `@opentelemetry/instrumentation@0.200.0`
- Updated dependency `@opentelemetry/sdk-node@0.52.1` to `@opentelemetry/sdk-node@0.200.0`
- Spans for successful requests should have SpanStatusCode.OK (Previously they were set to SpanStatusCode.UNSET)
- Fix incorrect status codes attributes for requests resulting in an error.

## 0.7.1

### Patch Changes

- Updated dependency `@vercel/otel@1.10.3` to `@vercel/otel@1.10.4`

## 0.7.0

### Minor Changes

- Support adding request and response headers to span attributes with the `requestHeaders` and `responseHeaders` options.

## 0.6.4

### Patch Changes

- Updated dependency `@vercel/otel@1.10.2` to `@vercel/otel@1.10.3`

## 0.6.3

### Patch Changes

- Added `h3@>=1.10.0` to `peerDependencies`.

## 0.6.2

### Patch Changes

- Updated dependency `@vercel/otel@1.10.1` to `@vercel/otel@1.10.2`

## 0.6.1

### Patch Changes

- Updated dependency `@opentelemetry/auto-instrumentations-node@0.56.0` to `@opentelemetry/auto-instrumentations-node@0.56.1`

## 0.6.0

### Minor Changes

- Remove explicit inline external for runtime helpers

## 0.5.10

### Patch Changes

- Updated dependency `@opentelemetry/exporter-trace-otlp-proto@0.57.1` to `@opentelemetry/exporter-trace-otlp-proto@0.57.2`
- Updated dependency `@opentelemetry/instrumentation@0.57.1` to `@opentelemetry/instrumentation@0.57.2`

## 0.5.9

### Patch Changes

- Updated dependency `@opentelemetry/semantic-conventions@1.29.0` to `@opentelemetry/semantic-conventions@1.30.0`

## 0.5.8

### Patch Changes

- Updated dependency `@opentelemetry/semantic-conventions@1.28.0` to `@opentelemetry/semantic-conventions@1.29.0`

## 0.5.7

### Patch Changes

- Updated dependency `@opentelemetry/auto-instrumentations-node@0.55.3` to `@opentelemetry/auto-instrumentations-node@0.56.0`
- Updated dependency `@vercel/otel@1.10.0` to `@vercel/otel@1.10.1`

## 0.5.6

### Patch Changes

- Updated dependency `@opentelemetry/auto-instrumentations-node@0.55.2` to `@opentelemetry/auto-instrumentations-node@0.55.3`

## 0.5.5

### Patch Changes

- Updated dependency `@opentelemetry/auto-instrumentations-node@0.55.1` to `@opentelemetry/auto-instrumentations-node@0.55.2`
- Updated dependency `@opentelemetry/exporter-trace-otlp-proto@0.57.0` to `@opentelemetry/exporter-trace-otlp-proto@0.57.1`
- Updated dependency `@opentelemetry/instrumentation@0.57.0` to `@opentelemetry/instrumentation@0.57.1`
- Updated dependency `@opentelemetry/resources@1.30.0` to `@opentelemetry/resources@1.30.1`

## 0.5.4

### Patch Changes

- Updated dependency `@opentelemetry/auto-instrumentations-node@0.55.0` to `@opentelemetry/auto-instrumentations-node@0.55.1`

## 0.5.3

### Patch Changes

- Updated dependency `@opentelemetry/auto-instrumentations-node@0.54.0` to `@opentelemetry/auto-instrumentations-node@0.55.0`
- Updated dependency `@opentelemetry/exporter-trace-otlp-proto@0.56.0` to `@opentelemetry/exporter-trace-otlp-proto@0.57.0`
- Updated dependency `@opentelemetry/instrumentation@0.56.0` to `@opentelemetry/instrumentation@0.57.0`
- Updated dependency `@opentelemetry/resources@1.29.0` to `@opentelemetry/resources@1.30.0`

## 0.5.2

### Patch Changes

- We've updated to `nuxt@3.14`

## 0.5.1

### Patch Changes

- Updated dependency `@opentelemetry/auto-instrumentations-node@0.53.0` to `@opentelemetry/auto-instrumentations-node@0.54.0`
- Updated dependency `@opentelemetry/exporter-trace-otlp-proto@0.55.0` to `@opentelemetry/exporter-trace-otlp-proto@0.56.0`
- Updated dependency `@opentelemetry/instrumentation@0.55.0` to `@opentelemetry/instrumentation@0.56.0`
- Updated dependency `@opentelemetry/resources@1.28.0` to `@opentelemetry/resources@1.29.0`

## 0.5.0

### Minor Changes

- Expanded Nitro span scope to include middleware execution alongside the primary handler execution, providing a more complete tracing.

### Patch Changes

- Resolved an issue where child request spans incorrectly inherited the pathname from their parent span, ensuring accurate request path tracing.

## 0.4.2

### Patch Changes

- Updated dependency `@opentelemetry/semantic-conventions@1.27.0` to `@opentelemetry/semantic-conventions@1.28.0`

## 0.4.1

### Patch Changes

- Updated dependency `@opentelemetry/auto-instrumentations-node@0.52.1` to `@opentelemetry/auto-instrumentations-node@0.53.0`
- Updated dependency `@opentelemetry/exporter-trace-otlp-proto@0.54.2` to `@opentelemetry/exporter-trace-otlp-proto@0.55.0`
- Updated dependency `@opentelemetry/instrumentation@0.54.2` to `@opentelemetry/instrumentation@0.55.0`
- Updated dependency `@opentelemetry/resources@1.27.0` to `@opentelemetry/resources@1.28.0`

## 0.4.0

### Minor Changes

- Add `include` and `exclude` options to control the `import-in-the-middle` behavior

  For more details on how to use these options see the [README](./README.md#including-and-excluding-modules)

- The default value for `enabled` is now true

  With this change, the module will be enabled when it has been installed. Previously, one had to install the module then add an additional module configuration to actually enable the module.

## 0.3.9

### Patch Changes

- Updated dependency `@opentelemetry/auto-instrumentations-node@0.52.0` to `@opentelemetry/auto-instrumentations-node@0.52.1`
- Updated dependency `@opentelemetry/exporter-trace-otlp-proto@0.54.1` to `@opentelemetry/exporter-trace-otlp-proto@0.54.2`
- Updated dependency `@opentelemetry/instrumentation@0.54.1` to `@opentelemetry/instrumentation@0.54.2`

## 0.3.8

### Patch Changes

- Updated dependency `@opentelemetry/exporter-trace-otlp-proto@0.54.0` to `@opentelemetry/exporter-trace-otlp-proto@0.54.1`
- Updated dependency `@opentelemetry/instrumentation@0.54.0` to `@opentelemetry/instrumentation@0.54.1`

## 0.3.7

### Patch Changes

- Updated dependency `@opentelemetry/auto-instrumentations-node@0.51.0` to `@opentelemetry/auto-instrumentations-node@0.52.0`

## 0.3.6

### Patch Changes

- Updated dependency `@opentelemetry/exporter-trace-otlp-proto@0.53.0` to `@opentelemetry/exporter-trace-otlp-proto@0.54.0`
- Updated dependency `@opentelemetry/instrumentation@0.53.0` to `@opentelemetry/instrumentation@0.54.0`
- Updated dependency `@opentelemetry/resources@1.26.0` to `@opentelemetry/resources@1.27.0`

## 0.3.5

### Patch Changes

- Updated dependency `@opentelemetry/auto-instrumentations-node@0.50.2` to `@opentelemetry/auto-instrumentations-node@0.51.0`

## 0.3.4

### Patch Changes

- Updated dependency `@opentelemetry/sdk-node@0.53.0` to `@opentelemetry/sdk-node@0.52.1`
- Downgrade the `@opentelemetry/sdk-node` package

  There is a bug in the Nuxt build process which causes it to fail when this package is part of the build. To workaround this, we've temporarily downgraded this package until the bug is fixed.

## 0.3.3

### Patch Changes

- Updated dependency `@opentelemetry/auto-instrumentations-node@0.50.0` to `@opentelemetry/auto-instrumentations-node@0.50.2`

## 0.3.2

### Patch Changes

- Update @nuxt/module-builder to 0.8.4

## 0.3.1

### Patch Changes

- Set the span status to Error for 5xx errors from H3

## 0.3.0

### Minor Changes

- Include additional attributes on Nitro spans: `http.status_code`, `client.address`, `server.address`, `server.port`, and `user_agent.original`. Additionally, other attributes were renamed to conform to [Semantic Conventions for HTTP Spans](https://opentelemetry.io/docs/specs/semconv/http/http-spans/).

## 0.2.0

### Minor Changes

- Add the package version of the instrumentation in the trace

## 0.1.0

### Minor Changes

- Initial release of `@scayle/nuxt-opentelemetry`
