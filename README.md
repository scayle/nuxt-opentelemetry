# @scayle/nuxt-opentelemetry

<div align="center">
  <img src="https://cdn-prod.scayle.com/public/media/general/SCAYLE-Commerce-Engine-header.png" />
</div>

<div align="center">
  <h1>@scayle/nuxt-opentelemetry</h1>
</div>

<div align="center">
  <h4><a href="https://scayle.dev/en/core-documentation/storefront-guide/storefront-application/integrations/open-telemetry">Documentation</a> | <a href="https://www.scayle.com/">Website</a></h4>
</div>

<div align="center">
  A Nuxt module for OpenTelemetry integration.
</div>
<br/>
<div align="center">
  <a href="https://www.npmjs.com/package/@scayle/nuxt-opentelemetry"><img src="https://img.shields.io/npm/v/@scayle/nuxt-opentelemetry/latest.svg?style=flat&colorB=007ec6" /></a>
  <a href="https://www.npmjs.com/package/@scayle/nuxt-opentelemetry"><img src="https://img.shields.io/npm/dm/@scayle/nuxt-opentelemetry.svg?style=flat&colorB=007ec6" /></a>
  <a href="https://www.npmjs.com/package/@scayle/nuxt-opentelemetry"><img src="https://img.shields.io/badge/license-MIT-blue.svg" /></a>
  <a href="https://nuxt.com"><img src="https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js" /></a>
</div>

## Installation

```bash
# Using pnpm
pnpm add @scayle/nuxt-opentelemetry

# Using yarn
yarn add @scayle/nuxt-opentelemetry

# Using npm
npm install @scayle/nuxt-opentelemetry
```

## Usage

```ts
export default defineNuxtConfig({
  modules: ['@scayle/nuxt-opentelemetry'],
  runtimeConfig: {
    opentelemetry: {
      // Set default runtime config options here.
      // They can be overridden at runtime with NUXT_OPENTELEMETRY_ environment variables
      // The properties which can be set at runtime are defined below
    },
  },
  opentelemetry: {
    // Set build-time module configuration options here
  },
})
```

This module will instrument requests handled by Nitro according to [Semantic Conventions for HTTP Spans v1.26.0](https://github.com/open-telemetry/semantic-conventions/blob/v1.26.0/docs/http/http-spans.md#http-server)

## Module Configuration

The internal module can be configured through module options or runtime environment variables. The following options are available.

- `enabled` or `NUXT_OPENTELEMETRY_ENABLED`
  - This option enables or disables the module.
    If `enabled` is set to false at build-time, the module will not install any plugins or modify the entrypoint.
    If `enabled` is set to false at runtime, the plugin will be installed, but spans will not be created for Nitro requests. They may be created for other instrumentations.

- `pathBlocklist` or `NUXT_OPENTELEMETRY_PATH_BLOCKLIST`
  - This option allows ignoring requests for paths that match the pattern.
    It can be a regular expression string or plain string. For example,
    you could use the option `{ pathBlocklist: '^/api/up' }` to skip creating spans for health check requests.

- `pathReplace` or `NUXT_OPENTELEMETRY_PATH_REPLACE`
  - The Nitro span names are derived from the route path.
    This option can be used to rewrite the path that is used in the name.
    It should be an array with two elements.
    The first element is the pattern to match, as a regular expression string or plain string.
    The second element is the text to replace the match with.
    This can be used to use the same span name when the paths only differ by a locale prefix.
    For example: `['^/(en|de|fr)/', '/:locale/']`

- `requestHeaders` or `NUXT_OPENTELEMETRY_REQUEST_HEADERS`
  - This option allows selecting which request headers to include as span attributes. They will be added as `http.request.header.{name}`. The values are case-insensitive when matching headers. It will be normalized to lowercase in the attribute name. Example: `{ requestHeaders: ['x-custom-header', 'accept'] }` or `NUXT_OPENTELEMETRY_REQUEST_HEADERS=["x-custom-header", "accept"]`

- `responseHeaders` or `NUXT_OPENTELEMETRY_RESPONSE_HEADERS`
  - This option allows selecting which response headers to include as span attributes. They will be added as `http.response.header.{name}`. The values are case-insensitive when matching headers. It will be normalized to lowercase in the attribute name. Example: `{ responseHeaders: ['content-type'] }` or `NUXT_OPENTELEMETRY_REQUEST_HEADERS=["content-type"]`

- `disableAutomaticInitialization` or `NUXT_OPENTELEMETRY_DISABLE_AUTOMATIC_INITIALIZATION`
  - This option allows for manual instrumentation of the application via a Nitro plugin. This enables adjustment of the application's instrumentation to better suit specific needs.

### Including and Excluding modules

The below options are passed to `import-in-the-middle` to control its interception behavior.
You can read more about the behavior of these options in [its documentation](https://github.com/nodejs/import-in-the-middle?tab=readme-ov-file#only-intercepting-hooked-modules).

- `include` An array of module identifiers to include from hooking
- `exclude` An array of module identifiers to exclude from hooking

### Custom instrumentation

To leverage custom instrumentation, set `disableAutomaticInstrumentation` to `true`. This enables the creation of custom instrumentation within a Nitro plugin located in the `./server/plugins` directory, offering enhanced customization and adaptability for your instrumentation configuration. The example provided demonstrates a basic instrumentation setup utilizing the `@opentelemetry/sdk-node`.

```ts
// ./server/plugins/instrumentation.ts
import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import type { NitroApp } from 'nitropack/types'
import { NitroInstrumentation } from '@scayle/nuxt-opentelemetry'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto'

export default defineNitroPlugin((_nitroApp: NitroApp) => {
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter(),
    }),
    instrumentations: [
      getNodeAutoInstrumentations(),
      new NitroInstrumentation()
    ],
  })

  sdk.start()
})
```

## License

Licensed under the [MIT License](https://opensource.org/license/mit/)

## What is SCAYLE?

[SCAYLE](https://scayle.com) is a full-featured e-commerce software solution that comes with flexible APIs.
Within SCAYLE, you can manage all aspects of your shop, such as products, stocks, customers, and transactions.

Learn more about [SCAYLE’s architecture](https://scayle.dev/en/core-documentation/welcome-to-scayle/getting-started) and commerce modules in the Docs.

## Other channels

- [LinkedIn](https://www.linkedin.com/company/scaylecommerce/)
- [Jobs](https://careers.smartrecruiters.com/ABOUTYOUGmbH/scayle)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@scayle/nuxt-opentelemetry/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/@scayle/nuxt-opentelemetry
[npm-downloads-src]: https://img.shields.io/npm/dm/@scayle/nuxt-opentelemetry.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/@scayle/nuxt-opentelemetry
[license-src]: https://img.shields.io/npm/l/@scayle/nuxt-opentelemetry.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/@scayle/nuxt-opentelemetry
