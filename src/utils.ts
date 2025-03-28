import { createResolver, useLogger } from '@nuxt/kit'
import { genImport } from 'knitwork'
import type { NitroConfig, Nitro } from 'nitropack'

export interface ModuleOptions {
  enabled: boolean
  pathBlocklist?: string
  pathReplace?: [string, string]
  include?: string[]
  exclude?: string[]
  requestHeaders?: string[]
  responseHeaders?: string[]
}

function getInstrumentedEntryFileForPreset(
  preset: string,
  baseEntry: string,
  include?: string[],
  exclude?: string[],
) {
  let entryFile

  if (preset === 'node-server') {
    entryFile = `
  import { register, createRequire } from 'node:module';
  import { pathToFileURL } from 'node:url'
  
  const require = createRequire(import.meta.url)
  register(pathToFileURL(require.resolve("./node-hooks.mjs")), import.meta.url, { data: { 
    include: ${JSON.stringify(include)},
    exclude: ${JSON.stringify(exclude)},
  }})
  
  // We should use dynamic imports after registering the customization hooks
  // https://nodejs.org/api/module.html#customization-hooks
  
  // Then load our application's entry point
  import("${baseEntry}")`
  } else if (preset.includes('vercel')) {
    entryFile = `
    ${genImport(baseEntry, 'handler')}
    export default handler
    `
  }

  return entryFile
}

export async function nitroSetup(nitroConfig: NitroConfig) {
  const { resolve } = createResolver(import.meta.url)
  const logger = useLogger('@scayle/nuxt-opentelemetry')

  nitroConfig.externals ??= {}
  nitroConfig.externals.traceInclude ??= []
  nitroConfig.externals.traceInclude.push('import-in-the-middle')

  // Add nitro server plugins
  nitroConfig.plugins = nitroConfig.plugins ?? []
  nitroConfig.plugins.push(
    resolve('./runtime/nitro/plugins/nitroAppPlugin'),
  )

  if (nitroConfig.preset?.includes('vercel')) {
    nitroConfig.plugins.push(
      resolve('./runtime/nitro/plugins/sdkInitVercel'),
    )
  } else {
    if (!(nitroConfig.preset?.startsWith('node'))) {
      logger.warn(
        `Using preset: ${nitroConfig.preset}. Only node and vercel presets are officially supported.`,
      )
    }
    nitroConfig.plugins.push(
      resolve('./runtime/nitro/plugins/sdkInitNode'),
    )
  }
}

export function prepareEntry(nitro: Nitro, options: ModuleOptions) {
  const resolver = createResolver(import.meta.url)
  const { entry, preset } = nitro.options

  // For the node presets, we need to add module customization hooks
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

  const newEntry = getInstrumentedEntryFileForPreset(
    preset,
    entry,
    options.include,
    options.exclude,
  )

  if (newEntry) {
    nitro.options.virtual['#virtual/instrumented-entry'] = newEntry
    nitro.options.entry = '#virtual/instrumented-entry'
  }
}
