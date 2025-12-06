
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

/**
 * Minimal helper: returns the env var value or throws a clear error.
 * This avoids undefined values breaking page.goto(config.baseUrl) and logins.
 */
function getEnv(name) {
  const val = process.env[name];
  if (!val || String(val).trim() === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return val;
}

const config = {
  //Use getEnv so baseUrl is guaranteed to be a non-empty string
  baseUrl: getEnv('AUTOMATION_APP_BASEURL'),

  users: {
    amadeus: {
      user_one: {
        //Use getEnv to ensure email/password are defined at runtime
        email: getEnv('AMADEUS_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD')
      },
      user_two: {
        email: getEnv('AMADEUS_USER_TWO_EMAIL'),
        password: getEnv('GENERAL_PASSWORD')
      }
    },
    ratehawk: {
      user_one: {
        email: getEnv('RATEHAWK_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD')
      }
    },
    sabre: {
      user_one: {
        email: getEnv('SABRE_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD')
      }
    },
    benerail: {
      user_one: {
        email: getEnv('BENERAIL_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD')
      }
    },
    evolvi: {
      user_one: {
        email: getEnv('EVOLVI_USER_ONE_EMAIL'),
        password: getEnv('GENERAL_PASSWORD')
      }
    },
    amtrak: {
      user_one: {
        email: getEnv('AMTRAK_USER_ONE_EMAIL'), 
        password: getEnv('GENERAL_PASSWORD')
      }
    },
  },
};

module.exports = config;
