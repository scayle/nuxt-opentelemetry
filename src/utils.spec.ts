import { beforeEach, describe, expect, it, vi } from 'vitest'
import { vol } from 'memfs'
import { getPublicAssets } from './utils'
import type { Nuxt } from 'nuxt/schema'
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
        'assets': {
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
