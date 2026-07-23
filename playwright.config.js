const { defineConfig } = require('@playwright/test');
require('module-alias/register');

// Note: Tests run via `npx cucumber-js`. This config applies to
// `npx playwright codegen` and Playwright tooling only.

const ACTIVE_VIEWPORT = { width: 1920, height: 1080 };

module.exports = defineConfig({
  use: {
    channel: 'chrome',
    viewport: ACTIVE_VIEWPORT,
    screen: ACTIVE_VIEWPORT,
    ignoreHTTPSErrors: true,
    testIdAttribute: 'data-testid',
  },
});