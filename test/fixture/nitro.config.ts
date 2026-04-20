import { join } from 'node:path'
import { createResolver } from '@nuxt/kit'
import nitroModule from '../../src/nitro-module'

import packageJson from '../../package.json'

// https://nitro.unjs.io/config

export default defineNitroConfig({
  compatibilityDate: '2025-03-19',
  srcDir: join(__dirname, 'server'),
  modules: [
    process.env.VITEST
      ? {
        setup(nitro) {
          const resolver = createResolver(import.meta.url)
          nitro.options.plugins.push(resolver.resolve('plugins/errorPlugin'))
          nitro.options.plugins.push(
            resolver.resolve('../../src/runtime/nitro/plugins/nitroAppPlugin'),
          )
        },
      }
      : nitroModule({ enabled: true }),
  ],
  externals: {
    traceInclude: ['import-in-the-middle'],
  },
  replace: {
    '__package_version': `'${packageJson.version}'`,
    '__package_name': `'${packageJson.name}'`,
  },
})
