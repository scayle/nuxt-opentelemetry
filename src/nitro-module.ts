import { nitroSetup, prepareEntry } from './utils'
import { defu } from 'defu'
import type { NitroModule } from 'nitropack'
import type { ModuleOptions } from './module'

const module: (options: ModuleOptions) => NitroModule = (
  options: ModuleOptions,
) => ({
  setup(nitro) {
    nitroSetup(nitro.options, options)
    nitro.options.runtimeConfig.opentelemetry = defu(
      {
        pathBlocklist: undefined,
        pathReplace: undefined,
        responseHeaders: [],
        requestHeaders: [],
      },
      options,
    )
    prepareEntry(nitro, options)
  },
})

export default module
