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

  // Known provider prefixes — vars starting with these belong to specific providers
  const KNOWN_PREFIXES = [
    'AMADEUS', 'SABRE', 'GALILEO', 'RATEHAWK', 'EXPEDIA', 'BOOKINGCOM',
    'EHOTEL', 'TRAVELODGE', 'PREMIERINN', 'AFKL', 'LUFTHANSA', 'BRITISH',
    'UNITED', 'AMERICAN', 'IBERIA', 'SUNNY', 'FUSION', 'YPSILON',
    'GALILEOACH', 'BENERAIL', 'EVOLVI', 'AMTRAK', 'GROUNDSCOPE',
    'TRANSFERZ', 'UKPARKING', 'TRAVELPOLICY', 'GENERAL',
  ];
  
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
    else if (envKey.endsWith('_EMAIL') || envKey.endsWith('_USER')) {
      const hasKnownPrefix = KNOWN_PREFIXES.some(p => envKey.startsWith(p + '_'));
      if (!hasKnownPrefix) {
        // Bare var like ELI_EMAIL — available under all providers
        userKey = envKey
          .replace(/_EMAIL$/, '')
          .replace(/_USER$/, '')
          .toLowerCase();
      } else if (provider === 'sabre' && envKey.startsWith('CHRIS_TREE')) {
        userKey = envKey.replace(/_EMAIL$/, '').replace(/_USER$/, '').toLowerCase();
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
 * Creates users from simple USER_<label>=email format.
 * Example: USER_BRUNA=bruna@atriis.com → accessible as config.users.labels.bruna
 * Usage in Gherkin: Given I am logged in as "bruna"
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
    /**
     * Simple label users — defined as USER_<label>=email in .env.
     * These are provider-agnostic and are the recommended approach for new users.
     */
    labels: createLabelUsers(),
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
    amadeus_light_ticketing: createProviderUsers('amadeus_light_ticketing'),
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

/**
 * Finds a user across all providers by userKey.
 * Returns { provider, userKey, userConfig } or throws if not found.
 *
 * @param {string} userKey - e.g. 'eli'
 * @returns {{ provider: string, userKey: string, userConfig: object }}
 */
config.resolveUser = function (userKey) {
  if (!userKey || typeof userKey !== 'string') {
    throw new Error('userKey must be a non-empty string, got: ' + typeof userKey);
  }
  const key = userKey.toLowerCase();
  for (const [provider, users] of Object.entries(config.users)) {
    if (users && users[key]) {
      return { provider, userKey: key, userConfig: users[key] };
    }
  }
  throw new Error(`User not found in any provider: ${userKey}`);
};

module.exports = config;
