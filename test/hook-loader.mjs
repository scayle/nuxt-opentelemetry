import * as module from 'node:module'

module.register('import-in-the-middle/hook.mjs', import.meta.url)
