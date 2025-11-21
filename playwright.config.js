const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 120000,

  // Enable parallel execution (different workers for CI vs local)
  workers: process.env.CI ? 2 : 4,

  // Reporters: console, JUnit for CI, HTML for local debugging
  reporter: [
    ['list'],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],

  use: {
    // Diagnostics for debugging failures
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',

    viewport: null,
    ignoreHTTPSErrors: true
  },

  projects: [
    {
      name: 'Google Chrome',
      use: {
        channel: 'chrome',
        launchOptions: {
          args: [
            '--incognito',
            '--start-maximized',
            '--window-size=1920,1080',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ]
        }
      }
    }
  ]
});