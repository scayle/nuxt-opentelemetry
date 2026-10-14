import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { vol } from 'memfs'
import { getPublicAssets, prepareEntry } from './utils'
import type { Nuxt } from 'nuxt/schema'
import type { Nitro } from 'nitropack'
import type { Resolver } from '@nuxt/kit'

vi.mock('node:fs')
vi.mock('node:fs/promises')

beforeEach(() => {
  vol.reset()
})

describe('getPublicAssets', () => {
  it('should return all public assets', async () => {
    vol.fromNestedJSON({
      '/public': {
        'index.html': 'Hello, world!',
        assets: {
          'image.png': 'Hello, world!',
        },
      },
    })

    const resolver = {
      resolvePath: vi.fn().mockImplementation((path) => path),
    } as unknown as Resolver

    const assets = await getPublicAssets(
      { options: { dir: { public: '/public' } } } as Nuxt,
      resolver,
    )
    expect(assets.toSorted()).toEqual(
      ['/index.html', '/assets/image.png'].toSorted(),
    )
  })
  it('should handle when the public directory does not exist', async () => {
    const resolver = {
      resolvePath: vi.fn().mockImplementation((path) => path),
    } as unknown as Resolver
    const assets = await getPublicAssets(
      { options: { dir: { public: '/public' } } } as Nuxt,
      resolver,
    )
    expect(assets).toEqual([])
  })
})

describe('prepareEntry', () => {
  const createNitro = (preset: string) =>
    ({
      options: { entry: '/app/entry.mjs', preset, virtual: {} },
      hooks: { hook: vi.fn() },
    }) as unknown as Nitro

  const getEntry = (nitro: Nitro) =>
    nitro.options.virtual['#virtual/instrumented-entry'] as string

  it('creates the instrumentations before loading the application on node-server', () => {
    const nitro = createNitro('node-server')
    prepareEntry(nitro, { enabled: true })

    const entry = getEntry(nitro)
    const instrumentationsImport = entry.indexOf('nodeInstrumentations')
    expect(instrumentationsImport).toBeGreaterThan(entry.indexOf('register('))
    expect(entry).toContain('.then(() => import("/app/entry.mjs"))')
    expect(nitro.options.entry).toBe('#virtual/instrumented-entry')
  })

  it('loads only the application when automatic initialization is disabled', () => {
    const nitro = createNitro('node-server')
    prepareEntry(nitro, { enabled: true, disableAutomaticInitialization: true })

    const entry = getEntry(nitro)
    expect(entry).not.toContain('nodeInstrumentations')
    expect(entry).toContain('import("/app/entry.mjs")')
  })

  it('gives the instrumentations their own chunk so the entry can load them before the server', () => {
    const nitro = createNitro('node-server')
    prepareEntry(nitro, { enabled: true })

    const [hookName, hook] = vi.mocked(nitro.hooks.hook).mock.calls[0]!
    expect(hookName).toBe('rollup:before')
    const nitroChunks = (id: string, _meta: unknown) =>
      id.startsWith('/nitro/') ? 'nitro' : undefined
    const rollupConfig = {
      input: '/app/entry.mjs',
      output: { manualChunks: nitroChunks },
    }
    ;(hook as (nitro: Nitro, config: typeof rollupConfig) => void)(
      nitro,
      rollupConfig,
    )

    const instrumentationsFile = `${fileURLToPath(new URL('./runtime/nitro/nodeInstrumentations', import.meta.url))}.ts`
    const meta = {}
    expect(rollupConfig.output.manualChunks(instrumentationsFile, meta)).toBe(
      'nitro/instrumentations',
    )
    expect(
      rollupConfig.output.manualChunks('/nitro/runtime/app.mjs', meta),
    ).toBe('nitro')
  })

  it('starts the dev worker from a wrapper that creates the instrumentations first', async () => {
    const nitro = createNitro('nitro-dev')
    prepareEntry(nitro, { enabled: true })

    const [hookName, hook] = vi.mocked(nitro.hooks.hook).mock.calls[0]!
    expect(hookName).toBe('rollup:before')
    const rollupConfig = {
      output: {} as { entryFileNames?: string },
      plugins: [] as unknown,
    }
    await (
      hook as (nitro: Nitro, config: typeof rollupConfig) => Promise<void>
    )(nitro, rollupConfig)

    expect(rollupConfig.output.entryFileNames).toBe('server.mjs')
    const plugin = (rollupConfig.plugins as unknown[]).at(-1) as {
      generateBundle: (this: { emitFile: (file: unknown) => void }) => void
    }
    const emitFile = vi.fn()
    plugin.generateBundle.call({ emitFile })

    const { fileName, source } = emitFile.mock.calls[0]![0] as {
      fileName: string
      source: string
    }
    expect(fileName).toBe('index.mjs')
    expect(source.indexOf('nodeInstrumentations')).toBeGreaterThan(-1)
    expect(source.indexOf('nodeInstrumentations')).toBeLessThan(
      source.indexOf("import('./server.mjs')"),
    )
  })

  it('leaves the dev worker entry alone when automatic initialization is disabled', () => {
    const nitro = createNitro('nitro-dev')
    prepareEntry(nitro, { enabled: true, disableAutomaticInitialization: true })

    expect(nitro.hooks.hook).not.toHaveBeenCalled()
  })
})
