import { defineProject } from 'vitest/config'
import packageJson from './package.json'
import { vitestCIConfigThreading } from '@scayle/vitest-config-storefront'

export default defineProject({
  test: {
    name: `v2:${packageJson.name}`,
    globals: true,
    setupFiles: ['./test/hook-loader.mjs'],
    ...vitestCIConfigThreading,
    hookTimeout: 60000,
    testTimeout: 60000,
  },
  define: {
    __package_version: `'${packageJson.version}'`,
    __package_name: `'${packageJson.name}'`,
  },
})
