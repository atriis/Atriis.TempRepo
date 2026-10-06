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

  // Public API V1 (the API the Amsalem website books through) is served by the Agency app service,
  // not by the APIM gateway the app uses — /api/v1 answers 404 there. atriis-dev.app runs on
  // Staging 3, whose Agency service is AgencyAPI2-stg.
  get apiV1BaseUrl() {
    return getOptionalEnv("AUTOMATION_AGENCY_API_V1_BASEURL", "https://agencyapi2-stg.azurewebsites.net/api/v1/");
  },

  viewport: ACTIVE_VIEWPORT,

  // Legacy GTP front (AngularJS) used by agents to work requested trips. Only agent-assistance
  // scenarios navigate here; the corporate app stays on baseUrl.
  get legacyGtpUrl() {
    return getEnv("LEGACY_GTP_BASEURL");
  },

  // Fallback domain for the addresses generated when a test shares a quote or itinerary to an
  // external recipient. Only used when no test mailbox is configured below: it just has to be
  // a valid domain the corporation does not own, so the share dialog treats it as an external
  // email. example.com is RFC 2606 reserved and never routes, so mail sent there is not
  // readable — configure mailbox.* to assert on delivered mail.
  get shareRecipientEmailDomain() {
    return getOptionalEnv("SHARE_RECIPIENT_EMAIL_DOMAIN", "example.com");
  },

  // Test mailbox used to read the emails the app actually sends (share quote / share
  // itinerary). Optional: with no API key set, tests can still generate a recipient and assert
  // the send succeeded, but any step that reads delivered mail fails with a configuration error
  // rather than passing vacuously.
  mailbox: {
    // Mailsac API key. Empty disables mail reading — the presence of a key IS the switch.
    get apiKey() {
      return getOptionalEnv("MAILBOX_API_KEY", "");
    },
    // Domain generated addresses are created under. Empty means mailsac.com.
    get domain() {
      return getOptionalEnv("MAILBOX_DOMAIN", "");
    },
    // A reserved (private) Mailsac address every share is delivered to. Prefer this over the
    // per-scenario public addresses it replaces: public mailsac.com inboxes are readable by
    // anyone who guesses the name, and an account with "allow public domains" off cannot read
    // them at all — the API answers 200 with an empty list, so the mail looks undelivered.
    // Because one inbox is now shared by every scenario (and by parallel workers), the run
    // discriminator moves from the address to the subject — see tests/steps/email.steps.js.
    // Empty keeps the old behaviour: a unique public address per scenario.
    get address() {
      return getOptionalEnv("MAILBOX_ADDRESS", "");
    },
    // How long to wait for a sent email to land before failing.
    get timeoutMs() {
      return Number(getOptionalEnv("MAILBOX_TIMEOUT_MS", "120000"));
    },
    // Gap between polls. Each poll is one metered API call, so this is the cost lever.
    get pollIntervalMs() {
      return Number(getOptionalEnv("MAILBOX_POLL_INTERVAL_MS", "5000"));
    },
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

  // OBT seat map (POST ?isMap=true), saved-seat load (GET ?quoteId=) and seat save (PUT).
  get flightSeatsApiPath() {
    return getOptionalEnv("FLIGHT_SEATS_API_PATH", "/api/v3/FlightSeats");
  },

  get flightSearchApiPath() {
    return getOptionalEnv("FLIGHT_SEARCH_API_PATH", "/flightSearch");
  },

  // Parallel EU-rail lookup fired right after a flight search commits its results
  // (flight.store.ts -> searchEuRailOptions). Its answer gates the "Rail is available
  // for this route" banner in flight results.
  get flightEuRailSearchApiPath() {
    return getOptionalEnv("FLIGHT_EU_RAIL_SEARCH_API_PATH", "/flightEURailSearchParallel");
  },

  // Hotel search results endpoint. One POST returns every hotel of the search, and its body carries
  // the searched location. Matched on the pathname end so /hotelsearchautocomplete stays out.
  get hotelSearchApiPath() {
    return getOptionalEnv("HOTEL_SEARCH_API_PATH", "/api/v3/hotelsearch");
  },

  // Loyalty-number extras save endpoint (loyalty-number.ts -> hotelService.addFrequentGuest).
  // POST only: the same route is read back with GET /FrequentPrograms?quoteId=... when the panel opens.
  get frequentProgramsApiPath() {
    return getOptionalEnv("FREQUENT_PROGRAMS_API_PATH", "/frequentprograms");
  },

  // Book & Finalize endpoint (trip.service.ts -> booking). One POST books every quote in the cart and
  // answers with a per-quote bookingResponses[] ({ success, status, errorMsg, type }) plus hasError.
  get bookingApiPath() {
    return getOptionalEnv("BOOKING_API_PATH", "/booking");
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
      // Whole-operation budget for one capture: every lookup attempt, retry delay and payload
      // download shares it. 20s was under the time a post-booking payload takes to reach storage,
      // so the budget expired before the row it was waiting for existed.
      return Number(getOptionalEnv("PAYLOAD_VALIDATION_TIMEOUT_MS", "60000"));
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
