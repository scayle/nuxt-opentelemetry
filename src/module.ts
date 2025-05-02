import {
  addPlugin,
  addServerTemplate,
  addTypeTemplate,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit'
import { defu } from 'defu'
import { getPublicAssets, nitroSetup, prepareEntry } from './utils'

export interface ModuleOptions {
  enabled: boolean
  pathBlocklist?: string
  pathReplace?: [string, string]
  include?: string[]
  exclude?: string[]
  requestHeaders?: string[]
  responseHeaders?: string[]
}

const PACKAGE_NAME = '__package_name'
const PACKAGE_VERSION = '__package_version'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: PACKAGE_NAME,
    configKey: 'opentelemetry',
    version: PACKAGE_VERSION,
    compatibility: {
      bridge: false,
      nuxt: '>=3.10',
    },
  },
  defaults: {
    enabled: true,
    pathBlocklist: undefined,
    pathReplace: undefined,
    responseHeaders: [],
    requestHeaders: [],
  },
  async setup(options, nuxt) {
    if (!options.enabled) {
      return
    }

    const resolver = createResolver(import.meta.url)

    // Private runtimeConfig
    nuxt.options.runtimeConfig.opentelemetry = defu(
      {
        pathBlocklist: undefined,
        pathReplace: undefined,
        responseHeaders: [],
        requestHeaders: [],
      },
      options,
    )

    addPlugin(resolver.resolve('./runtime/plugins/matchedVueRoutePlugin'))

    // Extend the H3 context based on the data we add in our route middleware
    const template = addTypeTemplate({
      filename: 'types/nuxt-opentelemetry.d.ts',
      getContents: () =>
        `// Auto-generated
        import type { RouteRecordNormalized } from '#vue-router'
        declare module 'h3' {
          interface H3EventContext {
            matchedVueRoute?: Record<string, RouteRecordNormalized>
          }
        }
        export {}`,
    })

    addServerTemplate({
      filename: '#opentelemetry/public-assets',
      getContents: async () => `
        export const assets = new Set([
          ${
        (await getPublicAssets(nuxt, resolver)).map((asset) => `'${asset}'`)
          .join(
            ',',
          )
      }
        ])
      `,
    })

    nuxt.hook('prepare:types', ({ references }) => {
      references.push({ path: template.dst })
    })

    nuxt.hooks.hook('nitro:init', async (nitro) => {
      await nitroSetup(nitro.options)
      prepareEntry(nitro, options)
    })
  },
})

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    // Required because automatically generated types are not correct
    opentelemetry: ModuleOptions
  }
}
