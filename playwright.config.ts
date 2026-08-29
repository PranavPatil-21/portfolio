import { defineConfig, devices } from '@playwright/test'

const PORT = 3100
const baseURL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL, trace: 'on-first-retry' },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // The no-JS suite asserts that nothing is left transparent. With
      // JavaScript enabled that is false by design — below-the-fold elements sit
      // at opacity 0 until they scroll into view — so it belongs only to the
      // project that actually disables scripting.
      testIgnore: /nojs\.spec\.ts/,
    },
    {
      // Proves the site is readable without JS — the spec requires all content
      // to be server-rendered DOM, never locked inside the canvas or a client fetch.
      name: 'no-javascript',
      use: { ...devices['Desktop Chrome'], javaScriptEnabled: false },
      testMatch: /nojs\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
