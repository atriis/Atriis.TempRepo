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

function getOptionalEnv(name, defaultValue = "") {
  const value = process.env[name];
  if (value === undefined || String(value).trim() === "") {
    return defaultValue;
  }
  return value;
}

function getOptionalBooleanEnv(name, defaultValue = false) {
  const raw = process.env[name];
  if (raw === undefined || String(raw).trim() === "") {
    return defaultValue;
  }

  const normalized = String(raw).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
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

  // Legacy GTP front (AngularJS) used by agents to work requested trips. Only agent-assistance
  // scenarios navigate here; the corporate app stays on baseUrl.
  get legacyGtpUrl() {
    return getEnv("LEGACY_GTP_BASEURL");
  },

  get quotesApiPath() {
    return getOptionalEnv("QUOTES_API_PATH", "/api/v3/quotes");
  },

  get flightPricingApiPath() {
    return getOptionalEnv("FLIGHT_PRICING_API_PATH", "/api/v3/flightPricing");
  },

  // New Flight Flow brand-selection pricing endpoint (per-leg fare rules live here).
  get flightPricingSelectionApiPath() {
    return getOptionalEnv("FLIGHT_PRICING_SELECTION_API_PATH", "/api/v3/FlightPricingSelection");
  },

  get flightSearchApiPath() {
    return getOptionalEnv("FLIGHT_SEARCH_API_PATH", "/flightSearch");
  },

  // Trip related-files upload response endpoint and download request endpoint.
  get tripFilesUploadApiPath() {
    return getOptionalEnv("TRIP_FILES_UPLOAD_API_PATH", "/TripFiles");
  },

  get tripFilesDownloadApiPath() {
    return getOptionalEnv("TRIP_FILES_DOWNLOAD_API_PATH", "/TripsUploadFiles");
  },

  payloadValidation: {
    get enabled() {
      return getOptionalBooleanEnv("PAYLOAD_VALIDATION_ENABLED", true);
    },
    get internalAtriisBaseUrl() {
      return getOptionalEnv("PAYLOAD_VALIDATION_INTERNAL_ATRIIS_BASE_URL", "");
    },
    get internalAtriisToken() {
      return getOptionalEnv("PAYLOAD_VALIDATION_INTERNAL_ATRIIS_TOKEN", "");
    },
    get lookbackMinutes() {
      return Number(getOptionalEnv("PAYLOAD_VALIDATION_LOOKBACK_MINUTES", "60"));
    },
    get timeoutMs() {
      return Number(getOptionalEnv("PAYLOAD_VALIDATION_TIMEOUT_MS", "20000"));
    },
    get maxRequestsMatches() {
      return Number(getOptionalEnv("PAYLOAD_VALIDATION_MAX_REQUESTS_MATCHES", "10"));
    },
    get maxRequestsMatches() {
      return Number(getOptionalEnv("PAYLOAD_VALIDATION_MAX_REQUESTS_MATCHES", "10"));
    },
  },
};

module.exports = config;
