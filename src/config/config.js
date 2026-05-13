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
 * - shared password (from .env)
 * - viewport settings
 *
 * No test should ever read process.env directly.
 * User emails are written directly in Gherkin feature files.
 */
const config = {
  get baseUrl() {
    return getEnv("AUTOMATION_APP_BASEURL");
  },

  get password() {
    return getEnv("GENERAL_PASSWORD");
  },

  viewport: ACTIVE_VIEWPORT,
};

module.exports = config;
