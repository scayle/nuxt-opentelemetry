import { defineBuildConfig } from 'unbuild'
import packageJson from './package.json'

export default defineBuildConfig({
  replace: {
    '__package_version': packageJson.version.toString(),
    '__package_name': packageJson.name,
  },
})
