/**
 * Playwright Defaults:
 * - headless: true (browser runs without UI)
 * - timeout: 30,000 ms (30 seconds for actions)
 * - browserType: chromium
 * - slowMo: 0 (no delay)
 * - tracing: off (must enable manually)
 * - screenshots: off (must enable manually)
 * - artifactsDir: playwright-report
 *
 * In this project, we only configure:
 * - baseUrl (application under test)
 * - Amadeus user email and password
 *
 * Optional parameters you can override if needed:
 * - headless: Set to false for local debugging
 * - timeoutMs: Increase if your app is slow (e.g., 90000)
 * - browserType: Change to 'firefox' or 'webkit'
 * - enableTracing: true to capture Playwright traces
 * - captureScreenshots: true to save screenshots on failure
 * - slowMo: Add delay for debugging (e.g., 100 ms)
 * - artifactsDir: Custom folder for test results
 */

const dotenv = require('dotenv');

// Load variables from .env into process.env (local runs).
// In CI, env vars will come from the pipeline and this is harmless.
dotenv.config();

const config = {
  baseUrl: process.env.AUTOMATION_APP_BASEURL,

  users: {
    amadeusUserOne: {
      email: process.env.AMADEUS_USER_ONE_EMAIL,
      password: process.env.GENERAL_PASSWORD,
    },
    // Later you can add more users here
  },
};

module.exports = config;

