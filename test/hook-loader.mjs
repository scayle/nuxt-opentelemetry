import * as module from 'node:module'

// Node.js 26 deprecates `module.register()` (DEP0205).
const syncHooks = await import('import-in-the-middle/register-hooks.mjs')
if (syncHooks.supportsSyncHooks()) {
  syncHooks.register()
} else {
  module.register('import-in-the-middle/hook.mjs', import.meta.url)
}
