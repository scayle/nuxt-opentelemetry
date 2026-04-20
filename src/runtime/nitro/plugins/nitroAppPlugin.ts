import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { useRuntimeConfig } from '#imports'
import type { NitroApp } from 'nitropack/types'
import { channel } from 'node:diagnostics_channel'

/**
 * Publish a notification when Nitro is initialized
 * and save a reference to the nitroApp globally.
 */
export default defineNitroPlugin((nitroApp: NitroApp) => {
  if (!globalThis.__nitro__) {
    globalThis.__nitro__ = {
      app: nitroApp,
      useRuntimeConfig,
    }
  } else {
    globalThis.__nitro__.app = nitroApp
  }

  const runtimeConfig = useRuntimeConfig()
  const initChannel = channel('nitro.init')
  initChannel.publish({ nitroApp, runtimeConfig })
})
