import { defineConfig, configDefaults } from 'vitest/config'
import packageJson from './package.json'
import { vitestConfigPoolForksLimited } from '@scayle/vitest-config-storefront'

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
    // As we modify the forks.execArgv here, we can't override the config via the vitestCIThreading,
    // hence we manually replicate it here.
    // As we modify the forks.execArgv here and thus use the values from the vitestConfigPoolForksLimited.
    pool: vitestConfigPoolForksLimited.pool,
    poolOptions: {
      forks: {
        execArgv: ['--import=./test/hook-loader.mjs'],
        ...(process.env.CI && {
          ...vitestConfigPoolForksLimited.poolOptions?.forks,
        }),
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
