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
 * Dynamically creates users for a provider based on available env vars.
 * Handles multiple naming patterns:
 *   - PROVIDER_USER_ONE_EMAIL → user_one
 *   - CHRIS_TREE_USER_EMAIL → chris_tree (cross-provider users)
 *   - AMADEUS_RUI_MENDES_USER → rui_mendes
 *   - AMADEUS_WITH_GDS_PROFILE → with_gds_profile
 *   - GENERAL_FLOWS_HARRY_POTTER_USER_EMAIL → harry_potter
 * 
 * This eliminates the need to update config.js when adding new users.
 * Just add the env var (locally in .env and in CI secrets).
 */
function createProviderUsers(provider) {
  const normalizedProvider = provider.toUpperCase().replace(/-/g, '_');
  const users = {};
  
  // Scan all env vars to find matches
  Object.keys(process.env).forEach(envKey => {
    // Skip if it's the general password
    if (envKey === 'GENERAL_PASSWORD') return;
    
    let userKey = null;
    
    // Pattern 1: Direct provider prefix (AMADEUS_USER_ONE_EMAIL, AMADEUS_WITH_GDS_PROFILE)
    if (envKey.startsWith(`${normalizedProvider}_`)) {
      userKey = envKey
        .replace(`${normalizedProvider}_`, '')
        .replace('FLOWS_', '')
        .replace(/_EMAIL$/, '')
        .replace(/_USER$/, '')
        .toLowerCase();
    }
    // Pattern 2: Cross-provider users (CHRIS_TREE_USER_EMAIL for sabre)
    // These don't have provider prefix but should be included based on context
    // For now, we'll add them to all providers that request them
    else if (envKey.endsWith('_EMAIL') || envKey.endsWith('_USER')) {
      // Extract potential user key
      const potentialKey = envKey
        .replace(/_EMAIL$/, '')
        .replace(/_USER$/, '')
        .toLowerCase();
      
      // Only add cross-provider users if they're commonly known
      // (This is a fallback - you can still add them explicitly if needed)
      if (provider === 'sabre' && envKey.startsWith('CHRIS_TREE')) {
        userKey = potentialKey;
      }
    }
    
    // If we found a valid user key, add it
    if (userKey) {
      users[userKey] = createUser(envKey);
    }
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
 * - test users per supplier
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
   * User credentials organized by provider.
   * Users are automatically discovered from environment variables.
   * No need to update this file when adding new users - just add the env var.
   */
  users: {
    amadeus: createProviderUsers('amadeus'),
    amadeus_value_hotel: createProviderUsers('amadeus_value_hotel'),
    sabre: createProviderUsers('sabre'),
    galileo: createProviderUsers('galileo'),
    ratehawk: createProviderUsers('ratehawk'),
    expedia: createProviderUsers('expedia'),
    bookingcom: createProviderUsers('bookingcom'),
    ehotel: createProviderUsers('ehotel'),
    travelodge: createProviderUsers('travelodge'),
    premierinn: createProviderUsers('premierinn'),
    afkl: createProviderUsers('afkl'),
    lufthansa: createProviderUsers('lufthansa'),
    british: createProviderUsers('british'),
    united: createProviderUsers('united'),
    american: createProviderUsers('american'),
    iberia: createProviderUsers('iberia'),
    sunny: createProviderUsers('sunny'),
    fusion: createProviderUsers('fusion'),
    ypsilon: createProviderUsers('ypsilon'),
    amadeuslightticketing: createProviderUsers('amadeuslightticketing'),
    galileoach: createProviderUsers('galileoach'),
    benerail: createProviderUsers('benerail'),
    evolvi: createProviderUsers('evolvi'),
    amtrak: createProviderUsers('amtrak'),
    groundscope: createProviderUsers('groundscope'),
    transferz: createProviderUsers('transferz'),
    ukparking: createProviderUsers('ukparking'),
    travelpolicy: createProviderUsers('travelpolicy'),
    general: createProviderUsers('general'),
  },
};

module.exports = config;
