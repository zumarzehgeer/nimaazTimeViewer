import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests-upgrade',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4174', trace: 'retain-on-failure' },
  webServer: {
    command: 'node scripts/serve-upgrade-test.mjs',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
  },
})
