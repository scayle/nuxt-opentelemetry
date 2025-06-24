import { defineConfig, configDefaults } from 'vitest/config'
import packageJson from './package.json'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'cobertura'],
      exclude: [
        ...(configDefaults.coverage.exclude || []),
        './playground/**',
        '__mocks__/**',
      ],
    },
    poolOptions: {
      forks: {
        execArgv: ['--import=./test/hook-loader.mjs'],
      },
    },
    hookTimeout: 60000,
    testTimeout: 60000,
  },
  define: {
    '__package_version': `'${packageJson.version}'`,
    '__package_name': `'${packageJson.name}'`,
  },
})
