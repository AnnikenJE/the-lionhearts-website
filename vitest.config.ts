import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    include: ['test/**/*.spec.ts'],
    // Plain modules need no Nuxt runtime, so the default is the fast one. A test
    // that does can opt in per file with `// @vitest-environment nuxt`.
    environment: 'node',
  },
})
