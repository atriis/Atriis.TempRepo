const hotelData = require("@data/hotels.json");
const { parseDateValue } = require("@utils/calendar.helper");
const { normalizeTextStrict } = require("@utils/text");

// Keys of nightlyLimitByMonth in hotels.json, indexed the same way as Date#getMonth().
const MONTH_ABBREVIATIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Normalizes a searched location into a key of hotels.json -> gsaPerDiems.
 * "Tallahassee", "tallahassee, FL, USA" and "TALLAHASSEE" all resolve to "tallahassee".
 *
 * @param {string} location - The location the hotel search was performed with
 * @returns {string} The normalized lookup key
 */
function toPerDiemKey(location) {
  if (typeof location !== "string" || !location.trim()) {
    throw new Error(`location must be a non-empty string, got: ${typeof location}`);
  }

  // Only the city part matters — "Tallahassee, FL, USA" and "Tallahassee" are the same city.
  return normalizeTextStrict(location.split(",")[0]).replace(/\s/g, "");
}

/**
 * Reads the month out of a check-in date as the search form displays it. The date range
 * picker renders "ddd, MMM DD" (e.g. "Wed, Aug 26"); parseDateValue also accepts the other
 * date formats the application uses, so the caller never depends on one display format.
 *
 * @param {string} checkInDate - The check-in value read back from the search form
 * @returns {string} The month abbreviation, e.g. "Aug"
 */
function extractCheckInMonth(checkInDate) {
  return MONTH_ABBREVIATIONS[parseDateValue(checkInDate).getMonth()];
}

/**
 * Resolves the GSA allowance that applies to a hotel search.
 *
 * The nightly lodging limit changes with the month of the stay, so the limit is
 * looked up per check-in month and falls back to the city's default limit for any
 * month not listed. The meals allowance is flat and never affects policy status.
 *
 * @param {string} location - The location the hotel search was performed with
 * @param {string} checkInDate - The check-in value read back from the search form
 * @returns {{cityName: string, currency: string, currencySymbol: string, checkInMonth: string,
 *            nightlyLimit: number, mealsAllowance: number, limitationName: string}}
 */
function resolveGsaPerDiem(location, checkInDate) {
  const key = toPerDiemKey(location);
  const perDiem = hotelData.gsaPerDiems?.[key];

  if (!perDiem) {
    const known = Object.keys(hotelData.gsaPerDiems ?? {}).join(", ") || "none";
    throw new Error(`No GSA per diem configured for location "${location}" (key "${key}"). Known: ${known}`);
  }

  const checkInMonth = extractCheckInMonth(checkInDate);
  const nightlyLimit = perDiem.nightlyLimitByMonth?.[checkInMonth] ?? perDiem.defaultNightlyLimit;

  if (typeof nightlyLimit !== "number") {
    throw new Error(`No nightly lodging limit for ${perDiem.cityName} in ${checkInMonth}`);
  }

  return {
    cityName: perDiem.cityName,
    currency: perDiem.currency,
    currencySymbol: perDiem.currencySymbol,
    checkInMonth,
    nightlyLimit,
    mealsAllowance: perDiem.mealsAllowance,
    limitationName: perDiem.limitationName,
  };
}

/**
 * Builds the GSA banner text the application is expected to render for an allowance.
 * Mirrors gsa-details-banner.vue: a title line followed by the limit line.
 *
 * @param {{cityName: string, currencySymbol: string, nightlyLimit: number, mealsAllowance: number}} allowance
 * @returns {{title: string, info: string}}
 */
function buildGsaBannerText(allowance) {
  return {
    title: `GSA lodging limit for ${allowance.cityName}`,
    info:
      `${allowance.cityName} nightly lodging limit ${allowance.currencySymbol}${allowance.nightlyLimit} ` +
      `and meals allowance ${allowance.currencySymbol}${allowance.mealsAllowance} ` +
      `(Meals allowance does not affect policy status).`,
  };
}

/**
 * Builds the policy violation text the OOP tooltip is expected to show for an allowance.
 *
 * @param {{limitationName: string, nightlyLimit: number, currency: string}} allowance
 * @returns {string}
 */
function buildGsaViolationText(allowance) {
  return `Limitation ${allowance.limitationName} is violated GSA per diem ${allowance.nightlyLimit} ${allowance.currency} per room, per night`;
}

/**
 * Splits priced results into the ones that contradict the GSA nightly limit.
 *
 * Results priced exactly at the limit are counted but never reported as breaches —
 * the policy defines the indicator for prices above and below the limit only.
 *
 * @param {Array<{price: number, isOutOfPolicy: boolean}>} entries - Priced results in display order
 * @param {number} nightlyLimit - The GSA nightly lodging limit that applies to the stay
 * @returns {{total: number, aboveLimit: number, belowLimit: number,
 *            missingIndicator: Array<object>, unexpectedIndicator: Array<object>}}
 */
function splitByGsaLimit(entries, nightlyLimit) {
  if (!Array.isArray(entries)) {
    throw new Error(`entries must be an array, got: ${typeof entries}`);
  }
  if (typeof nightlyLimit !== "number" || Number.isNaN(nightlyLimit)) {
    throw new Error(`nightlyLimit must be a number, got: ${nightlyLimit}`);
  }

  const above = entries.filter((entry) => entry.price > nightlyLimit);
  const below = entries.filter((entry) => entry.price < nightlyLimit);

  return {
    total: entries.length,
    aboveLimit: above.length,
    belowLimit: below.length,
    missingIndicator: above.filter((entry) => !entry.isOutOfPolicy),
    unexpectedIndicator: below.filter((entry) => entry.isOutOfPolicy),
  };
}

module.exports = {
  resolveGsaPerDiem,
  extractCheckInMonth,
  buildGsaBannerText,
  buildGsaViolationText,
  splitByGsaLimit,
};
