import { defineConfig, configDefaults } from 'vitest/config'
import packageJson from './package.json'
import { vitestCIConfigThreading } from '@scayle/vitest-config-storefront'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,js,mjs}'],
      reporter: ['text', 'cobertura'],
      exclude: [
        ...(configDefaults.coverage.exclude || []),
        './playground/**',
        '__mocks__/**',
      ],
    },
    setupFiles: [
      './test/hook-loader.mjs',
    ],
    ...vitestCIConfigThreading,
    hookTimeout: 60000,
    testTimeout: 60000,
  },
  define: {
    '__package_version': `'${packageJson.version}'`,
    '__package_name': `'${packageJson.name}'`,
  },
})
