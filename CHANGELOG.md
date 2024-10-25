# @scayle/nuxt-opentelemetry

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
