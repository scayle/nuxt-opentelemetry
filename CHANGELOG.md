# @scayle/nuxt-opentelemetry

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
