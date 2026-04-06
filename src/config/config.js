const dotenv = require("dotenv");
dotenv.config();

/**
 * Reads a required environment variable.
 * If it does not exist, the test suite stops immediately
 * with a clear error message.
 */
function getEnv(name) {
  const value = process.env[name];
  if (!value || String(value).trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

/**
 * Helper to define a single test user with lazy evaluation.
 * Credentials are only validated when actually accessed,
 * allowing partial test runs with subset of environment variables.
 */
function createUser(emailEnvVar) {
  return {
    get email() {
      return getEnv(emailEnvVar);
    },
    get password() {
      return getEnv("GENERAL_PASSWORD");
    },
  };
}

/**
 * Creates users from simple USER_<label>=email format.
 * Example: USER_ELI=eli@atriis.com → accessible as config.users.labels.eli
 * Usage in Gherkin: Given I am logged in as "eli"
 * No provider prefix needed — labels work across all test scenarios.
 */
function createLabelUsers() {
  const users = {};
  Object.keys(process.env).forEach(envKey => {
    if (!envKey.startsWith('USER_')) return;
    const label = envKey.replace(/^USER_/, '').toLowerCase();
    if (label) users[label] = createUser(envKey);
  });
  return users;
}

/**
 * Viewport presets for flexibility.
 * Can be changed via VIEWPORT env variable.
 * Default = desktopFullHD (1920x1080)
 */
const viewportPresets = {
  laptop: { width: 1366, height: 768 },
  desktop: { width: 1440, height: 900 },
  desktopFullHD: { width: 1920, height: 1080 },
  ultrawide: { width: 2560, height: 1440 },
};

const ACTIVE_VIEWPORT =
  viewportPresets[process.env.VIEWPORT] ||
  viewportPresets.desktopFullHD;

/**
 * Central test configuration.
 * This file defines:
 * - application URL
 * - viewport settings
 * - test users by label
 *
 * No test should ever read process.env directly.
 *
 * Note: User credentials use lazy evaluation (getters) so env vars
 * are only validated when accessed, not at config load time.
 */
const config = {
  get baseUrl() {
    return getEnv("AUTOMATION_APP_BASEURL");
  },

  viewport: ACTIVE_VIEWPORT,

  /**
   * User credentials organized by label.
   * Users are automatically discovered from USER_* environment variables.
   */
  users: {
    /**
     * Simple label users — defined as USER_<label>=email in .env.
     * This is the only supported user format in the project.
     */
    labels: createLabelUsers(),
  },
};

/**
 * Finds a label-based user by userKey.
 * Returns { userKey, userConfig } or throws if not found.
 *
 * @param {string} userKey - e.g. 'eli'
 * @returns {{ userKey: string, userConfig: object }}
 */
config.resolveUser = function (userKey) {
  if (!userKey || typeof userKey !== 'string') {
    throw new Error('userKey must be a non-empty string, got: ' + typeof userKey);
  }
  const key = userKey.toLowerCase();
  const userConfig = config.users.labels?.[key];
  if (userConfig) {
    return { userKey: key, userConfig };
  }
  throw new Error(`User not found in labels config: ${userKey}`);
};

module.exports = config;
