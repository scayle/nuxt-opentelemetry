import type { NitroApp } from 'nitropack/types'

export default (nitroApp: NitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event) => {
    if (event.path === '/plugin_error') {
      throw new Error('Problem in hook!')
    }
  })
}
