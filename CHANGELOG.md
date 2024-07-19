# @scayle/nuxt-opentelemetry

## 0.3.0

### Minor Changes

- Include additional attributes on Nitro spans: `http.status_code`, `client.address`, `server.address`, `server.port`, and `user_agent.original`. Additionally, other attributes were renamed to conform to [Semantic Conventions for HTTP Spans](https://opentelemetry.io/docs/specs/semconv/http/http-spans/).

## 0.2.0

### Minor Changes

- Add the package version of the instrumentation in the trace

## 0.1.0

### Minor Changes

- Initial release of `@scayle/nuxt-opentelemetry`
