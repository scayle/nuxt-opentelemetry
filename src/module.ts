import {
  addPlugin,
  addServerPlugin,
  addTypeTemplate,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit'
import { genImport } from 'knitwork'
import { defu } from 'defu'

function getInstrumentedEntryFileForPreset(
  preset: string,
  instrumentationFile: string,
  baseEntry: string,
) {
  let entryFile

  if (preset === 'node-server') {
    entryFile = `
import { register, createRequire } from 'node:module';
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
register(pathToFileURL(require.resolve("./node-hooks.mjs")))

// We should use dynamic imports after registering the customization hooks
// https://nodejs.org/api/module.html#customization-hooks

// First load the instrumentation file which initialized the OTEL SDK
import("${instrumentationFile}")

// Then load our application's entry point
import("${baseEntry}")`
  } else if (preset.includes('vercel')) {
    entryFile = `
  ${genImport(instrumentationFile)}
  ${genImport(baseEntry, 'handler')}
  export default handler
  `
  }

  return entryFile
}

interface ModuleOptions {
  enabled: boolean
  pathBlocklist?: string
  pathReplace?: [string, string]
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
  },
  setup(options, nuxt) {
    if (!options.enabled) {
      return
    }

    const resolver = createResolver(import.meta.url)

    // Private runtimeConfig
    nuxt.options.runtimeConfig.opentelemetry = defu(
      { pathBlocklist: undefined, pathReplace: undefined },
      options,
    )

    addServerPlugin(
      resolver.resolve('./runtime/nitro/plugins/nitroOTelTracerPlugin'),
    )
    addPlugin(resolver.resolve('./runtime/plugins/matchedVueRoutePlugin'))

    // Extend the H3 context based on the data we add in our route middleware
    const template = addTypeTemplate({
      filename: 'types/storefront-bootstrap.d.ts',
      getContents: () =>
        `// Auto-generated
        import type { RouteRecordNormalized } from '#vue-router'
        declare module 'h3' {
          interface H3EventContext {
            matchedVueRoute?: RouteRecordNormalized
          }
        }
        export {}`,
    })

    nuxt.hook('prepare:types', ({ references }) => {
      references.push({ path: template.dst })
    })

    // Add plugins to externals
    nuxt.hooks.hook('nitro:config', (nitroConfig) => {
      nitroConfig.externals = nitroConfig.externals || {}
      nitroConfig.externals.inline = nitroConfig.externals.inline || []
      const runtimePaths = [
        'nitro/plugins/nitroOTelTracerPlugin',
        'plugins/matchedVueRoutePlugin',
      ]
      runtimePaths.forEach((path) => {
        const file = resolver.resolve(`./runtime/${path}`)
        nitroConfig.externals?.inline?.push(file)
      })

      nitroConfig.replace = nitroConfig.replace || {}
      nitroConfig.replace.__otel_version = PACKAGE_VERSION
      nitroConfig.replace.__otel_package_name = PACKAGE_NAME
    })

    nuxt.hooks.hook('nitro:init', (nitro) => {
      const { entry, preset } = nitro.options

      let instrumentationFile

      if (preset === 'node-server') {
        instrumentationFile = resolver.resolve('./runtime/node')
      } else if (preset.includes('vercel')) {
        instrumentationFile = resolver.resolve('./runtime/vercel')
      } else {
        return
      }

      // Add the entry to moduleSideEffects so we don't treeshake away our server!
      nitro.options.moduleSideEffects.push(entry, instrumentationFile)

      const newEntry = getInstrumentedEntryFileForPreset(
        preset,
        instrumentationFile,
        entry,
      )

      if (newEntry) {
        nitro.options.virtual['#virtual/instrumented-entry'] = newEntry
        nitro.options.entry = '#virtual/instrumented-entry'
      }

      // For the node preset, we need to add module customization hooks
      if (preset === 'node-server') {
        nitro.hooks.hook('rollup:before', (_nitro, rollupConfig) => {
          if (typeof rollupConfig.input === 'string') {
            rollupConfig.input = [
              rollupConfig.input,
              resolver.resolve('./runtime/node-hooks'),
            ]
          }
          rollupConfig.output.entryFileNames = function(info) {
            if (info.name === 'node-hooks') {
              return 'node-hooks.mjs'
            }
            return 'index.mjs'
          }
        })
      }
    })
  },
})

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    // Required because automatically generated types are not correct
    opentelemetry: ModuleOptions
  }
}
