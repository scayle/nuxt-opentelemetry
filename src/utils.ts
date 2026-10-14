import { createResolver, resolvePath, useLogger } from '@nuxt/kit'
import type { Resolver } from '@nuxt/kit'
import { genImport } from 'knitwork'
import type { NitroConfig, Nitro } from 'nitropack'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Nuxt } from 'nuxt/schema'
import type { ModuleOptions } from './module'

function getInstrumentedEntryFileForPreset(
  preset: string,
  baseEntry: string,
  include?: string[],
  exclude?: string[],
  instrumentationsEntry?: string,
) {
  let entryFile

  // Create the instrumentations before the application loads its
  // dependencies, so their module hooks see them.
  const loadApplication = instrumentationsEntry
    ? `import("${instrumentationsEntry}").then(() => import("${baseEntry}"))`
    : `import("${baseEntry}")`

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
  ${loadApplication}`
  } else if (preset.includes('vercel')) {
    entryFile = `
    ${genImport(baseEntry, 'handler')}
    export default handler
    `
  }

  return entryFile
}

export async function nitroSetup(
  nitroConfig: NitroConfig,
  moduleOptions: ModuleOptions,
) {
  const { resolve } = createResolver(import.meta.url)
  const logger = useLogger('@scayle/nuxt-opentelemetry')

  nitroConfig.externals ??= {}
  nitroConfig.externals.traceInclude ??= []
  nitroConfig.externals.traceInclude.push('import-in-the-middle')

  // Add nitro server plugins
  nitroConfig.plugins = nitroConfig.plugins ?? []
  nitroConfig.plugins.push(resolve('./runtime/nitro/plugins/nitroAppPlugin'))

  if (moduleOptions.disableAutomaticInitialization) {
    logger.info('Automatic instrumentation is disabled.')
  } else if (nitroConfig.preset?.includes('vercel')) {
    nitroConfig.plugins.push(resolve('./runtime/nitro/plugins/sdkInitVercel'))
  } else {
    if (!nitroConfig.preset?.startsWith('node')) {
      logger.warn(
        `Using preset: ${nitroConfig.preset}. Only node and vercel presets are officially supported.`,
      )
    }
    nitroConfig.plugins.push(resolve('./runtime/nitro/plugins/sdkInitNode'))
  }
}

export function prepareEntry(nitro: Nitro, options: ModuleOptions) {
  const resolver = createResolver(import.meta.url)
  const { entry, preset } = nitro.options

  // For the node presets, we need to add module customization hooks
  const instrumentationsEntry = options.disableAutomaticInitialization
    ? undefined
    : resolver.resolve('./runtime/nitro/nodeInstrumentations')

  if (preset === 'node-server') {
    nitro.hooks.hook('rollup:before', (_nitro, rollupConfig) => {
      // Rollup would otherwise merge the instrumentations into the `nitro`
      // chunk, because the SDK plugin there imports them. Loading that chunk
      // evaluates the whole server, so the entry could no longer create the
      // instrumentations before the application's dependencies load.
      const manualChunks = rollupConfig.output.manualChunks
      if (instrumentationsEntry && typeof manualChunks === 'function') {
        rollupConfig.output.manualChunks = (id, meta) => {
          if (id.startsWith(`${instrumentationsEntry}.`)) {
            return 'nitro/instrumentations'
          }
          return manualChunks(id, meta)
        }
      }
      if (typeof rollupConfig.input === 'string') {
        rollupConfig.input = [
          rollupConfig.input,
          resolver.resolve('./runtime/node-hooks'),
        ]
      }
      rollupConfig.output.entryFileNames = function (info) {
        if (info.name === 'node-hooks') {
          return 'node-hooks.mjs'
        }
        return 'index.mjs'
      }
    })
  }

  // The dev server bundles everything into one file, which imports the
  // application's dependencies before any of its own code runs. Nitro starts
  // the dev worker from `index.mjs`, so the bundle moves to `server.mjs` and
  // `index.mjs` becomes a wrapper that creates the instrumentations first.
  // They come from the package file itself, since the bundle cannot be split.
  if (preset === 'nitro-dev' && instrumentationsEntry) {
    nitro.hooks.hook('rollup:before', async (_nitro, rollupConfig) => {
      const instrumentationsFile = pathToFileURL(
        await resolvePath(instrumentationsEntry),
      ).href
      rollupConfig.output.entryFileNames = 'server.mjs'
      rollupConfig.plugins = [
        rollupConfig.plugins,
        {
          name: '@scayle/nuxt-opentelemetry:dev-worker-entry',
          generateBundle() {
            this.emitFile({
              type: 'asset',
              fileName: 'index.mjs',
              source: [
                `await import(${JSON.stringify(instrumentationsFile)})`,
                `await import('./server.mjs')`,
                '',
              ].join('\n'),
            })
          },
        },
      ]
    })
  }

  const newEntry = getInstrumentedEntryFileForPreset(
    preset,
    entry,
    options.include,
    options.exclude,
    instrumentationsEntry,
  )

  if (newEntry) {
    nitro.options.virtual['#virtual/instrumented-entry'] = newEntry
    nitro.options.entry = '#virtual/instrumented-entry'
  }
}

export async function getPublicAssets(nuxt: Nuxt, resolver: Resolver) {
  const getAllFiles = (dir: string, baseDir: string = dir): string[] => {
    const files: string[] = []
    if (!existsSync(dir)) {
      return files
    }

    const items = readdirSync(dir)

    for (const item of items) {
      const fullPath = join(dir, item)

      if (statSync(fullPath).isDirectory()) {
        files.push(...getAllFiles(fullPath, baseDir))
      } else {
        files.push(`/${relative(nuxt.options.dir.public, fullPath)}`)
      }
    }

    return files
  }

  return getAllFiles(await resolver.resolvePath(nuxt.options.dir.public))
}
