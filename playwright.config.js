const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 120000,
  use: {
    screenshot: 'only-on-failure',
    viewport: null,
    contextOptions: {
      ignoreHTTPSErrors: true
    }
  },

  /* Configure projects for Google Chrome only */
  projects: [
    {
      name: 'Google Chrome',
      use: { 
        channel: 'chrome',
        viewport: null,
        launchOptions: {
          args: [
            '--incognito',
            '--start-maximized',
            '--window-size=1920,1080'
          ],
        },
      },
    }
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});