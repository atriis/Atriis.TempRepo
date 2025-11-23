const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 300000,
  workers: process.env.CI ? 2 : 4,

  // Reporters for CI/CD and dashboard parsing
  reporter: [
    ['list'],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],

  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    viewport: null,
    ignoreHTTPSErrors: true
  },

  projects: [
    {
      name: 'Smoke',
      testDir: 'tests/smoke',
      testMatch: '**/smoke.spec.js',
      use: { channel: 'chrome' }
    },
    {
      name: 'Regression',
      testDir: 'tests/regression',
      testMatch: '**/*.spec.js',
      use: { channel: 'chrome' }
    }
  ]
});
