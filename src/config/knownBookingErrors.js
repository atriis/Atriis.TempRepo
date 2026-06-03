const dotenv = require("dotenv");
const baseKnownBookingErrors = require("./knownBookingErrors.json");

dotenv.config();

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

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base, override, options = {}) {
  const { replaceArrays = false } = options;

  if (Array.isArray(override)) {
    if (replaceArrays || !Array.isArray(base)) {
      return [...override];
    }

    return [...new Set([...base, ...override])];
  }

  if (!isPlainObject(override)) {
    return override;
  }

  const result = isPlainObject(base) ? { ...base } : {};

  Object.entries(override).forEach(([key, value]) => {
    result[key] = deepMerge(result[key], value, options);
  });

  return result;
}

function getKnownBookingErrorsOverride() {
  const raw = process.env.KNOWN_BOOKING_ERRORS_JSON;
  if (!raw || String(raw).trim() === "") {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) {
      throw new Error("KNOWN_BOOKING_ERRORS_JSON must be a JSON object.");
    }

    return parsed;
  } catch (error) {
    throw new Error(`Invalid KNOWN_BOOKING_ERRORS_JSON: ${error.message}`);
  }
}

const envOverride = getKnownBookingErrorsOverride();
const shouldOverride = getOptionalBooleanEnv(
  "KNOWN_BOOKING_ERRORS_OVERRIDE_JSON",
  false
);
const knownBookingErrors = envOverride
  ? deepMerge(baseKnownBookingErrors, envOverride, {
      replaceArrays: shouldOverride,
    })
  : baseKnownBookingErrors;

function normalizeErrorValue(value) {
  if (!value) return "";
  return String(value)
    .toUpperCase()
    .replace(/[*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesKnownError(knownError, errorValue) {
  const known = normalizeErrorValue(knownError);
  const candidate = normalizeErrorValue(errorValue);

  if (!known || !candidate) return false;
  return candidate.includes(known);
}

function getKnownErrorList(config, product, subProduct) {
  if (!isPlainObject(config)) return [];

  const productConfig = config[product];
  if (!isPlainObject(productConfig)) return [];

  if (product === "transportation" && subProduct) {
    const subProductConfig = productConfig[subProduct];
    return Array.isArray(subProductConfig?.knownErrors)
      ? subProductConfig.knownErrors
      : [];
  }

  return Array.isArray(productConfig.knownErrors) ? productConfig.knownErrors : [];
}

function getKnownErrorSource(product, subProduct, errorValue) {
  const jsonKnownErrors = getKnownErrorList(baseKnownBookingErrors, product, subProduct);
  const envKnownErrors = getKnownErrorList(envOverride || {}, product, subProduct);

  const matchedInJson = jsonKnownErrors.some((knownError) =>
    matchesKnownError(knownError, errorValue)
  );
  const matchedInEnv = envKnownErrors.some((knownError) =>
    matchesKnownError(knownError, errorValue)
  );

  // In override mode, env lists are authoritative for source attribution.
  if (shouldOverride) {
    if (matchedInEnv) return "env";
    return "unknown";
  }

  if (matchedInJson && matchedInEnv) return "json & env";
  if (matchedInEnv) return "env";
  if (matchedInJson) return "json";
  return "unknown";
}

Object.defineProperty(knownBookingErrors, "getKnownErrorSource", {
  value: getKnownErrorSource,
  enumerable: false,
});

module.exports = knownBookingErrors;
