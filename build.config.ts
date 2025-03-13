import { defineBuildConfig } from 'unbuild'
import packageJson from './package.json'

export default defineBuildConfig({
  replace: {
    '__package_version': packageJson.version.toString(),
    '__package_name': packageJson.name,
  },
  hooks: {
    'mkdist:entry:options': function(_ctx, entry) {
      entry.esbuild ??= {}
      entry.esbuild.define = {
        '__package_version': JSON.stringify(packageJson.version.toString()),
        '__package_name': JSON.stringify(packageJson.name),
      }
    },
  },
})
