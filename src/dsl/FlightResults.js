const { expect } = require("@playwright/test");
const FlightResultsPage = require("@pages/FlightResultsPage");
const PayloadValidation = require("./PayloadValidation");
const logger = require("@utils/logger").child("FlightResults-DSL");
// The distributor log publishes after the screen has rendered, so a read of it waits this long.
const { CartPage } = require("@pages/CartPage");
const { ResultsPage } = require("@pages/ResultsPage");
const Results = require("./Results");
const { CommonPage } = require("@src/pages/CommonPage");
const { getPageObject } = require("@utils/pageObjectCache");
const { readJson } = require("@utils/networkInterceptor");
const { parseTimeToMinutes } = require("@utils/calendar.helper");
const { expectNumbersToBeEqualWithTolerance } = require("../assertions/numberAssertions");
const {
  extractCurrencySymbol,
  getCurrencyCodeFromSymbol,
  getCurrencySymbolFromCode,
  getCurrencyConversionTolerance,
  getExchangeRate,
  normalizeCurrencyCode,
} = require("../utils/currencyConversion");

// A result card renders one leg container per itinerary leg, outbound first. "Inbound" is the
// second leg — on a multi-city search that is the second requested leg.
const INBOUND_LEG_INDEX = 1;

// Airline filter options whose result cards name the carrier differently (flight-preview-segment.vue
// prints $t('flight.multipleCarriers') on a leg flown by more than one airline).
const CARRIER_FILTER_CARD_NAMES = {
  'Multi carrier': 'Multiple Carriers',
};

/** Parses a flight details connection duration ("2h 30m", "1d 3h") into minutes. */
function layoverTextToMinutes(text, cardIndex, legIndex) {
  const matches = [...(text || '').matchAll(/(\d+)\s*([dhm])/gi)];
  if (!matches.length) {
    throw new Error(
      `[FlightResults.getLayoverMinutesPerResult] Result card ${cardIndex + 1}, leg ${legIndex + 1}: the flight details ` +
      `drawer shows "${text}" as a connection time, which is not a parsable duration.`
    );
  }
  const unitMinutes = { d: 24 * 60, h: 60, m: 1 };
  return matches.reduce((total, [, amount, unit]) => total + Number(amount) * unitMinutes[unit.toLowerCase()], 0);
}

function describeLayover(layover) {
  const parts = layover.stopMinutes.length > 1 ? ` (stops ${layover.stopMinutes.join(' + ')} min)` : '';
  return `card ${layover.card} leg ${layover.leg} "${layover.text}" = ${layover.minutes} min${parts}`;
}

function assertLayoversInRange(layovers, range, caller) {
  const outside = layovers.filter((layover) =>
    layover.minutes !== null && (layover.minutes < range.startMinutes || layover.minutes > range.endMinutes));

  if (outside.length) {
    throw new Error(
      `[FlightResults.${caller}] ${outside.length} layover(s) fall outside the Limit Layover Duration range ` +
      `"${range.rangeText}" (${range.startMinutes}-${range.endMinutes} min), so the filter let them through: ` +
      outside.map(describeLayover).join('; ')
    );
  }
}

/**
 * Retries the card-only layover read until the rendered list agrees with the range, so a list still
 * re-rendering after a filter click is not judged. Multi-stop legs are only counted here; their
 * totals need the drawer and are judged once the list has settled.
 */
async function waitForCardLayoversInRange(dsl, page, range, caller, { requireMultiStop = false, timeout = 15000 } = {}) {
  let lastError;

  try {
    await expect(async () => {
      try {
        const layovers = await dsl.getLayoverMinutesPerResult(page, { includeMultiStop: false });
        if (!layovers.length) {
          throw new Error('No rendered result has a leg with a stop, so there is no layover to judge.');
        }
        if (requireMultiStop && !layovers.some((layover) => layover.stops > 1)) {
          throw new Error('No rendered result has a leg with two or more stops yet.');
        }
        assertLayoversInRange(layovers, range, caller);
      } catch (err) {
        lastError = err;
        throw err;
      }
    }).toPass({ timeout });
  } catch (err) {
    throw new Error(
      `[FlightResults.${caller}] The rendered results never agreed with the Limit Layover Duration range ` +
      `"${range.rangeText}" within ${timeout}ms. Original: ${(lastError || err).message}`
    );
  }
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// The leading time of a "20:05 · Fri, 16 Oct 26" line. Only the time is matched here; the
// separator and date are taken from the remainder, because a single regex spanning both lets the
// trailing group swallow the separator glyph.
const DRAWER_LEADING_TIME = /^\s*(\d{1,2}:\d{2}(?:\s*[AaPp]\.?[Mm]\.?)?)/;
// Anything non-alphanumeric between the time and the date is separator — a middot on staging,
// but treating any such run the same means a locale that swaps the glyph cannot break parsing.
const DRAWER_SEPARATOR = /^[^A-Za-z0-9]+/;
// "Fri, 16 Oct 26" / "Friday, 16 October 2026" / "16 Oct" — weekday and year both optional, month
// either abbreviated or full, year either 2- or 4-digit.
const DRAWER_DATE = /^(?:([A-Za-z]{3,9})\.?,?\s*)?(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s*(\d{2,4})?$/;

/**
 * Parses a rendered date — "Fri, 16 Oct 26", "Friday, 16 October 2026", "16 Oct" — into its parts.
 *
 * Shared by the drawer and the results card so both surfaces are read by the same code: a date
 * comparison between them can then only fail on a real difference, never on two parsers
 * disagreeing.
 *
 * Returns null rather than throwing so the caller can report WHICH leg failed and what the raw
 * text was — a bare parse error here would lose that context.
 *
 * @param {string} text
 * @returns {{dateText: string, day: number, month: number, year: number|null,
 *            weekday: string|null}|null}
 */
function parseFlightDate(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const dateMatch = text.trim().match(DRAWER_DATE);
  if (!dateMatch) {
    return null;
  }

  const [, weekday, day, monthToken, year] = dateMatch;
  const month = MONTH_NAMES.findIndex(
    (name) => name.toLowerCase() === monthToken.toLowerCase()
      || name.slice(0, 3).toLowerCase() === monthToken.toLowerCase()
  );

  if (month < 0) {
    return null;
  }

  // A 2-digit year is this century: the drawer renders "26" for 2026, and no bookable itinerary
  // is a hundred years out, so there is no ambiguity to resolve.
  let resolvedYear = null;
  if (year) {
    resolvedYear = year.length === 2 ? 2000 + Number(year) : Number(year);
  }

  return {
    dateText: text.trim(),
    day: Number(day),
    month,
    year: resolvedYear,
    weekday: weekday ?? null,
  };
}

/**
 * Parses one "HH:mm · EEE, dd MMM yy" line from the flight details drawer into its time and its
 * date. The date half is delegated to parseFlightDate, so the drawer and the results card — which
 * renders a bare date with no time prefix — can never disagree about how a date is read.
 *
 * Returns null rather than throwing so the caller can report WHICH leg failed to parse and what
 * the raw text was.
 *
 * @param {string} text
 * @returns {{time: string, dateText: string, day: number, month: number, year: number|null,
 *            weekday: string|null}|null}
 */
function parseDrawerTimeDate(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const timeMatch = text.match(DRAWER_LEADING_TIME);
  if (!timeMatch) {
    return null;
  }

  const datePart = text.slice(timeMatch[0].length).replace(DRAWER_SEPARATOR, '').trim();
  const parsedDate = parseFlightDate(datePart);
  if (!parsedDate) {
    return null;
  }

  return { time: timeMatch[1].replace(/\s+/g, ' ').trim(), ...parsedDate };
}

// A results-card time carries a next-day marker when that end of the leg falls on a later date
// than the leg's departure: "06:20 +1". The drawer never uses a marker — it renders the arrival's
// own date instead — so the two surfaces state the same fact in two different shapes.
const RESULTS_DAY_OFFSET = /\s*\+\s*(\d+)\s*$/;

/**
 * Splits a results-card time into the clock time and its day offset: "06:20 +1" -> 06:20, +1 day.
 *
 * The offset is separated rather than discarded because it is the results card's ONLY statement
 * about which date an arrival lands on, and this test exists to catch a leg being rendered a day
 * away from where it belongs. Dropping it would leave an overnight leg's date unasserted on the
 * one surface where the defect shows.
 *
 * @param {string} text
 * @returns {{time: string, dayOffset: number}}
 */
function splitResultsDayOffset(text) {
  const raw = String(text ?? '').trim();
  const match = raw.match(RESULTS_DAY_OFFSET);

  return {
    time: match ? raw.slice(0, match.index).trim() : raw,
    dayOffset: match ? Number(match[1]) : 0,
  };
}

/**
 * Whole days from one parsed drawer date to another, or null when either side lacks a year.
 *
 * Built as UTC midnights so the subtraction is unaffected by the browser timezone the scenario
 * runs under — the test asserts the app's rendering, and must not itself do date arithmetic that
 * the very timezone under test could shift.
 *
 * @param {{day: number, month: number, year: number|null}} from
 * @param {{day: number, month: number, year: number|null}} to
 * @returns {number|null}
 */
function daysBetweenParsedDates(from, to) {
  if (!from || !to || from.year === null || to.year === null) {
    return null;
  }

  const fromUtc = Date.UTC(from.year, from.month, from.day);
  const toUtc = Date.UTC(to.year, to.month, to.day);

  return Math.round((toUtc - fromUtc) / 86400000);
}

// The render wait deliberately runs past the caller's budget so a breach can report the real
// duration instead of an opaque timeout. It is capped because the wait must still finish inside
// the Cucumber step timeout (150s on the steps that call this) - otherwise Cucumber kills the
// step first and the measurement is lost.
const RENDER_WAIT_CAP_SECONDS = 90;
// How much longer than the budget to wait before giving up, within the cap above.
const RENDER_WAIT_BUDGET_MULTIPLIER = 3;

/**
 * Times how long a set of fare options takes to render and asserts it stays within budget.
 *
 * Shared by the legacy pricing-options overlay and the new-flight-flow brand cards: only the
 * locators differ, and ADO 83755 is measured the same way on both.
 *
 * @param {{maxSeconds: number, what: string, waitForCards: (timeout: number) => Promise<void>,
 *          countCards: () => Promise<number>}} params
 */
async function measureFareOptionsRender({ maxSeconds, what, waitForCards, countCards }) {
  if (typeof maxSeconds !== "number" || !Number.isFinite(maxSeconds) || maxSeconds <= 0) {
    throw new Error(`maxSeconds must be a positive number, got: ${maxSeconds}`);
  }

  const waitBudgetMs =
    Math.min(maxSeconds * RENDER_WAIT_BUDGET_MULTIPLIER, RENDER_WAIT_CAP_SECONDS) * 1000;
  const startedAt = Date.now();
  let rendered = true;
  try {
    await waitForCards(waitBudgetMs);
  } catch {
    rendered = false;
  }
  const elapsedSeconds = Number(((Date.now() - startedAt) / 1000).toFixed(1));

  if (!rendered) {
    throw new Error(
      `The ${what} had still not rendered ${elapsedSeconds}s after the fare options were opened ` +
      `(budget ${maxSeconds}s). Repeated pricing of the same fare options, or a repeat pass ` +
      `dispatched one call at a time, leaves the screen on skeletons this long.`
    );
  }

  const fareOptions = await countCards();
  logger.info("Fare options render time measured", { what, elapsedSeconds, maxSeconds, fareOptions });

  expect(
    elapsedSeconds,
    `The ${what} should render within ${maxSeconds}s, but took ${elapsedSeconds}s for ` +
    `${fareOptions} fare option(s). A wait far above the budget means the fare options are being ` +
    `priced repeatedly, or the repeat pass is being dispatched one call at a time.`
  ).toBeLessThanOrEqual(maxSeconds);

  return { elapsedSeconds, maxSeconds, fareOptions };
}

/**
 * Explains a missing EU Rail banner from the parallel rail-search answer that gates it, so the
 * report says whether the rail supplier returned nothing for this route/date or the options were
 * there and the UI failed to render them.
 *
 * @param {object|null} railSearch - Wire outcome from FlightResultsPage.readRailSearchOutcome
 * @param {object|null} appState - The app's own view, from FlightResultsPage.readEuRailSearchState
 * @returns {string}
 */
// Copied from the front end (_flight-brand-builder.logic.ts), not reinterpreted: any divergence
// reads as a false failure. Note \b treats an apostrophe as a boundary, so "DELTA'S" renders
// "Delta'S" on screen too.
const TITLE_CASE_WORD_START = /\b(\w)/g;

function titleCaseBrandName(value) {
  return String(value || '').toLowerCase().replace(TITLE_CASE_WORD_START, (character) => character.toUpperCase());
}

// Cabin tiers from flight.service.ts mapCabinOrder (0 Economy, 1 Premium Economy, 2 Business,
// 3 First), keyed without spaces and upper-cased. Cabins are compared by tier because the two sides
// name them differently: the drawer says "Premium" (mapCabin) where Ypsilon says "Premium Economy".
const CABIN_TIERS = {
  ECONOMY: 0,
  ECO: 0,
  ECONOMYPREMIUM: 0,
  ECONOMYWITHRESTRICTIONS: 0,
  ECONOMYWITHOUTRESTRICTIONS: 0,
  PREMIUMECONOMY: 1,
  PREMIUM: 1,
  BUSINESS: 2,
  FIRST: 3,
};

function cabinTier(cabinName) {
  return CABIN_TIERS[String(cabinName || '').replace(/\s+/g, '').toUpperCase()] ?? null;
}

// pricing-options.vue shortens a cabin tab label longer than 14 characters this way.
const CABIN_TAB_LABEL_MAX_LENGTH = 14;

/**
 * Resolves the cabin the classic Pricing Options drawer is listing from its "{cabin} pricing"
 * heading, whatever language "pricing" is in: the cabin is the longest leading run of heading words
 * that the active cabin tab shows as its label, once shortened the way pricing-options.vue shortens it.
 *
 * @param {{heading: string, activeTabLabel: string}} texts - From getPricingOptionsSelectedCabinTexts
 * @returns {string|null} The cabin name, or null when no leading run matches the tab
 */
function resolvePricingOptionsCabin({ heading, activeTabLabel }) {
  const words = String(heading || '').split(' ').filter(Boolean);
  for (let count = words.length; count >= 1; count -= 1) {
    const cabin = words.slice(0, count).join(' ');
    const tabLabel = cabin.length > CABIN_TAB_LABEL_MAX_LENGTH ? cabin.replace('Economy', 'Eco') : cabin;
    if (tabLabel === activeTabLabel) return cabin;
  }
  return null;
}

function describeRailSearchOutcome(railSearch, appState) {
  if (railSearch) {
    const details = JSON.stringify(railSearch);
    return railSearch.hasRailOptions
      ? `The gating EU rail search DID return options, so this is a UI regression rather than a supplier miss: ${details}`
      : 'The gating EU rail search returned no bookable rail options, so the banner could not render '
        + `and waiting longer would not have helped (it is never retried): ${details}`;
  }

  const noResponseSeen = 'No POST /flightEURailSearchParallel response was captured on the wire, so the '
    + 'gating EU rail search landed before this step began or was never fired (the app dispatches it '
    + 'once, fire-and-forget, after the flight results commit).';

  if (!appState?.reachable) {
    return `${noResponseSeen} The app's euRailStore was not reachable either: ${JSON.stringify(appState)}`;
  }

  if (appState.hasAnswer) {
    return `${noResponseSeen} The app does hold an EU rail answer, so read it to tell a supplier miss `
      + `from a UI regression: ${JSON.stringify(appState)}`;
  }

  return `${noResponseSeen} ${appState.searchSettled
    ? 'The search has finished and the app holds no EU rail answer (euRailStore.railsAnswer is null, which '
      + 'is what both a failed and an empty parallel rail search commit), so the banner had nothing to render.'
    : 'The search never settled within the wait either, so the rail lookup itself hung or was never sent.'
  } ${JSON.stringify(appState)}`;
}

function extractDayToken(dateText) {
  if (!dateText || typeof dateText !== 'string') {
    throw new Error('dateText must be a non-empty string');
  }

  const match = dateText.match(/\b(\d{1,2})\b/);
  if (!match) {
    throw new Error(`Could not extract day token from date text: ${dateText}`);
  }

  return match[1];
}

/**
 * Converts a displayed flight time into minutes past midnight. Handles both notations the
 * results page can render depending on the corporation's time-format setting: 24-hour
 * ("15:35") and 12-hour AM/PM ("3:35 PM").
 *
 * @param {string} timeText - Time as displayed, e.g. "15:35" or "3:35 PM"
 * @returns {number} Minutes past midnight
 */
function parseTimeOfDayToMinutes(timeText) {
  const match = (timeText ?? '').match(/\b(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) {
    throw new Error(`Could not parse a time of day from flight time text: "${timeText}"`);
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === 'AM' && hours === 12) hours = 0;
  if (meridiem === 'PM' && hours !== 12) hours += 12;

  return hours * 60 + minutes;
}

// Per-leg fare-rule cross-check helpers (bug 79393). These mirror the app's own mapping
// (extractRefundFeature / extractChangeFeature in _flight-brand-builder.logic.ts) so the test can
// assert each brand card's change/cancellation badge reflects that leg's fare rules from the
// FlightPricingSelection response and never falls back to "check fare rules" when it is conclusive.

// FareRulesStatus enum (flight-selection/models/consts.ts).
const FARE_RULES_STATUS = { OFFERED: 0, NOT_OFFERED: 1, CHARGEABLE: 2, NO_INFO: 3 };

// Normalized rule categories — the observable outcome, independent of price/currency formatting.
const RULE_CATEGORY = {
  REFUND_NON_REFUNDABLE: 'refund:non-refundable',
  REFUND_FULLY_REFUNDABLE: 'refund:fully-refundable',
  REFUND_WITH_AMOUNT: 'refund:with-amount',
  REFUND_CHECK_FARE_RULES: 'refund:check-fare-rules',
  CHANGE_NOT_ALLOWED: 'change:not-allowed',
  CHANGE_FARE_DIFFERENCE_ONLY: 'change:fare-difference-only',
  CHANGE_WITH_AMOUNT: 'change:with-amount',
  CHANGE_CHECK_FARE_RULES: 'change:check-fare-rules',
  UNKNOWN: 'unknown',
};

// The FlightPricingSelection API returns PascalCase keys. Read them case-tolerantly so the
// cross-check does not silently break if the wire format is normalized in future.
function pick(obj, ...names) {
  if (!obj) return undefined;
  for (const n of names) {
    if (obj[n] !== undefined) return obj[n];
  }
  return undefined;
}

// Share-bar slot aria-label (flight.shareSlotRemoveLabel):
// "Remove: leg 1 LIS - STN, Direct, 15:20 - 18:10; leg 2 STN - LIS, Direct, 17:45 - 20:35; €59.97999954223633. From the share list."
function parseShareSlotLabel(label) {
  const legs = [...String(label).matchAll(/leg \d+ ([A-Z]{3} - [A-Z]{3}), [^,]+, (\d{2}:\d{2}) - (\d{2}:\d{2})/g)]
    .map(([, route, departure, arrival]) => ({ route, departure, arrival }));
  const price = String(label).match(/;\s*[^;\d]*(\d+(?:\.\d+)?)\. From the share list/);
  return { legs, price: price ? Number(price[1]) : NaN };
}

// Result card actions outside share mode (new flow: "Select flight"; old flow: "Add to trip").
const BOOKING_ACTION_LABELS = ['Select flight', 'Add to trip'];
const SHARE_ACTION_LABELS = ['Share', 'Added'];
// Slots keep the unrounded per-traveller price; screens and the email show two decimals.
const SHARE_PRICE_TOLERANCE = 0.01;

function hasLabel(labels, label) {
  return labels.some((l) => l.toLowerCase() === String(label).toLowerCase());
}

/**
 * Returns the fare rules that apply to a given leg of a pricing-option package,
 * mirroring getApplicableFareRulesForLeg (_flight-fare-rules.logic.ts): use the
 * segment-level fare rules when they carry any rule data, otherwise fall back to
 * the package-level fare rules.
 */
function getApplicableFareRulesForLeg(pkg, legIndex) {
  if (!pkg) return undefined;
  const segments = pick(pkg, 'Segments', 'segments') || [];
  const segmentFareRules = pick(segments[legIndex] || {}, 'FareRules', 'fareRules');
  const hasData =
    segmentFareRules &&
    (pick(segmentFareRules, 'RefundabilityStatus', 'refundabilityStatus') !== undefined ||
      pick(segmentFareRules, 'ChangeabilityStatus', 'changeabilityStatus') !== undefined ||
      pick(segmentFareRules, 'CancellationFee', 'cancellationFee') !== undefined ||
      pick(segmentFareRules, 'ChangeFee', 'changeFee') !== undefined);
  return hasData ? segmentFareRules : pick(pkg, 'FareRules', 'fareRules');
}

/** Maps a leg's fare rules to the expected refund badge category (mirrors extractRefundFeature). */
function expectedRefundCategory(fareRules) {
  const status = pick(fareRules, 'RefundabilityStatus', 'refundabilityStatus');
  const amount = pick(pick(fareRules, 'CancellationFee', 'cancellationFee') || {}, 'Amount', 'amount');
  if (status === FARE_RULES_STATUS.NOT_OFFERED) return RULE_CATEGORY.REFUND_NON_REFUNDABLE;
  if (status === FARE_RULES_STATUS.OFFERED) return RULE_CATEGORY.REFUND_FULLY_REFUNDABLE;
  if (status === FARE_RULES_STATUS.CHARGEABLE) {
    return amount !== undefined && amount > 0
      ? RULE_CATEGORY.REFUND_WITH_AMOUNT
      : RULE_CATEGORY.REFUND_CHECK_FARE_RULES;
  }
  return RULE_CATEGORY.REFUND_CHECK_FARE_RULES; // NoInfo / missing
}

/** Maps a leg's fare rules to the expected change badge category (mirrors extractChangeFeature). */
function expectedChangeCategory(fareRules) {
  const status = pick(fareRules, 'ChangeabilityStatus', 'changeabilityStatus');
  const amount = pick(pick(fareRules, 'ChangeFee', 'changeFee') || {}, 'Amount', 'amount');
  if (status === FARE_RULES_STATUS.NOT_OFFERED) return RULE_CATEGORY.CHANGE_NOT_ALLOWED;
  if (status === FARE_RULES_STATUS.OFFERED) return RULE_CATEGORY.CHANGE_FARE_DIFFERENCE_ONLY;
  if (status === FARE_RULES_STATUS.CHARGEABLE) {
    return amount !== undefined && amount > 0
      ? RULE_CATEGORY.CHANGE_WITH_AMOUNT
      : RULE_CATEGORY.CHANGE_CHECK_FARE_RULES;
  }
  return RULE_CATEGORY.CHANGE_CHECK_FARE_RULES; // NoInfo / missing
}

// The four labels below are the only refund/change texts extractRefundFeature/extractChangeFeature
// can emit, so the classifiers match exactly those and treat anything else as UNKNOWN.

/** Classifies a rendered refund badge text into a category. */
function classifyRefundText(text) {
  const t = (text || '').trim();
  if (/^Non-refundable$/i.test(t)) return RULE_CATEGORY.REFUND_NON_REFUNDABLE;
  if (/^Cancellation - fully refundable$/i.test(t)) return RULE_CATEGORY.REFUND_FULLY_REFUNDABLE;
  if (/^Cancellation - check fare rules$/i.test(t)) return RULE_CATEGORY.REFUND_CHECK_FARE_RULES;
  if (/^Cancellation - /i.test(t)) return RULE_CATEGORY.REFUND_WITH_AMOUNT;
  return RULE_CATEGORY.UNKNOWN;
}

/** Classifies a rendered change badge text into a category. */
function classifyChangeText(text) {
  const t = (text || '').trim();
  if (/^Changes not allowed$/i.test(t)) return RULE_CATEGORY.CHANGE_NOT_ALLOWED;
  if (/^Changes - fare difference only$/i.test(t)) return RULE_CATEGORY.CHANGE_FARE_DIFFERENCE_ONLY;
  if (/^Changes - check fare rules$/i.test(t)) return RULE_CATEGORY.CHANGE_CHECK_FARE_RULES;
  if (/^Change - .*fare difference/i.test(t)) return RULE_CATEGORY.CHANGE_WITH_AMOUNT;
  return RULE_CATEGORY.UNKNOWN;
}

/** Picks the refund badge and change badge texts out of a brand card's feature texts. */
function splitFeatureTexts(featureTexts) {
  let refundText = null;
  let changeText = null;
  for (const raw of featureTexts || []) {
    const t = (raw || '').trim();
    if (refundText === null && (/^Non-refundable$/i.test(t) || /^Cancellation\b/i.test(t))) {
      refundText = t;
    } else if (changeText === null && /^Changes?\b/i.test(t)) {
      changeText = t;
    }
  }
  return { refundText, changeText };
}

/** Normalizes a brand name for matching UI cards to response segments (case/space/dashes tolerant). */
function normalizeBrandName(name) {
  return (name || '').toString().trim().toUpperCase().replace(/\s+/g, ' ');
}

// A prefix, because the feature captures the call with a trailing wildcard.
const BRAND_INFO_REQUEST_TYPE = 'UAPI TVP NDC Brand Info';

// Brand Info inclusions as attributeKey() compacts them ("Not Offered" -> "notoffered").
const CHARGEABLE = 'chargeable';
const NOT_OFFERED = 'notoffered';

// The branded fares drawer prints a Brand Info classification as words ("Carry on") while the
// payload files it in one token ("CarryOn"); both collapse to the same key here.
function attributeKey(text) {
  return (text || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Splits a drawer line such as "Carry on: Included" into its attribute key and compact value. */
function parseBrandServiceLine(line) {
  const colon = line.indexOf(':');
  if (colon === -1) {
    return { line, key: attributeKey(line), value: null };
  }
  return { line, key: attributeKey(line.slice(0, colon)), value: attributeKey(line.slice(colon + 1)) };
}

// Travelport's JSON API has shipped both camelCase and PascalCase property names, so every Brand
// Info property is looked up without regard to case.
function getPropertyIgnoringCase(obj, name) {
  if (!obj || typeof obj !== 'object') return undefined;
  const wanted = name.toLowerCase();
  const match = Object.keys(obj).find((k) => k.toLowerCase() === wanted);
  return match === undefined ? undefined : obj[match];
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/** Every Brand filed in a UAPI TVP NDC Brand Info response, with the attributes each one lists. */
function collectBrandInfoBrands(json) {
  const response = getPropertyIgnoringCase(json, 'OfferListResponse');
  if (!response) {
    throw new Error(
      `[FlightResults.collectBrandInfoBrands] The captured Brand Info response has no OfferListResponse. ` +
      `Top-level keys: ${Object.keys(json || {}).join(', ') || '(none)'}. The captured call may not be a Brand Info response.`
    );
  }

  const brands = [];
  for (const referenceList of asArray(getPropertyIgnoringCase(response, 'ReferenceList'))) {
    for (const brand of asArray(getPropertyIgnoringCase(referenceList, 'Brand'))) {
      const attributes = [];
      for (const list of ['BrandAttribute', 'AdditionalBrandAttribute']) {
        for (const attribute of asArray(getPropertyIgnoringCase(brand, list))) {
          attributes.push({
            classification: getPropertyIgnoringCase(attribute, 'classification'),
            inclusion: getPropertyIgnoringCase(attribute, 'inclusion'),
          });
        }
      }
      brands.push({ id: getPropertyIgnoringCase(brand, 'id'), name: getPropertyIgnoringCase(brand, 'name'), attributes });
    }
  }
  return brands;
}

/**
 * What Brand Info files for one brand, keyed by attribute. A round trip files one Brand per leg
 * under the same name, and the legs can disagree on an attribute; the drawer shows the brand once,
 * so any inclusion filed on any leg is accepted.
 */
function expectedAttributesForBrand(brands, brandName) {
  const wanted = normalizeBrandName(brandName);
  const expected = new Map();
  for (const brand of brands.filter((b) => normalizeBrandName(b.name) === wanted)) {
    for (const attribute of brand.attributes) {
      const key = attributeKey(attribute.classification);
      if (!key) continue;
      if (!expected.has(key)) {
        expected.set(key, { classification: attribute.classification, inclusions: new Set() });
      }
      expected.get(key).inclusions.add(attributeKey(attribute.inclusion));
    }
  }
  for (const [key, entry] of expected) {
    if (entry.inclusions.size > 1) {
      logger.info('Brand Info files conflicting inclusions for one attribute across same-named brands; accepting any of them', {
        brandName,
        attribute: entry.classification,
        key,
        inclusions: [...entry.inclusions],
      });
    }
  }
  return expected;
}

// The Amadeus NDC offer message that carries what the airline filed per brand. The trip logs it in
// two flavours - "NDC Search Upsell" holds every brand combination of the itinerary, "Flight Price
// (Brand Info)" prices one combination per rendered card - and both are read: which flavour fed a
// given card is an implementation detail, and a brand whose flavours disagree is skipped anyway.
const NDC_OFFER_REQUEST_TYPE = '*AMA_TravelOfferPriceRQ*';

// Penalty details are filed per moment; "2" is before departure, which is what the brand card
// quotes. The after-departure and no-show rows are filed alongside it and are not what is shown.
const BEFORE_DEPARTURE = '2';

// Penalty amounts are filed in minor units - 30000 is a fee of 300.00.
const MINOR_UNITS_PER_UNIT = 100;

/** First value of a collected field list, or null when the field was absent. */
function first(values) {
  return Array.isArray(values) && values.length > 0 ? values[0] : null;
}

/**
 * The single value a set holds, or undefined when it holds none or several. Several means the
 * offers carrying a brand disagree, and nothing can be concluded about what fed the card.
 */
function onlyValue(values) {
  return values && values.size === 1 ? [...values][0] : undefined;
}

/**
 * The facts filed for the fare a card shows, on the leg it belongs to.
 *
 * A brand name does not identify a fare: one leg can carry two cards both named "Light" whose
 * filed data differs completely - the bug's own trip has Light at 569.74 with no penalties beside
 * Light at 737.74 with them, and merging the two hides exactly the card under test. The price the
 * card shows is what tells them apart; without it the records are merged, and the callers skip a
 * fare whose records disagree rather than guess.
 */
function findFiledBrand(legs, card) {
  const leg = legs[card.legIndex];
  if (!leg) return null;
  const wanted = normalizeBrandName(card.brandName);
  const candidates = Object.values(leg.brands).filter((record) => normalizeBrandName(record.brandName) === wanted);
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const shown = firstNumberIn(card.priceText);
  const exact = shown === null
    ? []
    : candidates.filter((record) => Number(record.totalAmount) / MINOR_UNITS_PER_UNIT === shown);
  return mergeFiledBrands(exact.length === 1 ? exact : candidates);
}

/** Folds several offers of one brand into a single record, keeping every distinct value seen. */
function mergeFiledBrands(records) {
  if (records.length === 1) return records[0];

  const merged = {
    brandName: records[0].brandName,
    totalAmount: records.map((record) => record.totalAmount).join('/'),
    offers: 0,
    filedRules: new Set(),
    changeFeeInd: new Set(),
    changeAmounts: new Set(),
    seatGranted: new Set(),
    checkedPieces: new Set(),
    spansTwoBrands: false,
  };
  for (const record of records) {
    merged.offers += record.offers;
    for (const field of ['filedRules', 'changeFeeInd', 'changeAmounts', 'seatGranted', 'checkedPieces']) {
      for (const value of record[field]) merged[field].add(value);
    }
    if (record.spansTwoBrands) merged.spansTwoBrands = true;
  }
  return merged;
}

/**
 * The first money amount in a rendered badge, or null when its grouping is ambiguous. Returning
 * null skips only the numeric comparison, never the assertion that a fee is shown at all.
 */
function firstNumberIn(text) {
  const raw = (String(text || '').match(/\d[\d.,]*/) || [null])[0];
  if (raw === null) return null;
  if (/^\d+$/.test(raw)) return Number(raw);
  if (/^\d{1,3}(,\d{3})*(\.\d+)?$/.test(raw)) return Number(raw.replace(/,/g, ''));
  if (/^\d+\.\d+$/.test(raw)) return Number(raw);
  return null;
}

/** Whether a rendered seat badge says the seat selection is included at no charge. */
function isFreeSeatText(text) {
  return /free[\w\s]*seat/i.test(String(text || ''));
}

/**
 * FlightResults DSL
 *
 * High-level actions related to flight search results.
 * Describes WHAT the user does, not HOW the UI works.
 */
const FlightResults = {
  /**
   * Asserts that bookable flight results rendered, and fails with the reason when they did not.
   *
   * Throws rather than returning a boolean on purpose: the caller used to assert
   * `expect(isDisplayed).toBe(true)`, which reported every distinct cause — zero availability, a
   * filter that emptied the list, a search that never left the form — as the same bare
   * `expect(received).toBe(expected)` with nothing to act on. Here the "No results found" empty
   * state is named explicitly, matching the "Add to trip" / "Select" button waits.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @throws {Error} If the empty state rendered, or results never appeared before the budget
   * @returns {Promise<{displayed: true}>}
   */
  async verifyFlightResultsAvailable(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const resultsPage = getPageObject(page, ResultsPage);
    // This budget must stay BELOW the Cucumber timeout of whichever step calls it, or Cucumber
    // kills the step before the catch below can run - the no-results branch becomes unreachable and
    // "zero availability", "empty state rendered" and "never left the search form" all report as
    // the same opaque harness timeout. The callers give it headroom rather than shrinking it here,
    // so a slow-but-successful search keeps its full 120s (see RESULTS_STEP_TIMEOUT_MS).
    const timeout = 120000;
    const startTime = Date.now();

    try {
      if (await flightResultsPage.isResultsLoaderVisible()) {
        await flightResultsPage.waitForResultsLoaderToFinish(timeout);
      }

      if (await flightResultsPage.isResultsSkeletonVisible()) {
        await flightResultsPage.waitForResultsSkeletonToFinish(timeout);
      }

      const remainingTimeout = Math.max(1000, timeout - (Date.now() - startTime));
      await flightResultsPage.waitForFlightResults(remainingTimeout);
      return { displayed: true };
    } catch (error) {
      // Results never rendered. Give the empty state a short window to confirm WHY: it usually
      // paints alongside the failed wait, so this is a read of state already on the page, not a
      // second full-length wait.
      const emptyStateTimeout = Math.min(10000, Math.max(1000, timeout - (Date.now() - startTime)));

      try {
        await resultsPage.waitForNoResults(emptyStateTimeout);
      } catch {
        // No empty state either — the page is neither results nor "No results found", so the
        // original wait failure is the honest diagnosis (still loading, or never left the search).
        throw new Error(
          `[FlightResults.verifyFlightResultsAvailable] Flight results never rendered, and the ` +
          `"No results found" empty state was not displayed either — the page is in neither state. ` +
          `The search may still be loading, or it never left the search form. Original: ${error.message}`,
        );
      }

      await resultsPage.throwNoResultsError('flight result cards');
    }
  },

  /**
   * Waits for a visible alert on the flight results page.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedText - Exact alert text
   * @returns {Promise<{visible: boolean, expectedText: string}>}
   */
  async verifyAlertTextDisplayed(page, expectedText) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForAlertText(expectedText);

    return { visible: true, expectedText };
  },

  /**
   * Hovers over the first disabled add-to-trip button in results and returns the tooltip text.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string>}
   */
  async hoverAddToTripButtonAndGetTooltipText(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForFlightResults();
    await flightResultsPage.hoverFirstAddToTripButtonInResults();

    const tooltipText = await flightResultsPage.getVisibleTooltipText();
    expect(tooltipText).toBeTruthy();

    return tooltipText;
  },

  /**
   * Verifies that the add-to-trip tooltip text contains the expected text.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText
   * @returns {Promise<string>}
   */
  async verifyAddToTripTooltipContains(page, expectedText) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actualText = await flightResultsPage.getVisibleTooltipText();

    expect(actualText).toContain(expectedText);

    return actualText;
  },

  /**
   * Verifies that every flight result's "Add to trip" button is rendered but not actionable.
   *
   * This is how the app surfaces a ticketing/office-hours TIME LIMIT: flight-extra-info.vue binds
   * `:isDisabled="isAddToCardDisabled"`, which is true when the fare is past its last ticketing date
   * or outside TMC office hours. The traveller still sees every result, but cannot add any to the trip.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @throws {Error} If page is missing, no result button is found, or any button is enabled
   * @returns {Promise<{checked: number}>} How many result buttons were asserted
   */
  async expectAllAddToTripButtonsDisabledInResults(page) {
    if (!page) {
      throw new Error('page is required');
    }

    logger.debug('Verifying every flight result "Add to trip" button is disabled by the time limit');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForFlightResults();

    const buttons = flightResultsPage.getAddToTripButtonsInResults();
    const count = await buttons.count();

    if (count === 0) {
      throw new Error(
        '[FlightResults.expectAllAddToTripButtonsDisabledInResults] No "Add to trip" button was found in the ' +
        'flight results list. Either the search returned no results, or the results render a different ' +
        'primary action (e.g. "Select" for a by-schedule search), so the time limit cannot be verified here.'
      );
    }

    for (let i = 0; i < count; i += 1) {
      const button = buttons.nth(i);

      await expect(
        button,
        `The "Add to trip" button on flight result ${i} should stay visible — a time-limited result is still ` +
        'shown to the traveller, only blocked from being booked',
      ).toBeVisible();

      await expect(
        button,
        `The "Add to trip" button on flight result ${i} should be disabled because a ticketing time limit ` +
        'applies to this user. An enabled button means the app did not flag the fare as expired ' +
        '(isExpired / isExpiredOfficeHours false in flight-extra-info.vue)',
      ).toBeDisabled();
    }

    logger.info('All flight result "Add to trip" buttons are disabled', { checked: count });

    return { checked: count };
  },

  /**
   * Verifies the results-list "Pricing Options" button is still visible and clickable while a
   * time limit applies — the fares stay browsable even though they cannot be added to the trip.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} [index=0] - Zero-based index of the flight result
   * @throws {Error} If page is missing, index is invalid, or the button is missing/disabled
   * @returns {Promise<void>}
   */
  async expectPricingOptionsButtonEnabled(page, index = 0) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(`index must be a non-negative integer, got: ${index}`);
    }

    logger.debug('Verifying the "Pricing Options" button stays enabled under the time limit', { index });

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForPricingOptionsButton(index);

    const button = flightResultsPage.getPricingOptionsButton(index);

    await expect(
      button,
      `The "Pricing Options" button on flight result ${index} should be visible — the time limit blocks ` +
      'booking, not browsing the fares',
    ).toBeVisible();

    await expect(
      button,
      `The "Pricing Options" button on flight result ${index} should be enabled. The app never binds ` +
      'isDisabled on this button (flight-extra-info.vue), so a disabled one means the results are ' +
      'rendering a different action than "Pricing Options"',
    ).toBeEnabled();
  },

  /**
   * Verifies every fare card in the open Pricing Options drawer is rendered but not selectable.
   *
   * leg-pricing-option.vue binds the same `isAddToCardDisabled` on each card's "Select" button as the
   * results list does on "Add to trip", so a time limit locks the whole drawer.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @throws {Error} If page is missing, no fare card is found, or any "Select" button is enabled
   * @returns {Promise<{checked: number}>} How many fare-card buttons were asserted
   */
  async expectAllPricingOptionsDisabled(page) {
    if (!page) {
      throw new Error('page is required');
    }

    logger.debug('Verifying every pricing option "Select" button is disabled by the time limit');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForPricingOptionCards();

    const selectButtons = flightResultsPage.getPricingOptionSelectButtons();
    const count = await selectButtons.count();

    if (count === 0) {
      throw new Error(
        '[FlightResults.expectAllPricingOptionsDisabled] The Pricing Options drawer rendered fare cards but ' +
        'none of them exposed a "Select" button, so there is nothing to assert. The drawer markup likely ' +
        'changed, or the cards are still loading their fares.'
      );
    }

    for (let i = 0; i < count; i += 1) {
      const button = selectButtons.nth(i);

      await expect(
        button,
        `The "Select" button on pricing option ${i} should stay visible — a time-limited fare is still ` +
        'listed in the drawer, only blocked from being selected',
      ).toBeVisible();

      await expect(
        button,
        `The "Select" button on pricing option ${i} should be disabled because a ticketing time limit ` +
        'applies to this user. An enabled button means leg-pricing-option.vue did not receive ' +
        'isAddToCardDisabled for this fare',
      ).toBeDisabled();
    }

    logger.info('All pricing options are disabled', { checked: count });

    return { checked: count };
  },

  /**
   * Verifies the travel-policy state of every visible flight result card.
   *
   * A restricting policy sets `isRestricTravelPolicyViolation`, which flight-extra-info.vue folds
   * into `isAddToCardDisabled`, and a violation renders app-oop-badge in the same card. So an out
   * of policy result shows the badge with a disabled "Add to trip"; an in-policy one shows neither.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {{outOfPolicy: boolean}} options - true: every card OOP and restricted; false: every card in policy and bookable
   * @throws {Error} If page is missing, no result card is found, or any card is in the other state
   * @returns {Promise<{checked: number}>} How many result cards were asserted
   */
  async expectAllFlightResultsPolicyState(page, { outOfPolicy } = {}) {
    if (!page) throw new Error('page is required');
    if (typeof outOfPolicy !== 'boolean') {
      throw new Error(`outOfPolicy must be a boolean, got: ${outOfPolicy}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForFlightResults();

    const cards = flightResultsPage.getFlightResultCards();
    const count = await cards.count();
    if (count === 0) {
      throw new Error('[FlightResults.expectAllFlightResultsPolicyState] No visible flight result card was found');
    }

    for (let i = 0; i < count; i += 1) {
      const card = cards.nth(i);
      const oopBadge = flightResultsPage.getOOPIndicatorInCard(card);
      const oopBadgeShown = oopBadge.first();
      const addToTripButton = flightResultsPage.getAddToTripButtonInResultCard(card).first();

      await expect(
        addToTripButton,
        `Flight result ${i} should render an "Add to trip" button`,
      ).toBeVisible();

      if (outOfPolicy) {
        await expect(
          oopBadgeShown,
          `Flight result ${i} should show the out of policy badge — the travel policy was not applied to it`,
        ).toBeVisible();
        await expect(
          addToTripButton,
          `Flight result ${i} is out of policy, so its "Add to trip" button should be disabled by the restricting policy`,
        ).toBeDisabled();
      } else {
        await expect(
          oopBadge,
          `Flight result ${i} should be in policy, but it shows the out of policy badge`,
        ).toHaveCount(0);
        await expect(
          addToTripButton,
          `Flight result ${i} is in policy, so its "Add to trip" button should be enabled`,
        ).toBeEnabled();
      }
    }

    logger.info('Flight result policy state verified', { outOfPolicy, checked: count });

    return { checked: count };
  },

  /**
   * Verifies the travel-policy state of every visible fare card in the open Pricing Options drawer.
   *
   * leg-pricing-option.vue disables the card's button when its option carries
   * `isRestricTravelPolicyViolation`, and renders app-oop-badge when it has policy violations.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {{outOfPolicy: boolean}} options - true: every card OOP and restricted; false: every card in policy and selectable
   * @throws {Error} If page is missing, no fare card is found, or any card is in the other state
   * @returns {Promise<{checked: number}>} How many fare cards were asserted
   */
  async expectAllPricingOptionsPolicyState(page, { outOfPolicy } = {}) {
    if (!page) throw new Error('page is required');
    if (typeof outOfPolicy !== 'boolean') {
      throw new Error(`outOfPolicy must be a boolean, got: ${outOfPolicy}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForPricingOptionCards();

    const cards = flightResultsPage.getVisiblePricingOptionsCards();
    const count = await cards.count();
    if (count === 0) {
      throw new Error('[FlightResults.expectAllPricingOptionsPolicyState] No visible pricing option fare card was found');
    }

    for (let i = 0; i < count; i += 1) {
      const card = cards.nth(i);
      const oopBadge = flightResultsPage.getOOPIndicatorInCard(card);
      const oopBadgeShown = oopBadge.first();
      const selectButton = flightResultsPage.getSelectButtonInPricingOptionCard(card).first();

      await expect(
        selectButton,
        `Pricing option ${i} should render its select button`,
      ).toBeVisible();

      if (outOfPolicy) {
        await expect(
          oopBadgeShown,
          `Pricing option ${i} should show the out of policy badge — the travel policy was not applied to it`,
        ).toBeVisible();
        await expect(
          selectButton,
          `Pricing option ${i} is out of policy, so its select button should be disabled by the restricting policy`,
        ).toBeDisabled();
      } else {
        await expect(
          oopBadge,
          `Pricing option ${i} should be in policy, but it shows the out of policy badge`,
        ).toHaveCount(0);
        await expect(
          selectButton,
          `Pricing option ${i} is in policy, so its select button should be enabled`,
        ).toBeEnabled();
      }
    }

    logger.info('Pricing option policy state verified', { outOfPolicy, checked: count });

    return { checked: count };
  },

  /**
   * Hovers over the office-hours restriction icon and returns the tooltip title text.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string>}
   */
  async hoverTimeLimitIconAndGetBookingRestrictedMessage(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForFlightResults();
    await flightResultsPage.hoverOfficeHoursRestrictionInfoIcon();

    const message = await flightResultsPage.getOfficeHoursRestrictionTooltipTitle();
    expect(message).toBeTruthy();

    return message;
  },

  /**
   * Verifies that the office-hours restriction tooltip title contains the expected text.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText
   * @returns {Promise<string>}
   */
  async verifyBookingRestrictedMessageContains(page, expectedText) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actualText = await flightResultsPage.getOfficeHoursRestrictionTooltipTitle();

    expect(actualText).toContain(expectedText);

    return actualText;
  },

  /**
   * Verifies the CO2 Squake tooltip is available from the first result card.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{visible: boolean, resultTooltipText: string}>}
   */
  async verifyCO2SquakeTooltipInResults(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const expectedText = 'Emissions are calculated per passenger in the selected class of service.';
    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await flightResultsPage.waitForFlightResults();
    await flightResultsPage.openResultsCO2Tooltip();
    const resultTooltipText = await flightResultsPage.getCO2TooltipDescription();
    expect(resultTooltipText).toBe(expectedText);
    await flightResultsPage.closeCO2Tooltip();

    return { visible: true, resultTooltipText };
  },

  /**
   * Verifies that a flight-comparison row has no visible prices.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} stopLabel - Comparison row label
   * @returns {Promise<{stopLabel: string, priceCount: number}>}
   */
  async verifyComparisonRowHasNoPrices(page, stopLabel) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!stopLabel || typeof stopLabel !== 'string') {
      throw new Error('stopLabel must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const priceCount = await flightResultsPage.getComparisonPriceCount(stopLabel);

    expect(priceCount, `Expected "${stopLabel}" comparison row to have no prices, got ${priceCount}`).toBe(0);

    return { stopLabel, priceCount };
  },

  /**
   * Verifies that a flight-comparison row has at least one visible price.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} stopLabel - Comparison row label
   * @returns {Promise<{stopLabel: string, priceCount: number}>}
   */
  async verifyComparisonRowHasPrices(page, stopLabel) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!stopLabel || typeof stopLabel !== 'string') {
      throw new Error('stopLabel must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const priceCount = await flightResultsPage.getComparisonPriceCount(stopLabel);

    expect(priceCount, `Expected "${stopLabel}" comparison row to have prices`).toBeGreaterThan(0);

    return { stopLabel, priceCount };
  },

  /**
   * Verifies that every price in the comparison table is rendered inside its own cell box.
   *
   * The box is the 75x48px `div.cell` rectangle flight-comparison.scss draws behind each
   * carrier/stop intersection. Its size is fixed, so a long amount or a multi-character currency
   * prefix can spill outside it while the DOM still looks perfectly correct -- the only way to
   * catch that is to compare the price rect against the box rect.
   *
   * Every overflowing cell is collected before failing, so one run reports the whole set rather
   * than only the first offender.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} tolerance - Sub-pixel slack in px, to absorb fractional layout rounding
   * @returns {Promise<{cellsChecked: number}>}
   */
  async verifyComparisonPricesFitTheirCells(page, tolerance = 0.5) {
    if (!page) {
      throw new Error('[FlightResults.verifyComparisonPricesFitTheirCells] "page" is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const cells = await flightResultsPage.getComparisonPriceCellGeometry();

    // A comparison table with no prices at all would make every containment check below vacuously
    // true, so the count is asserted first -- an empty matrix must fail loudly, not pass silently.
    if (cells.length === 0) {
      throw new Error(
        '[FlightResults.verifyComparisonPricesFitTheirCells] Expected the flight comparison table to ' +
          'show at least one price, but no priced cell was found. Either the table never rendered or ' +
          'every carrier/stop intersection came back with isFound=false.'
      );
    }

    const overflowing = cells
      .map((cell) => {
        const { cellRect, priceRect } = cell;
        const spill = {
          left: cellRect.x - priceRect.x,
          right: priceRect.x + priceRect.width - (cellRect.x + cellRect.width),
          top: cellRect.y - priceRect.y,
          bottom: priceRect.y + priceRect.height - (cellRect.y + cellRect.height),
        };

        const sides = Object.entries(spill)
          .filter(([, overshoot]) => overshoot > tolerance)
          .map(([side, overshoot]) => `${side} by ${overshoot.toFixed(1)}px`);

        return sides.length > 0 ? `"${cell.priceText}" in the "${cell.stopLabel}" row (${cell.column}) overflows ${sides.join(' and ')}` : null;
      })
      .filter(Boolean);

    // expect()'s second argument is discarded by this repo's @playwright/test, and the overshoot
    // detail IS the failure report here, so it is thrown rather than attached to a matcher.
    if (overflowing.length > 0) {
      throw new Error(
        `[FlightResults.verifyComparisonPricesFitTheirCells] ${overflowing.length} of ${cells.length} ` +
          `comparison-table prices overflow their cell box:\n  - ${overflowing.join('\n  - ')}`
      );
    }

    logger.debug('[FlightResults.verifyComparisonPricesFitTheirCells] All comparison prices fit their cells', {
      cellsChecked: cells.length,
    });

    return { cellsChecked: cells.length };
  },

  /**
   * Hides the comparison table from flight results.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{hidden: boolean}>}
   */
  async hideComparisonTable(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await flightResultsPage.waitForFlightResults();
    await flightResultsPage.waitForComparisonToggle();

    const currentText = await flightResultsPage.getComparisonToggleText();
    if (currentText.trim() === 'Show Comparison') {
      // Table is already hidden — desired state is already achieved
      return { hidden: true };
    }

    await flightResultsPage.clickComparisonToggle();
    await flightResultsPage.waitForComparisonToggleText('Show Comparison');

    return { hidden: true };
  },

  /**
   * Shows the comparison table from flight results.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{visible: boolean}>}
   */
  async showComparisonTable(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await flightResultsPage.waitForFlightResults();
    await flightResultsPage.waitForComparisonToggleText('Show Comparison');
    await flightResultsPage.clickComparisonToggle();
    await flightResultsPage.waitForComparisonTable();
    await flightResultsPage.waitForComparisonToggleText('Hide Comparison');

    return { visible: true };
  },

  /**
   * Verifies the comparison toggle label.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText
   * @returns {Promise<{expectedText: string, actualText: string}>}
   */
  async verifyComparisonToggleText(page, expectedText) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await flightResultsPage.waitForComparisonToggleText(expectedText);
    const actualText = await flightResultsPage.getComparisonToggleText();

    expect(actualText).toBe(expectedText);

    return { expectedText, actualText };
  },

  /**
   * Verifies the comparison table is visible and the toggle label matches.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText
   * @returns {Promise<{tableVisible: boolean, expectedText: string}>}
   */
  async verifyComparisonTableVisibleWithToggleText(page, expectedText) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await flightResultsPage.waitForComparisonTable();
    await this.verifyComparisonToggleText(page, expectedText);

    return { tableVisible: true, expectedText };
  },

  /**
   * Verifies the stops filter is visible in flight results.
   * @param {import('playwright').Page} page
   */
  async verifyStopsFilterVisible(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isStopsFilterVisible();
    expect(visible, 'Stops filter should be visible in flight results').toBe(true);
    return { visible: true };
  },

  /**
   * Restricts results to non-stop flights via the "No stops" filter; settles on results or "No results
   * found". Combine with a carrier filter to isolate one carrier's non-stop itineraries.
   * @param {import('playwright').Page} page
   */
  async filterByNoStops(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const resultsPage = getPageObject(page, ResultsPage);
    await flightResultsPage.waitForFlightResults();
    await flightResultsPage.applyNoStopsFilter();
    await Promise.any([
      flightResultsPage.waitForFlightResults(),
      resultsPage.waitForNoResultsTitle('No results found'),
    ]);
    return { applied: true };
  },

  /**
   * Verifies the origin shown in the flight info bar at the top of the results page contains the
   * expected origin (e.g. "London (LON)"). Whitespace is normalized so a spacing difference in the
   * feature text does not cause a false mismatch.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedOrigin - Expected origin text (e.g. "London (LON)")
   * @returns {Promise<{expectedOrigin: string, actualOrigin: string}>}
   */
  async verifyFlightResultsOrigin(page, expectedOrigin) {
    if (!page) throw new Error('page is required');
    if (!expectedOrigin || typeof expectedOrigin !== 'string') {
      throw new Error(`expectedOrigin must be a non-empty string, got: ${typeof expectedOrigin}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actualOrigin = await flightResultsPage.getFlightInfoBarOriginText();
    const normalizedExpected = expectedOrigin.replace(/\s+/g, ' ').trim();

    expect(
      actualOrigin.toLowerCase(),
      `Expected the flight results origin to show "${expectedOrigin}", but the info bar showed "${actualOrigin}". ` +
        `The origin may not have carried over to the results header.`,
    ).toContain(normalizedExpected.toLowerCase());

    return { expectedOrigin, actualOrigin };
  },

  /**
   * Verifies the destination shown in the flight info bar at the top of the results page contains
   * the expected destination (e.g. "Amsterdam (AMS)"). Whitespace is normalized so a spacing
   * difference in the feature text does not cause a false mismatch.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedDestination - Expected destination text (e.g. "Amsterdam (AMS)")
   * @returns {Promise<{expectedDestination: string, actualDestination: string}>}
   */
  async verifyFlightResultsDestination(page, expectedDestination) {
    if (!page) throw new Error('page is required');
    if (!expectedDestination || typeof expectedDestination !== 'string') {
      throw new Error(`expectedDestination must be a non-empty string, got: ${typeof expectedDestination}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actualDestination = await flightResultsPage.getFlightInfoBarDestinationText();
    const normalizedExpected = expectedDestination.replace(/\s+/g, ' ').trim();

    expect(
      actualDestination.toLowerCase(),
      `Expected the flight results destination to show "${expectedDestination}", but the info bar showed "${actualDestination}". ` +
        `The destination may not have carried over to the results header.`,
    ).toContain(normalizedExpected.toLowerCase());

    return { expectedDestination, actualDestination };
  },

  /**
   * Verifies that the first flight result highlights the expected airport codes.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string[]} airportCodes - Airport codes expected to be marked
   * @returns {Promise<{airportCodes: string[], markedCodes: string[]}>}
   */
  async verifyMarkedAirportCodesInFirstResult(page, airportCodes) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!Array.isArray(airportCodes) || airportCodes.length === 0) {
      throw new Error('airportCodes must be a non-empty array, got: ' + JSON.stringify(airportCodes));
    }

    const normalizedCodes = airportCodes.map((airportCode) => {
      if (!airportCode || typeof airportCode !== 'string') {
        throw new Error('each airport code must be a non-empty string, got: ' + airportCode);
      }

      return airportCode.trim().toUpperCase();
    });

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const markedCodes = (await flightResultsPage.getMarkedLocationCodesInFirstFlightResult())
      .map((airportCode) => airportCode.toUpperCase());

    expect(markedCodes, 'Expected the first flight result to highlight the requested airport changes')
      .toEqual(expect.arrayContaining(normalizedCodes));

    return { airportCodes: normalizedCodes, markedCodes };
  },

  /**
   * Verifies that a per-leg airport filter route label is visible.
   *
   * @param {import('playwright').Page} page
   * @param {string} routeLabel
   * @returns {Promise<{routeLabel: string}>}
   */
  async verifyAirportFilterRouteLabelVisible(page, routeLabel) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!routeLabel || typeof routeLabel !== 'string') {
      throw new Error('routeLabel must be a non-empty string');
    }

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForAirportRouteLabel(routeLabel);

    return { routeLabel };
  },

  /**
   * Verifies that the expected airport filter sections are visible under a route label.
   *
   * @param {import('playwright').Page} page
   * @param {string} routeLabel
   * @param {string[]} sectionTitles
   * @returns {Promise<{routeLabel: string, sectionTitles: string[]}>}
   */
  async verifyAirportFilterSectionsVisible(page, routeLabel, sectionTitles) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!routeLabel || typeof routeLabel !== 'string') {
      throw new Error('routeLabel must be a non-empty string');
    }

    if (!Array.isArray(sectionTitles) || sectionTitles.length === 0) {
      throw new Error('sectionTitles must be a non-empty array, got: ' + JSON.stringify(sectionTitles));
    }

    const resultsPage = getPageObject(page, ResultsPage);
    for (const sectionTitle of sectionTitles) {
      if (!sectionTitle || typeof sectionTitle !== 'string') {
        throw new Error('each sectionTitle must be a non-empty string, got: ' + sectionTitle);
      }

      await resultsPage.waitForAirportSection(routeLabel, sectionTitle);
    }

    return { routeLabel, sectionTitles };
  },

  /**
   * Applies route-scoped airport filters by airport code.
   *
   * @param {import('playwright').Page} page
   * @param {string} routeLabel
   * @param {Array<{sectionTitle: string, airportCode: string}>} selections
   * @returns {Promise<{routeLabel: string, selections: Array<{sectionTitle: string, airportCode: string}>}>}
   */
  async filterByAirportCodesForRoute(page, routeLabel, selections) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!routeLabel || typeof routeLabel !== 'string') {
      throw new Error('routeLabel must be a non-empty string');
    }

    if (!Array.isArray(selections) || selections.length === 0) {
      throw new Error('selections must be a non-empty array, got: ' + JSON.stringify(selections));
    }

    const resultsPage = getPageObject(page, ResultsPage);
    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await flightResultsPage.waitForFlightResults();

    for (const selection of selections) {
      if (!selection || typeof selection !== 'object') {
        throw new Error('each selection must be an object, got: ' + selection);
      }

      const { sectionTitle, airportCode } = selection;
      if (!sectionTitle || typeof sectionTitle !== 'string') {
        throw new Error('sectionTitle must be a non-empty string, got: ' + sectionTitle);
      }

      if (!airportCode || typeof airportCode !== 'string') {
        throw new Error('airportCode must be a non-empty string, got: ' + airportCode);
      }

      await resultsPage.selectAirportOption(routeLabel, sectionTitle, airportCode);

      await Promise.any([
        flightResultsPage.waitForFlightResults(),
        resultsPage.waitForNoResultsTitle('No results found'),
      ]);
    }

    return { routeLabel, selections };
  },

  /**
   * Verifies that the first flight result displays the requested original-currency symbol.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} currencySymbol - Expected currency symbol, e.g. "$"
   * @returns {Promise<{currencySymbol: string, priceText: string}>}
   */
  async verifyOriginalCurrencySymbolVisibleInResults(page, currencySymbol) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!currencySymbol || typeof currencySymbol !== 'string') {
      throw new Error('currencySymbol must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const priceText = await flightResultsPage.getFirstFlightResultPriceText();

    expect(priceText, 'Expected the first flight result to display the original currency symbol')
      .toContain(currencySymbol);

    return { currencySymbol, priceText };
  },

  /**
   * Verifies that the pricing options drawer displays the requested original-currency symbol.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} currencySymbol - Expected currency symbol, e.g. "$"
   * @returns {Promise<{currencySymbol: string, originalPriceTexts: string[]}>}
   */
  async verifyOriginalCurrencySymbolVisibleInPricingOptions(page, currencySymbol) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!currencySymbol || typeof currencySymbol !== 'string') {
      throw new Error('currencySymbol must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const originalPriceTexts = await flightResultsPage.getPricingOptionsOriginalPriceTexts();

    expect(
      originalPriceTexts.some((text) => text.includes(currencySymbol)),
      `Expected pricing options to display the original currency symbol ${currencySymbol}`,
    ).toBe(true);

    return { currencySymbol, originalPriceTexts };
  },

  async extractFirstFlightResultDisplayAndOriginalPrices(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return await flightResultsPage.getFirstFlightResultDisplayAndOriginalPriceValues();
  },

  async extractFirstFlightResultDisplayAndOriginalPriceData(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const priceData = await flightResultsPage.getFirstFlightResultDisplayAndOriginalPriceData();

    return {
      ...priceData,
      displayCurrencySymbol: extractCurrencySymbol(priceData.displayPriceText, 'first flight result display price'),
      originalCurrencySymbol: extractCurrencySymbol(priceData.originalPriceText, 'first flight result original price'),
    };
  },

  async extractFirstFlightResultDisplayPriceData(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const priceData = await flightResultsPage.getFirstFlightResultDisplayPriceData();

    return {
      ...priceData,
      displayCurrencySymbol: extractCurrencySymbol(priceData.displayPriceText, 'first flight result display price'),
    };
  },

  async verifyFirstPricingOptionMatchesStoredFlightResultPrices(page, expectedPrices) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedPrices || typeof expectedPrices !== 'object') {
      throw new Error('expectedPrices must be an object');
    }

    const { displayPrice, originalPrice } = expectedPrices;

    if (typeof displayPrice !== 'number' || Number.isNaN(displayPrice)) {
      throw new Error(`expectedPrices.displayPrice must be a valid number, got: ${displayPrice}`);
    }

    if (typeof originalPrice !== 'number' || Number.isNaN(originalPrice)) {
      throw new Error(`expectedPrices.originalPrice must be a valid number, got: ${originalPrice}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actualPrices = await flightResultsPage.getFirstPricingOptionDisplayAndOriginalPriceValues();

    expectNumbersToBeEqualWithTolerance(
      actualPrices.displayPrice,
      displayPrice,
      0.02,
      'Pricing options display price vs stored flight result display price',
    );

    expectNumbersToBeEqualWithTolerance(
      actualPrices.originalPrice,
      originalPrice,
      0.02,
      'Pricing options original price vs stored flight result original price',
    );

    return { expectedPrices, actualPrices };
  },

  async verifyFirstPricingOptionDisplayPriceMatchesStored(page, expectedDisplayPrice) {
    if (!page) {
      throw new Error('page is required');
    }

    if (typeof expectedDisplayPrice !== 'number' || Number.isNaN(expectedDisplayPrice)) {
      throw new Error(`expectedDisplayPrice must be a valid number, got: ${expectedDisplayPrice}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actualDisplayPrice = await flightResultsPage.getAmountPriceValuePricingOptions(0);

    if (typeof actualDisplayPrice !== 'number' || Number.isNaN(actualDisplayPrice)) {
      throw new Error(`Could not read first pricing option display price, got: ${actualDisplayPrice}`);
    }

    expectNumbersToBeEqualWithTolerance(
      actualDisplayPrice,
      expectedDisplayPrice,
      0.02,
      'First pricing option display price vs stored flight result display price',
    );

    return { expectedDisplayPrice, actualDisplayPrice };
  },

  async extractFirstPricingOptionDisplayAndOriginalPriceData(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const priceData = await flightResultsPage.getFirstPricingOptionDisplayAndOriginalPriceData();

    return {
      ...priceData,
      displayCurrencySymbol: extractCurrencySymbol(priceData.displayPriceText, 'first pricing option display price'),
      originalCurrencySymbol: extractCurrencySymbol(priceData.originalPriceText, 'first pricing option original price'),
    };
  },

  async verifyStoredPriceMatchesCurrencyConversion(
    page,
    displayPriceEntry,
    originalPriceEntry,
    locationLabel,
    expectedOriginalCurrencyCode,
    expectedDisplayCurrencyCode,
  ) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!displayPriceEntry || typeof displayPriceEntry !== 'object') {
      throw new Error('displayPriceEntry must be an object');
    }

    if (!originalPriceEntry || typeof originalPriceEntry !== 'object') {
      throw new Error('originalPriceEntry must be an object');
    }

    if (!locationLabel || typeof locationLabel !== 'string') {
      throw new Error('locationLabel must be a non-empty string');
    }

    const { amount: displayAmount, currencySymbol: displayCurrencySymbol } = displayPriceEntry;
    const { amount: originalAmount, currencySymbol: originalCurrencySymbol } = originalPriceEntry;

    if (typeof displayAmount !== 'number' || Number.isNaN(displayAmount)) {
      throw new Error(`displayPriceEntry.amount must be a valid number, got: ${displayAmount}`);
    }

    if (typeof originalAmount !== 'number' || Number.isNaN(originalAmount)) {
      throw new Error(`originalPriceEntry.amount must be a valid number, got: ${originalAmount}`);
    }

    const normalizedExpectedOriginalCurrencyCode = normalizeCurrencyCode(
      expectedOriginalCurrencyCode,
      'expectedOriginalCurrencyCode',
    );
    const normalizedExpectedDisplayCurrencyCode = normalizeCurrencyCode(
      expectedDisplayCurrencyCode,
      'expectedDisplayCurrencyCode',
    );

    const displayCurrencyCode = getCurrencyCodeFromSymbol(displayCurrencySymbol);
    const originalCurrencyCode = getCurrencyCodeFromSymbol(originalCurrencySymbol);

    expect(
      originalCurrencyCode,
      `${locationLabel} original currency should be ${normalizedExpectedOriginalCurrencyCode} (${getCurrencySymbolFromCode(normalizedExpectedOriginalCurrencyCode)}) but extracted ${originalCurrencySymbol}`,
    ).toBe(normalizedExpectedOriginalCurrencyCode);

    expect(
      displayCurrencyCode,
      `${locationLabel} display currency should be ${normalizedExpectedDisplayCurrencyCode} (${getCurrencySymbolFromCode(normalizedExpectedDisplayCurrencyCode)}) but extracted ${displayCurrencySymbol}`,
    ).toBe(normalizedExpectedDisplayCurrencyCode);

    const exchangeRate = await getExchangeRate(
      normalizedExpectedOriginalCurrencyCode,
      normalizedExpectedDisplayCurrencyCode,
    );
    const expectedConvertedAmount = Number((originalAmount * exchangeRate).toFixed(2));
    const tolerance = getCurrencyConversionTolerance(expectedConvertedAmount);

    expectNumbersToBeEqualWithTolerance(
      displayAmount,
      expectedConvertedAmount,
      tolerance,
      `${locationLabel} converted price ${originalCurrencyCode}->${displayCurrencyCode}`,
    );

    return {
      locationLabel,
      displayAmount,
      displayCurrencyCode,
      expectedDisplayCurrencyCode: normalizedExpectedDisplayCurrencyCode,
      originalAmount,
      originalCurrencyCode,
      expectedOriginalCurrencyCode: normalizedExpectedOriginalCurrencyCode,
      exchangeRate,
      expectedConvertedAmount,
      tolerance,
    };
  },

  /**
   * Verifies that pricing options are displayed in ascending (lowest-to-highest) price order.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{verified: boolean, amounts: number[]}>}
   */
  async verifyPricingOptionsInAscendingOrder(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const amounts = await flightResultsPage.getAllPricingOptionAmounts();

    if (amounts.length < 2) {
      throw new Error(`Expected at least 2 pricing options to verify order, got: ${amounts.length}`);
    }

    for (let i = 1; i < amounts.length; i++) {
      expect(
        amounts[i],
        `Expected pricing option ${i + 1} (${amounts[i]}) to be >= pricing option ${i} (${amounts[i - 1]})`,
      ).toBeGreaterThanOrEqual(amounts[i - 1]);
    }

    return { verified: true, amounts };
  },

  async verifyPricingOptionsPriceIsPerTraveler(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const resultsPerTravelerPrice = await flightResultsPage.getFirstFlightResultPriceValue();
    const pricingOptionsPrice = await flightResultsPage.getAmountPriceValuePricingOptions(0);
    const hasPerTravellerLabel = await flightResultsPage.isPricingOptionsPerTravellerLabelVisible();

    if (pricingOptionsPrice == null) {
      throw new Error('Could not extract pricing options price from the first option');
    }

    expect(hasPerTravellerLabel, 'Expected the pricing options drawer to display the per-traveller indicator').toBe(true);
    expectNumbersToBeEqualWithTolerance(
      pricingOptionsPrice,
      resultsPerTravelerPrice,
      0.02,
      'Pricing options price vs results per-traveler price',
    );

    return { resultsPerTravelerPrice, pricingOptionsPrice, hasPerTravellerLabel };
  },

  /**
   * Verifies the cabin class shown on the first pricing option card matches
   * the expected class name (case-insensitive) and is not rendered as
   * "undefined". Guards against the brandDesc-missing rendering bug.
   *
   * @param {Object} page - Playwright page object
   * @param {string} expectedClass - Expected cabin class label, e.g. "Business"
   * @param {number} index - Zero-based pricing option index (default: 0)
   * @returns {Promise<{verified: true, cabinClassText: string}>}
   */
  async verifyCabinClassInPricingOptions(page, expectedClass, index = 0) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!expectedClass || typeof expectedClass !== 'string') {
      throw new Error('expectedClass must be a non-empty string, got: ' + expectedClass);
    }
    if (typeof index !== 'number' || index < 0) {
      throw new Error('index must be a non-negative number, got: ' + index);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const cabinClassText = await flightResultsPage.getPricingOptionsCabinClassText(index);

    expect(
      cabinClassText.toLowerCase(),
      `Cabin class on pricing option #${index} should not contain "undefined" — got "${cabinClassText}"`,
    ).not.toContain('undefined');

    expect(
      cabinClassText.toLowerCase(),
      `Cabin class on pricing option #${index} should contain "${expectedClass}" — got "${cabinClassText}"`,
    ).toContain(expectedClass.toLowerCase());

    return { verified: true, cabinClassText };
  },

  async extractTotalPriceFromFlightDetails(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return await flightResultsPage.getFlightDetailsTotalPrice();
  },

  async verifyFlightDetailsPriceIsTotalForAllPax(page, perTravelerPrice, travelerCount, flightDetailsTotalPrice = null) {
    if (!page) {
      throw new Error('page is required');
    }

    if (typeof perTravelerPrice !== 'number' || Number.isNaN(perTravelerPrice)) {
      throw new Error(`perTravelerPrice must be a valid number, got: ${perTravelerPrice}`);
    }

    if (!Number.isInteger(travelerCount) || travelerCount < 1) {
      throw new Error(`travelerCount must be a positive integer, got: ${travelerCount}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actualTotalPrice = flightDetailsTotalPrice ?? await flightResultsPage.getFlightDetailsTotalPrice();
    const expectedTotalPrice = perTravelerPrice * travelerCount;

    expectNumbersToBeEqualWithTolerance(
      actualTotalPrice,
      expectedTotalPrice,
      0.02,
      `Flight details total price vs per-traveler price x ${travelerCount}`,
    );

    return { perTravelerPrice, travelerCount, expectedTotalPrice, actualTotalPrice };
  },

  /**
   * Opens the share quote email dialog from the first flight result, verifies that the
   * email preview contains the requested original-currency symbol, then closes the dialog.
   *
   * @param {import('playwright').Page} page
   * @param {string} currencySymbol - Expected currency symbol, e.g. "$"
   * @returns {Promise<{currencySymbol: string, found: boolean}>}
   */
  async verifyOriginalCurrencyInShareQuoteFromResults(page, currencySymbol) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!currencySymbol || typeof currencySymbol !== 'string') {
      throw new Error('currencySymbol must be a non-empty string');
    }

    const resultsPage = getPageObject(page, ResultsPage);
    const commonPage = getPageObject(page, CommonPage);
    const cartPage = getPageObject(page, CartPage);

    // Enter share mode and select the first result quote
    await FlightResults.waitForAddToTripButtonAndClickShareButton(page);
    await resultsPage.clickShareQuoteButton(1);
    await resultsPage.clickShareQuoteToGetEmailPopUp();
    await commonPage.waitForSubjectLabelSharePopUp();

    // Verify the email preview contains the currency symbol
    const found = await cartPage.sharePreviewContainsText(currencySymbol);
    expect(found, `Expected share quote email preview to contain the currency symbol "${currencySymbol}"`).toBe(true);

    // Close the share dialog so the test can continue
    await cartPage.closeShareDialog();

    return { currencySymbol, found };
  },

  /**
   * Adds the first flight result to the cart.
   *
   * This flow:
   * - waits for results
   * - adds the first flight
   * - handles conflict quote modal if it appears
   * - waits until the cart shows "Pending booking"
   *
   * Returns a simple status object so callers can assert intent,
   * not UI details.
   */
  async addFirstFlightToCart(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const cartPage = getPageObject(page, CartPage);

    await Results.waitAndClickAddToTripButton(page);

    // Some suppliers show a conflict modal; handle it defensively
    await Results.clickProceedConflictQuoteModal(page);

    // Ensure the flight is now present in the cart
    await cartPage.waitForPendingBookingText();

    return { added: true };
  },

  async extractFirstFlightResultSegmentDetails(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return await flightResultsPage.getFirstResultFlightSegmentSummaries();
  },

  /**
   * Selects a single flight segment by schedule.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{selected: boolean}>}
   */
  async selectOneSegmentBySchedule(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    await Results.waitAndClickSelectButton(page);

    return { selected: true };
  },

  async verifySelectFlightButtonVisible(page) {
    if (!page) throw new Error('page is required');

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForSelectText();
    return { visible: true };
  },

  async verifyAddToTripAndPricingOptionsNotVisible(page) {
    if (!page) throw new Error('page is required');

    const resultsPage = getPageObject(page, ResultsPage);
    const flightResultsPage = getPageObject(page, FlightResultsPage);

    const addToTripVisible = await resultsPage.getAddToTripButton().isVisible();
    expect(addToTripVisible, '"Add to trip" button should not be visible').toBe(false);

    const pricingOptionsVisible = await flightResultsPage.isPricingOptionsButtonVisible();
    expect(pricingOptionsVisible, '"Pricing Options" button should not be visible').toBe(false);

    return { addToTripVisible: false, pricingOptionsVisible: false };
  },

  async confirmPricingOptionForCurrentSegment(page) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.confirmBySchedulePricingSelection();

    return { confirmed: true };
  },

  /**
   * Selects both segments for a round-trip flight by schedule.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{selected: boolean}>}
   */
  async selectSegmentsBySchedule(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);

    // Select first segment
    await this.selectOneSegmentBySchedule(page);
    await flightResultsPage.waitForChangeFlightButton();

    // Select second segment
    await this.selectOneSegmentBySchedule(page);

    return { selected: true };
  },

  /**
   * Waits for flight results, clicks the main Share button, and waits for the share dialog to appear.
   * Use when sharing all visible flight results (not filtered by carrier).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{clicked: boolean}>}
   */
  async waitForAddToTripButtonAndClickShareButton(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const resultsPage = getPageObject(page, ResultsPage);

    await Promise.any([
      resultsPage.waitForAddToTripText(),
      resultsPage.waitForSelectText(),
      resultsPage.waitForShareMainButton(),
    ]);

    await resultsPage.clickShareMainButton();
    return { clicked: true };
  },

  /**
   * Clicks a share quote button from results share mode using the UI-visible button number.
   *
   * @param {import('playwright').Page} page
   * @param {number} buttonNumber - UI-visible share button number (1-based)
   * @returns {Promise<{clicked: boolean, buttonNumber: number}>}
   */
  async clickShareQuoteButtonInResults(page, buttonNumber) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!Number.isInteger(buttonNumber) || buttonNumber < 1) {
      throw new Error(`buttonNumber must be an integer >= 1, got: ${buttonNumber}`);
    }

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.clickShareQuoteButton(buttonNumber);

    return { clicked: true, buttonNumber };
  },

  /**
   * Navigates to a specific by-schedule flight segment using the stepper.
   *
   * @param {import('playwright').Page} page
   * @param {number} segmentNumber - UI-visible segment number (1-based)
   * @returns {Promise<{clicked: boolean, segmentNumber: number}>}
   */
  async clickByScheduleFlightSegment(page, segmentNumber) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!Number.isInteger(segmentNumber) || segmentNumber < 1) {
      throw new Error(`segmentNumber must be an integer >= 1, got: ${segmentNumber}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.clickByScheduleFlightSegment(segmentNumber);

    return { clicked: true, segmentNumber };
  },

  /**
   * Verifies that the currently active by-schedule leg matches the expected
   * route and that flight results are visible for it.
   *
   * @param {import('playwright').Page} page
   * @param {string} leg - Leg code in "FROM-TO" format (e.g. "GLA-AMS")
   * @returns {Promise<{leg: string, activeTitle: string}>}
   */
  async verifyByScheduleLegHasResults(page, leg) {
    if (!page) {
      throw new Error('page is required');
    }
    if (typeof leg !== 'string' || !/^[A-Za-z]{3}-[A-Za-z]{3}$/.test(leg)) {
      throw new Error(`leg must be a "FROM-TO" code (e.g. "GLA-AMS"), got: ${leg}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const activeTitle = await flightResultsPage.getActiveByScheduleLegTitle();
    const [from, to] = leg.toUpperCase().split('-');
    const expected = `${from} to ${to}`;
    const normalized = activeTitle.toUpperCase();

    if (normalized !== expected.toUpperCase() && !(normalized.includes(from) && normalized.includes(to))) {
      throw new Error(
        `Expected active by-schedule leg to be "${expected}", but stepper shows "${activeTitle}"`
      );
    }

    await flightResultsPage.waitForFlightResults(60000);

    return { leg, activeTitle };
  },

  /**
   * Waits for a field label to be visible in the share dialog.
   *
   * @param {import('playwright').Page} page
   * @param {string} fieldLabel
   * @returns {Promise<{visible: boolean, fieldLabel: string}>}
   */
  async waitForFieldInShareDialog(page, fieldLabel) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!fieldLabel || typeof fieldLabel !== 'string') {
      throw new Error('fieldLabel must be a non-empty string');
    }

    const commonPage = getPageObject(page, CommonPage);
    await commonPage.waitForFieldLabelSharePopUp(fieldLabel);

    return { visible: true, fieldLabel };
  },

  /**
   * Exits share mode by clicking the X button on the share bar.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   */
  async exitShareMode(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.clickExitShareModeButton();
  },

  // ===== SHARE MODE ON RESULTS (US 84219) =====

  /**
   * Asserts every result card shows both share-mode actions and none of the booking actions.
   *
   * @param {import('playwright').Page} page
   * @param {string} shareLabel - e.g. "Share"
   * @param {string} secondaryLabel - e.g. "Pricing Options"
   * @returns {Promise<{cardsChecked: number}>}
   */
  async verifyEveryResultOffersShareActions(page, shareLabel, secondaryLabel) {
    if (!page) throw new Error('[FlightResults.verifyEveryResultOffersShareActions] "page" is required.');
    const cards = await getPageObject(page, FlightResultsPage).getResultCardButtonLabels();
    const wrong = cards
      .map((labels, i) => ({ result: i + 1, labels }))
      .filter(({ labels }) => !hasLabel(labels, shareLabel) || !hasLabel(labels, secondaryLabel)
        || BOOKING_ACTION_LABELS.some((booking) => hasLabel(labels, booking)));
    if (cards.length === 0 || wrong.length > 0) {
      throw new Error(
        `[FlightResults.verifyEveryResultOffersShareActions] Every result should offer "${shareLabel}" and ` +
        `"${secondaryLabel}" instead of ${BOOKING_ACTION_LABELS.map((l) => `"${l}"`).join('/')}. ` +
        `${cards.length} cards read; wrong: ${JSON.stringify(wrong.slice(0, 5))}`
      );
    }
    return { cardsChecked: cards.length };
  },

  /**
   * Asserts every result card shows `label` as its booking action and no share-mode action.
   *
   * @param {import('playwright').Page} page
   * @param {string} label - e.g. "Select flight"
   * @returns {Promise<{cardsChecked: number}>}
   */
  async verifyEveryResultShowsBookingAction(page, label) {
    if (!page) throw new Error('[FlightResults.verifyEveryResultShowsBookingAction] "page" is required.');
    const cards = await getPageObject(page, FlightResultsPage).getResultCardButtonLabels();
    const wrong = cards
      .map((labels, i) => ({ result: i + 1, labels }))
      .filter(({ labels }) => !hasLabel(labels, label) || SHARE_ACTION_LABELS.some((share) => hasLabel(labels, share)));
    if (cards.length === 0 || wrong.length > 0) {
      throw new Error(
        `[FlightResults.verifyEveryResultShowsBookingAction] Every result should show "${label}" and no share action. ` +
        `${cards.length} cards read; wrong: ${JSON.stringify(wrong.slice(0, 5))}`
      );
    }
    return { cardsChecked: cards.length };
  },

  /**
   * Asserts the share bar heading reads "{selected} of {max} selected".
   *
   * @param {import('playwright').Page} page
   * @param {number} selected
   * @param {number} max
   */
  async verifyShareBarSelection(page, selected, max) {
    if (!page) throw new Error('[FlightResults.verifyShareBarSelection] "page" is required.');
    const resultsPage = getPageObject(page, ResultsPage);
    const expected = `${selected} of ${max} selected`;
    let heading = '';
    try {
      await expect.poll(async () => {
        heading = await resultsPage.getShareBarHeadingText();
        return heading.toLowerCase();
      }, { timeout: 15000 }).toContain(expected);
    } catch {
      throw new Error(`[FlightResults.verifyShareBarSelection] Share bar should read "${expected}", but read "${heading}".`);
    }
    return { heading };
  },

  /**
   * Asserts the share bar's "Share" (send price offer) button is enabled or disabled.
   *
   * @param {import('playwright').Page} page
   * @param {'enabled'|'disabled'} state
   */
  async verifyShareBarShareButtonState(page, state) {
    if (!page) throw new Error('[FlightResults.verifyShareBarShareButtonState] "page" is required.');
    if (!['enabled', 'disabled'].includes(state)) {
      throw new Error(`[FlightResults.verifyShareBarShareButtonState] state must be "enabled" or "disabled", got: ${state}`);
    }
    const disabled = await getPageObject(page, ResultsPage).isShareBarShareButtonDisabled();
    if (disabled !== (state === 'disabled')) {
      throw new Error(`[FlightResults.verifyShareBarShareButtonState] Share bar "Share" button should be ${state}, but it is ${disabled ? 'disabled' : 'enabled'}.`);
    }
    return { state };
  },

  /**
   * Asserts the share bar is shown (share mode on) or gone (share mode off).
   *
   * @param {import('playwright').Page} page
   * @param {boolean} displayed
   */
  async verifyShareBarDisplayed(page, displayed) {
    if (!page) throw new Error('[FlightResults.verifyShareBarDisplayed] "page" is required.');
    try {
      await getPageObject(page, ResultsPage).waitForShareBar(displayed ? 'visible' : 'hidden');
    } catch {
      throw new Error(`[FlightResults.verifyShareBarDisplayed] The share bar should ${displayed ? 'be displayed' : 'not be displayed'}.`);
    }
    return { displayed };
  },

  /**
   * Clicks "+ Share" on a result card and waits for its slot (the new flow prices the package first).
   *
   * @param {import('playwright').Page} page
   * @param {number} resultNumber - 1-based card position
   * @returns {Promise<{resultNumber: number, flightNumbers: string[], cardPrice: number|null,
   *   legs: Array<{route: string, departure: string, arrival: string}>, price: number}>}
   */
  async addResultToShareBar(page, resultNumber) {
    if (!page) throw new Error('[FlightResults.addResultToShareBar] "page" is required.');
    if (!Number.isInteger(resultNumber) || resultNumber < 1) {
      throw new Error(`[FlightResults.addResultToShareBar] resultNumber must be an integer >= 1, got: ${resultNumber}`);
    }
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const index = resultNumber - 1;
    const flightNumbers = await flightResultsPage.getResultCardFlightNumbers(index);
    const cardPrice = await flightResultsPage.getResultCardPrice(index);
    const before = await flightResultsPage.getFilledShareSlotCount();

    await flightResultsPage.clickResultCardShareButton(index);
    try {
      await flightResultsPage.waitForFilledShareSlotCount(before + 1);
    } catch (err) {
      throw new Error(
        `[FlightResults.addResultToShareBar] Result ${resultNumber} did not fill a share slot (${before} filled before). ` +
        `On the new flow a failed pricing opens the pricing options screen instead. Original: ${err.message}`
      );
    }

    const slotLabel = (await flightResultsPage.getFilledShareSlotLabels())[before];
    const quote = { resultNumber, flightNumbers, cardPrice, ...parseShareSlotLabel(slotLabel) };
    logger.info('[Share] Result added to the share bar', { resultNumber, flightNumbers, cardPrice, slotPrice: quote.price });
    return quote;
  },

  /**
   * Asserts a result card's share button reads `label` ("Added" once shared, "Share" otherwise).
   *
   * @param {import('playwright').Page} page
   * @param {number} resultNumber - 1-based card position
   * @param {string} label
   */
  async verifyResultShareButtonLabel(page, resultNumber, label) {
    if (!page) throw new Error('[FlightResults.verifyResultShareButtonLabel] "page" is required.');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    let labels = [];
    try {
      await expect.poll(async () => {
        labels = (await flightResultsPage.getResultCardButtonLabels())[resultNumber - 1] || [];
        return hasLabel(labels, label);
      }, { timeout: 15000 }).toBe(true);
    } catch {
      throw new Error(`[FlightResults.verifyResultShareButtonLabel] Result ${resultNumber} should show "${label}"; its buttons read ${JSON.stringify(labels)}.`);
    }
    return { resultNumber, labels };
  },

  /**
   * Asserts the slot price is the cheapest priced option per traveller: min(TotalDisplay.Amount) / TotalPassengers.
   *
   * @param {{price: number, resultNumber: number}} quote - from addResultToShareBar
   * @param {Promise<import('@playwright/test').Response>} responsePromise - from startCapturingPricingSelectionResponse
   * @returns {Promise<{expected: number, slotPrice: number, options: number}>}
   */
  async verifySharedQuotePriceIsCheapestPricedOption(quote, responsePromise) {
    if (!quote) throw new Error('[FlightResults.verifySharedQuotePriceIsCheapestPricedOption] "quote" is required - add a result to the share bar first.');
    if (!responsePromise) {
      throw new Error('[FlightResults.verifySharedQuotePriceIsCheapestPricedOption] "responsePromise" is required - start intercepting the flight pricing selection response before adding the result.');
    }
    const body = await readJson(responsePromise);
    const totals = (pick(body, 'results', 'Results') || [])
      .filter((option) => (pick(option, 'segments', 'Segments') || []).length > 0)
      .map((option) => Number(pick(pick(pick(option, 'pricing', 'Pricing'), 'totalDisplay', 'TotalDisplay'), 'amount', 'Amount')))
      .filter(Number.isFinite);
    if (totals.length === 0) {
      throw new Error('[FlightResults.verifySharedQuotePriceIsCheapestPricedOption] The FlightPricingSelection response has no priced option with segments.');
    }
    const passengers = Number(pick(pick(body, 'searchCriteria', 'SearchCriteria'), 'totalPassengers', 'TotalPassengers'));
    const expected = Math.min(...totals) / (passengers > 0 ? passengers : 1);
    if (!(Math.abs(quote.price - expected) <= SHARE_PRICE_TOLERANCE)) {
      throw new Error(
        `[FlightResults.verifySharedQuotePriceIsCheapestPricedOption] Result ${quote.resultNumber} was shared at ${quote.price}, ` +
        `but its cheapest priced option is ${expected.toFixed(2)} per traveller (lowest of ${totals.length} options).`
      );
    }
    logger.info('[Share] Slot price is the cheapest priced option', { slotPrice: quote.price, expected, options: totals.length });
    return { expected, slotPrice: quote.price, options: totals.length };
  },

  /**
   * Asserts the slot price equals the price shown on its result card (old flow: no pricing call).
   *
   * @param {{price: number, cardPrice: number|null, resultNumber: number}} quote - from addResultToShareBar
   * @param {number} resultNumber - 1-based card position the quote must come from
   */
  verifySharedQuotePriceMatchesResultPrice(quote, resultNumber) {
    if (!quote) throw new Error('[FlightResults.verifySharedQuotePriceMatchesResultPrice] "quote" is required - add a result to the share bar first.');
    if (quote.resultNumber !== resultNumber) {
      throw new Error(`[FlightResults.verifySharedQuotePriceMatchesResultPrice] The slot holds result ${quote.resultNumber}, not ${resultNumber}.`);
    }
    if (!(Math.abs(quote.price - quote.cardPrice) <= SHARE_PRICE_TOLERANCE)) {
      throw new Error(
        `[FlightResults.verifySharedQuotePriceMatchesResultPrice] Result ${quote.resultNumber} shows ${quote.cardPrice} ` +
        `but was shared at ${quote.price}.`
      );
    }
    return { resultNumber: quote.resultNumber, cardPrice: quote.cardPrice, slotPrice: quote.price };
  },

  /**
   * Hovers a filled share slot to open its tooltip.
   *
   * @param {import('playwright').Page} page
   * @param {number} slotNumber - 1-based slot position
   */
  async hoverShareSlot(page, slotNumber) {
    if (!page) throw new Error('[FlightResults.hoverShareSlot] "page" is required.');
    await getPageObject(page, FlightResultsPage).hoverFilledShareSlot(slotNumber - 1);
    return { hovered: slotNumber };
  },

  /**
   * Asserts the open slot tooltip shows the quote's route and times per leg and its price.
   *
   * @param {import('playwright').Page} page
   * @param {{legs: Array<{route: string, departure: string, arrival: string}>, price: number}} quote
   * @returns {Promise<{tooltip: string}>}
   */
  async verifyShareSlotTooltip(page, quote) {
    if (!page) throw new Error('[FlightResults.verifyShareSlotTooltip] "page" is required.');
    if (!quote || quote.legs.length === 0) throw new Error('[FlightResults.verifyShareSlotTooltip] "quote" with legs is required.');
    const tooltip = await getPageObject(page, FlightResultsPage).getShareSlotTooltipText();
    const expected = [
      ...quote.legs.flatMap((leg) => [leg.route, `${leg.departure} - ${leg.arrival}`]),
      quote.price.toFixed(2),
    ];
    const missing = expected.filter((value) => !tooltip.replace(/,(?=\d{3})/g, '').includes(value));
    if (missing.length > 0) {
      throw new Error(`[FlightResults.verifyShareSlotTooltip] Tooltip is missing ${JSON.stringify(missing)}. Tooltip: "${tooltip}"`);
    }
    return { tooltip };
  },

  /**
   * Clicks a filled share slot and waits for its quote to be removed.
   *
   * @param {import('playwright').Page} page
   * @param {number} slotNumber - 1-based slot position
   */
  async removeShareSlot(page, slotNumber) {
    if (!page) throw new Error('[FlightResults.removeShareSlot] "page" is required.');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const before = await flightResultsPage.getFilledShareSlotCount();
    if (slotNumber < 1 || slotNumber > before) {
      throw new Error(`[FlightResults.removeShareSlot] Slot ${slotNumber} is not filled (${before} filled).`);
    }
    await flightResultsPage.clickFilledShareSlot(slotNumber - 1);
    await flightResultsPage.waitForFilledShareSlotCount(before - 1, 15000);
    return { removed: slotNumber, remaining: before - 1 };
  },

  /**
   * Asserts the new pricing options footer offers `expectedLabel` and not `absentLabel`.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedLabel
   * @param {string} absentLabel
   */
  async verifyNewFlowFooterOffers(page, expectedLabel, absentLabel) {
    if (!page) throw new Error('[FlightResults.verifyNewFlowFooterOffers] "page" is required.');
    const labels = await getPageObject(page, FlightResultsPage).getNewFlowFooterButtonLabels();
    if (!hasLabel(labels, expectedLabel) || hasLabel(labels, absentLabel)) {
      throw new Error(`[FlightResults.verifyNewFlowFooterOffers] The pricing options footer should offer "${expectedLabel}" and not "${absentLabel}"; it reads ${JSON.stringify(labels)}.`);
    }
    return { labels };
  },

  /**
   * Asserts the email preview has one "Flight Offer # n" per quote, with its flight numbers, times and total.
   *
   * @param {import('playwright').Page} page
   * @param {Array<object>} quotes - from addResultToShareBar, in slot order
   * @returns {Promise<{offers: number}>}
   */
  async verifySharePreviewContainsQuotes(page, quotes) {
    if (!page) throw new Error('[FlightResults.verifySharePreviewContainsQuotes] "page" is required.');
    if (!Array.isArray(quotes) || quotes.length === 0) {
      throw new Error('[FlightResults.verifySharePreviewContainsQuotes] No shared quotes recorded - add results to the share bar first.');
    }
    const preview = (await getPageObject(page, CartPage).getSharePreviewTextContent()).replace(/,(?=\d{3})/g, '');
    const offers = preview.split(/Flight Offer #\s*\d+/i).slice(1);
    if (offers.length !== quotes.length) {
      throw new Error(`[FlightResults.verifySharePreviewContainsQuotes] The email preview has ${offers.length} flight offers, expected ${quotes.length} (one per shared quote).`);
    }

    const problems = quotes.flatMap((quote, i) => {
      const offer = offers[i];
      const missing = [...quote.flightNumbers, ...quote.legs.flatMap((leg) => [leg.departure, leg.arrival])]
        .filter((value) => !offer.includes(value));
      const total = Number((offer.match(/Total:\s*[^\d]*(\d+(?:\.\d+)?)/i) || [])[1]);
      const totalOk = Math.abs(total - quote.price) <= SHARE_PRICE_TOLERANCE;
      return missing.length === 0 && totalOk
        ? []
        : [`offer #${i + 1} (result ${quote.resultNumber}): missing ${JSON.stringify(missing)}, total ${total} vs shared ${quote.price.toFixed(2)}`];
    });
    if (problems.length > 0) {
      throw new Error(`[FlightResults.verifySharePreviewContainsQuotes] The email preview does not match the share bar: ${problems.join('; ')}`);
    }
    return { offers: offers.length };
  },

  /**
   * Filters flight results by carrier, extracts the price, and shares that quote.
   * Use for sharing a quote from a specific carrier (e.g., KLM, Air France).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} carrier - Carrier name to filter
   * @param {number} index - Index of the result to share (default: 0 for first result)
   * @returns {Promise<{price: number, shared: boolean}>} The price and share status
   */
  async getPriceAndShareQuoteFromCarrier(page, carrier, index = 0) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!carrier || typeof carrier !== 'string') {
      throw new Error('carrier must be a non-empty string');
    }
    
    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }
    
    const resultsPage = getPageObject(page, ResultsPage);
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    
    // Filter by carrier
    await flightResultsPage.typeInSearchFlightFilter(carrier);
    
    // Necessary wait to ensure results are filtered before interacting
    await page.waitForTimeout(1000);
    
    // Get price from the filtered result (index 0 = first filtered result)
    const price = await resultsPage.getAmountPriceValueResults(index);
    
    // Share the same result (index + 1 because share buttons include disabled main button at index 0)
    await resultsPage.clickShareQuoteButton(index + 1);
    
    return { price, shared: true };
  },

  /**
   * Shares the first two available flight quotes from results by email.
   * Mirrors the legacy Testim flow for simple multi-quote sharing from results.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{shared: boolean, quotesSelected: number}>}
   */
  async shareFirstTwoQuotesByEmailFromResults(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const resultsPage = getPageObject(page, ResultsPage);
    const commonPage = getPageObject(page, CommonPage);

    await FlightResults.waitForAddToTripButtonAndClickShareButton(page);

    // Index 0 is the disabled share entry in this results share mode.
    await resultsPage.clickShareQuoteButton(1);
    await resultsPage.clickShareQuoteButton(2);
    await resultsPage.clickShareQuoteToGetEmailPopUp();
    await commonPage.waitForSubjectLabelSharePopUp();

    return { shared: true, quotesSelected: 2 };
  },

  /**
   * Scrolls to each shared flight offer in the share dialog and extracts their prices.
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{sharedPrice1: number, sharedPrice2: number}>} The prices of the two shared offers
   */
  // TODO: Locator needs to be created
  async scrollIntoOffersAndGetPrices(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const commonPage = getPageObject(page, CommonPage);
    
    // Scroll to make both offers visible in the share dialog
    await commonPage.scrollIntoViewOffer(1);
    await commonPage.getPriceFromEmailOffer(3);
    await commonPage.scrollIntoViewOffer(2);
    await commonPage.getPriceFromEmailOffer(7);
    
    // Extract prices from the shared offers (indices 1 and 2 skip the first price element)
    const sharedPrice1 = await commonPage.getPriceFromEmailOffer(3);
    const sharedPrice2 = await commonPage.getPriceFromEmailOffer(7);
    
    return { sharedPrice1, sharedPrice2 };
  },

  /**
   * Selects the first pricing option by clicking "Select to share" button.
   * Assumes pricing options modal is already open.
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{selected: boolean}>} Selection status
   */
  async selectToShareFirstPricingOption(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    
    // Click "Select to share" button for first pricing option
    await flightResultsPage.waitForSelectToShareButton();
    await flightResultsPage.clickSelectToShareButton();
    
    return { selected: true };
  },

  async selectFirstPricingOptionInModal(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);

    // Click "Select" button for first pricing option
    await flightResultsPage.waitForSelectButtonInPricingOptionsModal();
    await flightResultsPage.clickSelectButtonInPricingOptionsModal();

    return { selected: true };
  },

  /**
   * Selects the pricing option on the current leg whose displayed per-pax price matches the
   * target amount, and returns the matched price and card index.
   * @param {import('playwright').Page} page
   * @param {number} targetPrice - Per-pax price to match (from the flightPricing response).
   * @returns {Promise<{ selected: true, selectedPrice: number, index: number }>}
   */
  async selectPricingOptionByPrice(page, targetPrice) {
    if (!page) {
      throw new Error('page is required');
    }
    if (typeof targetPrice !== 'number' || !Number.isFinite(targetPrice)) {
      throw new Error(`targetPrice must be a finite number, got: ${targetPrice}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);

    // Displayed prices can round differently from the API value in the display currency.
    const PRICE_MATCH_TOLERANCE = 1;
    const prices = await flightResultsPage.getPricingOptionCardPrices();
    const index = prices.findIndex((p) => p !== null && Math.abs(p - targetPrice) <= PRICE_MATCH_TOLERANCE);
    if (index === -1) {
      throw new Error(
        `No pricing-option card matches price ${targetPrice} (±${PRICE_MATCH_TOLERANCE}). Prices shown: ${JSON.stringify(prices)}`,
      );
    }

    logger.info('Selecting pricing option by displayed price', { targetPrice, index, prices });
    await flightResultsPage.clickSelectButtonInPricingOptionsModal(index);

    return { selected: true, selectedPrice: prices[index], index };
  },

  /**
   * Selects the fare matching the target price on every leg tab of the open pricing-options modal,
   * since "Add to trip" stays disabled until each tab has a fare and the tab count varies per run.
   * @param {import('playwright').Page} page
   * @param {number} targetPrice - Per-pax price to match (from the flightPricing response).
   * @returns {Promise<{ selected: true, legCount: number, selectedPrice: number }>}
   */
  async selectPublishedFareOnEveryLeg(page, targetPrice) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    // A single-leg product renders no tab strip, so treat 0 tabs as one leg
    const tabCount = await flightResultsPage.getPricingOptionsTabCount();
    const legCount = Math.max(tabCount, 1);

    logger.info('Selecting the published fare on every leg of the pricing options modal', { targetPrice, tabCount, legCount });

    let selectedPrice;
    for (let leg = 0; leg < legCount; leg += 1) {
      ({ selectedPrice } = await this.selectPricingOptionByPrice(page, targetPrice));
    }

    return { selected: true, legCount, selectedPrice };
  },

  /**
   * Selects a pricing option in the open modal at the given zero-based index.
   * Used by tests that need to pick a specific fare (e.g. the second fare).
   * @param {import('playwright').Page} page
   * @param {number} index - Zero-based index of the pricing option
   * @returns {Promise<{ selected: true, index: number }>}
   */
  async selectPricingOptionInModalByIndex(page, index) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(`index must be a non-negative integer, got: ${index}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await flightResultsPage.waitForSelectButtonInPricingOptionsModal(index);
    await flightResultsPage.clickSelectButtonInPricingOptionsModal(index);

    return { selected: true, index };
  },

  /**
   * Selects a cabin-class tab in the top section of the pricing options modal.
   * The tab labels are the cabin class names (Economy / Premium Eco / Business / First),
   * and matching is done by substring so passing "Premium" selects "Premium Eco".
   *
   * @param {import('playwright').Page} page
   * @param {string} cabinName - Cabin name or substring (e.g. "Premium")
   * @returns {Promise<{ selected: true, cabinName: string }>}
   */
  async selectCabinClassFromPricingOptionsTop(page, cabinName) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!cabinName || typeof cabinName !== 'string') {
      throw new Error('cabinName must be a non-empty string, got: ' + cabinName);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.clickPricingOptionsCabinClassTabByName(cabinName);

    return { selected: true, cabinName };
  },

  async clickToOpenPricingOptions(page, index = 0) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForFlightResults(90000);
    await flightResultsPage.waitForPricingOptionsButton(index, 90000);
    await flightResultsPage.clickPricingOptionsButton(index);
  },

  /**
   * Verifies the pricing options header contains the expected fare text.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedText - Expected text inside the pricing options header
   * @returns {Promise<{expectedText: string, actualText: string}>}
   */
  async verifyPricingOptionsHeaderContains(page, expectedText) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actualText = await flightResultsPage.getPricingOptionsHeaderText();

    expect(actualText).toContain(expectedText);

    return { expectedText, actualText };
  },

  /**
   * Verifies the "Brand information is currently unavailable." message is
   * displayed inside the currently open branded fares drawer. The same drawer
   * component renders in three contexts (results flight-details, pricing
   * options, and cart flight-details), so a single verification works for all.
   *
   * @param {import('playwright').Page} page
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<{ visible: boolean }>}
   */
  async verifyBrandInformationUnavailable(page, { timeout = 15000 } = {}) {
    if (!page) throw new Error('page is required');
    if (typeof timeout !== 'number' || timeout < 0) {
      throw new Error(`timeout must be >= 0, got ${timeout}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isBrandInformationUnavailableVisible(timeout);

    expect(
      visible,
      'Expected "Brand information is currently unavailable." message to be visible in branded fares drawer',
    ).toBe(true);

    return { visible };
  },

  /**
   * Verifies that a specific brand name is visible in pricing options.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedBrandName - Brand name expected in the pricing options drawer
   * @returns {Promise<{expectedBrandName: string, brandNames: string[]}>}
   */
  async verifyPricingOptionsBrandDisplayed(page, expectedBrandName) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedBrandName || typeof expectedBrandName !== 'string') {
      throw new Error('expectedBrandName must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const brandNames = await flightResultsPage.getPricingOptionsBrandNames();

    expect(
      brandNames.some((brandName) => brandName.toLowerCase() === expectedBrandName.toLowerCase()),
      `Expected pricing options brands to include "${expectedBrandName}", got: ${brandNames.join(', ')}`,
    ).toBe(true);

    return { expectedBrandName, brandNames };
  },

  /**
   * Verifies that each multi-city segment is visible in pricing options and can be selected in sequence.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string[]} segmentRoutes - Array of routes in FROM-TO format
   * @returns {Promise<{verified: boolean, segmentRoutes: string[]}>}
   */
  async verifyMultiCitySegmentsVisibleInPricingOptions(page, segmentRoutes) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!Array.isArray(segmentRoutes) || segmentRoutes.length < 2) {
      throw new Error(`segmentRoutes must be an array of at least 2 routes, got: ${JSON.stringify(segmentRoutes)}`);
    }

    const normalizedRoutes = segmentRoutes.map((route, index) => {
      if (!route || typeof route !== 'string') {
        throw new Error(`segmentRoutes[${index}] must be a non-empty string`);
      }

      return route.toUpperCase().split('-').map((part) => part.trim()).join(' - ');
    });

    const flightResultsPage = getPageObject(page, FlightResultsPage);
  await flightResultsPage.waitForPricingOptionsTabCount(normalizedRoutes.length, 60000);
  const tabCount = await flightResultsPage.getPricingOptionsTabCount();

    expect(
      tabCount,
      `Expected at least ${normalizedRoutes.length} pricing options tabs, got: ${tabCount}`,
    ).toBeGreaterThanOrEqual(normalizedRoutes.length);

    for (let index = 0; index < normalizedRoutes.length; index += 1) {
      await flightResultsPage.waitForPricingOptionsTabRouteText(index, normalizedRoutes[index]);
      await flightResultsPage.waitForSelectButtonInPricingOptionsModal();
      await flightResultsPage.clickSelectButtonInPricingOptionsModal();

      await flightResultsPage.waitForPricingOptionsTabGreenIcon(index);

      if (index < normalizedRoutes.length - 1) {
        await flightResultsPage.waitForPricingOptionsTabRouteText(index + 1, normalizedRoutes[index + 1]);
      }
    }

    return { verified: true, segmentRoutes: normalizedRoutes };
  },

  /**
   * Verifies the open pricing-options drawer shows exactly ONE leg tab per searched leg, with no
   * duplicated journey legs (ADO 71514).
   *
   * The app builds one tab per priced segment and then dedupes them on
   * `origin-destCode-leg-carrier` (flight.service.ts). A regression there re-renders the same leg
   * twice, so the check is deliberately strict on both counts:
   *   - every tab route headline is distinct
   *   - the tab count EQUALS the number of searched legs (not >=, which is what
   *     verifyMultiCitySegmentsVisibleInPricingOptions asserts and why that one cannot catch this)
   *
   * Read-only: it does not select a fare, so it can run before the wizard advances any tab.
   *
   * The tab route is matched on distinctness and count only, never against the searched city
   * codes: a tab shows the priced segment's AIRPORT ("HEL - LHR"), so a city-code search leg like
   * "HEL-LON" never equals its own tab and which airport a city resolves to varies per quote.
   *
   * Limitation that follows from that: legs are told apart by their route text alone, so a trip
   * that legitimately flies the SAME origin-destination pair twice (e.g. multi-city LON-PAR on two
   * dates) would read as a duplicate. Use this only for trips whose legs have distinct routes.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} expectedLegCount - Number of searched journey legs (one tab each)
   * @returns {Promise<{expectedLegCount: number, tabRoutes: string[]}>}
   */
  async verifyPricingOptionsLegTabsNotDuplicated(page, expectedLegCount) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!Number.isInteger(expectedLegCount) || expectedLegCount < 1) {
      throw new Error(`expectedLegCount must be an integer >= 1, got: ${expectedLegCount}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);

    // The tabs render one leg at a time as the pricing response resolves, so settle on the
    // expected count before asserting on it — otherwise a slow second leg reads as a miscount.
    await flightResultsPage.waitForPricingOptionsTabCount(expectedLegCount, 60000);

    const tabRoutes = await flightResultsPage.getPricingOptionsTabRouteTexts();
    const rendered = tabRoutes.length ? tabRoutes.join(' | ') : '(none)';

    // Diagnostics are the whole point of this failure (which leg came back twice, what the drawer
    // actually rendered), and expect()'s custom message is dropped in this repo — so throw.
    const duplicates = [...new Set(tabRoutes.filter((route, index) => tabRoutes.indexOf(route) !== index))];
    if (duplicates.length) {
      throw new Error(
        `Pricing options journey legs are duplicated: ${duplicates.join(', ')}. ` +
        `Expected ${expectedLegCount} distinct leg tab(s), got ${tabRoutes.length}: ${rendered}`
      );
    }

    if (tabRoutes.length !== expectedLegCount) {
      throw new Error(
        `Expected exactly ${expectedLegCount} pricing options leg tab(s), one per searched journey leg, ` +
        `got ${tabRoutes.length}: ${rendered}`
      );
    }

    return { expectedLegCount, tabRoutes };
  },

  /**
   * Shares the selected pricing option and closes the modal.
   * 
   * Flow:
   * - Click share quote button from pricing options
   * - Close the pricing options modal
   * - Wait for share action to complete
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{shared: boolean}>} Share status
   */
  async shareFromPricingOptions(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    
    // Share the quote
    await flightResultsPage.clickPricingOptionsShareQuoteButton();
    
    // Wait for share action to process
    await page.waitForTimeout(1000);
    
    // Close the pricing options drawer
    await flightResultsPage.clickXToClosePricingOptionsModal();
    
    // Wait for drawer close animation and for results to update
    await page.waitForTimeout(500);
    
    return { shared: true };
  },

  /**
   * Gets the fare rules note text from the fare rules drawer.
   * Returns the text for validation in step definitions.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<string>} The fare rules note text
   */
  async getFareRulesNoteText(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return await flightResultsPage.getFareRulesNote().textContent();
  },

  /**
   * Reads the active leg tab of the open fare rules drawer: its fare basis headline and
   * the rules text below it. Used to compare a leg's fare rules across the results page,
   * the pricing page and the cart.
   *
   * The rules text is taken as everything after the fare basis headline, because what sits
   * above it (leg tabs, carrier, the strictest-terms note, the "Jump to..." picker) is drawer
   * chrome that differs between the results, pricing and cart drawers.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{fareBasis: string, body: string}>} Fare basis headline and rules text
   */
  async getFareRulesContent(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForFareRulesMainHeadline();

    const fareBasis = await flightResultsPage.getFareRulesMainHeadlineText();
    const drawerText = await flightResultsPage.getFareRulesDrawerText();
    const body = drawerText.split(fareBasis).pop().replace(/\s+/g, ' ').trim();

    return { fareBasis, body };
  },

  /**
   * Opens the fare rules drawer and waits for the note to render.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Zero-based index of the fare rules button (default: 0)
   * @returns {Promise<void>}
   */
  async clickToOpenFareRules(page, index = 0) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    // Open the fare rules drawer and wait for its content to be visible.
    await flightResultsPage.waitForFareRulesButton(index);
    await flightResultsPage.clickFareRulesButton(index);
    await flightResultsPage.waitForFareRulesNote();
  },

  async clickToOpenFlightDetails(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForFlightDetailsButton();
    await flightResultsPage.clickFlightDetailsButton();
    await flightResultsPage.waitForFlightDetailsHeadline();
  },

  /**
   * Opens the seat preview drawer from flight results and waits for it to load.
   * Accepts either a rendered seat map or the unavailable-state panel.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Zero-based index of the Seats button (default: 0)
   * @returns {Promise<{opened: boolean, state: 'map' | 'unavailable'}>}
   */
  async openSeatMapFromResults(page, index = 0) {
    if (!page) {
      throw new Error('page is required');
    }

    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForSeatsButton(index);
    await flightResultsPage.clickSeatsButton(index);
    const state = await flightResultsPage.waitForSeatMapOrUnavailableState();
    return { opened: true, state };
  },

  /**
   * Verifies the results seat drawer rendered an actual seat map, not the
   * "Seating map is not available at the moment" empty state.
   *
   * ADO 80198: a by-schedule round trip runs one search per leg and each leg gets its own
   * search cache key. The return-leg seat map request was sent with the outbound leg's key,
   * so the lookup missed and the drawer fell back to the empty state. Opening the drawer is
   * not enough to catch that — both outcomes open a drawer — so the state must be asserted.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{displayed: boolean}>}
   */
  async verifySeatMapDisplayedInResults(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const state = await flightResultsPage.waitForSeatMapOrUnavailableState();
    const unavailable = await flightResultsPage.isSeatMapUnavailableStateVisible();
    const displayed = await flightResultsPage.isSeatMapDisplayed();

    logger.info('Results seat drawer state resolved', { state, displayed, unavailable });

    expect(
      unavailable,
      'Results seat drawer shows the "Seating map is not available at the moment" empty state',
    ).toBe(false);
    expect(displayed, 'Results seat drawer did not render a seat map').toBe(true);

    return { displayed: true };
  },

  /**
   * Closes the results seat preview drawer.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{closed: boolean}>}
   */
  async closeSeatMapDrawerInResults(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.closeSeatMapDrawer();

    return { closed: true };
  },

  /**
   * Verifies the preview-only message in the results seat drawer.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<string>}
   */
  async verifySeatPreviewOnlyMessage(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const expectedMessage = 'Preview only. Seat selection available at checkout.';
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actualMessage = await flightResultsPage.getSeatPreviewOnlyMessage();

    expect(actualMessage).toBe(expectedMessage);
    return actualMessage;
  },

async clickToOpenFareRulesFromResultsModal(page) {
  if (!page) {
    throw new Error('page is required');
  }
  const flightResultsPage = getPageObject(page, FlightResultsPage);

  // Try flight details drawer first, then pricing options overlay
  const flightDetailsDrawer = page.locator("[aria-label='Flight details' i]");
  const isFlightDetailsOpen = await flightDetailsDrawer.isVisible().catch(() => false);

  if (isFlightDetailsOpen) {
    await flightResultsPage.waitAndClickFareRulesButtonInFlightDetails();
  } else {
    await flightResultsPage.waitAndClickFareRulesButtonInPricingOptions(0);
  }
  await flightResultsPage.waitForFareRulesNote();
},

  /**
   * Clicks a leg tab inside the already-open fare rules drawer.
   * Tabs are displayed at the top of the drawer (e.g. BRU-FRA, FRA-DFW, DFW-BRU).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Zero-based index of the leg tab
   * @returns {Promise<void>}
   */
  async clickFareRulesLegTab(page, index) {
    if (!page) {
      throw new Error('page is required');
    }
    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got: ${index}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForFareRulesLegTab(index);
    await flightResultsPage.clickFareRulesLegTab(index);
    await flightResultsPage.waitForFareRulesNote();
  },

  /**
   * Verifies the open fare rules drawer shows exactly the expected leg tabs, in order.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string[]} expectedLabels - Tab routes in journey order (e.g. ["LIS - BOS", "BOS - LIS"])
   * @returns {Promise<{expectedLabels: string[], actualLabels: string[]}>}
   */
  async verifyFareRulesLegTabs(page, expectedLabels) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!Array.isArray(expectedLabels) || expectedLabels.length === 0) {
      throw new Error(`expectedLabels must be a non-empty array, got: ${JSON.stringify(expectedLabels)}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);

    // The tabs are built from the same response as the rules body, so wait for the body first;
    // reading the tabs earlier can catch a drawer that has not filled in all its legs yet.
    await flightResultsPage.waitForFareRulesNote();
    const actualLabels = await flightResultsPage.getFareRulesLegTabLabels();

    const normalize = (label) => label.replace(/\s*-\s*/g, ' - ').trim().toUpperCase();
    const matches =
      actualLabels.length === expectedLabels.length &&
      actualLabels.every((label, index) => normalize(label) === normalize(expectedLabels[index]));

    if (!matches) {
      throw new Error(
        `[FlightResults.verifyFareRulesLegTabs] Fare rules drawer leg tabs do not match. ` +
        `Expected ${expectedLabels.length} tab(s): ${expectedLabels.join(' | ')}; ` +
        `got ${actualLabels.length}: ${actualLabels.join(' | ') || '(none)'}`
      );
    }

    return { expectedLabels, actualLabels };
  },

/**
 * Checks if the green circle icon is displayed in the pricing options modal.
 * Returns visibility status for validation in step definitions.
 * This icon indicates a successful selection of a pricing option.
 *
 * @param {import('playwright').Page} page - Playwright page instance
 * @param {number} index - Zero-based index of the icon (default: 0)
 * @returns {Promise<boolean>} True if icon is visible
 */
async isGreenCircleIconVisibleInPricingOptions(page, index = 0) {
  if (!page) {
    throw new Error('page is required');
  }
  
  if (typeof index !== 'number' || index < 0) {
    throw new Error(`index must be >= 0, got ${index}`);
  }
  
  const flightResultsPage = getPageObject(page, FlightResultsPage);
  
  // Wait for the green icon to appear
  await flightResultsPage.waitForGreenIconPricingOptionsModal(index);
  
  // Return visibility status
  return await flightResultsPage.getGreenIconInPricingOptions(index).isVisible();
},

async verifyFareComponentTextColorInPricingOptions(page, expectedColor, index = 0) {
  if (!page) {
    throw new Error('page is required');
  }

  if (!expectedColor || typeof expectedColor !== 'string') {
    throw new Error(`expectedColor must be a non-empty string, got: ${typeof expectedColor}`);
  }

  if (typeof index !== 'number' || index < 0) {
    throw new Error(`index must be >= 0, got ${index}`);
  }

  const flightResultsPage = getPageObject(page, FlightResultsPage);
  const actualColor = await flightResultsPage.getFareComponentTextColorInPricingOptions(index);

  expect(actualColor).toBe(expectedColor);
},

 async selectFareWithBaggage(page, baggageText) {
  if (!page) {
    throw new Error('page is required');
  }
  
  const resultsPage = getPageObject(page, FlightResultsPage);
  await resultsPage.clickSelectForFareWithBaggagePricingOptions(baggageText);
},

  /**
   * Scans results until one offers a fare with the given baggage allowance, then selects that fare
   * on every leg tab of its modal. A result can open with no fare cards at all, so the fare cannot
   * be pinned to the first result.
   *
   * @param {import('playwright').Page} page
   * @param {string} baggageText - Baggage label substring (e.g. "0PC")
   * @param {object} [options]
   * @param {number} [options.maxResults=6] - How many results to scan before giving up.
   * @returns {Promise<{ resultIndex: number, legCount: number, attempts: Array }>}
   */
  async selectFareWithBaggageAcrossResults(page, baggageText, { maxResults = 6 } = {}) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!baggageText || typeof baggageText !== 'string') {
      throw new Error(`baggageText must be a non-empty string, got: ${typeof baggageText}`);
    }
    if (!Number.isInteger(maxResults) || maxResults < 1) {
      throw new Error(`maxResults must be an integer >= 1, got: ${maxResults}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);

    // A pricing-options button only exists on a rendered result, so this covers both
    await flightResultsPage.waitForPricingOptionsButton(0);

    const buttonCount = await flightResultsPage.getPricingOptionsButtonCount();
    const limit = Math.min(maxResults, buttonCount);
    if (limit === 0) {
      throw new Error('No "Pricing Options" buttons found in the flight results');
    }

    const attempts = [];
    for (let i = 0; i < limit; i += 1) {
      await flightResultsPage.clickPricingOptionsButton(i);

      const hasFare = await flightResultsPage.hasFareWithBaggageInPricingOptions(baggageText);
      attempts.push({ index: i, hasFare });
      logger.info('Scanned result for a fare with the requested baggage', { index: i, baggageText, hasFare });

      if (hasFare) {
        // A single-leg product renders no tab strip, so treat 0 tabs as one leg to select.
        let legCount = Math.max(await flightResultsPage.getPricingOptionsTabCount(), 1);
        for (let leg = 0; leg < legCount; leg += 1) {
          await flightResultsPage.clickSelectForFareWithBaggagePricingOptions(baggageText);
          await flightResultsPage.waitForPricingOptionsLegSelected(leg);
          // The strip is certainly rendered once a leg is confirmed, so the count read before the
          // first selection cannot be trusted to have seen every tab.
          if (leg === 0) {
            legCount = Math.max(await flightResultsPage.getPricingOptionsTabCount(), legCount);
          }
        }
        logger.info('Selected the fare with the requested baggage on every leg', { resultIndex: i, baggageText, legCount });
        return { resultIndex: i, legCount, attempts };
      }

      await flightResultsPage.clickXToClosePricingOptionsModal();
      await flightResultsPage.waitForPricingOptionsOverlayHidden().catch(() => {});
    }

    throw new Error(
      `No result among the first ${limit} offers a fare with baggage "${baggageText}". ` +
      `Scanned: ${JSON.stringify(attempts)}`,
    );
  },

  /**
   * Scrolls to the Flight Duration filter title.
   * Useful for ensuring the filter is in view before interacting with it.
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async scrollToFlightDurationTitle(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.getFlightDurationTitle().scrollIntoViewIfNeeded();
  },

  /**
   * Scrolls to the Flight Duration filter title for a specific location.
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} location - The location text (e.g., "Depart from London", "Depart from Madrid")
   * @returns {Promise<void>}
   */
  async scrollToFlightDurationFromLocationTitle(page, location) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!location || typeof location !== 'string') {
      throw new Error('location must be a non-empty string');
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.getFlightDurationFromLocationTitle(location).scrollIntoViewIfNeeded();
  },

  /**
   * Asserts that the Flight Duration filter title is visible.
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async assertFlightDurationTitleVisible(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await expect(flightResultsPage.getFlightDurationTitle()).toBeVisible();
  },

  /**
   * Asserts that the Flight Duration filter title for a specific location is visible.
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} location - The location text (e.g., "Depart from London", "Depart from Madrid")
   * @returns {Promise<void>}
   */
  async assertFlightDurationFromLocationVisible(page, location) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!location || typeof location !== 'string') {
      throw new Error('location must be a non-empty string');
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await expect(
      flightResultsPage.getFlightDurationFromLocationTitle(location)
    ).toBeVisible();
  },

  /**
   * Adjusts the Limit Layover Duration filter by moving its lower bound to the midpoint.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{adjusted: boolean, originalRangeText: string, targetStartMinutes: number}>}
   */
  async adjustLimitLayoverDurationFilterFromMidpoint(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const result = await flightResultsPage.adjustLimitLayoverDurationFilterFromMidpoint();

    await flightResultsPage.waitForFlightResults();

    return result;
  },

  /**
   * Verifies whether the "Limit Layover Duration" link under the Stops filter is rendered.
   * flight-filter.vue drops it (v-if) only when "No stops" is the sole ticked stops option.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {boolean} shouldBeDisplayed - true when the link must be rendered, false when it must be absent
   * @returns {Promise<{displayed: boolean}>}
   */
  async verifyLimitLayoverDurationFilterDisplayed(page, shouldBeDisplayed) {
    if (!page) throw new Error('[FlightResults.verifyLimitLayoverDurationFilterDisplayed] "page" is required, got: ' + typeof page);
    if (typeof shouldBeDisplayed !== 'boolean') {
      throw new Error(
        `[FlightResults.verifyLimitLayoverDurationFilterDisplayed] "shouldBeDisplayed" must be a boolean, got: ${typeof shouldBeDisplayed}`
      );
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    // Anchor on the Stops filter first, so an absent link means the app hid it, not that the panel never loaded.
    await flightResultsPage.waitForStopsFilter();
    const link = flightResultsPage.getLimitLayoverDurationFilterContainer();

    try {
      if (shouldBeDisplayed) {
        await expect(link).toBeVisible({ timeout: 10000 });
      } else {
        await expect(link).toHaveCount(0, { timeout: 10000 });
      }
    } catch (err) {
      throw new Error(
        `[FlightResults.verifyLimitLayoverDurationFilterDisplayed] The "Limit Layover Duration" link under the Stops ` +
        `filter was expected to be ${shouldBeDisplayed ? 'displayed' : 'hidden'} but was not. It is hidden only when ` +
        `"No stops" is the sole ticked stops option. Original: ${err.message}`
      );
    }

    logger.info('Limit Layover Duration link visibility verified', { displayed: shouldBeDisplayed });
    return { displayed: shouldBeDisplayed };
  },

  /**
   * Reads the layover time of every leg with a stop on every rendered result card. A 1-stop leg's
   * time comes from the card; a card only names its stops when a leg has two or more, so those
   * legs are read from the Flight Details drawer and their stop times summed — the total the
   * layover filter judges.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {{includeMultiStop?: boolean}} [options] - false skips the drawer reads for multi-stop legs
   * @returns {Promise<Array<{card: number, leg: number, stops: number, text: string, minutes: number|null, stopMinutes: number[]}>>}
   *   one entry per leg that has a stop; minutes is null for a multi-stop leg when includeMultiStop is false
   */
  async getLayoverMinutesPerResult(page, { includeMultiStop = true } = {}) {
    if (!page) throw new Error('[FlightResults.getLayoverMinutesPerResult] "page" is required, got: ' + typeof page);

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const cards = await flightResultsPage.getStopTimesPerResult();
    const layovers = [];

    for (let cardIndex = 0; cardIndex < cards.length; cardIndex++) {
      const legs = cards[cardIndex];
      let drawerLegs = null;

      if (includeMultiStop && legs.some((leg) => leg.stops > 1)) {
        logger.debug('Reading multi-stop layovers from the flight details drawer', { card: cardIndex + 1 });
        await flightResultsPage.clickFlightDetailsButtonOnResult(cardIndex);
        drawerLegs = await flightResultsPage.getFlightDetailsConnectionDurationsPerLeg();
        await flightResultsPage.closeFlightDetailsDrawer();
      }

      legs.forEach((leg, legIndex) => {
        if (!leg.stops) return;

        const entry = { card: cardIndex + 1, leg: legIndex + 1, stops: leg.stops, text: leg.text, minutes: null, stopMinutes: [] };

        if (leg.stops === 1) {
          entry.minutes = leg.stopMinutes;
          entry.stopMinutes = [leg.stopMinutes];
        } else if (drawerLegs) {
          const durations = drawerLegs[legIndex] ?? [];
          if (durations.length !== leg.stops) {
            throw new Error(
              `[FlightResults.getLayoverMinutesPerResult] Result card ${cardIndex + 1}, leg ${legIndex + 1} shows ` +
              `"${leg.text}" but its flight details drawer lists ${durations.length} connection(s), so the stop ` +
              'times cannot be summed for the same leg.'
            );
          }
          entry.stopMinutes = durations.map((duration) => layoverTextToMinutes(duration, cardIndex, legIndex));
          entry.minutes = entry.stopMinutes.reduce((total, minutes) => total + minutes, 0);
        }

        layovers.push(entry);
      });
    }

    return layovers;
  },

  /**
   * Verifies every layover on the rendered result cards falls inside the Limit Layover Duration
   * range label. flight.service.ts filterByLayoverDuration keeps a result only when each of its
   * layovers is inside the range, so one outside it means the filter let it through.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{range: string, checked: number, multiStop: number}>}
   */
  async verifyResultsWithinLimitLayoverDurationRange(page) {
    if (!page) throw new Error('[FlightResults.verifyResultsWithinLimitLayoverDurationRange] "page" is required, got: ' + typeof page);

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const range = await flightResultsPage.getLimitLayoverDurationFilterSummary();

    // A stops or carrier filter click re-renders the list without a signal, so the cheap card-only
    // read is retried until it agrees with the range before the drawer reads start.
    await waitForCardLayoversInRange(this, page, range, 'verifyResultsWithinLimitLayoverDurationRange');

    const layovers = await this.getLayoverMinutesPerResult(page);
    assertLayoversInRange(layovers, range, 'verifyResultsWithinLimitLayoverDurationRange');

    const multiStop = layovers.filter((layover) => layover.stops > 1).length;
    logger.info('Every rendered layover is inside the Limit Layover Duration range', {
      range: range.rangeText,
      checked: layovers.length,
      multiStop,
    });
    return { range: range.rangeText, checked: layovers.length, multiStop };
  },

  /**
   * Verifies the Limit Layover Duration range is judged against the total of both stops on a
   * 2-stop leg (#72380): every rendered 2-stop leg's summed stop time, read from the Flight Details
   * drawer, has to sit inside the range.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{range: string, twoStopLegs: number, longestTotal: number}>}
   */
  async verifyLimitLayoverDurationRangeCoversTwoStopTotals(page) {
    if (!page) throw new Error('[FlightResults.verifyLimitLayoverDurationRangeCoversTwoStopTotals] "page" is required, got: ' + typeof page);

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const range = await flightResultsPage.getLimitLayoverDurationFilterSummary();
    await waitForCardLayoversInRange(this, page, range, 'verifyLimitLayoverDurationRangeCoversTwoStopTotals', { requireMultiStop: true });

    const twoStopLegs = (await this.getLayoverMinutesPerResult(page)).filter((layover) => layover.stops > 1);
    if (!twoStopLegs.length) {
      throw new Error(
        '[FlightResults.verifyLimitLayoverDurationRangeCoversTwoStopTotals] No rendered result has a leg with two or more ' +
        `stops, so there is no 2-stop total to judge against the range "${range.rangeText}".`
      );
    }

    assertLayoversInRange(twoStopLegs, range, 'verifyLimitLayoverDurationRangeCoversTwoStopTotals');

    const longestTotal = Math.max(...twoStopLegs.map((layover) => layover.minutes));
    logger.info('Limit Layover Duration range covers the 2-stop totals', {
      range: range.rangeText,
      twoStopLegs: twoStopLegs.length,
      longestTotal,
    });
    return { range: range.rangeText, twoStopLegs: twoStopLegs.length, longestTotal };
  },

  /**
   * Verifies every rendered result is from the carrier picked in the airline filter. "Multi carrier"
   * keeps only results flown by more than one airline, which a card names "Multiple Carriers".
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} filterOption - The airline filter option that was ticked, e.g. "Multi carrier"
   * @returns {Promise<{expectedCarrier: string}>}
   */
  async verifyAllResultsFromSelectedCarrier(page, filterOption) {
    if (!page) throw new Error('[FlightResults.verifyAllResultsFromSelectedCarrier] "page" is required, got: ' + typeof page);
    if (!filterOption || typeof filterOption !== 'string') {
      throw new Error(
        `[FlightResults.verifyAllResultsFromSelectedCarrier] "filterOption" must be a non-empty string — tick an airline ` +
        `filter option first, got: ${typeof filterOption} (${filterOption})`
      );
    }

    const expectedCarrier = CARRIER_FILTER_CARD_NAMES[filterOption.trim()] || filterOption.trim();
    let lastError;

    try {
      // The airline filter click re-renders the list without a signal, so the read is retried.
      await expect(async () => {
        try {
          await this.verifyAllResultsFromAirline(page, expectedCarrier);
        } catch (err) {
          lastError = err;
          throw err;
        }
      }).toPass({ timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[FlightResults.verifyAllResultsFromSelectedCarrier] Not every rendered result is from "${expectedCarrier}" ` +
        `after ticking the "${filterOption}" airline filter. Original: ${(lastError || err).message}`
      );
    }

    logger.info('Every rendered result is from the selected carrier', { filterOption, expectedCarrier });
    return { expectedCarrier };
  },

  /**
   * Extracts the arrival date text from a flight result card.
   * @param {Object} page - Playwright page
   * @param {number} cardIndex - Zero-based index (default: 0)
   * @returns {Promise<string>} Date text like "Thu, 11 Dec"
   */
  async extractFlightArrivalDate(page, cardIndex = 0) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return flightResultsPage.getFlightArrivalDate(cardIndex);
  },

  /**
   * Extracts the departure date text from a flight result card.
   * @param {Object} page - Playwright page
   * @param {number} cardIndex - Zero-based index (default: 0)
   * @returns {Promise<string>} Date text like "Mon, 15 Dec"
   */
  async extractFlightDepartureDate(page, cardIndex = 0) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return flightResultsPage.getFlightDepartureDate(cardIndex);
  },

  /**
   * Extracts the departure location code from a flight result card segment.
   *
   * @param {Object} page - Playwright page
   * @param {number} cardIndex - Zero-based result card index (default: 0)
   * @param {number} segmentIndex - Zero-based segment index within the card (default: 0)
   * @returns {Promise<string>} Departure location code like "SEA"
   */
  async extractFlightDepartureLocationCode(page, cardIndex = 0, segmentIndex = 0) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return flightResultsPage.getFlightDepartureLocationCode(cardIndex, segmentIndex);
  },

  /**
   * Extracts the inbound (return) departure date from a round-trip flight result card.
   * @param {Object} page - Playwright page
   * @param {number} cardIndex - Zero-based index (default: 0)
   * @returns {Promise<string>} Date text like "Mon, 15 Dec"
   */
  async extractInboundFlightDepartureDate(page, cardIndex = 0) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return flightResultsPage.getInboundFlightDepartureDate(cardIndex);
  },

  /**
   * Verifies the first round-trip result reflects the edited departure and return dates.
   *
   * @param {Object} page - Playwright page instance
   * @param {string} expectedDepartureDate - Edited departure date value from the search form
   * @param {string} expectedReturnDate - Edited return date value from the search form
   */
  async verifyResultsReflectEditedDates(page, expectedDepartureDate, expectedReturnDate) {
    if (!page) throw new Error('page is required');
    if (!expectedDepartureDate || typeof expectedDepartureDate !== 'string') {
      throw new Error('expectedDepartureDate must be a non-empty string');
    }
    if (!expectedReturnDate || typeof expectedReturnDate !== 'string') {
      throw new Error('expectedReturnDate must be a non-empty string');
    }

    const expectedDepartureDay = extractDayToken(expectedDepartureDate);
    const expectedReturnDay = extractDayToken(expectedReturnDate);
    const actualDepartureDate = await this.extractFlightDepartureDate(page, 0);
    const actualReturnDate = await this.extractInboundFlightDepartureDate(page, 0);

    expect(actualDepartureDate).toContain(expectedDepartureDay);
    expect(actualReturnDate).toContain(expectedReturnDay);

    return {
      actualDepartureDate,
      actualReturnDate,
      expectedDepartureDay,
      expectedReturnDay,
    };
  },

  /**
   * Verifies the first result reflects the edited departure location.
   *
   * @param {Object} page - Playwright page instance
   * @param {string} expectedDepartureLocation - Updated departure location code
   */
  async verifyResultsReflectUpdatedDepartureLocation(page, expectedDepartureLocation) {
    if (!page) throw new Error('page is required');
    if (!expectedDepartureLocation || typeof expectedDepartureLocation !== 'string') {
      throw new Error('expectedDepartureLocation must be a non-empty string');
    }

    const actualDepartureLocation = await this.extractFlightDepartureLocationCode(page, 0, 0);
    expect(actualDepartureLocation.toUpperCase()).toBe(expectedDepartureLocation.trim().toUpperCase());

    return {
      actualDepartureLocation,
      expectedDepartureLocation: expectedDepartureLocation.trim().toUpperCase(),
    };
  },

  // ===== CODESHARE / OPERATED BY =====

  /**
   * Verifies "Operated by" text is visible in the first flight result.
   * @param {import('playwright').Page} page
   */
  async verifyOperatedByInResults(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const isVisible = await flightResultsPage.isFlightOperatorVisibleInResults();
    expect(isVisible).toBe(true);
  },

  /**
   * Verifies "Operated by" text is visible in the flight details drawer.
   * @param {import('playwright').Page} page
   */
  async verifyOperatedByInFlightDetails(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const isVisible = await flightResultsPage.isFlightOperatorVisibleInDrawer();
    expect(isVisible).toBe(true);
  },

  // ===== FLIGHT DETAILS DRAWER (redesigned in US 84214) =====

  /**
   * Opens the flight details of the leg being priced, from inside the pricing options drawer.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{opened: true}>}
   */
  async openFlightDetailsFromPricingOptions(page) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.clickFlightDetailsToggleInPricingOptions();
    await flightResultsPage.waitForRedesignedFlightDetails();
    return { opened: true };
  },

  /**
   * Closes the flight details inside the pricing options drawer, returning to the fare list.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{closed: true}>}
   */
  async closeFlightDetailsInPricingOptions(page) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.clickFlightDetailsToggleInPricingOptions();
    await flightResultsPage.waitForRedesignedFlightDetailsToClose();
    return { closed: true };
  },

  /**
   * Reads what the open flight details drawer shows, so a later screen can be held to it.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{title: string, legs: object[]}>}
   */
  async captureFlightDetails(page) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const title = await flightResultsPage.getRedesignedFlightDetailsTitle();
    const legs = await flightResultsPage.getRedesignedFlightDetailsLegs();

    if (!legs.length) {
      throw new Error('The flight details drawer is open but shows no legs, so there is nothing to capture.');
    }

    return { title, legs };
  },

  /**
   * Verifies the open flight details drawer is laid out as US 84214 specifies: every leg titled,
   * routed and dated, and every flight in it carrying its carrier, flight number, aircraft,
   * departure and arrival times, duration and fare attributes.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {object} options
   * @param {number} [options.expectedLegs] - Legs the screen must show, when the caller knows it
   * @returns {Promise<{legs: number, segments: number}>}
   */
  async verifyFlightDetailsLayout(page, { expectedLegs } = {}) {
    if (!page) throw new Error('page is required');
    if (expectedLegs !== undefined && (typeof expectedLegs !== 'number' || expectedLegs < 1)) {
      throw new Error(`expectedLegs must be a number >= 1, got: ${expectedLegs}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const legs = await flightResultsPage.getRedesignedFlightDetailsLegs();

    if (expectedLegs !== undefined && legs.length !== expectedLegs) {
      throw new Error(
        `The flight details drawer shows ${legs.length} leg(s), expected ${expectedLegs}: ` +
        `${legs.map((leg) => leg.route || '(no route)').join(', ')}`
      );
    }

    let segmentCount = 0;

    legs.forEach((leg, legIndex) => {
      const where = `Leg ${legIndex + 1} of ${legs.length}`;

      if (!leg.title) throw new Error(`${where} has no title (e.g. "Flight to Madrid").`);
      if (!/^[A-Z]{3}( - [A-Z]{3})+$/.test(leg.route)) {
        throw new Error(`${where} shows "${leg.route}" as its route; expected airport codes such as "LHR - MAD".`);
      }
      if (!leg.date) throw new Error(`${where} (${leg.route}) shows no date.`);
      if (!leg.segments.length) throw new Error(`${where} (${leg.route}) shows no flight.`);

      leg.segments.forEach((segment, segmentIndex) => {
        const flight = `${where}, flight ${segmentIndex + 1} of ${leg.segments.length}`;

        if (!segment.carrier) throw new Error(`${flight} shows no carrier name.`);
        if (!/^[A-Z0-9]{2}\s?\d{1,4}[A-Z]?$/.test(segment.flightNumber)) {
          throw new Error(`${flight} shows "${segment.flightNumber}" as its flight number.`);
        }
        if (!segment.aircraft) throw new Error(`${flight} (${segment.flightNumber}) shows no aircraft.`);
        [['departure', segment.departure], ['arrival', segment.arrival]].forEach(([label, value]) => {
          if (!/^\d{1,2}:\d{2}$/.test(value)) {
            throw new Error(`${flight} (${segment.flightNumber}) shows "${value}" as its ${label} time.`);
          }
        });
        if (!/\d+\s*h/.test(segment.duration)) {
          throw new Error(`${flight} (${segment.flightNumber}) shows "${segment.duration}" as its duration.`);
        }
        if (!/\b(Economy|Business|First|Premium)\b/i.test(segment.amenities.join(' '))) {
          throw new Error(
            `${flight} (${segment.flightNumber}) lists no cabin class among its fare attributes: ` +
            `${segment.amenities.join(' | ') || '(none)'}`
          );
        }

        segmentCount += 1;
      });
    });

    logger.info('Flight details drawer layout verified', { legs: legs.length, segments: segmentCount });
    return { legs: legs.length, segments: segmentCount };
  },

  /**
   * Verifies the open flight details drawer shows the same flights as an earlier capture.
   *
   * Matched by route rather than by position, because pricing options shows only the leg being
   * priced while results and the cart show them all.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {{legs: object[]}} captured - What captureFlightDetails() returned earlier
   * @returns {Promise<{legsCompared: number}>}
   */
  async verifyFlightDetailsMatchCapture(page, captured) {
    if (!page) throw new Error('page is required');
    if (!captured || !Array.isArray(captured.legs) || !captured.legs.length) {
      throw new Error('captured must be the result of captureFlightDetails(), holding at least one leg');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const legs = await flightResultsPage.getRedesignedFlightDetailsLegs();

    if (!legs.length) throw new Error('The flight details drawer shows no legs to compare.');

    const describe = (segment) => `${segment.flightNumber} ${segment.departure}-${segment.arrival}`;

    legs.forEach((leg) => {
      const reference = captured.legs.find((candidate) => candidate.route === leg.route);

      if (!reference) {
        throw new Error(
          `The flight details drawer shows leg "${leg.route}", which was not among the legs first ` +
          `shown: ${captured.legs.map((candidate) => candidate.route).join(', ')}`
        );
      }

      if (!leg.segments.length) {
        throw new Error(`Leg "${leg.route}" shows no flights, so there is nothing to compare.`);
      }

      const shown = leg.segments.map(describe).join(', ');
      const expected = reference.segments.map(describe).join(', ');

      if (shown !== expected) {
        throw new Error(
          `Leg "${leg.route}" is no longer the same flights: the drawer now shows [${shown}] where ` +
          `it first showed [${expected}].`
        );
      }
    });

    logger.info('Flight details drawer matches the captured itinerary', { legsCompared: legs.length });
    return { legsCompared: legs.length };
  },

  /**
   * Verifies the drawer holding the flight details is titled as expected — the title is what
   * #84772 found differing between results and the cart.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedTitle - Title the panel must carry
   * @returns {Promise<{title: string}>}
   */
  async verifyFlightDetailsTitle(page, expectedTitle) {
    if (!page) throw new Error('page is required');
    if (typeof expectedTitle !== 'string' || !expectedTitle.trim()) {
      throw new Error(`expectedTitle must be a non-empty string, got: ${typeof expectedTitle}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const title = await flightResultsPage.getRedesignedFlightDetailsTitle();

    // Exact, case included: the title is the whole point of #84772, so a copy change should be
    // seen rather than tolerated.
    if (title !== expectedTitle.trim()) {
      throw new Error(`The flight details panel is titled "${title}", expected "${expectedTitle}".`);
    }

    return { title };
  },

  /**
   * Opens the flight details of the first result whose itinerary has a long layover, so the badge
   * #84773 was raised against is on screen. Not every itinerary on a route has one.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {object} options
   * @param {number} [options.maxResults] - Results to look through before giving up (default: 8)
   * @returns {Promise<{resultIndex: number, layover: string}>}
   */
  async openFlightDetailsForResultWithLongLayover(page, { maxResults = 8 } = {}) {
    if (!page) throw new Error('page is required');
    if (typeof maxResults !== 'number' || maxResults < 1) {
      throw new Error(`maxResults must be a number >= 1, got: ${maxResults}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForFlightDetailsButton();
    const available = Math.min(maxResults, await flightResultsPage.getFlightDetailsButtonCount());

    for (let index = 0; index < available; index += 1) {
      await flightResultsPage.clickFlightDetailsButton(index);
      await flightResultsPage.waitForRedesignedFlightDetails();

      const legs = await flightResultsPage.getRedesignedFlightDetailsLegs();
      const badged = legs.flatMap((leg) => leg.connections).find((connection) => connection.longLayover);

      if (badged) {
        logger.info('Opened a result with a long layover', { resultIndex: index + 1, layover: badged.duration });
        return { resultIndex: index + 1, layover: badged.duration };
      }

      await flightResultsPage.closeOpenFlightDetailsDrawer();
    }

    throw new Error(
      `None of the first ${available} results has a connection flagged as a long layover, so the ` +
      'badge this check exists for is not on screen. Pick a route whose itineraries wait longer.'
    );
  },

  /**
   * Verifies the long layover badge sits on the connection it describes: it is read from inside a
   * connection row, and the flagged connection has to be the longest wait on screen.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{flagged: number, layover: string}>}
   */
  async verifyLongLayoverFlaggedOnItsConnection(page) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const connections = (await flightResultsPage.getRedesignedFlightDetailsLegs())
      .flatMap((leg) => leg.connections);

    const toMinutes = (duration) => {
      const hours = Number((duration.match(/(\d+)\s*h/i) || [])[1] || 0);
      const minutes = Number((duration.match(/(\d+)\s*m/i) || [])[1] || 0);
      return hours * 60 + minutes;
    };

    const flagged = connections.filter((connection) => connection.longLayover);
    const plain = connections.filter((connection) => !connection.longLayover);

    if (!flagged.length) {
      throw new Error(
        'No connection on screen carries the long layover badge, so there is nothing to judge. ' +
        'Open an itinerary that waits long enough between flights.'
      );
    }

    flagged.forEach((connection) => {
      const shorter = plain.find((other) => toMinutes(other.duration) >= toMinutes(connection.duration));
      if (shorter) {
        throw new Error(
          `The connection waiting ${connection.duration} is badged "${connection.longLayover}" while ` +
          `one waiting ${shorter.duration} is not, so the badge is not on the connection it describes.`
        );
      }
    });

    logger.info('Long layover badge verified', { flagged: flagged.length, layover: flagged[0].duration });
    return { flagged: flagged.length, layover: flagged[0].duration };
  },

  /**
   * Verifies each stop within a leg is shown as a connection between the two flights it joins,
   * carrying its own layover duration — the row #84773 was raised against.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{connections: number}>}
   */
  async verifyFlightDetailsConnections(page) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const legs = await flightResultsPage.getRedesignedFlightDetailsLegs();
    const total = legs.reduce((count, leg) => count + leg.connections.length, 0);

    if (!total) {
      throw new Error(
        'No leg in this itinerary has a stop, so there is no connection on screen to judge. ' +
        'Pick a connecting itinerary.'
      );
    }

    legs.forEach((leg, legIndex) => {
      const where = `Leg ${legIndex + 1} (${leg.route})`;
      const expected = leg.segments.length - 1;

      if (leg.connections.length !== expected) {
        throw new Error(
          `${where} shows ${leg.segments.length} flight(s) but ${leg.connections.length} ` +
          `connection(s); a stop between each pair means ${expected} were expected.`
        );
      }

      leg.connections.forEach((connection, index) => {
        if (!connection.title) {
          throw new Error(`${where}, connection ${index + 1} has no heading.`);
        }
        if (!/\d+\s*(h|m)/.test(connection.duration)) {
          throw new Error(
            `${where}, connection ${index + 1} shows "${connection.duration}" as its layover.`
          );
        }
      });
    });

    logger.info('Flight details connections verified', { connections: total });
    return { connections: total };
  },

  /**
   * Verifies every flight that is operated by another airline names that airline before its
   * flight number, which is the ordering #84760 was raised for.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{operatedFlights: number}>}
   */
  async verifyOperatorShownBeforeFlightNumber(page) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const legs = await flightResultsPage.getRedesignedFlightDetailsLegs();
    const operated = legs.flatMap((leg) => leg.segments).filter((segment) => segment.operatedBy);

    if (!operated.length) {
      throw new Error(
        'No flight in this itinerary is marked as operated by another airline, so the ordering ' +
        'this check exists for is not on screen. Pick a codeshare itinerary.'
      );
    }

    operated.forEach((segment) => {
      const operatorAt = segment.carrierLine.indexOf(segment.operatedBy);
      const flightNumberAt = segment.carrierLine.indexOf(segment.flightNumber);

      if (operatorAt === -1 || flightNumberAt === -1) {
        throw new Error(
          `Could not locate "${segment.operatedBy}" and "${segment.flightNumber}" in the carrier ` +
          `line "${segment.carrierLine}".`
        );
      }
      if (operatorAt > flightNumberAt) {
        throw new Error(
          `"${segment.carrierLine}" puts the flight number before the operating airline; the ` +
          'operator has to come first.'
        );
      }
    });

    logger.info('Operating airline precedes the flight number', { operatedFlights: operated.length });
    return { operatedFlights: operated.length };
  },

  /**
   * Verifies the codeshare operator line of the INBOUND leg of one flight result card
   * contains the expected text, e.g. "Operated by MH".
   *
   * Inbound is leg index 1 of the card - on a multi-city search that is the second
   * requested leg, which is what the manual test means by "the inbound result".
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Operator line the leg must show, e.g. "Operated by MH"
   * @param {number} [resultNumber=1] - One-based flight result card number
   * @returns {Promise<{ actualText: string }>}
   */
  async verifyOperatorTextInInboundResult(page, expectedText, resultNumber = 1) {
    if (!page) throw new Error('[FlightResults.verifyOperatorTextInInboundResult] "page" is required.');
    if (typeof expectedText !== 'string' || !expectedText.trim()) {
      throw new Error(
        `[FlightResults.verifyOperatorTextInInboundResult] "expectedText" must be a non-empty string, got: ${typeof expectedText} (${expectedText})`
      );
    }
    if (!Number.isInteger(resultNumber) || resultNumber < 1) {
      throw new Error(
        `[FlightResults.verifyOperatorTextInInboundResult] "resultNumber" must be a positive integer, got: ${resultNumber}`
      );
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    logger.debug('Reading the inbound leg operator line of a flight result', { expectedText, resultNumber });

    const actualText = await flightResultsPage.getOperatorTextForResultLeg(resultNumber - 1, INBOUND_LEG_INDEX);

    // Thrown rather than asserted: the operator line actually rendered is the whole diagnostic,
    // and expect()'s second argument is discarded by this repo's @playwright/test.
    if (!actualText.includes(expectedText.trim())) {
      throw new Error(
        `[FlightResults.verifyOperatorTextInInboundResult] Expected the inbound leg of flight result ` +
        `${resultNumber} to show "${expectedText.trim()}", but it reads "${actualText}". The result order or the ` +
        `carrier operating that leg may have changed.`
      );
    }

    return { actualText };
  },

  // ===== BRANDED FARES =====

  /**
   * Opens branded fares from the flight details drawer and verifies ancillaries text.
   * Flight details drawer must already be open.
   * @param {import('playwright').Page} page
   */
  async openBrandedFaresAndVerifyAncillaries(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await flightResultsPage.clickBrandedFaresButtonInDetails();
    await flightResultsPage.waitForBrandedFaresDrawer();
  },

  /**
   * Closes the branded fares drawer.
   * @param {import('playwright').Page} page
   */
  async closeBrandedFaresDrawer(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.closeBrandedFaresDrawer();
  },

  /**
   * Verifies that the branded fare ancillaries text is visible.
   * @param {import('playwright').Page} page
   */
  async verifyAncillariesTextVisible(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const isVisible = await flightResultsPage.isAncillariesTextVisible();
    expect(isVisible).toBe(true);
  },

  /**
   * Opens branded fares from the pricing options drawer.
   * The pricing options drawer must already be open.
   * Clicks the brand name link in the first leg pricing option.
   * @param {import('playwright').Page} page
   */
  async openBrandedFaresFromPricingOptions(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await flightResultsPage.clickBrandNameInPricingOptions();
    await flightResultsPage.waitForBrandedFaresDrawer();
  },

  /**
   * Reads the active brand tab of the branded fares drawer together with what the last captured
   * Brand Info response files for that brand.
   * @private
   */
  async _readActiveBrandAgainstBrandInfo(page, world) {
    if (!page) throw new Error('[FlightResults._readActiveBrandAgainstBrandInfo] "page" is required, got: ' + typeof page);
    if (!world || typeof world !== 'object') {
      throw new Error('[FlightResults._readActiveBrandAgainstBrandInfo] "world" must be the Cucumber world, got: ' + typeof world);
    }

    const record = PayloadValidation.getLastCapturedPayloadBySource(world, 'response');
    if (!(record.requestType || '').startsWith(BRAND_INFO_REQUEST_TYPE)) {
      throw new Error(
        `[FlightResults._readActiveBrandAgainstBrandInfo] The last captured response is "${record.requestType}", ` +
        `not a "${BRAND_INFO_REQUEST_TYPE}" call. Capture the Brand Info response right before this check.`
      );
    }
    const brands = collectBrandInfoBrands(PayloadValidation.parseCapturedPayloadJson(record));

    logger.debug('Reading the active brand of the branded fares drawer');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const sections = await flightResultsPage.getActiveBrandedFareSections();

    const wanted = normalizeBrandName(sections.brandName);
    const matched = brands.filter((b) => normalizeBrandName(b.name) === wanted);
    if (matched.length === 0) {
      throw new Error(
        `[FlightResults._readActiveBrandAgainstBrandInfo] The drawer shows brand "${sections.brandName}", but the ` +
        `captured Brand Info files no Brand of that name. Brand Info names: ${[...new Set(brands.map((b) => b.name))].join(', ') || '(none)'}. ` +
        `The capture may belong to a different offer than the one opened.`
      );
    }

    const expected = expectedAttributesForBrand(brands, sections.brandName);
    if (expected.size === 0) {
      throw new Error(
        `[FlightResults._readActiveBrandAgainstBrandInfo] Brand Info files ${matched.length} Brand(s) named ` +
        `"${sections.brandName}" with no attributes, so there is nothing to compare the drawer against.`
      );
    }

    logger.info('Comparing the active branded fare against Brand Info', {
      brandName: sections.brandName,
      brandInfoBrandsMatched: matched.length,
      attributesFiled: expected.size,
      lines: {
        included: sections.included.length,
        additionalCharge: sections.additionalCharge.length,
        notIncluded: sections.notIncluded.length,
      },
    });

    return { sections, expected };
  },

  /**
   * Verifies the active brand's main list and "not included" section show exactly the attributes
   * Brand Info files as included or not offered, with the filed inclusion.
   * @param {import('playwright').Page} page
   * @param {object} world - Cucumber world holding the captured Brand Info response
   * @returns {Promise<{brandName: string, attributesChecked: number}>}
   */
  async verifyBrandedFaresOfferedItemsMatchBrandInfo(page, world) {
    const { sections, expected } = await this._readActiveBrandAgainstBrandInfo(page, world);
    const mainLines = sections.included.map(parseBrandServiceLine);
    const notIncludedLines = sections.notIncluded.map(parseBrandServiceLine);
    const chargeKeys = new Set(sections.additionalCharge.map((line) => parseBrandServiceLine(line).key));
    const mismatches = [];
    let attributesChecked = 0;

    for (const [key, { classification, inclusions }] of expected) {
      const acceptable = [...inclusions].filter((inclusion) => inclusion !== CHARGEABLE);
      if (acceptable.length === 0) continue;
      attributesChecked += 1;

      const shownInMain = mainLines.some((l) => l.key === key && acceptable.includes(l.value));
      const shownNotOffered = acceptable.includes(NOT_OFFERED)
        && notIncludedLines.some((l) => l.key === key && l.value === NOT_OFFERED);
      // A leg filing it as chargeable makes the additional-charge placement a filed value too.
      const shownAsCharge = inclusions.has(CHARGEABLE) && chargeKeys.has(key);
      if (!shownInMain && !shownNotOffered && !shownAsCharge) {
        mismatches.push(`"${classification}" is filed as ${[...inclusions].join('/')} but the drawer does not show it with that value`);
      }
    }

    for (const { line, key, value } of [...mainLines, ...notIncludedLines]) {
      const filed = expected.get(key);
      if (!filed) {
        mismatches.push(`"${line}" is shown but Brand Info files no such attribute for this brand`);
      } else if (value !== null && !filed.inclusions.has(value)) {
        mismatches.push(`"${line}" is shown but Brand Info files "${filed.classification}" as ${[...filed.inclusions].join('/')}`);
      }
    }

    expect(
      mismatches,
      `[FlightResults.verifyBrandedFaresOfferedItemsMatchBrandInfo] Brand "${sections.brandName}": the branded fares ` +
      `drawer does not match the captured Brand Info:\n- ${mismatches.join('\n- ')}`
    ).toEqual([]);

    return { brandName: sections.brandName, attributesChecked };
  },

  /**
   * Verifies every attribute Brand Info files as chargeable for the active brand is listed under
   * "Ancillaries for additional charge" and nowhere else, and that section holds nothing else.
   * @param {import('playwright').Page} page
   * @param {object} world - Cucumber world holding the captured Brand Info response
   * @returns {Promise<{brandName: string, chargeableChecked: number}>}
   */
  async verifyBrandedFaresChargeableItemsOnlyUnderAdditionalCharge(page, world) {
    const { sections, expected } = await this._readActiveBrandAgainstBrandInfo(page, world);
    const chargeable = [...expected].filter(([, entry]) => entry.inclusions.has(CHARGEABLE));

    if (chargeable.length === 0) {
      throw new Error(
        `[FlightResults.verifyBrandedFaresChargeableItemsOnlyUnderAdditionalCharge] Brand Info files no chargeable ` +
        `attribute for brand "${sections.brandName}", so the additional-charge placement cannot be checked. ` +
        `Open a brand that has chargeable items.`
      );
    }

    const chargeLines = sections.additionalCharge.map(parseBrandServiceLine);
    const otherLines = [...sections.included, ...sections.notIncluded].map(parseBrandServiceLine);
    const mismatches = [];

    for (const [key, { classification, inclusions }] of chargeable) {
      const inCharge = chargeLines.some((l) => l.key === key);
      const elsewhere = otherLines.filter((l) => l.key === key).map((l) => l.line);
      // Legs disagreeing (chargeable on one, included on another) may legitimately render either way.
      if (inclusions.size > 1) {
        if (!inCharge && elsewhere.length === 0) {
          mismatches.push(`"${classification}" (filed as ${[...inclusions].join('/')}) is not shown anywhere`);
        }
        continue;
      }
      if (!inCharge) {
        mismatches.push(`"${classification}" is filed as chargeable but is not listed under additional charge`);
      }
      if (elsewhere.length > 0) {
        mismatches.push(`"${classification}" is filed as chargeable but is also listed as: ${elsewhere.join(' | ')}`);
      }
    }

    for (const { line, key } of chargeLines) {
      if (!expected.get(key)?.inclusions.has(CHARGEABLE)) {
        mismatches.push(`"${line}" is listed under additional charge but Brand Info does not file it as chargeable`);
      }
    }

    expect(
      mismatches,
      `[FlightResults.verifyBrandedFaresChargeableItemsOnlyUnderAdditionalCharge] Brand "${sections.brandName}": ` +
      `chargeable items are misplaced:\n- ${mismatches.join('\n- ')}`
    ).toEqual([]);

    return { brandName: sections.brandName, chargeableChecked: chargeable.length };
  },

  /**
   * Verifies no attribute appears more than once across the active brand's sections of the
   * branded fares drawer (included, additional charge and not included).
   * @param {import('playwright').Page} page
   * @returns {Promise<{brandName: string, linesChecked: number}>}
   */
  async verifyBrandedFaresAttributesListedOnce(page) {
    if (!page) throw new Error('[FlightResults.verifyBrandedFaresAttributesListedOnce] "page" is required, got: ' + typeof page);

    logger.debug('Reading the active brand of the branded fares drawer');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const sections = await flightResultsPage.getActiveBrandedFareSections();
    const lines = [...sections.included, ...sections.additionalCharge, ...sections.notIncluded];

    logger.info('Branded fares attribute lines read', { brandName: sections.brandName, lineCount: lines.length });
    if (lines.length === 0) {
      throw new Error(
        `[FlightResults.verifyBrandedFaresAttributesListedOnce] Brand "${sections.brandName}" shows no attribute ` +
        `lines, so duplicates cannot be ruled out. The drawer rendered the brand without any services.`
      );
    }

    const byKey = new Map();
    for (const line of lines) {
      const { key } = parseBrandServiceLine(line);
      byKey.set(key, [...(byKey.get(key) || []), line]);
    }
    const duplicates = [...byKey.values()].filter((group) => group.length > 1);

    expect(
      duplicates,
      `[FlightResults.verifyBrandedFaresAttributesListedOnce] Brand "${sections.brandName}" lists an attribute more ` +
      `than once:\n- ${duplicates.map((group) => group.join(' | ')).join('\n- ')}`
    ).toEqual([]);

    return { brandName: sections.brandName, linesChecked: lines.length };
  },

  /**
   * Verifies carrier name text in the more details drawer.
   * @param {import('playwright').Page} page
   * @param {string} expectedName - Expected carrier name (e.g., "Iberia")
   */
  async verifyCarrierNameInDetails(page, expectedName) {
    if (!page) throw new Error('page is required');
    if (typeof expectedName !== 'string') throw new Error('expectedName must be a string, got: ' + typeof expectedName);
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actual = await flightResultsPage.getCarrierNameInDetails();
    expect(actual).toContain(expectedName);
  },

  /**
   * Verifies the EU Rail options banner is visible in flight results.
   *
   * Fails with the gating EU-rail search outcome rather than a bare boolean: the banner only
   * renders when that parallel search returns options, so an empty answer from the rail
   * supplier and a genuine UI regression look identical from the DOM alone.
   *
   * @param {import('playwright').Page} page
   */
  async verifyRailBannerVisible(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const { visible, railSearch, appState } = await flightResultsPage.waitForRailBannerOrRailSearchMiss();
    if (visible) return;

    // Thrown, not asserted: Playwright drops custom expect() messages, so the reason would
    // never reach the CI report through expect(visible, '...').toBe(true).
    throw new Error(
      `Rail banner is not visible in flight results. ${describeRailSearchOutcome(railSearch, appState)}`,
    );
  },

  /**
   * Clicks the "Rail Options" CTA in the EU Rail banner and returns the new
   * Benerail results tab it opens.
   * @param {import('playwright').Page} page
   * @returns {Promise<import('playwright').Page>}
   */
  async clickRailOptionsButton(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return flightResultsPage.clickRailOptionsButtonAndWaitForNewTab();
  },

  /**
   * Verifies the "Separated Tickets" indicator is visible in flight results.
   * This tag appears when split rules apply and the system issues tickets per carrier.
   * @param {import('playwright').Page} page
   */
  async verifySeparatedTicketsIndicatorVisible(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isSeparatedTicketsIndicatorVisible();
    expect(visible, '"Separated Tickets" indicator should be visible in flight results').toBe(true);
  },

  /**
   * Verifies the agreement indicator is visible in the first flight result.
   * @param {import('playwright').Page} page
   */
  async verifyAgreementIndicatorVisibleInResults(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isAgreementIndicatorVisibleInFirstResult();
    expect(visible, 'Agreement indicator should be visible in the first flight result').toBe(true);
  },

  /**
   * Verifies the "Instant Purchase" label is visible in the first flight result.
   * @param {import('playwright').Page} page
   */
  async verifyInstantPurchaseLabelVisibleInFirstResult(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isInstantPurchaseLabelVisibleInFirstResult();
    expect(visible, '"Instant Purchase" label should be visible in the first flight result').toBe(true);
  },

  /**
   * Verifies a flight result displays the expected info label (e.g. "NDC direct rate").
   * @param {import('playwright').Page} page
   * @param {string} expectedText - The expected label text
   * @param {number} flightIndex - 1-based index of the flight result (default: 1)
   */
  async verifyFlightResultInfoLabel(page, expectedText, flightIndex = 1) {
    if (!page) throw new Error('page is required');
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(`expectedText must be a non-empty string, got: ${typeof expectedText}`);
    }
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const found = await flightResultsPage.waitForFlightResultInfoLabel(expectedText, flightIndex);
    if (found) return;

    // The top bar carries a chip per attribute in no fixed order, so name the ones that are there
    // rather than leaving a bare diff against whichever chip came first.
    const labels = await flightResultsPage.getFlightResultInfoLabels(flightIndex);
    throw new Error(
      `[FlightResults.verifyFlightResultInfoLabel] Flight result ${flightIndex} does not display the "${expectedText}" label. ` +
        `Labels in its info top bar: ${labels.length ? labels.map((label) => `"${label}"`).join(', ') : '(none)'}`,
    );
  },

  /**
   * Verifies the Marine Fare icon (anchor) is visible in flight results.
   * @param {import('playwright').Page} page
   */
  async verifyMarineFareIconVisibleInResults(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isMarineFareIconVisible();
    expect(visible, 'Marine Fare icon should be visible in flight results').toBe(true);
  },

  /**
   * Verifies the Marine Fare icon (anchor) is visible in pricing options.
   * @param {import('playwright').Page} page
   */
  async verifyMarineFareIconVisibleInPricingOptions(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isMarineFareIconVisibleInPricingOptions();
    expect(visible, 'Marine Fare icon should be visible in pricing options').toBe(true);
  },

  /**
   * Verifies the open pricing options drawer displays both EDIFACT and NDC content — i.e. at least
   * one card carries the "NDC direct rate" label and at least one does not. Regression guard for
   * bug 75701, where a corporate enabled for both content types saw NDC fares only.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{total: number, ndc: number, edifact: number}>}
   */
  async verifyBothEdifactAndNdcPricingOptionsDisplayed(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const counts = await flightResultsPage.getPricingOptionsContentTypeCounts();

    expect(
      counts.ndc,
      `Pricing options should include at least one NDC fare (got ${counts.ndc} NDC of ${counts.total} options)`,
    ).toBeGreaterThan(0);
    expect(
      counts.edifact,
      `Pricing options should include at least one EDIFACT fare (got ${counts.edifact} EDIFACT of ${counts.total} options)`,
    ).toBeGreaterThan(0);

    return counts;
  },

  /**
   * Measures how long the legacy pricing options fare cards take to render. Guards ADO 83755.
   *
   * @param {import('playwright').Page} page
   * @param {number} maxSeconds
   */
  async verifyPricingOptionsRenderWithin(page, maxSeconds) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return measureFareOptionsRender({
      maxSeconds,
      what: 'pricing options fare cards',
      waitForCards: (timeout) => flightResultsPage.waitForPricingOptionsCards({ timeout }),
      countCards: () => flightResultsPage.getPricingOptionsCards().count(),
    });
  },

  /**
   * Measures how long the new-flight-flow outbound brand cards take to render. Guards ADO 83755.
   *
   * @param {import('playwright').Page} page
   * @param {number} maxSeconds
   */
  async verifyOutboundBrandCardsRenderWithin(page, maxSeconds) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return measureFareOptionsRender({
      maxSeconds,
      what: 'outbound leg brand cards',
      waitForCards: (timeout) => flightResultsPage.waitForNewFlightFlowBrandCards(0, timeout),
      countCards: () => flightResultsPage.getNewFlightFlowBrandCards(0).count(),
    });
  },

  /**
   * Verifies the agreement indicator is visible in the first pricing option.
   * @param {import('playwright').Page} page
   */
  async verifyAgreementIndicatorVisibleInPricingOptions(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isAgreementIndicatorVisibleInPricingOptions();
    expect(visible, 'Agreement indicator should be visible in the first pricing option').toBe(true);
  },

  /**
   * Verifies the carrier name shown on one leg of the FIRST flight result card.
   *
   * Uses an auto-retrying locator assertion on purpose: the results list re-renders after a
   * filter change (for example the "Multi carrier" checkbox), so a one-shot text read races
   * the rebuild and can assert against the pre-filter card.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedCarrier - Expected carrier name (e.g. "Vueling Airline")
   * @param {string} legDirection - Which leg to check: "outbound" or "inbound" (case-insensitive)
   * @returns {Promise<void>}
   */
  async verifyFirstFlightCarrierForLeg(page, expectedCarrier, legDirection) {
    if (!page) throw new Error('[FlightResults.verifyFirstFlightCarrierForLeg] "page" is required, got: ' + typeof page);
    if (!expectedCarrier || typeof expectedCarrier !== 'string') {
      throw new Error(
        `[FlightResults.verifyFirstFlightCarrierForLeg] "expectedCarrier" must be a non-empty string, got: ${typeof expectedCarrier} (${expectedCarrier})`
      );
    }
    if (!legDirection || typeof legDirection !== 'string') {
      throw new Error(
        `[FlightResults.verifyFirstFlightCarrierForLeg] "legDirection" must be a non-empty string, got: ${typeof legDirection} (${legDirection})`
      );
    }

    const legMap = { outbound: 0, inbound: 1 };
    const normalizedLeg = legDirection.trim().toLowerCase();
    const legIndex = legMap[normalizedLeg];
    if (legIndex === undefined) {
      throw new Error(
        `[FlightResults.verifyFirstFlightCarrierForLeg] "legDirection" must be "outbound" or "inbound", got: "${legDirection}"`
      );
    }

    logger.debug('Reading the first result leg carrier name', { expectedCarrier, legDirection, legIndex });

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const carrierName = flightResultsPage.getFirstResultLegCarrierNameLocator(legIndex);

    try {
      await expect(carrierName).toContainText(expectedCarrier, { timeout: 30000 });
    } catch (err) {
      const actual = await carrierName.innerText().catch(() => '(carrier name node not found)');
      throw new Error(
        `[FlightResults.verifyFirstFlightCarrierForLeg] The ${normalizedLeg} leg (leg index ${legIndex}) of the first `
        + `flight result should show carrier "${expectedCarrier}", but it shows "${String(actual).trim()}". `
        + 'A leg whose own flights mix carriers renders the i18n label "Multiple carriers" instead of a carrier '
        + 'name, so either the filter selected a different first result or this leg is genuinely multi-carrier. '
        + `Original: ${err.message}`
      );
    }

    logger.info('Verified the first flight result leg carrier', { expectedCarrier, legDirection, legIndex });
  },

  /**
   * Verifies that all flight results are from a specific airline.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} airlineName - Expected airline name (e.g., "British Airways")
   * @returns {Promise<void>}
   */
  async verifyAllResultsFromAirline(page, airlineName) {
    if (!page) throw new Error('page is required');
    if (!airlineName || typeof airlineName !== 'string') {
      throw new Error('airlineName must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const names = await flightResultsPage.getAllCarrierNamesInResults();
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name).toBe(airlineName);
    }
  },

  /**
   * Verifies that every flight result flies the requested route on one leg.
   *
   * Used to prove the per-leg airport filter is scoped to its own leg: after filtering the
   * outbound leg to a single origin/destination airport pair, no result may keep a different
   * pair on that leg.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} legIndex - Zero-based leg index (0 = outbound, 1 = inbound)
   * @param {string} originCode - Expected leg origin airport code, e.g. "LIN"
   * @param {string} destinationCode - Expected leg destination airport code, e.g. "LCY"
   * @returns {Promise<{legIndex: number, originCode: string, destinationCode: string, routes: Array<{departureCode: string, arrivalCode: string}>}>}
   */
  async verifyAllResultsLegRoute(page, legIndex, originCode, destinationCode) {
    if (!page) throw new Error('[FlightResults.verifyAllResultsLegRoute] "page" is required, got: ' + typeof page);
    if (!Number.isInteger(legIndex) || legIndex < 0) {
      throw new Error(`[FlightResults.verifyAllResultsLegRoute] "legIndex" must be a non-negative integer, got: ${legIndex}`);
    }
    if (!originCode || typeof originCode !== 'string') {
      throw new Error(`[FlightResults.verifyAllResultsLegRoute] "originCode" must be a non-empty string, got: ${typeof originCode}`);
    }
    if (!destinationCode || typeof destinationCode !== 'string') {
      throw new Error(`[FlightResults.verifyAllResultsLegRoute] "destinationCode" must be a non-empty string, got: ${typeof destinationCode}`);
    }

    const expectedOrigin = originCode.trim().toUpperCase();
    const expectedDestination = destinationCode.trim().toUpperCase();

    logger.debug('Reading per-leg airport codes from every flight result', {
      legIndex,
      expectedOrigin,
      expectedDestination,
    });

    const flightResultsPage = getPageObject(page, FlightResultsPage);

    let routes;
    try {
      routes = await flightResultsPage.getLegLocationCodesPerResult(legIndex);
    } catch (error) {
      throw new Error(
        `[FlightResults.verifyAllResultsLegRoute] Could not read the leg ${legIndex} airport codes from the flight ` +
        `results, so the per-leg airport filter cannot be verified against ${expectedOrigin} to ` +
        `${expectedDestination}. Original: ${error.message}`
      );
    }

    // Thrown Errors, not expect(value, message): this repo's @playwright/test discards expect's
    // custom message, and here the offending result numbers and codes ARE the diagnostic.
    if (routes.length === 0) {
      throw new Error(
        `[FlightResults.verifyAllResultsLegRoute] No flight results were available to verify the per-leg airport ` +
        `filter against ${expectedOrigin} to ${expectedDestination}. The filter may have emptied the results list.`
      );
    }

    const mismatches = routes
      .map((route, index) => ({ ...route, resultNumber: index + 1 }))
      .filter((route) => route.departureCode !== expectedOrigin || route.arrivalCode !== expectedDestination);

    if (mismatches.length > 0) {
      throw new Error(
        `[FlightResults.verifyAllResultsLegRoute] Expected all ${routes.length} flight results to fly ` +
        `${expectedOrigin} to ${expectedDestination} on leg ${legIndex}, but ${mismatches.length} did not: ` +
        `${mismatches.map((route) => `#${route.resultNumber} ${route.departureCode}-${route.arrivalCode}`).join(', ')}. ` +
        `The airport filter is leaking across legs, or it did not apply to this leg at all.`
      );
    }

    return { legIndex, originCode: expectedOrigin, destinationCode: expectedDestination, routes };
  },

  // Regression guard: every filtered result must show the eligibility tag.
  async verifyAllResultsShowUnusedTicketTag(page) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const statuses = await flightResultsPage.getUnusedTicketTagStatusPerResult();

    expect(statuses.length, 'Expected at least one flight result to be present').toBeGreaterThan(0);

    const missing = statuses.filter((hasTag) => !hasTag).length;
    expect(
      missing,
      `${missing} of ${statuses.length} flight results are missing the unused ticket eligibility tag`,
    ).toBe(0);
  },

  // ===== ADVISORY VERIFICATION =====

  /**
   * Hovers over the advisory icon in flight results and verifies the tooltip text.
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Expected tooltip text (e.g. "Mixed transportation")
   */
  async verifyAdvisoryTooltipText(page, expectedText) {
    if (!page) throw new Error('page is required');
    if (!expectedText || typeof expectedText !== 'string') throw new Error(`expectedText must be a non-empty string, got: ${typeof expectedText}`);

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.hoverAdvisoryIcon();
    const isVisible = await flightResultsPage.isAdvisoryTooltipVisible(expectedText);
    expect(isVisible, `Expected advisory tooltip to contain "${expectedText}"`).toBeTruthy();
  },

  /**
   * Verifies the full mixed transportation advisory in flight details:
   * (1) Each segment shows a transport equipment icon (flight, directions_railway, directions_bus)
   * (2) Connection messages display "Connection: Change transportation" with "Change to {type}..."
   * (3) Connection advisory icon matches the next segment's transport type
   * @param {import('playwright').Page} page
   */
  async verifyFlightDetailsConnectionAdvisory(page) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);

    const validIcons = ['flight', 'directions_railway', 'directions_bus'];

    // 1. Verify connection advisory messages exist with "Change transportation"
    const hasAdvisory = await flightResultsPage.hasConnectionAdvisoryInDetails();
    expect(hasAdvisory, 'Expected flight details to contain a connection advisory with "Change transportation"').toBeTruthy();

    const advisories = await flightResultsPage.getFlightDetailsConnectionAdvisories();
    expect(advisories.length, 'Expected at least one connection advisory message').toBeGreaterThan(0);
    for (const advisory of advisories) {
      // Verify message contains "Connection" context and "Change to {transport type}" instruction
      expect(advisory.text, `Connection advisory should contain "Change to", got: "${advisory.text}"`).toContain('Change to');
      expect(advisory.text, `Connection advisory should reference transport change context, got: "${advisory.text}"`).toMatch(/change\s+to/i);
      // Verify the advisory icon is a valid transport icon (train/bus/flight)
      if (advisory.icon) {
        expect(validIcons, `Advisory icon "${advisory.icon}" should be a valid transport icon`).toContain(advisory.icon);
      }
    }

    // 2. Verify per-segment equipment icons
    const segments = await flightResultsPage.getFlightDetailsSegmentEquipment();
    expect(segments.length, 'Expected at least 2 segments for a mixed itinerary').toBeGreaterThanOrEqual(2);

    const hasMultipleTypes = new Set(segments.map(s => s.icon)).size > 1;
    expect(hasMultipleTypes, `Expected mixed transport types across segments, but all segments have the same icon: ${segments[0]?.icon}`).toBeTruthy();

    for (const segment of segments) {
      expect(validIcons, `Segment equipment icon "${segment.icon}" should be one of: ${validIcons.join(', ')}`).toContain(segment.icon);
    }

    // 3. Verify connection advisory icon matches the next segment's transport type
    const connectionIcons = await flightResultsPage.getConnectionAdvisoryIcons();
    expect(connectionIcons.length, 'Expected at least one connection advisory icon').toBeGreaterThan(0);
    for (const icon of connectionIcons) {
      expect(validIcons, `Connection advisory icon "${icon}" should be a valid transport icon`).toContain(icon);
    }
  },

  /**
   * Verifies that the share email preview contains equipment information for flight segments.
   * Checks that segment/equipment text (aircraft names or transport types) appears in the preview.
   * @param {import('playwright').Page} page
   */
  async verifyShareEmailContainsEquipment(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);

    // Extract equipment values from the share email HTML
    const equipmentValues = await cartPage.getSharePreviewEquipmentValues();
    expect(equipmentValues.length, 'Share email should contain at least one Equipment label per segment').toBeGreaterThan(0);

    // For mixed itineraries, at least one segment should have non-aircraft equipment (train/bus)
    const nonAircraftKeywords = ['train', 'bus', 'rail'];
    const hasNonAircraft = equipmentValues.some(val =>
      nonAircraftKeywords.some(kw => val.toLowerCase().includes(kw))
    );
    expect(hasNonAircraft, `Share email should contain at least one non-aircraft equipment (train/bus) for mixed itinerary. Found: ${equipmentValues.join(', ')}`).toBeTruthy();

    // Verify flight segment info is also present (flight numbers)
    const hasFlightInfo = await cartPage.sharePreviewContainsFlightNumber();
    expect(hasFlightInfo, 'Share email should contain flight number information').toBeTruthy();
  },

  /**
   * Verifies all flight times on the search results page are in 12-hour AM/PM format.
   * Returns the collected times so they can be compared later against the pricing page.
   *
   * @param {Object} page
   * @returns {Promise<string[]>} Array of time strings found
   */
  async verifyResultsTimesAreIn12HourFormat(page) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const timeTexts = await flightResultsPage.getFlightTimesFromResultsPage();

    expect(timeTexts.length, 'Expected at least one flight time on the results page').toBeGreaterThan(0);

    const amPmPattern = /\b\d{1,2}:\d{2}\s*(AM|PM)\b/i;
    const pure24HourPattern = /\b([01]\d|2[0-3]):\d{2}\b(?!\s*(AM|PM))/i;

    for (const text of timeTexts) {
      expect(
        amPmPattern.test(text),
        `Results page: expected time "${text}" to be in 12-hour AM/PM format — bug #75337 regression`
      ).toBe(true);
      expect(
        pure24HourPattern.test(text),
        `Results page: expected time "${text}" NOT to use 24-hour notation — bug #75337 regression`
      ).toBe(false);
    }

    return timeTexts;
  },

  /**
   * Opens the second fare rules drawer within the pricing options modal.
   * Uses a scoped locator (index 1 within the overlay) to avoid targeting
   * background buttons blocked by the overlay.
   * @param {import('playwright').Page} page
   */
  async clickToOpenSecondFareRulesFromPricingOptions(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitAndClickFareRulesButtonInPricingOptions(1);
    await flightResultsPage.waitForFareRulesNote();
  },

  /**
   * Clicks "Add to trip" and then asserts the conflicting quotes warning dialog is visible.
   *
   * Use this when searching for the same flight a second time on an existing trip —
   * the conflict modal should appear instead of navigating to the cart.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{dialogVisible: boolean}>}
   */
  async addFirstFlightToCartAndVerifyConflictingQuotesDialog(page) {
    if (!page) {
      throw new Error('page is required');
    }

    await Results.waitAndClickAddToTripButton(page);
    await Results.verifyConflictQuoteModalVisible(page);

    return { dialogVisible: true };
  },

  async verifyStopoverIndicatorInResultsForFlight(page, flightNumber) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!flightNumber || typeof flightNumber !== 'string') {
      throw new Error('flightNumber must be a non-empty string, got: ' + typeof flightNumber);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isStopoverIndicatorVisibleForFlight(flightNumber);
    expect(visible, `Stopover indicator icon with "Stop over" tooltip should be visible for flight ${flightNumber}`).toBe(true);

    return { visible, flightNumber };
  },

  async verifyStopoverIndicatorInFlightDetails(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isStopoverIndicatorVisibleInDetails();
    expect(visible, 'Stopover indicator should be visible in flight details').toBe(true);

    return { visible };
  },

  async verifyStopoverLocationInFlightDetails(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actualText = await flightResultsPage.getStopoverLocationTextInDetails();
    expect(actualText, 'Stopover location should contain "Stop over in"').toContain('Stop over in');
    expect(actualText, 'Stopover location should contain "no plane change"').toContain('no plane change');

    return { actualText };
  },

  async verifyFirstFlightResultPriceIsNotZero(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const priceValue = await flightResultsPage.getFirstFlightResultPriceValue();

    expect(priceValue, 'First flight result price should not be null').not.toBeNull();
    expect(priceValue, 'First flight result price should be greater than zero').toBeGreaterThan(0);

    return { priceValue };
  },

  /**
   * Navigates back from the flight results page to the trip search page by
   * clicking the "Search" link in the results breadcrumb.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   */
  async navigateBackToSearchViaBreadcrumb(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.clickBreadcrumbSearchLink();

    return { navigated: true };
  },

  /**
   * Verifies that a pricing-option card in the open modal whose visible text
   * contains the given substring shows the out-of-policy indicator.
   *
   * Used by tests that need to assert OOP on a specific fare row identified
   * by its baggage label (e.g. "2PC Luggage").
   *
   * @param {import('playwright').Page} page
   * @param {string} cardText - Substring used to identify the target card.
   * @returns {Promise<{ cardText: string }>}
   */
  async verifyPricingOptionOOPByText(page, cardText) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!cardText || typeof cardText !== 'string') {
      throw new Error('cardText must be a non-empty string, got: ' + typeof cardText);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const card = flightResultsPage.getPricingOptionCardByText(cardText);
    await card.waitFor({ state: 'visible', timeout: 30000 });

    const oopIndicator = flightResultsPage.getOOPIndicatorInPricingOptionByText(cardText);
    await expect(
      oopIndicator,
      `Expected out-of-policy indicator on pricing option card containing "${cardText}"`,
    ).toBeVisible({ timeout: 30000 });

    return { cardText };
  },

  /**
   * Selects the pricing-option card at the given zero-based position by clicking its own
   * Select button. Works in the by-schedule drawer (no leg tabs), unlike
   * selectPricingOptionInModalByIndex.
   *
   * @param {import('playwright').Page} page
   * @param {number} index - Zero-based card position
   * @returns {Promise<{ selected: true, index: number }>}
   */
  async selectPricingOptionCardByIndex(page, index) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(`index must be a non-negative integer, got: ${index}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.clickSelectButtonInPricingOptionCardByIndex(index);

    return { selected: true, index };
  },

  /**
   * Selects the first pricing-option card in the open modal whose visible text
   * contains the given substring by clicking its Select button.
   *
   * @param {import('playwright').Page} page
   * @param {string} cardText - Substring used to identify the target card.
   * @returns {Promise<{ selected: true, cardText: string }>}
   */
  async selectPricingOptionByText(page, cardText) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!cardText || typeof cardText !== 'string') {
      throw new Error('cardText must be a non-empty string, got: ' + typeof cardText);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.clickSelectButtonInPricingOptionByText(cardText);

    return { selected: true, cardText };
  },

  /**
   * Verifies that a pricing-option card identified by cardText does NOT contain
   * the specified excludedText substring.
   *
   * @param {import('playwright').Page} page
   * @param {string} cardText - Substring used to identify the target card.
   * @param {string} excludedText - Text that should NOT appear in the card.
   * @returns {Promise<{ cardText: string, excludedText: string }>}
   */
  async verifyPricingOptionCardDoesNotContainText(page, cardText, excludedText) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!cardText || typeof cardText !== 'string') {
      throw new Error('cardText must be a non-empty string, got: ' + typeof cardText);
    }
    if (!excludedText || typeof excludedText !== 'string') {
      throw new Error('excludedText must be a non-empty string, got: ' + typeof excludedText);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const card = flightResultsPage.getPricingOptionCardByText(cardText);
    await card.waitFor({ state: 'visible', timeout: 30000 });
    await card.scrollIntoViewIfNeeded();

    const fullText = await card.textContent();
    expect(fullText).not.toContain(excludedText);

    return { cardText, excludedText };
  },

  /**
   * Sorts flight results using the extended "Sort by" dropdown.
   * Clicks the Sort by button and selects the matching option by label.
   *
   * @param {import('playwright').Page} page
   * @param {string} label - Sort option label (e.g. "Departure Earliest")
   * @returns {Promise<{ sorted: boolean, label: string }>}
   */
  async sortBy(page, label) {
    if (!page) throw new Error('[FlightResults.sortBy] "page" is required');
    if (!label || typeof label !== 'string') {
      throw new Error(`[FlightResults.sortBy] "label" must be a non-empty string, got: ${typeof label}`);
    }

    logger.debug(`Sorting flight results by "${label}"`);

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    try {
      await flightResultsPage.selectSortOption(label);
    } catch (err) {
      throw new Error(`[FlightResults.sortBy] Failed to sort by "${label}". Original: ${err.message}`);
    }

    return { sorted: true, label };
  },

  /**
   * Verifies which quick-sort option the flight results are currently sorted by, without
   * applying a sort first. Used to assert the default sort of a freshly loaded results page
   * (the flight store defaults to "Best").
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedLabel - Expected sort option label as shown in the UI (e.g. "Best")
   * @returns {Promise<{ activeLabel: string }>}
   */
  async verifyActiveQuickSortOption(page, expectedLabel) {
    if (!page) throw new Error('[FlightResults.verifyActiveQuickSortOption] "page" is required');
    if (!expectedLabel || typeof expectedLabel !== 'string') {
      throw new Error(
        `[FlightResults.verifyActiveQuickSortOption] "expectedLabel" must be a non-empty string, got: ${typeof expectedLabel}`,
      );
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const activeLabel = await flightResultsPage.getActiveQuickSortLabel();

    logger.debug('Verifying the active quick-sort option', { expectedLabel, activeLabel });

    // A plain throw, not expect(): Playwright drops the custom message argument, so the only way
    // to surface the actual selected sort in the report is to build the error message here.
    if (!activeLabel.toLowerCase().includes(expectedLabel.toLowerCase())) {
      throw new Error(
        `[FlightResults.verifyActiveQuickSortOption] Expected the flight results to be sorted by ` +
        `"${expectedLabel}", but "${activeLabel}" was the selected quick-sort option`,
      );
    }

    return { activeLabel };
  },

  // ===== NEW FLIGHT FLOW =====

  /**
   * Clicks the "Select Flight" button on the first result to enter the NFF brand-cards view.
   * In New Flight Flow the results list shows a "Select Flight" primary button instead of
   * "Pricing Options". Clicking it transitions to the flight-selection component.
   */
  async selectFirstFlightResultNFF(page) {
    if (!page) {
      throw new Error('[FlightResults.selectFirstFlightResultNFF] "page" is required.');
    }
    await Results.waitAndClickSelectButton(page);
    return { selected: true };
  },

  /**
   * Selects the first separated-ticket flight result (new flight flow) — the first result card
   * carrying the "Separated Tickets" tag — rather than blindly the first result.
   * @param {import('playwright').Page} page
   */
  async selectFirstSeparatedTicketFlightResultNFF(page) {
    if (!page) {
      throw new Error('[FlightResults.selectFirstSeparatedTicketFlightResultNFF] "page" is required.');
    }
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.clickSelectFlightForFirstSeparatedTicketResult();
    return { selected: true, separatedTicket: true };
  },

  /**
   * Selects the first pricing option (brand card) for the outbound leg in the new flight flow.
   */
  async selectOutboundFirstBrandCardNewFlightFlow(page) {
    if (!page) {
      throw new Error('[FlightResults.selectOutboundFirstBrandCardNewFlightFlow] "page" is required.');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForNewFlightFlowBrandCards(0);
    await flightResultsPage.clickNewFlightFlowBrandCard(0, 0);

    return { selected: true, leg: 'outbound' };
  },

  /**
   * Selects the outbound brand card whose brand name matches, in the new flight flow.
   *
   * Brand-specific pricing bugs hide behind an index-based pick, so an unmatched name
   * throws instead of falling back to the first card.
   *
   * @param {import('playwright').Page} page
   * @param {string} brandName - Brand name as rendered on the card, e.g. "Economy Flex"
   */
  async selectOutboundBrandCardByNameNewFlightFlow(page, brandName) {
    if (!page) {
      throw new Error('[FlightResults.selectOutboundBrandCardByNameNewFlightFlow] "page" is required.');
    }
    if (!brandName || typeof brandName !== 'string') {
      throw new Error(
        `[FlightResults.selectOutboundBrandCardByNameNewFlightFlow] "brandName" must be a non-empty string, got: ${typeof brandName}`
      );
    }

    logger.info('[NewFlightFlow] Selecting outbound brand card by name', { brandName });

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForNewFlightFlowBrandCards(0);
    const names = await flightResultsPage.getOutboundBrandCardNames();

    const wanted = brandName.trim();
    let index = names.findIndex((n) => typeof n === 'string' && n.trim() === wanted);
    if (index === -1) {
      index = names.findIndex((n) => typeof n === 'string' && n.trim().toLowerCase() === wanted.toLowerCase());
    }

    if (index === -1) {
      throw new Error(
        `[FlightResults.selectOutboundBrandCardByNameNewFlightFlow] Outbound brand card "${brandName}" not found. ` +
        `Available: [${names.map((n) => `"${n}"`).join(', ')}]`
      );
    }

    await flightResultsPage.clickNewFlightFlowBrandCard(0, index);

    return { selected: true, leg: 'outbound', brandName, index };
  },

  /**
   * Scrolls the outbound brand-card carousel to its last card in the new flight flow.
   *
   * The carousel's ">" arrow sits on top of the last visible card and swallows clicks
   * meant for it, so a card under the arrow must be scrolled clear before selecting it.
   *
   * @param {import('playwright').Page} page
   */
  async scrollOutboundBrandCardsToEndNewFlightFlow(page) {
    if (!page) {
      throw new Error('[FlightResults.scrollOutboundBrandCardsToEndNewFlightFlow] "page" is required.');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForNewFlightFlowBrandCards(0);
    logger.debug('[NewFlightFlow] Scrolling outbound brand cards to the end');
    const clicks = await flightResultsPage.scrollNewFlightFlowBrandCardsToEnd(0);
    logger.info('[NewFlightFlow] Scrolled outbound brand cards', { arrowClicks: clicks });

    return { leg: 'outbound', arrowClicks: clicks };
  },

  /**
   * Selects the first pricing option (brand card) for the inbound leg in the new flight flow.
   */
  async selectInboundFirstBrandCardNewFlightFlow(page) {
    if (!page) {
      throw new Error('[FlightResults.selectInboundFirstBrandCardNewFlightFlow] "page" is required.');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForNewFlightFlowBrandCards(1);
    await flightResultsPage.clickNewFlightFlowBrandCard(1, 0);

    return { selected: true, leg: 'inbound' };
  },

  /**
   * Selects the first fare for the OUTBOUND leg in the classic Pricing Options
   * drawer (pricing-options.vue) — the leg-by-leg "Select fare" flow that renders
   * for non-New-Flight-Flow accounts. This is DISTINCT from
   * selectOutboundFirstBrandCardNewFlightFlow, which targets the NFF
   * flight-selection brand cards (.flight-brand-leg / .flight-brand-card) that do
   * not exist on this drawer. Selecting the outbound fare advances the drawer to
   * the inbound leg.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{selected: boolean, leg: string}>}
   */
  async selectOutboundFirstOptionFromPricingOptions(page) {
    if (!page) {
      throw new Error('[FlightResults.selectOutboundFirstOptionFromPricingOptions] "page" is required.');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForPricingOptionsDrawerLeg();
    await flightResultsPage.selectFirstFareInCurrentPricingLeg();
    await flightResultsPage.waitForPricingOptionsLegSelected(0);

    return { selected: true, leg: 'outbound' };
  },

  /**
   * Selects the first fare for the INBOUND leg in the classic Pricing Options
   * drawer. Called after selectOutboundFirstOptionFromPricingOptions, once the
   * drawer has advanced to (and reloaded the fares for) the inbound leg.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{selected: boolean, leg: string}>}
   */
  async selectInboundFirstOptionFromPricingOptions(page) {
    if (!page) {
      throw new Error('[FlightResults.selectInboundFirstOptionFromPricingOptions] "page" is required.');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForPricingOptionsDrawerLeg();
    await flightResultsPage.selectFirstFareInCurrentPricingLeg();
    await flightResultsPage.waitForPricingOptionsLegSelected(1);

    return { selected: true, leg: 'inbound' };
  },

  /**
   * Adds the fares selected across all legs to the cart via the "Add to trip"
   * button in the classic Pricing Options drawer footer, handles any conflict
   * quote modal, and waits until the cart shows "Pending booking".
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{added: boolean}>}
   */
  async addToCartFromPricingOptions(page) {
    if (!page) {
      throw new Error('[FlightResults.addToCartFromPricingOptions] "page" is required.');
    }

    const cartPage = getPageObject(page, CartPage);
    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await flightResultsPage.clickPricingOptionsAddToTrip();
    await Results.clickProceedConflictQuoteModal(page);
    await cartPage.waitForPendingBookingText({ timeout: 90000 });

    return { added: true };
  },

  /**
   * Verifies the currently-active leg of the classic Pricing Options drawer offers more
   * than one fare. Guards the mixed-carrier regression where only the carrier's basic /
   * saver fare comes back instead of the full fare family list.
   *
   * @param {import('playwright').Page} page
   * @param {number} [minimumFares=2] - Minimum number of fare cards the leg must offer.
   * @returns {Promise<{fareCount: number, fareNames: Array<string|null>}>}
   */
  async verifyPricingOptionsLegOffersMultipleFares(page, minimumFares = 2) {
    if (!page) {
      throw new Error('[FlightResults.verifyPricingOptionsLegOffersMultipleFares] "page" is required.');
    }
    if (!Number.isInteger(minimumFares) || minimumFares < 2) {
      throw new Error(`[FlightResults.verifyPricingOptionsLegOffersMultipleFares] "minimumFares" must be an integer >= 2, got: ${minimumFares}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForPricingOptionsDrawerLeg();

    const fareCount = await flightResultsPage.getPricingOptionsLegFareCardCount();
    const fareNames = await flightResultsPage.getPricingOptionsLegFareNames();

    expect(
      fareCount,
      `Expected the pricing options leg to offer at least ${minimumFares} fares, got ${fareCount}: ${JSON.stringify(fareNames)}`,
    ).toBeGreaterThanOrEqual(minimumFares);

    return { fareCount, fareNames };
  },

  /**
   * Verifies the classic Pricing Options drawer actually rendered fares for the
   * currently-active leg. The app renders its "no pricing options" empty state inside the
   * same drawer section, so the fare cards are counted instead of only waiting for the
   * drawer to become visible. Unlike verifyPricingOptionsLegOffersMultipleFares, a single
   * fare is a pass — a multicarrier leg whose carrier has no branded fares legitimately
   * returns one.
   *
   * @param {import('playwright').Page} page
   * @param {number} [minimumFares=1] - Minimum number of fare cards the leg must display.
   * @returns {Promise<{fareCount: number, fareNames: Array<string|null>}>}
   */
  async verifyPricingOptionsFaresDisplayed(page, minimumFares = 1) {
    if (!page) {
      throw new Error('[FlightResults.verifyPricingOptionsFaresDisplayed] "page" is required.');
    }
    if (!Number.isInteger(minimumFares) || minimumFares < 1) {
      throw new Error(`[FlightResults.verifyPricingOptionsFaresDisplayed] "minimumFares" must be an integer >= 1, got: ${minimumFares}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForPricingOptionsDrawerLeg();

    const fareCount = await flightResultsPage.getPricingOptionsLegFareCardCount();
    const fareNames = await flightResultsPage.getPricingOptionsLegFareNames();

    expect(
      fareCount,
      `Expected the pricing options drawer to display at least ${minimumFares} fare(s) on the active leg, got ${fareCount}: ${JSON.stringify(fareNames)}`,
    ).toBeGreaterThanOrEqual(minimumFares);

    return { fareCount, fareNames };
  },

  /**
   * Per-pax price of the fare card named `fareName` on the classic Pricing Options drawer's active leg.
   * By name, not position, so a sold-out brand fails instead of reading the next brand's price.
   *
   * @param {import('playwright').Page} page
   * @param {string} fareName - Brand name shown on the card, matched case-insensitively.
   * @returns {Promise<number>}
   */
  async extractPricingOptionPriceByFareName(page, fareName) {
    if (!page) {
      throw new Error('[FlightResults.extractPricingOptionPriceByFareName] "page" is required.');
    }
    if (!fareName || typeof fareName !== 'string') {
      throw new Error(`[FlightResults.extractPricingOptionPriceByFareName] "fareName" must be a non-empty string, got: ${typeof fareName}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForPricingOptionsDrawerLeg();

    const fareNames = await flightResultsPage.getPricingOptionsLegFareNames();
    const prices = await flightResultsPage.getPricingOptionCardPrices();
    logger.debug('[FlightResults.extractPricingOptionPriceByFareName] Fares shown', { fareName, fareNames, prices });
    if (fareNames.length !== prices.length) {
      throw new Error(
        `[FlightResults.extractPricingOptionPriceByFareName] Fare names and prices are not aligned ` +
        `(${fareNames.length} names, ${prices.length} prices): ${JSON.stringify(fareNames)}`
      );
    }

    const index = fareNames.findIndex((name) => name?.toLowerCase() === fareName.toLowerCase());
    if (index === -1) {
      throw new Error(
        `[FlightResults.extractPricingOptionPriceByFareName] No "${fareName}" fare in pricing options. ` +
        `Fares shown: ${JSON.stringify(fareNames)}`
      );
    }
    if (typeof prices[index] !== 'number') {
      throw new Error(`[FlightResults.extractPricingOptionPriceByFareName] Could not read the price of the "${fareName}" fare card.`);
    }

    return prices[index];
  },

  /**
   * Verifies the fare card named `fareName` in the classic Pricing Options drawer shows `expectedPrice`.
   *
   * @param {import('playwright').Page} page
   * @param {string} fareName - Brand name shown on the card, matched case-insensitively.
   * @param {number} expectedPrice
   * @returns {Promise<{fareName: string, expectedPrice: number, actualPrice: number}>}
   */
  async verifyPricingOptionFarePrice(page, fareName, expectedPrice) {
    if (typeof expectedPrice !== 'number' || !Number.isFinite(expectedPrice)) {
      throw new Error(`[FlightResults.verifyPricingOptionFarePrice] "expectedPrice" must be a finite number, got: ${expectedPrice}`);
    }

    const actualPrice = await this.extractPricingOptionPriceByFareName(page, fareName);
    expectNumbersToBeEqualWithTolerance(actualPrice, expectedPrice, 0.02, `"${fareName}" fare price in pricing options`);

    return { fareName, expectedPrice, actualPrice };
  },

  /**
   * Selects a random fare on the currently-active leg of the classic Pricing Options
   * drawer, then waits for that leg to register as selected. Cards already chosen (button
   * reads "Unselect") are excluded so the click never deselects the current fare.
   *
   * @param {import('playwright').Page} page
   * @param {number} [legIndex=0] - Zero-based leg index (0=outbound, 1=inbound).
   * @returns {Promise<{selected: boolean, legIndex: number, index: number, fareName: string|null}>}
   */
  async selectRandomFareFromPricingOptionsLeg(page, legIndex = 0) {
    if (!page) {
      throw new Error('[FlightResults.selectRandomFareFromPricingOptionsLeg] "page" is required.');
    }
    if (!Number.isInteger(legIndex) || legIndex < 0) {
      throw new Error(`[FlightResults.selectRandomFareFromPricingOptionsLeg] "legIndex" must be a non-negative integer, got: ${legIndex}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForPricingOptionsDrawerLeg();

    const fareNames = await flightResultsPage.getPricingOptionsLegFareNames();
    const selectableIndices = await flightResultsPage.getSelectablePricingOptionsLegCardIndices();

    if (selectableIndices.length === 0) {
      throw new Error(
        `[FlightResults.selectRandomFareFromPricingOptionsLeg] Leg ${legIndex} has no selectable fare card. ` +
        `Fares shown: ${JSON.stringify(fareNames)}`
      );
    }

    const index = selectableIndices[Math.floor(Math.random() * selectableIndices.length)];
    const fareName = fareNames[index] ?? null;

    logger.info('[FlightResults.selectRandomFareFromPricingOptionsLeg] Selecting a random fare', {
      legIndex,
      index,
      fareName,
      fareNames,
    });

    await flightResultsPage.clickSelectButtonInPricingOptionsLegCard(index);
    await flightResultsPage.waitForPricingOptionsLegSelected(legIndex);

    return { selected: true, legIndex, index, fareName };
  },

  /**
   * Waits for the classic Pricing Options drawer to advance to the given leg and for that
   * leg's fare cards to render, so the next assertion reads the new leg and not the previous one.
   *
   * @param {import('playwright').Page} page
   * @param {number} legIndex - Zero-based leg index (0=outbound, 1=inbound).
   * @returns {Promise<{legIndex: number}>}
   */
  async waitForPricingOptionsLeg(page, legIndex) {
    if (!page) {
      throw new Error('[FlightResults.waitForPricingOptionsLeg] "page" is required.');
    }
    if (!Number.isInteger(legIndex) || legIndex < 0) {
      throw new Error(`[FlightResults.waitForPricingOptionsLeg] "legIndex" must be a non-negative integer, got: ${legIndex}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForPricingOptionsActiveLeg(legIndex);
    await flightResultsPage.waitForPricingOptionsDrawerLeg();

    return { legIndex };
  },

  /**
   * Verifies the inbound leg heading in the new flight flow contains the expected text.
   * The heading format is e.g., "London To Lisbon".
   * @param {import('playwright').Page} page
   * @param {string} expectedHeading - Text expected in the inbound heading
   */
  async verifyInboundHeadingNewFlightFlow(page, expectedHeading) {
    if (!page) {
      throw new Error('[FlightResults.verifyInboundHeadingNewFlightFlow] "page" is required.');
    }
    if (!expectedHeading || typeof expectedHeading !== 'string') {
      throw new Error(`[FlightResults.verifyInboundHeadingNewFlightFlow] "expectedHeading" must be a non-empty string, got: ${typeof expectedHeading}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    // After outbound selection, only the inbound leg has a visible header-name.
    // Try index 0 first (most common — only one header visible), fallback to index 1.
    let headerText;
    try {
      headerText = await flightResultsPage.getNewFlightFlowLegHeaderName(0);
      logger.debug(`Header at index 0: "${headerText}"`);
    } catch (err0) {
      logger.debug(`Header index 0 failed: ${err0.message}`);
      try {
        headerText = await flightResultsPage.getNewFlightFlowLegHeaderName(1);
        logger.debug(`Header at index 1: "${headerText}"`);
      } catch (err1) {
        logger.debug(`Header index 1 also failed: ${err1.message}`);
        throw new Error(
          `[FlightResults.verifyInboundHeadingNewFlightFlow] No leg header found. ` +
          `The inbound leg pricing options may not have loaded.`
        );
      }
    }

    if (!headerText.toLowerCase().includes(expectedHeading.toLowerCase())) {
      throw new Error(
        `[FlightResults.verifyInboundHeadingNewFlightFlow] Expected inbound heading to contain "${expectedHeading}", ` +
        `but found "${headerText}". The inbound leg may not have loaded after outbound selection.`
      );
    }

    return { heading: headerText };
  },

  /**
   * Clicks the "Add to cart" (or "Select") button in the new flight flow footer.
   */
  async addToCartNewFlightFlow(page) {
    if (!page) {
      throw new Error('[FlightResults.addToCartNewFlightFlow] "page" is required.');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.clickNewFlightFlowAddToCartButton();

    return { addedToCart: true };
  },

  /**
   * Clicks pricing options on the first flight result labelled "NDC direct rate".
   * Use this when the search returns a mix of NDC and GDS results and you need
   * to explicitly target the NDC row.
   *
   * @param {import('playwright').Page} page
   */
  async clickPricingOptionsForFirstNdcResult(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForFlightResults(90000);
    await flightResultsPage.clickPricingOptionsForFirstFlightWithLabel('NDC direct rate');
  },

  /**
   * Clicks pricing options on the first flight result that is NOT an "NDC direct rate".
   * Use this when the search returns a mix of NDC and GDS results and you need
   * to explicitly target a non-NDC (GDS) row.
   *
   * @param {import('playwright').Page} page
   */
  async clickPricingOptionsForFirstNonNdcResult(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForFlightResults(90000);
    await flightResultsPage.clickPricingOptionsForFirstFlightWithoutLabel('NDC direct rate');
  },

  async verifyOutboundLegShowsStartingFromPricing(page) {
    if (!page) {
      throw new Error('[FlightResults.verifyOutboundLegShowsStartingFromPricing] "page" is required.');
    }
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.verifyLegBrandCardsShowStartingFrom(0);
    return { outboundStartingFromVisible: true };
  },

  async verifyInboundLegShowsDeltaPricing(page) {
    if (!page) {
      throw new Error('[FlightResults.verifyInboundLegShowsDeltaPricing] "page" is required.');
    }
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.verifyLegBrandCardsShowDelta(1);
    return { inboundDeltaVisible: true };
  },

  async verifyOutboundLegBrandCardsVisible(page) {
    if (!page) {
      throw new Error('[FlightResults.verifyOutboundLegBrandCardsVisible] "page" is required.');
    }
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForNewFlightFlowBrandCards(0);
    return { outboundBrandCardsVisible: true };
  },

  async verifyInboundLegBrandCardsVisible(page) {
    if (!page) {
      throw new Error('[FlightResults.verifyInboundLegBrandCardsVisible] "page" is required.');
    }
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForNewFlightFlowBrandCards(1);
    return { inboundBrandCardsVisible: true };
  },

  // These two assert on the trip's payload and never touch the page - they take `world`, not
  // `page`. They live in this module because the scenarios that use them drive the new-flight-flow
  // brand cards, which is this trio's screen; the generic mechanism is
  // PayloadValidation.collectParameterOccurrencesPerCall.
  /**
   * Asserts the Amadeus fare family descriptions were batched rather than fetched one per supplier
   * call. Guards ADO 83106, whose engine chunks them at MaxFareFamilyDescriptionsPerCall = 6.
   *
   * An exact call count is deliberately not asserted - see docs/PayloadValidation.md section 2.10.9
   * for why, and for what the product repo covers deterministically instead.
   *
   * @param {object} world
   * @param {string} requestType - e.g. "*Fare_GetFareFamilyDescription*"
   * @param {number} maxPerCall - the supplier cap on entries per call
   */
  async expectFareFamilyDescriptionsBatched(world, requestType, maxPerCall) {
    if (!Number.isInteger(maxPerCall) || maxPerCall < 1) {
      throw new Error(`maxPerCall must be a positive integer, got: ${maxPerCall}`);
    }

    const { perCall, entriesTotal } = await PayloadValidation.collectParameterOccurrencesPerCall(
      world,
      requestType,
      "rateCategory"
    );
    const oversized = perCall.filter((call) => call.entries > maxPerCall);

    logger.info("Checked fare family description batching", {
      requestType,
      calls: perCall.length,
      entriesTotal,
      entriesPerCall: perCall.map((call) => call.entries),
      families: perCall.map((call) => call.values),
    });

    // Nothing described means nothing to judge, and the assertions below would hold over an empty
    // set - the vacuous pass this check exists to prevent.
    expect(
      entriesTotal,
      `No fare family was described for this trip, so batching cannot be checked. Confirm the ` +
      `itinerary really offers branded fares and that the content is EDIFACT - an NDC offer is ` +
      `priced through a different message and never sends "${requestType}".`
    ).toBeGreaterThan(0);

    expect(
      oversized.length,
      `No "${requestType}" call may carry more than ${maxPerCall} fare families, but ` +
      `${oversized.length} of ${perCall.length} call(s) did (${oversized.map((c) => c.entries).join(", ")} ` +
      `entries). That cap is the supplier's documented limit for standaloneDescriptionRequest.`
    ).toBe(0);

    // The regression this guards: one call per fare family. Batching means fewer calls than
    // families, whatever the render count - which an exact call count could never survive.
    if (entriesTotal > 1) {
      expect(
        perCall.length,
        `${entriesTotal} fare families were described across ${perCall.length} ` +
        `"${requestType}" call(s) - one call each, so they were not batched. The families ` +
        `shown on one render are meant to travel together in as few calls as the cap of ` +
        `${maxPerCall} allows.`
      ).toBeLessThan(entriesTotal);
    }

    return { calls: perCall.length, entriesTotal, entriesPerCall: perCall.map((c) => c.entries) };
  },

  /**
   * Asserts the itinerary described more fare families than the given number, so a scenario written
   * to exercise chunking says so when its route's ladder narrows instead of passing over nothing.
   *
   * @param {object} world
   * @param {string} requestType
   * @param {number} atLeast
   */
  async expectMoreFareFamiliesDescribedThan(world, requestType, atLeast) {
    if (!Number.isInteger(atLeast) || atLeast < 0) {
      throw new Error(`atLeast must be a non-negative integer, got: ${atLeast}`);
    }

    const { entriesTotal } = await PayloadValidation.collectParameterOccurrencesPerCall(
      world,
      requestType,
      "rateCategory"
    );

    logger.info("Counted fare families described", { requestType, entriesTotal, atLeast });

    expect(
      entriesTotal,
      `This scenario exists to exercise batching beyond ${atLeast} fare families per call, but the ` +
      `itinerary only offered ${entriesTotal}. The route's fare family ladder has narrowed - pick ` +
      `one that still offers more than ${atLeast}, or the chunking path stops being covered.`
    ).toBeGreaterThan(atLeast);
  },

  /**
   * Reads every fare family the Amadeus EDIFACT search reply describes and stores it on the world
   * for the assertion below.
   *
   * Guards ADO 82771 / 84218. Each familyInformation node carries the filed code in "fareFamilyname"
   * and, when the airline files one, a market-facing name in "description". Which of the two must
   * appear on screen depends on whether the description is there at all, so the expectation cannot
   * be hard-coded in Gherkin - it is derived here, per fare family.
   *
   * @param {object} world
   * @param {string} requestType - e.g. "Amadeus4.Fare_MasterPricerTravelBoardSearch9"
   * @returns {Promise<{families: Array<{carrier: string|null, code: string, description: string|null,
   *   describedCount: number, bareCount: number}>}>}
   */
  async captureFareFamilyDescriptions(world, requestType) {
    if (!world) {
      throw new Error('[FlightResults.captureFareFamilyDescriptions] "world" is required.');
    }

    // The response, not the request: a MasterPricer REQUEST carries the fare family criteria the OBT
    // asks for (bare codes, no descriptions), which would read as "nothing was described".
    const { blocks } = await PayloadValidation.collectXmlBlockFieldsForTrip(
      world,
      requestType,
      "familyInformation",
      ["fareFamilyname", "description", "carrier"],
      { source: "response", purpose: "read the fare families the search reply describes" }
    );

    const families = [];
    const seen = new Map();

    for (const block of blocks) {
      const code = block.fareFamilyname;
      if (!code) continue;

      const description = block.description;
      const carrier = block.carrier;
      const key = `${(carrier || "").toUpperCase()}|${code.toUpperCase()}`;
      const existing = seen.get(key);

      // The same family repeats across a multi-sid search, and the occurrences need not agree.
      // Count described and bare occurrences separately instead of merging them: a family that is
      // described in one reply and bare in another cannot be judged from a card label, since the
      // label carries nothing that says which occurrence it came from. Merging (letting a described
      // copy fill in for a bare one) would call the code a defect when showing it is the correct
      // AC3/R2 fallback for the bare occurrence.
      if (existing) {
        if (description) {
          existing.describedCount += 1;
          if (!existing.description) existing.description = description;
        } else {
          existing.bareCount += 1;
        }
        continue;
      }

      const family = {
        carrier: carrier || null,
        code,
        description: description || null,
        describedCount: description ? 1 : 0,
        bareCount: description ? 0 : 1,
      };
      seen.set(key, family);
      families.push(family);
    }

    logger.info("Captured fare families from the search reply", {
      requestType,
      described: families.filter((f) => f.description).length,
      withoutDescription: families.filter((f) => !f.description).map((f) => f.code),
      families,
    });

    expect(
      families.length,
      `No familyInformation node was found in any "${requestType}" reply for this trip, so there is ` +
      `nothing to compare the screen against. Confirm the itinerary offers branded fares and that ` +
      `the content is Amadeus EDIFACT.`
    ).toBeGreaterThan(0);

    world.capturedFareFamilies = families;
    return { families };
  },

  /**
   * Asserts every fare family label on screen is the one the supplier's search reply calls for.
   *
   * Guards ADO 82771 / 84218. For a family the airline files a description for, the screen must
   * show that description; for one filed without a description, the code itself is correct (AC3 /
   * R2). Which applies is therefore a property of the payload, not something Gherkin can state -
   * run captureFareFamilyDescriptions first and this compares against what it found.
   *
   * The label is Title-Cased by the front end (_flight-brand-builder.logic.ts), so the comparison
   * Title-Cases the payload values the same way.
   *
   * @param {import('playwright').Page} page
   * @param {object} world - Must carry capturedFareFamilies from the capture step
   * @param {{flow?: 'newFlightFlow'|'pricingOptions', legIndex?: number}} [options]
   * @returns {Promise<{names: string[], offenders: string[], flow: string, legIndex: number}>}
   */
  async verifyBrandNamesMatchFareFamilyDescriptions(page, world, options = {}) {
    if (!page) {
      throw new Error('[FlightResults.verifyBrandNamesMatchFareFamilyDescriptions] "page" is required.');
    }
    if (!world || !Array.isArray(world.capturedFareFamilies)) {
      throw new Error(
        '[FlightResults.verifyBrandNamesMatchFareFamilyDescriptions] No fare families captured. Run the ' +
        'capture step for the Amadeus search reply before this assertion.',
      );
    }

    const { flow = 'newFlightFlow', legIndex = 0 } = options;
    if (!['newFlightFlow', 'pricingOptions'].includes(flow)) {
      throw new Error(`[FlightResults.verifyBrandNamesMatchFareFamilyDescriptions] "flow" must be newFlightFlow or pricingOptions, got: ${flow}`);
    }
    if (![0, 1].includes(legIndex)) {
      throw new Error(`[FlightResults.verifyBrandNamesMatchFareFamilyDescriptions] "legIndex" must be 0 or 1, got: ${legIndex}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);

    // The legacy drawer renders one leg at a time and its reader is already leg-scoped; the new
    // flow renders both legs at once and needs the index.
    let rawNames;
    if (flow === 'pricingOptions') {
      // Same order as verifyPricingOptionsLegOffersMultipleFares: the drawer renders its leg
      // asynchronously, so reading without this can catch the previous leg's cards.
      await flightResultsPage.waitForPricingOptionsDrawerLeg();
      rawNames = await flightResultsPage.getPricingOptionsLegFareNames();
    } else {
      rawNames = legIndex === 1
        ? await flightResultsPage.getInboundBrandCardNames()
        : await flightResultsPage.getOutboundBrandCardNames();
    }

    // Both readers yield null for a card with no label, to stay index-aligned with the cards.
    const names = rawNames.filter(Boolean);

    // A description equal to its own code (UA files ECONOMY as "ECONOMY") is unjudgeable.
    const described = world.capturedFareFamilies.filter(
      (family) => family.description
        && titleCaseBrandName(family.description) !== titleCaseBrandName(family.code),
    );

    // Every label a correct screen may show: a description, or an undescribed family's code.
    const legitimateLabels = new Set(world.capturedFareFamilies.map(
      (family) => titleCaseBrandName(family.description || family.code),
    ));

    // A described family's code must never reach the screen - that is 84218. Skipped when the
    // label cannot be attributed: card text carries no carrier, so a code that doubles as another
    // family's description, or a family described in one occurrence and bare in another, is not
    // judgeable. Worked examples in docs/PayloadValidation.md section 2.10.9.
    const ambiguous = [];
    const forbidden = new Map();
    for (const family of described) {
      const code = titleCaseBrandName(family.code);
      if (legitimateLabels.has(code)) {
        ambiguous.push(`${family.carrier || '?'}|${family.code} (code doubles as another description)`);
        continue;
      }
      if (family.bareCount > 0) {
        ambiguous.push(`${family.carrier || '?'}|${family.code} (${family.describedCount} described, ${family.bareCount} bare)`);
        continue;
      }
      forbidden.set(code, family);
    }

    if (ambiguous.length > 0) {
      logger.warn('[FareFamilyName] Codes not judged - each doubles as another family\'s description', { ambiguous });
    }

    logger.info('[FareFamilyName] Comparing labels against the search reply', {
      flow,
      legIndex,
      names,
      describedFamilies: described.length,
      forbiddenLabels: [...forbidden.keys()],
    });

    // An empty set would satisfy the assertion below without proving anything.
    expect(
      names.length,
      `No fare family label was read for the ${flow} leg ${legIndex}, so the labels cannot be judged. ` +
      'Confirm the itinerary really offers branded fares on this leg.',
    ).toBeGreaterThan(0);

    expect(
      described.length,
      'The search reply described no fare family with a name that differs from its filed code, so ' +
      'this assertion could only pass vacuously. Pick an itinerary whose carrier files real fare ' +
      'family descriptions.',
    ).toBeGreaterThan(0);

    const offenders = names.filter((name) => forbidden.has(name));

    expect(
      offenders,
      `${offenders.length} label(s) show the filed code although the airline filed a description: ` +
      offenders.map((name) => {
        const family = forbidden.get(name);
        return `"${name}" should read "${titleCaseBrandName(family.description)}" (${family.carrier || '?'} ${family.code})`;
      }).join('; ') +
      `. The whole set read was [${names.join(', ')}].`,
    ).toEqual([]);

    // The casing rule, asserted on its own. It holds whatever the label's provenance: a family the
    // airline described, a filed code the pricing reply returned bare (Fare_InformativePricingWithoutPNR
    // and Fare_PriceUpsellWithoutPNR carry no description, so the code is Title-Cased instead - the
    // AC3/R2 fallback), or the brand builder's "<Cabin> (<class>)" for a fare with no brand at all.
    // Every one of those must reach the screen with only the first letter of each word capitalised,
    // so a raw MAINEXTRA is caught here even when no captured family can explain the label.
    const miscased = names.filter((name) => titleCaseBrandName(name) !== name);

    expect(
      miscased,
      `${miscased.length} label(s) are not Title-Cased: ` +
      miscased.map((name) => `"${name}" should read "${titleCaseBrandName(name)}"`).join('; ') +
      `. The whole set read was [${names.join(', ')}].`,
    ).toEqual([]);

    // Not asserted: that every label is one of the captured families. The brand builder's cabin
    // fallback above is legitimate and matches no fare family, so an unrecognised label is not
    // necessarily wrong - it is logged, and it is what exposes a label whose family the search
    // reply never described.
    const expected = new Set(world.capturedFareFamilies.map(
      (family) => titleCaseBrandName(family.description || family.code),
    ));
    const unrecognised = names.filter((name) => !expected.has(name));
    if (unrecognised.length > 0) {
      logger.warn('[FareFamilyName] Labels not matching any captured fare family', { unrecognised });
    }

    return { names, offenders, miscased, flow, legIndex };
  },

  /**
   * Asserts the classic Pricing Options drawer offers exactly the brands Ypsilon returned for the
   * flight it is pricing (ADO 77108).
   *
   * Ypsilon files a brand as the extFlightInfo of a <flight> in its Fare response, and ties that
   * flight to the legs it covers through <legXRef legId>; the <leg> list of the same response says
   * which carrier, flight number and date each legId is. A search sends several Fare calls (the
   * whole trip, then each leg alone), each numbering its legs itself, so legIds are resolved per
   * call and the brands are pooled across calls.
   *
   * Only brands in the drawer's cabin are expected: the drawer drops every option whose cabin is not
   * exactly the searched one (flight.service.ts, AB#84200), so an Economy search never lists the
   * Premium Economy brand the same response carries. Those are logged, not asserted.
   *
   * @param {import('playwright').Page} page
   * @param {object} world - Cucumber world carrying the trip id
   * @param {string} [requestType='Fare'] - Logged name of the Ypsilon fare call
   * @returns {Promise<{flight: object, cabinClass: string, displayed: string[], expected: string[], otherCabins: object}>}
   */
  async verifyPricingOptionsBrandsMatchYpsilonFareResponse(page, world, requestType = 'Fare') {
    if (!page) {
      throw new Error('[FlightResults.verifyPricingOptionsBrandsMatchYpsilonFareResponse] "page" is required.');
    }
    if (!world) {
      throw new Error('[FlightResults.verifyPricingOptionsBrandsMatchYpsilonFareResponse] "world" is required to read the trip\'s Fare responses.');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForPricingOptionsDrawerLeg();

    const flight = await flightResultsPage.getPricingOptionsPreviewFlight();
    const cabinTexts = await flightResultsPage.getPricingOptionsSelectedCabinTexts();
    const cabinClass = resolvePricingOptionsCabin(cabinTexts);
    const drawerCabinTier = cabinTier(cabinClass);
    if (drawerCabinTier === null) {
      throw new Error(
        `[FlightResults.verifyPricingOptionsBrandsMatchYpsilonFareResponse] Cannot tell which cabin the pricing options drawer ` +
        `is listing: heading "${cabinTexts.heading}", active cabin tab "${cabinTexts.activeTabLabel}", resolved to ` +
        `${JSON.stringify(cabinClass)}. Known cabins: ${Object.keys(CABIN_TIERS).join(', ')}.`,
      );
    }
    const displayed = [...new Set(
      (await flightResultsPage.getPricingOptionsLegFareNames()).filter(Boolean).map(titleCaseBrandName),
    )].sort();

    const designators = flight.flightNumbers.map((text) => {
      const match = text.replace(/\s+/g, '').match(/^([A-Z0-9]{2})(\d{1,4})$/i);
      if (!match) {
        throw new Error(`[FlightResults.verifyPricingOptionsBrandsMatchYpsilonFareResponse] Cannot read a flight number out of "${text}" in the pricing options flight preview.`);
      }
      return `${match[1].toUpperCase()}${Number(match[2])}`;
    });
    const date = parseFlightDate(flight.departureDateText);
    if (!date) {
      throw new Error(`[FlightResults.verifyPricingOptionsBrandsMatchYpsilonFareResponse] Cannot read the departure date "${flight.departureDateText}" in the pricing options flight preview.`);
    }
    const isDepartureDate = (isoDate) => {
      const [year, month, day] = String(isoDate || '').split('-').map(Number);
      return day === date.day && month === date.month + 1 && (date.year === null || year === date.year);
    };

    const { perCall } = await PayloadValidation.collectXmlBlockTreesPerCall(
      world,
      requestType,
      {
        leg: { attributes: ['legId', 'cr', 'fNo', 'depApt', 'depDate'] },
        flight: { attributes: ['extFlightInfo'], blocks: { legXRef: { attributes: ['legId', 'cosDescription'] } } },
      },
      { source: 'response', purpose: 'read the brands the Ypsilon Fare responses offer' },
    );

    const expectedBrands = new Set();
    const otherCabins = {};
    // Per call, so a brand that only one of the pooled calls returned can be traced to it.
    const brandsPerCall = [];
    for (const call of perCall) {
      const callBrands = new Set();
      brandsPerCall.push(callBrands);
      const legsById = new Map(call.leg.map((leg) => [leg.legId, leg]));
      for (const fareFlight of call.flight) {
        if (!fareFlight.extFlightInfo) continue;
        const legs = fareFlight.legXRef.map((ref) => ({ ...legsById.get(ref.legId), cosDescription: ref.cosDescription }));
        const legDesignators = legs.map((leg) => `${String(leg.cr || '').toUpperCase()}${Number(leg.fNo)}`);
        const [firstLeg] = legs;
        const isOpenedFlight = firstLeg
          && legDesignators[0] === designators[0]
          && firstLeg.depApt === flight.origin
          && isDepartureDate(firstLeg.depDate)
          && designators.every((designator) => legDesignators.includes(designator));
        if (!isOpenedFlight) continue;

        const brand = titleCaseBrandName(fareFlight.extFlightInfo);
        const cabins = [...new Set(legs.map((leg) => leg.cosDescription))];
        // An unknown cabin is not set aside as "another cabin": that would quietly drop its brand
        // from the expectation, which is the very miss this check exists to catch.
        const unknownCabin = cabins.find((cabin) => cabinTier(cabin) === null);
        if (unknownCabin !== undefined) {
          throw new Error(
            `[FlightResults.verifyPricingOptionsBrandsMatchYpsilonFareResponse] The "${requestType}" response files brand ` +
            `"${brand}" of ${designators.join('/')} in cabin ${JSON.stringify(unknownCabin)}, which has no known tier. ` +
            `Add it to CABIN_TIERS (known: ${Object.keys(CABIN_TIERS).join(', ')}).`,
          );
        }
        if (cabins.every((cabin) => cabinTier(cabin) === drawerCabinTier)) {
          expectedBrands.add(brand);
          callBrands.add(brand);
        } else {
          (otherCabins[cabins.join(' + ')] ||= new Set()).add(brand);
        }
      }
    }

    const expected = [...expectedBrands].sort();
    const otherCabinBrands = Object.fromEntries(Object.entries(otherCabins).map(([cabin, brands]) => [cabin, [...brands]]));
    logger.info('[YpsilonBrands] Pricing options brands vs the Fare responses', {
      flight: { ...flight, designators },
      cabinClass,
      fareCalls: perCall.length,
      brandsPerCall: brandsPerCall.map((brands) => [...brands].sort()),
      displayed,
      expected,
      otherCabinBrands,
    });

    // Thrown rather than expect(value, message): this repo's Playwright drops expect's message, and
    // the lists below are what makes a failure readable.
    if (expected.length === 0) {
      throw new Error(
        `No brand (extFlightInfo) was found in the ${perCall.length} "${requestType}" response(s) for ${designators.join('/')} ` +
        `${flight.origin}-${flight.destination} on ${flight.departureDateText} in ${cabinClass}, so there is nothing to compare the ` +
        `drawer against. Brands in other cabins: ${JSON.stringify(otherCabinBrands)}.`,
      );
    }

    const missing = expected.filter((brand) => !displayed.includes(brand));
    const unexpected = displayed.filter((brand) => !expected.includes(brand));
    if (missing.length > 0 || unexpected.length > 0) {
      throw new Error(
        `Pricing options for ${designators.join('/')} ${flight.origin}-${flight.destination} (${cabinClass}) must offer every brand ` +
        `Ypsilon returned in extFlightInfo, and no other. Missing from the drawer: ${JSON.stringify(missing)}; ` +
        `not in the Fare response: ${JSON.stringify(unexpected)}. Displayed: ${JSON.stringify(displayed)}, ` +
        `Fare response: ${JSON.stringify(expected)}.`,
      );
    }

    return { flight: { ...flight, designators }, cabinClass, displayed, expected, otherCabins: otherCabinBrands };
  },

  /**
   * Verifies a cabin class is offered as a tab above a leg's brand cards in the new flight flow.
   * Matching is case-insensitive substring, so "Premium" passes for a "Premium Economy" tab.
   *
   * @param {import('playwright').Page} page
   * @param {string} cabinName - Cabin name or substring (e.g. "Premium")
   * @param {number} legIndex - Zero-based leg index (default: 0 = outbound)
   * @returns {Promise<{cabinName: string, legIndex: number, tabNames: string[]}>}
   */
  async verifyCabinClassTabDisplayedNewFlightFlow(page, cabinName, legIndex = 0) {
    if (!page) {
      throw new Error('[FlightResults.verifyCabinClassTabDisplayedNewFlightFlow] "page" is required.');
    }
    if (!cabinName || typeof cabinName !== 'string') {
      throw new Error(`[FlightResults.verifyCabinClassTabDisplayedNewFlightFlow] "cabinName" must be a non-empty string, got: ${typeof cabinName}`);
    }

    logger.debug('[NewFlightFlow] Reading cabin class tabs for leg', { cabinName, legIndex });
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const tabNames = await flightResultsPage.getNewFlightFlowCabinClassTabNames(legIndex);
    const normalizedCabinName = cabinName.toLowerCase();

    expect(
      tabNames.some((tabName) => tabName.toLowerCase().includes(normalizedCabinName)),
      `Expected leg ${legIndex} to offer a "${cabinName}" cabin class tab, got: [${tabNames.join(', ')}]`,
    ).toBe(true);

    return { cabinName, legIndex, tabNames };
  },

  /**
   * Selects a cabin class tab above a leg's brand cards in the new flight flow, so the leg
   * re-renders its brand cards for that cabin class.
   *
   * @param {import('playwright').Page} page
   * @param {string} cabinName - Cabin name or substring (e.g. "Premium")
   * @param {number} legIndex - Zero-based leg index (default: 0 = outbound)
   * @returns {Promise<{selected: true, cabinName: string, legIndex: number}>}
   */
  async selectCabinClassTabNewFlightFlow(page, cabinName, legIndex = 0) {
    if (!page) {
      throw new Error('[FlightResults.selectCabinClassTabNewFlightFlow] "page" is required.');
    }
    if (!cabinName || typeof cabinName !== 'string') {
      throw new Error(`[FlightResults.selectCabinClassTabNewFlightFlow] "cabinName" must be a non-empty string, got: ${typeof cabinName}`);
    }

    logger.debug('[NewFlightFlow] Selecting cabin class tab', { cabinName, legIndex });
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.clickNewFlightFlowCabinClassTab(cabinName, legIndex);
    await flightResultsPage.waitForNewFlightFlowBrandCards(legIndex);

    return { selected: true, cabinName, legIndex };
  },

  /**
   * Verifies every brand card name on the outbound leg contains the expected text, so a cabin
   * class tab cannot silently list brands belonging to another cabin.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Text every brand name must contain (e.g. "Premium")
   * @returns {Promise<{expectedText: string, brandNames: string[]}>}
   */
  async verifyOutboundBrandCardNamesContain(page, expectedText) {
    if (!page) {
      throw new Error('[FlightResults.verifyOutboundBrandCardNamesContain] "page" is required.');
    }
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(`[FlightResults.verifyOutboundBrandCardNamesContain] "expectedText" must be a non-empty string, got: ${typeof expectedText}`);
    }

    logger.debug('[NewFlightFlow] Reading outbound brand card names', { expectedText });
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const brandNames = await flightResultsPage.getOutboundBrandCardNames();
    const normalizedExpectedText = expectedText.toLowerCase();

    expect(
      brandNames.length,
      `Expected the outbound leg to display at least one brand card carrying "${expectedText}", got none.`,
    ).toBeGreaterThan(0);

    const mismatched = brandNames.filter(
      (brandName) => !brandName || !brandName.toLowerCase().includes(normalizedExpectedText),
    );

    expect(
      mismatched,
      `Expected every outbound brand card name to contain "${expectedText}", but these did not: [${mismatched.join(', ')}]. All names: [${brandNames.join(', ')}]`,
    ).toEqual([]);

    return { expectedText, brandNames };
  },

  async verifyPriceWithoutStartingFromLabel(page) {
    if (!page) {
      throw new Error('[FlightResults.verifyPriceWithoutStartingFromLabel] "page" is required.');
    }
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.verifyLegBrandCardsShowPriceOnly();
    return { priceOnlyVisible: true };
  },

  async verifyNoDeltaPricing(page) {
    if (!page) {
      throw new Error('[FlightResults.verifyNoDeltaPricing] "page" is required.');
    }
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.verifyNoBrandCardDelta();
    return { noDeltaConfirmed: true };
  },

  async verifyThirdLegBrandCardsVisible(page) {
    if (!page) throw new Error('[FlightResults.verifyThirdLegBrandCardsVisible] "page" is required.');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForNewFlightFlowBrandCards(2);
    return { thirdLegBrandCardsVisible: true };
  },

  /**
   * Reads the fare ladder the supplier priced for each leg and stores it on the world.
   *
   * One entry point for every supplier: the ladder means the same thing on each, only the message
   * that carries it differs, so the Gherkin stays one step and the payload shape is resolved here.
   * The request type names the message, which is what says whose reader applies - adding a third
   * supplier is one row below, not a new step.
   *
   * @param {object} world - Must carry searchedLegs from the multi-city search step
   * @param {string} requestType - the supplier message, e.g. "AirPriceRsp"
   * @returns {Promise<{ladders: Array<{leg: string, brands: string[]}>, combinations: number}>}
   */
  async captureFareLaddersPerLeg(world, requestType) {
    if (!world) throw new Error('[FlightResults.captureFareLaddersPerLeg] "world" is required.');
    if (typeof requestType !== 'string' || !requestType.trim()) {
      throw new Error(
        `[FlightResults.captureFareLaddersPerLeg] "requestType" must be a non-empty string, got: ${typeof requestType}`
      );
    }

    const readers = [
      { matches: /Fare_InformativePricingWithoutPNR/i, read: this.captureAmadeusFareLaddersPerLeg },
      { matches: /AirPriceRsp/i, read: this.captureGalileoFareLaddersPerLeg },
    ];
    const reader = readers.find((candidate) => candidate.matches.test(requestType));
    if (!reader) {
      throw new Error(
        `[FlightResults.captureFareLaddersPerLeg] No fare ladder reader knows the message "${requestType}". ` +
        `Known: ${readers.map((candidate) => candidate.matches.source).join(', ')}.`
      );
    }

    return reader.read.call(this, world, requestType);
  },

  /**
   * Reads the fare ladder the supplier priced for each leg and stores it on the world. Guards
   * ADO 83321 / 83337.
   *
   * Only single-segment reprices count. A by-schedule trip also reprices the whole itinerary, and
   * those calls carry every leg's segments at once - reading one as a leg inflates the count and
   * invents a leg that is not on screen.
   *
   * @param {object} world - Must carry searchedLegs from the multi-city search step
   * @param {string} requestType - e.g. "AirPriceRsp"
   * @returns {Promise<{ladders: Array<{leg: string, brands: string[]}>, combinations: number}>}
   */
  async captureGalileoFareLaddersPerLeg(world, requestType) {
    if (!world) throw new Error('[FlightResults.captureGalileoFareLaddersPerLeg] "world" is required.');
    if (!Array.isArray(world.searchedLegs) || world.searchedLegs.length === 0) {
      throw new Error(
        '[FlightResults.captureGalileoFareLaddersPerLeg] No searched legs on the world. Run the multi-city ' +
        'search step first - the leg order is what maps a payload route to a leg on screen.'
      );
    }

    const { perCall } = await PayloadValidation.collectXmlBlockAttributesPerCall(
      world,
      requestType,
      { AirSegment: ["Origin", "Destination"], Brand: ["Name", "BrandID"] },
      { source: "response", purpose: "read which leg each reprice covers and what it priced" }
    );

    const brandsByLeg = new Map();
    let wholeItineraryCalls = 0;

    for (const call of perCall) {
      const routes = [...new Set(call.AirSegment.map((s) => `${s.Origin}-${s.Destination}`))];
      if (routes.length !== 1) {
        if (routes.length > 1) wholeItineraryCalls += 1;
        continue;
      }
      const leg = routes[0];
      if (!brandsByLeg.has(leg)) brandsByLeg.set(leg, new Map());
      for (const brand of call.Brand) {
        // Keyed by id: it is what the pricing trace names a row's fares by, and two brands can
        // share a name across carriers while ids stay distinct.
        if (brand.BrandID) brandsByLeg.get(leg).set(brand.BrandID, brand.Name || brand.BrandID);
      }
    }

    const ladders = world.searchedLegs.map((leg) => {
      const byId = brandsByLeg.get(leg) || new Map();
      return { leg, brandIds: [...byId.keys()], brands: [...byId.values()] };
    });
    const combinations = ladders.reduce((total, l) => total * Math.max(l.brands.length, 1), 1);

    logger.info("Captured the fare ladder priced for each leg", {
      requestType,
      wholeItineraryCalls,
      ladders: ladders.map((l) => `${l.leg}:${l.brands.length}`),
      combinations,
    });

    const empty = ladders.filter((l) => l.brands.length === 0).map((l) => l.leg);
    expect(
      empty,
      `No fare ladder was priced for leg(s) [${empty.join(", ")}], so there is nothing to compare ` +
      `their cards against. The flight selected on such a leg was not priced separately - check the ` +
      `carrier filter reached every leg.`
    ).toEqual([]);

    world.capturedFareLadders = ladders;
    return { ladders, combinations };
  },

  /**
   * The same ladder, read from Amadeus. Guards ADO 83329.
   *
   * Amadeus prices the whole selection once per fare family rather than repricing a leg at a time,
   * so which family a leg can sell is read from those replies: each names its segments and its fare
   * components, and a segment's item number is the component that priced it. A reply that comes
   * back "NO FARES/RBD/CARRIER/PASSENGER TYPE" is a family that selection cannot sell.
   *
   * Only about a third of those replies carry a price - the rest are the families that selection
   * cannot sell - so the ladder is what the priced ones agree on. The route is chosen to keep their
   * number near the thirty the payload API answers for comfortably.
   *
   * @param {object} world
   * @param {string} requestType - e.g. "*Fare_InformativePricingWithoutPNR*"
   * @returns {Promise<{ladders: Array<{leg: string, brands: string[]}>, combinations: number, priced: number}>}
   */
  async captureAmadeusFareLaddersPerLeg(world, requestType) {
    if (!world) throw new Error('[FlightResults.captureAmadeusFareLaddersPerLeg] "world" is required.');
    if (!Array.isArray(world.searchedLegs) || world.searchedLegs.length === 0) {
      throw new Error(
        '[FlightResults.captureAmadeusFareLaddersPerLeg] No searched legs on the world. Run the ' +
        'multi-city search step first - the leg order is what maps a payload route to a leg on screen.'
      );
    }
    if (!Array.isArray(world.capturedFareFamilies) || world.capturedFareFamilies.length === 0) {
      throw new Error(
        '[FlightResults.captureAmadeusFareLaddersPerLeg] No fare families captured. Run the step that ' +
        'captures the fare families described in the search reply first: the pricing replies name a ' +
        'family by its filed code, and the card shows the airline description of it where one exists.'
      );
    }

    const { perCall } = await PayloadValidation.collectXmlBlockFieldsPerCall(
      world,
      requestType,
      {
        // Read inside each block: a segment holds its board point, its off point and its item
        // number, and the component that priced it repeats that number.
        segmentLevelGroup: ["trueLocationId", "itemNumber"],
        fareComponentDetailsGroup: ["fareFamilyname", "number"],
      },
      { source: "response", purpose: "read which fare family each leg was priced into" }
    );

    const codesByLeg = new Map();
    let priced = 0;

    for (const call of perCall) {
      // A reply that priced nothing carries no segment group at all.
      if (!call.segmentLevelGroup.length) continue;
      priced += 1;

      const familyByItem = new Map();
      for (const component of call.fareComponentDetailsGroup) {
        const [family] = component.fareFamilyname;
        const [reference] = component.number;
        if (family && reference) familyByItem.set(reference, family);
      }

      for (const segment of call.segmentLevelGroup) {
        const [origin, destination] = segment.trueLocationId;
        const [itemNumber] = segment.itemNumber;
        const code = familyByItem.get(itemNumber);
        if (!origin || !destination || !code) continue;
        const leg = `${origin}-${destination}`;
        if (!codesByLeg.has(leg)) codesByLeg.set(leg, new Set());
        codesByLeg.get(leg).add(code);
      }
    }

    // The card carries the filed code on one itinerary and the airline's description of it on
    // another - 82771 found the two cannot be told apart from the label - so each fare is held to
    // either form.
    const describedAs = (code) => {
      const family = world.capturedFareFamilies.find((f) => (f.code || "").toUpperCase() === code.toUpperCase());
      return (family && family.description) || code;
    };

    const ladders = world.searchedLegs.map((leg) => {
      const codes = [...(codesByLeg.get(leg) || new Set())];
      return { leg, brands: codes, brandAlternatives: codes.map((code) => [describedAs(code)]) };
    });
    const combinations = ladders.reduce((total, l) => total * Math.max(l.brands.length, 1), 1);

    logger.info("Captured the fare ladder priced for each leg", {
      requestType,
      replies: perCall.length,
      pricedCalls: priced,
      ladders: ladders.map((l) => `${l.leg}:${l.brands.join("/")}`),
      combinations,
    });

    expect(
      priced,
      `None of the ${perCall.length} "${requestType}" replies priced anything, so there is no ladder ` +
      `to hold the screen to. They may all have come back "NO FARES" - check the carrier filter ` +
      `reached every leg.`
    ).toBeGreaterThan(0);

    const empty = ladders.filter((l) => l.brands.length === 0).map((l) => l.leg);
    expect(
      empty,
      `No fare was priced for leg(s) [${empty.join(", ")}], so there is nothing to compare their ` +
      `cards against. Check the legs searched match the routes the replies price.`
    ).toEqual([]);

    world.capturedFareLadders = ladders;
    return { ladders, combinations, priced };
  },

  /**
   * Asserts no leg lost a fare when the combination matrix was capped. Guards ADO 83321 / 83337.
   *
   * A fare missing from one screen is filtered by what was picked before it; a fare missing from
   * EVERY row is lost. Only the second is a defect, and only this can tell them apart.
   *
   * Reads the pricing trace, which is diagnostic output rather than a contract: a format change
   * fails loudly here instead of quietly weakening the assertion.
   *
   * @param {object} world - Must carry capturedFareLadders
   * @param {string} requestType - the pricing trace type, e.g. "FlightPricingV3"
   * @returns {Promise<{rows: number, perLeg: Array<{leg: string, offered: number, unreachable: string[]}>}>}
   */
  async expectEveryFareReachableInSomeOption(world, requestType) {
    if (!world || !Array.isArray(world.capturedFareLadders)) {
      throw new Error(
        '[FlightResults.expectEveryFareReachableInSomeOption] No captured fare ladders. Run the capture step first.'
      );
    }
    const ladders = world.capturedFareLadders;

    const { payloads } = await PayloadValidation.collectPayloadsForTrip(world, requestType, {
      source: "response",
      purpose: "read the combination rows the pricing matrix produced",
    });

    // option[n] ... brands=<id>/<class>/bag:...,<id>/... - one entry per leg, in leg order. Rows
    // carrying fewer entries price a single leg rather than a combination, and are not rows.
    const rows = [];
    for (const payload of payloads) {
      // Unanchored: the trace indents these lines, so matching from line start finds nothing.
      for (const match of payload.matchAll(/option\[\d+\][^\n]*?\bbrands=([^\n]*)/gi)) {
        const ids = match[1]
          .split(/\s+keys=/)[0]
          .split(",")
          .map((entry) => (entry.trim().match(/^(\d+)/) || [])[1])
          .filter(Boolean);
        if (ids.length === ladders.length) rows.push(ids);
      }
    }

    expect(
      rows.length,
      `No combination rows were found in the "${requestType}" trace for this trip, so there is ` +
      `nothing to check reachability against. The trace format may have changed - it is diagnostic ` +
      `output, not a contract.`
    ).toBeGreaterThan(0);

    const perLeg = ladders.map((ladder, legIndex) => {
      const reachable = new Set(rows.map((row) => row[legIndex]));
      const unreachable = ladder.brandIds
        .filter((id) => !reachable.has(id))
        .map((id, i) => `${ladder.brands[ladder.brandIds.indexOf(id)] || id} (${id})`);
      return { leg: ladder.leg, offered: ladder.brandIds.length, unreachable };
    });

    logger.info("Checked every priced fare is reachable in some combination row", {
      requestType,
      rows: rows.length,
      perLeg: perLeg.map((l) => `${l.leg}:${l.offered - l.unreachable.length}/${l.offered}`),
    });

    const lost = perLeg.filter((l) => l.unreachable.length > 0);
    expect(
      lost.map((l) => `${l.leg}: ${l.unreachable.join(", ")}`),
      `Fares priced by the supplier appear in no combination row at all, so no choice on the other ` +
      `legs can reach them - they are lost, not merely filtered. ${rows.length} rows were built.`
    ).toEqual([]);

    return { rows: rows.length, perLeg };
  },

  /**
   * Asserts the selection is wide enough that the cap has to truncate something. Below it every leg
   * gets its full ladder for free and the scenario covers nothing. Same role as 84298's width guard.
   *
   * @param {object} world - Must carry capturedFareLadders
   * @param {number} cap - The product's combination cap, stated in Gherkin so it is visible
   * @returns {Promise<{combinations: number, cap: number}>}
   */
  async expectFareLadderCombinationsExceed(world, cap) {
    if (!world || !Array.isArray(world.capturedFareLadders)) {
      throw new Error(
        '[FlightResults.expectFareLadderCombinationsExceed] No captured fare ladders. Run the capture step first.'
      );
    }
    if (!Number.isInteger(cap) || cap < 1) {
      throw new Error(`[FlightResults.expectFareLadderCombinationsExceed] "cap" must be a positive integer, got: ${cap}`);
    }

    const ladders = world.capturedFareLadders;
    const combinations = ladders.reduce((total, l) => total * Math.max(l.brands.length, 1), 1);

    logger.info("Checked the selection exceeds the combination cap", {
      cap,
      combinations,
      ladders: ladders.map((l) => `${l.leg}:${l.brands.length}`),
    });

    expect(
      combinations,
      `This scenario exists to exercise a selection wider than the ${cap}-combination cap, but the ` +
      `legs offered ${ladders.map((l) => l.brands.length).join(" x ")} = ${combinations}. The route's ` +
      `ladders have narrowed - pick one that still exceeds the cap, or the truncation path stops ` +
      `being covered.`
    ).toBeGreaterThan(cap);

    return { combinations, cap };
  },

  /**
   * Asserts the leg currently on screen offers a card for every fare its reprice priced.
   *
   * The expectation is read from the payload for this run, never a fixed list: what a leg offers
   * follows live availability. Coverage is a property of the finished card set - a fare is on the
   * screen if any card carries it - so this compares sets, not order or count.
   *
   * By schedule renders ONE leg at a time, and splits its ladder across cabin tabs
   * (Economy / Premium / First). A reprice does not split that way, so every tab is read and the
   * names unioned - comparing the whole ladder against one tab would fail a correct screen.
   *
   * @param {import('playwright').Page} page
   * @param {object} world - Must carry capturedFareLadders
   * @param {number} legIndex - Zero-based, in the order the legs were searched
   * @returns {Promise<{leg: string, expected: string[], displayed: string[], cabins: string[]}>}
   */
  async verifyDisplayedLegBrandCardsMatchFareLadder(page, world, legIndex) {
    if (!page) throw new Error('[FlightResults.verifyDisplayedLegBrandCardsMatchFareLadder] "page" is required.');
    if (!world || !Array.isArray(world.capturedFareLadders)) {
      throw new Error(
        '[FlightResults.verifyDisplayedLegBrandCardsMatchFareLadder] No captured fare ladders. Run the capture step first.'
      );
    }
    const ladder = world.capturedFareLadders[legIndex];
    if (!ladder) {
      throw new Error(
        `[FlightResults.verifyDisplayedLegBrandCardsMatchFareLadder] No ladder captured for leg index ${legIndex}; ` +
        `the trip has ${world.capturedFareLadders.length} legs.`
      );
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    // A leg's container only appears once a fare is picked on the one before it, and it fills in
    // progressively, so settle on this leg's cards rather than reading whatever is on screen.
    const settledCards = await flightResultsPage.waitForLegBrandCardsToSettle(legIndex);

    // Tabs render one per available cabin, so a leg selling a single cabin has none and the reader
    // throws rather than returning empty - that is a shape, not a failure.
    const cabins = await flightResultsPage.getNewFlightFlowCabinClassTabNames(legIndex).catch(() => []);
    const displayed = new Set();

    if (cabins.length === 0) {
      (await flightResultsPage.getLegBrandCardNames(legIndex)).filter(Boolean).forEach((n) => displayed.add(n));
    } else {
      for (const cabin of cabins) {
        await flightResultsPage.clickNewFlightFlowCabinClassTab(cabin, legIndex);
        (await flightResultsPage.getLegBrandCardNames(legIndex)).filter(Boolean).forEach((n) => displayed.add(n));
      }
      // Back to the first cabin: reading the ladder must not leave the flow on a tab the scenario
      // never chose, or the fare picked next comes from the wrong cabin.
      await flightResultsPage.clickNewFlightFlowCabinClassTab(cabins[0], legIndex);
    }

    const normalize = (value) => value.trim().toLowerCase();
    const displayedSet = new Set([...displayed].map(normalize));
    // A fare can be labelled in more than one way - Amadeus cards carry either the filed code or
    // the airline's description of it - so a ladder entry may offer alternatives, and any of them
    // being on screen means that fare is offered.
    const missing = ladder.brands.filter((brand, index) => {
      const accepted = [brand, ...((ladder.brandAlternatives && ladder.brandAlternatives[index]) || [])];
      return !accepted.some((label) => displayedSet.has(normalize(label)));
    });

    logger.info("Compared the displayed leg's brand cards against the ladder its reprice priced", {
      leg: ladder.leg,
      legIndex,
      cabins,
      settledCards,
      expected: ladder.brands,
      displayed: [...displayed],
      missing,
    });

    expect(
      missing,
      `The "${ladder.leg}" leg was priced for [${ladder.brands.join(", ")}] but its cards, across ` +
      `cabins [${cabins.join(", ")}], show [${[...displayed].join(", ")}]. Missing: [${missing.join(", ")}].`
    ).toEqual([]);

    return { leg: ladder.leg, expected: ladder.brands, displayed: [...displayed], cabins };
  },

  async verifyThirdLegShowsDeltaPricing(page) {
    if (!page) throw new Error('[FlightResults.verifyThirdLegShowsDeltaPricing] "page" is required.');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.verifyLegBrandCardsShowDelta(2);
    return { thirdLegDeltaVisible: true };
  },

  async selectThirdLegFirstBrandCard(page) {
    if (!page) throw new Error('[FlightResults.selectThirdLegFirstBrandCard] "page" is required.');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForNewFlightFlowBrandCards(2);
    await flightResultsPage.clickNewFlightFlowBrandCard(2, 0);
    return { selected: true, leg: 'third' };
  },

  async verifySeparatedTicketsIndicationVisible(page) {
    if (!page) {
      throw new Error('[FlightResults.verifySeparatedTicketsIndicationVisible] "page" is required.');
    }
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.verifySeparatedTicketsIndicationVisible();
    return { separatedTicketsVisible: true };
  },

  async verifyFlightSelectionFooterTotalPerTraveller(page) {
    if (!page) {
      throw new Error('[FlightResults.verifyFlightSelectionFooterTotalPerTraveller] "page" is required.');
    }
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.verifyFlightSelectionFooterTotalPerTraveller();
    return { footerTotalPerTraveller: true };
  },

  /**
   * Extracts the flight-selection footer's per-traveller total as a number.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<number>} The per-traveller total shown in the footer
   */
  async extractFlightSelectionFooterTotalPerTraveller(page) {
    if (!page) {
      throw new Error('[FlightResults.extractFlightSelectionFooterTotalPerTraveller] "page" is required.');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const price = await flightResultsPage.getFlightSelectionFooterTotalPerTravellerValue();

    if (typeof price !== 'number' || Number.isNaN(price)) {
      throw new Error(
        `[FlightResults.extractFlightSelectionFooterTotalPerTraveller] Could not parse a numeric price from the flight selection footer, got: ${price}`
      );
    }

    return price;
  },

  async selectOutboundFirstNonAgreementBrandCard(page) {
    if (!page) throw new Error('[FlightResults.selectOutboundFirstNonAgreementBrandCard] "page" is required.');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForNewFlightFlowBrandCards(0);
    await flightResultsPage.clickFirstNonAgreementBrandCard(0);
    return { selected: true, leg: 'outbound' };
  },

  async getInboundLegAgreementCardIndices(page) {
    if (!page) throw new Error('[FlightResults.getInboundLegAgreementCardIndices] "page" is required.');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const { agreementCardIndices } = await flightResultsPage.getAgreementIconCountInLegBrandCards(1);
    return { agreementCardIndices };
  },

  /**
   * Verifies at least one brand card on a leg of the New Flight Flow selection screen carries the
   * marine-fare badge, walking the brand-class carousel until it finds one.
   *
   * @param {import('playwright').Page} page
   * @param {number} legIndex - Zero-based leg index (0=outbound, 1=inbound)
   * @returns {Promise<{found: boolean, cardsScanned: number, arrowClicks: number}>}
   */
  async verifyMarineFareIconVisibleInLegBrandCards(page, legIndex = 0) {
    if (!page) throw new Error('[FlightResults.verifyMarineFareIconVisibleInLegBrandCards] "page" is required.');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const result = await flightResultsPage.findMarineFareBrandCardInLeg(legIndex);
    if (!result.found) {
      throw new Error(
        `[FlightResults.verifyMarineFareIconVisibleInLegBrandCards] No brand card on leg ${legIndex} displays ` +
        `the Marine Fare icon. Scanned ${result.cardsScanned} card(s) across the whole brand-class carousel ` +
        `(${result.arrowClicks} arrow step(s) to its end). Either the itinerary selected carries no marine ` +
        `fare — check the "Marine fare" results filter ran and the account holds a SEA agreement — or the ` +
        `anchor badge stopped rendering in flight-brand-card.vue.`
      );
    }
    return result;
  },

  /**
   * Hovers the agreement icon of the first pricing-options fare that carries one and returns the
   * tooltip it opens. The tooltip stays open only while the pointer rests on the icon, so the text
   * is read here and handed back for the caller to assert on.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{tooltipText: string}>}
   */
  async hoverAgreementIconInPricingOptions(page) {
    if (!page) throw new Error('[FlightResults.hoverAgreementIconInPricingOptions] "page" is required.');

    logger.info('Hovering the agreement icon of the first pricing option that carries an agreement');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const tooltipText = await flightResultsPage.hoverAgreementIconInFirstPricingOptionAndGetTooltipText();

    if (!tooltipText) {
      throw new Error(
        '[FlightResults.hoverAgreementIconInPricingOptions] The agreement tooltip opened but is empty. ' +
        'The agreement has no tooltip text configured in administration.'
      );
    }

    return { tooltipText };
  },

  /**
   * Verifies a brand card shows a feature, optionally asserting it is shown as INCLUDED.
   *
   * A not-included feature reuses the same row markup with a different icon ('close' plus a
   * 'light-gray' text class), and a feature the supplier sent no data for gets a grey
   * 'error_outline' — so the text alone proves the wording but not the state. Pass
   * `requireGreenCheck` when the test cares that the feature is actually granted.
   *
   * On a round trip the first card matching `fareName` is the outbound leg's.
   *
   * @param {import('playwright').Page} page
   * @param {string} fareName - Brand name as rendered in the card header (e.g. "Smart")
   * @param {string} expectedText - Feature text as rendered (e.g. "Free standard seat selection")
   * @param {Object} [options]
   * @param {boolean} [options.requireGreenCheck=false] - Also assert the green check mark
   * @returns {Promise<{fareName: string, expectedText: string, featureTexts: string[], icon: string, iconClasses: string}>}
   */
  async verifyFareShowsFeatureInBrandCard(page, fareName, expectedText, { requireGreenCheck = false } = {}) {
    if (!page) throw new Error('[FlightResults.verifyFareShowsFeatureInBrandCard] "page" is required.');
    if (!fareName || typeof fareName !== 'string') throw new Error('[FlightResults.verifyFareShowsFeatureInBrandCard] "fareName" must be a non-empty string, got: ' + typeof fareName);
    if (!expectedText || typeof expectedText !== 'string') throw new Error('[FlightResults.verifyFareShowsFeatureInBrandCard] "expectedText" must be a non-empty string, got: ' + typeof expectedText);

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const features = await flightResultsPage.getBrandCardFeatureRows(fareName);
    const featureTexts = features.map((f) => f.text);
    const feature = features.find((f) => f.text === expectedText);

    if (!feature) {
      throw new Error(
        `[FlightResults.verifyFareShowsFeatureInBrandCard] Fare "${fareName}" does not show "${expectedText}". ` +
        `Found: [${featureTexts.map((t) => `"${t}"`).join(', ')}]`
      );
    }

    if (requireGreenCheck) {
      const hasGreenIcon = feature.iconClasses.split(/\s+/).includes('green') && feature.icon === 'check';
      const textIsDimmed = feature.textClasses.split(/\s+/).includes('light-gray');

      if (!hasGreenIcon || textIsDimmed) {
        throw new Error(
          `[FlightResults.verifyFareShowsFeatureInBrandCard] Fare "${fareName}" shows "${expectedText}" but not ` +
          `as included: expected a green check mark (icon "check" with the "green" class and no "light-gray" ` +
          `text class), got icon "${feature.icon}" with classes "${feature.iconClasses}" and text classes ` +
          `"${feature.textClasses}". An icon of "close" means the supplier reported the feature as not ` +
          `included; "error_outline" means it sent no data for it.`
        );
      }
    }

    return { fareName, expectedText, featureTexts, icon: feature.icon, iconClasses: feature.iconClasses };
  },

  /**
   * Selects the first brand card on a leg whose fare carries no checked baggage — the new flight
   * flow's rendering of a 0PC fare. _flight-brand-builder.logic.ts gives a not-included allowance the
   * text "Checked bag not included" with a `close` icon; the icon is checked too, since a card with no
   * supplier baggage data reads "Baggage - No Info" and must not stand in for a confirmed 0PC.
   *
   * @param {import('playwright').Page} page
   * @param {number} legIndex - Zero-based leg index (0=outbound, 1=inbound)
   * @returns {Promise<{ legIndex: number, index: number, brandName: string|null }>}
   */
  async selectBrandCardWithoutCheckedBaggageNewFlightFlow(page, legIndex) {
    if (!page) throw new Error('[FlightResults.selectBrandCardWithoutCheckedBaggageNewFlightFlow] "page" is required.');
    if (!Number.isInteger(legIndex) || legIndex < 0) {
      throw new Error(`[FlightResults.selectBrandCardWithoutCheckedBaggageNewFlightFlow] "legIndex" must be a non-negative integer, got: ${legIndex}`);
    }

    const NO_CHECKED_BAGGAGE_TEXT = 'Checked bag not included';
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForNewFlightFlowBrandCards(legIndex);
    await flightResultsPage.waitForLegBrandCardsToSettle(legIndex);

    const cards = await flightResultsPage.getLegBrandCardFeatureRows(legIndex);
    const index = cards.findIndex((card) =>
      card.features.some((f) => f.text === NO_CHECKED_BAGGAGE_TEXT && f.icon === 'close'),
    );

    if (index === -1) {
      const baggageRows = cards.map((card) => ({
        name: card.name,
        baggage: card.features.filter((f) => /bag/i.test(f.text)).map((f) => `${f.text} (${f.icon})`),
      }));
      throw new Error(
        `[FlightResults.selectBrandCardWithoutCheckedBaggageNewFlightFlow] No brand card on leg ${legIndex} shows ` +
        `"${NO_CHECKED_BAGGAGE_TEXT}". Cards: ${JSON.stringify(baggageRows)}`
      );
    }

    await flightResultsPage.clickNewFlightFlowBrandCard(legIndex, index);
    return { legIndex, index, brandName: cards[index].name };
  },

  async selectInboundBrandMatchingOutboundRules(page, timeout = 30000) {
    if (!page) throw new Error('[FlightResults.selectInboundBrandMatchingOutboundRules] "page" is required.');
    logger.info('[NewFlightFlow] Selecting inbound brand card with same cancellation and change rules as outbound');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const outboundBrandName = await flightResultsPage.getOutboundSelectedBrandName(timeout);
    const inboundNames = await flightResultsPage.getInboundBrandCardNames(timeout);
    const matchIndex = inboundNames.findIndex((n) => n === outboundBrandName);
    if (matchIndex === -1) {
      throw new Error(
        `[FlightResults.selectInboundBrandMatchingOutboundRules] No inbound brand card found with name "${outboundBrandName}". ` +
        `Available: [${inboundNames.map((n) => `"${n}"`).join(', ')}]`
      );
    }
    await flightResultsPage.clickInboundBrandCardAt(matchIndex, timeout);
  },

  async selectBrandsWithDifferentRulesAcrossLegs(page, timeout = 30000) {
    if (!page) throw new Error('[FlightResults.selectBrandsWithDifferentRulesAcrossLegs] "page" is required.');
    logger.info('[NewFlightFlow] Selecting outbound and inbound brands to produce mixed fare rules');
    const flightResultsPage = getPageObject(page, FlightResultsPage);

    const MAX_RESULTS_TO_TRY = 8;
    for (let resultIndex = 0; resultIndex < MAX_RESULTS_TO_TRY; resultIndex++) {
      if (resultIndex > 0) {
        // Current flight has no mixed-rules combination — close the drawer and try the next result.
        logger.info('[NewFlightFlow] No mixed rules combination found for this result, trying next', { resultIndex });
        await flightResultsPage.closeNFFDrawer();
        await flightResultsPage.clickSelectFlightButtonAt(resultIndex, timeout);
      }

      const outboundNames = await flightResultsPage.getOutboundBrandCardNames(timeout);
      for (let outboundIndex = 0; outboundIndex < outboundNames.length; outboundIndex++) {
        const outboundName = outboundNames[outboundIndex];
        if (!outboundName) continue;
        await flightResultsPage.clickNewFlightFlowBrandCard(0, outboundIndex);
        const inboundNames = await flightResultsPage.getInboundBrandCardNames(timeout);
        for (let inboundIndex = 0; inboundIndex < inboundNames.length; inboundIndex++) {
          const inboundName = inboundNames[inboundIndex];
          if (!inboundName) continue;
          await flightResultsPage.clickInboundBrandCardAt(inboundIndex, timeout);
          // Brand names alone don't determine fare rules — same-named brands can have different
          // rules across legs in NDC. Always check the warning after every combination.
          const warningVisible = await flightResultsPage.isChangeAndCancellationWarningVisible();
          if (warningVisible) {
            logger.info('[NewFlightFlow] Found mixed rules combination', { resultIndex, outboundBrand: outboundName, inboundBrand: inboundName });
            return { outboundBrand: outboundName, inboundBrand: inboundName };
          }
        }
      }
    }

    throw new Error(
      `[FlightResults.selectBrandsWithDifferentRulesAcrossLegs] No outbound+inbound combination with different fare rules found in the first ${MAX_RESULTS_TO_TRY} results.`
    );
  },

  async verifyChangeAndCancellationRulesWarningVisible(page, expectedMessage) {
    if (!page) throw new Error('[FlightResults.verifyChangeAndCancellationRulesWarningVisible] "page" is required.');
    if (!expectedMessage || typeof expectedMessage !== 'string') throw new Error('[FlightResults.verifyChangeAndCancellationRulesWarningVisible] "expectedMessage" must be a non-empty string.');
    logger.info('[NewFlightFlow] Verifying change and cancellation rules warning is displayed', { expectedMessage });
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const text = await flightResultsPage.getChangeAndCancellationWarningText();
    if (!text.includes(expectedMessage.trim())) {
      throw new Error(
        `[FlightResults.verifyChangeAndCancellationRulesWarningVisible] Warning visible but text does not match. ` +
        `Expected to include: "${expectedMessage.trim()}" — Got: "${text}"`
      );
    }
  },

  async verifyChangeAndCancellationRulesWarningNotVisible(page) {
    if (!page) throw new Error('[FlightResults.verifyChangeAndCancellationRulesWarningNotVisible] "page" is required.');
    logger.info('[NewFlightFlow] Verifying change and cancellation rules warning is not displayed');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForChangeAndCancellationWarningHidden();
  },

  /**
   * Starts capturing the next FlightPricingSelection API response (New Flight Flow brand-selection
   * pricing call). Call this BEFORE entering the brand cards. Returns the response promise for the
   * per-leg fare-rules cross-check.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<import('@playwright/test').Response>}
   */
  startCapturingPricingSelectionResponse(page) {
    if (!page) throw new Error('[FlightResults.startCapturingPricingSelectionResponse] "page" is required.');
    logger.info('[FareRulesPerLeg] Setting up FlightPricingSelection API response capture');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return flightResultsPage.capturePricingSelectionApiResponse();
  },

  /**
   * Verifies that, in the new-flight-flow brand cards, every leg's change and cancellation
   * badges reflect that leg's fare rules from the intercepted flightPricing response — i.e.
   * they are parsed per leg and never fall back to the generic "check fare rules" text when
   * the supplier response carries a conclusive rule for that leg (bug 79393).
   *
   * For each rendered brand card it matches the card to the response package with the same
   * per-leg brand name, computes the expected change/refund category from that package's
   * per-leg fare rules (segment-level, falling back to package-level exactly as the app does),
   * and asserts the rendered badge category matches.
   *
   * @param {import('playwright').Page} page
   * @param {Promise<import('@playwright/test').Response>} responsePromise - from startCapturingPricingSelectionResponse.
   * @returns {Promise<{legsChecked: number, cardsChecked: number, comparisons: Array<Object>}>}
   */
  async verifyPerLegFareRulesMatchPricingResponse(page, responsePromise) {
    if (!page) throw new Error('[FlightResults.verifyPerLegFareRulesMatchPricingResponse] "page" is required.');
    if (!responsePromise) {
      throw new Error('[FlightResults.verifyPerLegFareRulesMatchPricingResponse] "responsePromise" is required — call "I start intercepting the flight pricing selection response" before entering the brand cards.');
    }

    const body = await readJson(responsePromise);
    const results = pick(body, 'results', 'Results');
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error('[FlightResults.verifyPerLegFareRulesMatchPricingResponse] FlightPricingSelection response body has no results array.');
    }

    // Build the set of allowed change/refund category pairs per (leg, brand) from the response.
    // A brand can appear across packages with different per-leg fare rules, so we collect ALL
    // combinations the supplier actually returns for that brand on that leg — the rendered badge
    // must be one of them. legBrand[legIndex] = Map<normalizedBrandName, Set<"refundCat|changeCat">>.
    const legBrand = [];
    for (const pkg of results) {
      const segments = pick(pkg, 'Segments', 'segments') || [];
      for (let legIndex = 0; legIndex < segments.length; legIndex++) {
        const flights = pick(segments[legIndex] || {}, 'Flights', 'flights') || [];
        const brandName = pick(flights[0] || {}, 'BrandName', 'brandName') ?? null;
        if (!brandName) continue;
        const fareRules = getApplicableFareRulesForLeg(pkg, legIndex);
        const pair = `${expectedRefundCategory(fareRules)}|${expectedChangeCategory(fareRules)}`;
        if (!legBrand[legIndex]) legBrand[legIndex] = new Map();
        const key = normalizeBrandName(brandName);
        if (!legBrand[legIndex].has(key)) legBrand[legIndex].set(key, new Set());
        legBrand[legIndex].get(key).add(pair);
      }
    }

    const uiCards = await getPageObject(page, FlightResultsPage).getPerLegBrandCardFeatureTexts();
    if (uiCards.length === 0) {
      throw new Error('[FlightResults.verifyPerLegFareRulesMatchPricingResponse] No brand cards were read from the UI.');
    }

    logger.info('[FareRulesPerLeg] Cross-checking brand-card rules against FlightPricingSelection response', {
      responsePackages: results.length,
      uiCards: uiCards.length,
      legsInResponse: legBrand.length,
    });

    const comparisons = [];
    const mismatches = [];
    const legsSeen = new Set();
    let checkedCards = 0;

    for (const card of uiCards) {
      const { refundText, changeText } = splitFeatureTexts(card.featureTexts);
      const observedRefund = classifyRefundText(refundText);
      const observedChange = classifyChangeText(changeText);
      const observedPair = `${observedRefund}|${observedChange}`;
      const allowedForBrand = legBrand[card.legIndex]
        ? legBrand[card.legIndex].get(normalizeBrandName(card.brandName))
        : undefined;

      const record = {
        legIndex: card.legIndex,
        cardIndex: card.cardIndex,
        brandName: card.brandName,
        refundText,
        changeText,
        observedRefund,
        observedChange,
        allowed: allowedForBrand ? [...allowedForBrand] : null,
      };
      comparisons.push(record);
      legsSeen.add(card.legIndex);

      // A rendered badge must never be the generic fallback — the supplier response for this flow
      // is conclusive, so "check fare rules" on a leg is exactly the bug 79393 defect.
      if (observedRefund === RULE_CATEGORY.REFUND_CHECK_FARE_RULES || observedChange === RULE_CATEGORY.CHANGE_CHECK_FARE_RULES) {
        mismatches.push(
          `Leg ${card.legIndex} brand "${card.brandName}": rendered the generic "check fare rules" fallback ` +
          `(cancellation "${refundText}", change "${changeText}") — the per-leg fare rules were not parsed.`
        );
        continue;
      }

      if (!allowedForBrand) {
        logger.warn('[FareRulesPerLeg] UI brand card has no matching brand in the response for its leg — skipping cross-check', {
          legIndex: card.legIndex,
          brandName: card.brandName,
          responseBrandsForLeg: legBrand[card.legIndex] ? [...legBrand[card.legIndex].keys()] : [],
        });
        continue;
      }

      checkedCards++;
      if (!allowedForBrand.has(observedPair)) {
        mismatches.push(
          `Leg ${card.legIndex} brand "${card.brandName}": rendered rules { cancellation: "${refundText}" (${observedRefund}), ` +
          `change: "${changeText}" (${observedChange}) } do not match any per-leg fare rule the response returns for this brand ` +
          `(allowed: ${[...allowedForBrand].join(' , ')}).`
        );
      }
    }

    if (checkedCards === 0 && mismatches.length === 0) {
      throw new Error(
        '[FlightResults.verifyPerLegFareRulesMatchPricingResponse] No UI brand card could be matched to a response brand by name — cannot verify per-leg fare rules. ' +
        `UI brands: [${uiCards.map((c) => `L${c.legIndex}:${c.brandName}`).join(', ')}]`
      );
    }

    expect(
      mismatches.length,
      `Per-leg change/cancellation rules must reflect that leg's fare rules from the supplier response:\n${mismatches.join('\n')}`
    ).toBe(0);

    logger.info('[FareRulesPerLeg] All rendered brand cards reflect their per-leg fare rules', {
      legsChecked: legsSeen.size,
      cardsChecked: checkedCards,
    });

    return { legsChecked: legsSeen.size, cardsChecked: checkedCards, comparisons };
  },

  // ===== AIRPORT FILTER =====

  /**
   * Filters flight results by a single destination airport code by clicking its checkbox
   * in the airports filter panel. Works for single-leg (one-way) results where no
   * per-route toggle is rendered.
   *
   * @param {import('playwright').Page} page
   * @param {string} airportCode - IATA airport code to filter by (e.g. "EWR")
   * @returns {Promise<{airportCode: string}>}
   */
  async filterByAirportCode(page, airportCode) {
    if (!page) {
      throw new Error('[FlightResults.filterByAirportCode] "page" is required');
    }
    if (!airportCode || typeof airportCode !== 'string') {
      throw new Error(`[FlightResults.filterByAirportCode] "airportCode" must be a non-empty string, got: ${typeof airportCode}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const resultsPage = getPageObject(page, ResultsPage);

    await flightResultsPage.waitForFlightResults();
    logger.debug('[FlightResults.filterByAirportCode] Selecting airport checkbox', { airportCode });

    await flightResultsPage.selectAirportOptionByCode(airportCode);

    await Promise.any([
      flightResultsPage.waitForFlightResults(),
      resultsPage.waitForNoResultsTitle('No results found'),
    ]);

    return { airportCode };
  },

  /**
   * Verifies that the destination airport code of the first flight result matches the expected code.
   * Reads the arrival loc-code from the last segment of the first result card.
   *
   * @param {import('playwright').Page} page
   * @param {string} airportCode - Expected IATA destination code (e.g. "EWR")
   * @returns {Promise<{actualCode: string, expectedCode: string}>}
   */
  async verifyFirstFlightDestinationAirport(page, airportCode) {
    if (!page) {
      throw new Error('[FlightResults.verifyFirstFlightDestinationAirport] "page" is required');
    }
    if (!airportCode || typeof airportCode !== 'string') {
      throw new Error(`[FlightResults.verifyFirstFlightDestinationAirport] "airportCode" must be a non-empty string, got: ${typeof airportCode}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const expectedCode = airportCode.trim().toUpperCase();
    const actualCode = (await flightResultsPage.getFlightArrivalLocationCode(0)).toUpperCase();

    expect(
      actualCode,
      `[FlightResults.verifyFirstFlightDestinationAirport] Expected destination airport "${expectedCode}" but got "${actualCode}". ` +
      `The airport filter may not have applied correctly.`
    ).toBe(expectedCode);

    return { actualCode, expectedCode };
  },

  // ===== FILTER / SORT / COMPARISON TABLE =====

  /**
   * Clears every applied flight-result filter via the "Clear all" link.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{cleared: boolean}>}
   */
  async clearAllFilters(page) {
    if (!page) {
      throw new Error('[FlightResults.clearAllFilters] "page" is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const resultsPage = getPageObject(page, ResultsPage);

    logger.debug('[FlightResults.clearAllFilters] Clearing all flight-result filters');

    try {
      await flightResultsPage.clickClearAllFilters();
    } catch (err) {
      throw new Error(
        `[FlightResults.clearAllFilters] Failed to clear all flight-result filters. ` +
        `The "Clear all" control may be missing (no filters applied) or the results panel is not loaded. ` +
        `Original: ${err.message}`
      );
    }

    // Clearing filters re-runs the search results; wait for the list to settle.
    await Promise.any([
      flightResultsPage.waitForFlightResults(),
      resultsPage.waitForNoResultsTitle('No results found'),
    ]);

    return { cleared: true };
  },

  /**
   * Extracts the numeric price advertised on a quick-sort option (e.g. "Best", "Cheapest").
   * The quick-sort bar shows, for each sort option, the price of the top result once that
   * sort is applied — used to assert the first result reflects the selected sort.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} sortLabel - Sort option label (e.g. "Best", "Cheapest")
   * @returns {Promise<number>} The parsed sort-option price
   */
  async extractQuickSortOptionPrice(page, sortLabel) {
    if (!page) {
      throw new Error('[FlightResults.extractQuickSortOptionPrice] "page" is required');
    }
    if (!sortLabel || typeof sortLabel !== 'string') {
      throw new Error(`[FlightResults.extractQuickSortOptionPrice] "sortLabel" must be a non-empty string, got: ${typeof sortLabel}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    logger.debug('[FlightResults.extractQuickSortOptionPrice] Extracting quick-sort option price', { sortLabel });

    let price;
    try {
      price = await flightResultsPage.getQuickSortOptionPrice(sortLabel);
    } catch (err) {
      throw new Error(
        `[FlightResults.extractQuickSortOptionPrice] Failed to read the "${sortLabel}" quick-sort price. ` +
        `Verify "${sortLabel}" is an available sort option for the current result set. ` +
        `Original: ${err.message}`
      );
    }

    if (typeof price !== 'number' || Number.isNaN(price)) {
      throw new Error(
        `[FlightResults.extractQuickSortOptionPrice] Could not parse a numeric price from the "${sortLabel}" quick-sort option, got: ${price}`
      );
    }

    return price;
  },

  /**
   * Verifies a quick-sort option (Best / Cheapest / Quickest) advertises an average trip time,
   * i.e. its duration paragraph reads "Average: <h>h <m>m". The "Average:" prefix is asserted on
   * purpose: the store always fills a duration, but the prefix only renders for complete-trip
   * searches, so a bare duration means the average feature is not what is on screen.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} sortLabel - Sort option label (e.g. "Best")
   * @returns {Promise<{ text: string, minutes: number }>} The advertised text and its minutes
   */
  async verifyQuickSortOptionShowsAverageDuration(page, sortLabel) {
    if (!page) {
      throw new Error('[FlightResults.verifyQuickSortOptionShowsAverageDuration] "page" is required');
    }
    if (!sortLabel || typeof sortLabel !== 'string') {
      throw new Error(
        `[FlightResults.verifyQuickSortOptionShowsAverageDuration] "sortLabel" must be a non-empty string, got: ${typeof sortLabel}`
      );
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    logger.debug('[FlightResults.verifyQuickSortOptionShowsAverageDuration] Reading the quick-sort average trip time', { sortLabel });

    let average;
    try {
      average = await flightResultsPage.getQuickSortOptionAverageDuration(sortLabel);
    } catch (err) {
      throw new Error(
        `[FlightResults.verifyQuickSortOptionShowsAverageDuration] Failed to read the "${sortLabel}" quick-sort average ` +
        `trip time. Verify the results loaded on desktop and "${sortLabel}" is an available sort option. Original: ${err.message}`
      );
    }

    if (!/^Average:\s*(\d+h(\s\d+m)?|\d+m)$/.test(average.text)) {
      throw new Error(
        `[FlightResults.verifyQuickSortOptionShowsAverageDuration] The "${sortLabel}" quick-sort option shows "${average.text}", ` +
        `expected "Average: <h>h <m>m". A missing "Average:" prefix means the results are a by-schedule search, where the ` +
        `average trip time is intentionally not shown.`
      );
    }
    if (!Number.isInteger(average.minutes) || average.minutes <= 0) {
      throw new Error(
        `[FlightResults.verifyQuickSortOptionShowsAverageDuration] The "${sortLabel}" quick-sort average "${average.text}" ` +
        `parsed to ${average.minutes} minutes; a real itinerary average must be a positive whole number of minutes.`
      );
    }

    return average;
  },

  /**
   * Extracts, for every rendered flight result card, its leg durations and their average
   * (round(sum of leg minutes / leg count) - the same formula flight.store's
   * recalculateQuickSortBy applies to the flight each quick-sort option advertises).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<Array<{ index: number, legMinutes: number[], averageMinutes: number }>>}
   */
  async extractFlightResultAverageDurations(page) {
    if (!page) {
      throw new Error('[FlightResults.extractFlightResultAverageDurations] "page" is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    logger.debug('[FlightResults.extractFlightResultAverageDurations] Reading leg durations from the rendered result cards');

    let durationsPerCard;
    try {
      durationsPerCard = await flightResultsPage.getLegDurationsPerResult();
    } catch (err) {
      throw new Error(
        `[FlightResults.extractFlightResultAverageDurations] Failed to read leg durations from the flight result cards. ` +
        `Original: ${err.message}`
      );
    }

    if (!durationsPerCard.length) {
      throw new Error(
        '[FlightResults.extractFlightResultAverageDurations] No flight result cards were rendered, so no average trip ' +
        'time can be computed. Expected at least one result on the page.'
      );
    }

    return durationsPerCard.map((legMinutes, index) => {
      if (!legMinutes.length) {
        throw new Error(
          `[FlightResults.extractFlightResultAverageDurations] Result card ${index + 1} rendered no legs, so it has no ` +
          `average trip time. Every result card must show at least one leg.`
        );
      }
      const total = legMinutes.reduce((sum, minutes) => sum + minutes, 0);
      return { index, legMinutes, averageMinutes: Math.round(total / legMinutes.length) };
    });
  },

  /**
   * Verifies the average trip time a quick-sort option advertises equals the average of the leg
   * durations of the result it puts first. The option must be the active sort: the store computes
   * the tile from the flight that wins that sort, and only under that sort is that flight the
   * first card in the list.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} sortLabel - Sort option label (e.g. "Best")
   * @param {Array<{ index: number, legMinutes: number[], averageMinutes: number }>} resultAverages - From extractFlightResultAverageDurations
   * @returns {Promise<{ sortLabel: string, advertisedMinutes: number, firstResultAverageMinutes: number, legMinutes: number[] }>}
   */
  async verifyQuickSortAverageMatchesFirstResult(page, sortLabel, resultAverages) {
    if (!page) {
      throw new Error('[FlightResults.verifyQuickSortAverageMatchesFirstResult] "page" is required');
    }
    if (!sortLabel || typeof sortLabel !== 'string') {
      throw new Error(
        `[FlightResults.verifyQuickSortAverageMatchesFirstResult] "sortLabel" must be a non-empty string, got: ${typeof sortLabel}`
      );
    }
    if (!Array.isArray(resultAverages) || !resultAverages.length) {
      throw new Error(
        `[FlightResults.verifyQuickSortAverageMatchesFirstResult] "resultAverages" must be a non-empty array, got: ` +
        `${Array.isArray(resultAverages) ? 'empty array' : typeof resultAverages}`
      );
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    logger.debug('[FlightResults.verifyQuickSortAverageMatchesFirstResult] Comparing the quick-sort average with the first result', { sortLabel });

    let activeLabel;
    try {
      activeLabel = await flightResultsPage.getActiveQuickSortLabel();
    } catch (err) {
      throw new Error(
        `[FlightResults.verifyQuickSortAverageMatchesFirstResult] Could not read which quick-sort option is active. ` +
        `Original: ${err.message}`
      );
    }
    if (activeLabel.toLowerCase() !== sortLabel.toLowerCase()) {
      throw new Error(
        `[FlightResults.verifyQuickSortAverageMatchesFirstResult] The results are sorted by "${activeLabel}", not "${sortLabel}". ` +
        `The "${sortLabel}" tile describes the flight that wins that sort, which is only the first card while that sort is active.`
      );
    }

    let advertised;
    try {
      advertised = await flightResultsPage.getQuickSortOptionAverageDuration(sortLabel);
    } catch (err) {
      throw new Error(
        `[FlightResults.verifyQuickSortAverageMatchesFirstResult] Failed to read the "${sortLabel}" quick-sort average trip time. ` +
        `Original: ${err.message}`
      );
    }

    // Thrown rather than asserted with expect(): the numbers alone ("574 vs 561") say nothing about
    // which legs produced them, and this repo's Playwright drops expect's custom message, so the
    // leg breakdown would never reach the failure report.
    const first = resultAverages[0];
    if (first.averageMinutes !== advertised.minutes) {
      throw new Error(
        `[FlightResults.verifyQuickSortAverageMatchesFirstResult] The "${sortLabel}" option advertises "${advertised.text}" ` +
        `(${advertised.minutes} min) but the first result's legs [${first.legMinutes.join(', ')}] min average to ` +
        `${first.averageMinutes} min (round(${first.legMinutes.reduce((sum, m) => sum + m, 0)} / ${first.legMinutes.length} legs)). ` +
        `The tile must equal the average of the leg durations of the flight it advertises.`
      );
    }

    return {
      sortLabel,
      advertisedMinutes: advertised.minutes,
      firstResultAverageMinutes: first.averageMinutes,
      legMinutes: first.legMinutes,
    };
  },

  /**
   * Selects a carrier by clicking its logo in the comparison table, which filters results to
   * that carrier and re-sorts them by cheapest.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} carrierName - Carrier name shown in the logo tooltip (e.g. "Air Europa")
   * @returns {Promise<{carrierName: string}>}
   */
  async selectCarrierLogoFromComparison(page, carrierName) {
    if (!page) {
      throw new Error('[FlightResults.selectCarrierLogoFromComparison] "page" is required');
    }
    if (!carrierName || typeof carrierName !== 'string') {
      throw new Error(`[FlightResults.selectCarrierLogoFromComparison] "carrierName" must be a non-empty string, got: ${typeof carrierName}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const resultsPage = getPageObject(page, ResultsPage);

    logger.debug('[FlightResults.selectCarrierLogoFromComparison] Selecting carrier logo from comparison table', { carrierName });

    try {
      await flightResultsPage.clickComparisonCarrierLogo(carrierName);
    } catch (err) {
      throw new Error(
        `[FlightResults.selectCarrierLogoFromComparison] Failed to select the "${carrierName}" logo from the comparison table. ` +
        `Original: ${err.message}`
      );
    }

    // Selecting a comparison carrier re-filters the results; wait for the list to settle.
    await Promise.any([
      flightResultsPage.waitForFlightResults(),
      resultsPage.waitForNoResultsTitle('No results found'),
    ]);

    return { carrierName };
  },

  /**
   * Verifies that the carriers-filter checkbox for the given airline is checked.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} airlineName - Airline label text (e.g. "Air Europa")
   * @returns {Promise<{airlineName: string, checked: boolean}>}
   */
  async verifyAirlineCheckboxChecked(page, airlineName) {
    if (!page) {
      throw new Error('[FlightResults.verifyAirlineCheckboxChecked] "page" is required');
    }
    if (!airlineName || typeof airlineName !== 'string') {
      throw new Error(`[FlightResults.verifyAirlineCheckboxChecked] "airlineName" must be a non-empty string, got: ${typeof airlineName}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const checked = await flightResultsPage.isAirlineCheckboxChecked(airlineName);

    expect(
      checked,
      `[FlightResults.verifyAirlineCheckboxChecked] Expected the "${airlineName}" carriers-filter checkbox to be checked after selecting it from the comparison table, but it was not.`
    ).toBe(true);

    return { airlineName, checked };
  },

  /**
   * Reads one row of the "Preferred airlines" results filter by its 1-based position and returns
   * the airline plus its lowest-price text.
   *
   * The filter panel is fed from `resultMap[resultsIndex]`, which the app swaps as the displayed
   * leg changes, so a single call serves every leg -- the caller only decides which leg's values it
   * is storing. The price is read as displayed ("$1.2K") rather than parsed: the app abbreviates it
   * through getFormattedAbbreviatedPrice, so digits alone would not compare faithfully.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} position - 1-based row position in the Preferred airlines filter
   * @returns {Promise<{airline: string, price: string}>} Airline name and price text as displayed
   */
  async extractPreferredAirlinesFilterPrice(page, position) {
    if (!page) {
      throw new Error('[FlightResults.extractPreferredAirlinesFilterPrice] "page" is required');
    }
    if (!Number.isInteger(position) || position < 1) {
      throw new Error(
        `[FlightResults.extractPreferredAirlinesFilterPrice] "position" must be an integer >= 1, got: ${position}`
      );
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    logger.debug('[FlightResults.extractPreferredAirlinesFilterPrice] Reading Preferred airlines filter row', { position });

    // The filters re-render whenever the displayed leg changes, so settle the skeleton first --
    // otherwise the row read belongs to the previous leg.
    try {
      await flightResultsPage.waitForResultsSkeletonToFinish();
    } catch (err) {
      throw new Error(
        `[FlightResults.extractPreferredAirlinesFilterPrice] The results filters were still loading when ` +
        `reading Preferred airlines row ${position}. The displayed leg's results never finished rendering. ` +
        `Original: ${err.message}`
      );
    }

    let option;
    try {
      option = await flightResultsPage.getPreferredAirlinesFilterOptionByPosition(position);
    } catch (err) {
      throw new Error(
        `[FlightResults.extractPreferredAirlinesFilterPrice] Failed to read row ${position} of the ` +
        `"Preferred airlines" filter for the displayed leg. Verify the leg's results offer at least ` +
        `${position} carriers to filter by. Original: ${err.message}`
      );
    }

    logger.debug('[FlightResults.extractPreferredAirlinesFilterPrice] Read Preferred airlines filter row', {
      position,
      airline: option.airline,
      price: option.price,
    });

    return option;
  },

  /**
   * Asserts the "Preferred airlines" filter prices captured for one leg differ from those captured
   * for another -- the point of the by-schedule test: each leg is filtered on its own flights, so
   * its filter shows that leg's carrier prices, not the previous leg's.
   *
   * Compares the legs as a whole (all captured positions together) rather than position by
   * position: two legs can legitimately share a price at one position while still being different
   * result sets, and only an identical set of prices proves the filter never refreshed.
   *
   * @param {object} capturedPrices - Prices by leg key, e.g. { outbound: { 1: {...} }, inbound: {...} }
   * @param {string} firstLeg - Leg key captured first (e.g. "outbound")
   * @param {string} secondLeg - Leg key captured second (e.g. "inbound")
   * @returns {Promise<{firstLegPrices: string[], secondLegPrices: string[]}>}
   */
  async verifyPreferredAirlinesFilterPricesDifferBetweenLegs(capturedPrices, firstLeg, secondLeg) {
    if (!capturedPrices || typeof capturedPrices !== 'object') {
      throw new Error(
        `[FlightResults.verifyPreferredAirlinesFilterPricesDifferBetweenLegs] "capturedPrices" must be an object, got: ${typeof capturedPrices}`
      );
    }
    if (!firstLeg || typeof firstLeg !== 'string') {
      throw new Error(
        `[FlightResults.verifyPreferredAirlinesFilterPricesDifferBetweenLegs] "firstLeg" must be a non-empty string, got: ${typeof firstLeg}`
      );
    }
    if (!secondLeg || typeof secondLeg !== 'string') {
      throw new Error(
        `[FlightResults.verifyPreferredAirlinesFilterPricesDifferBetweenLegs] "secondLeg" must be a non-empty string, got: ${typeof secondLeg}`
      );
    }

    const readLeg = (legKey) => {
      const leg = capturedPrices[legKey];
      const positions = leg ? Object.keys(leg).map(Number).sort((a, b) => a - b) : [];
      if (!positions.length) {
        throw new Error(
          `[FlightResults.verifyPreferredAirlinesFilterPricesDifferBetweenLegs] No "${legKey}" Preferred ` +
          `airlines prices were captured. Run the extraction step for the "${legKey}" leg before asserting.`
        );
      }
      return { positions, entries: positions.map((position) => leg[position]) };
    };

    const first = readLeg(firstLeg);
    const second = readLeg(secondLeg);

    if (first.positions.join(',') !== second.positions.join(',')) {
      throw new Error(
        `[FlightResults.verifyPreferredAirlinesFilterPricesDifferBetweenLegs] The legs were captured at ` +
        `different filter positions ("${firstLeg}": ${first.positions.join(', ')}; "${secondLeg}": ` +
        `${second.positions.join(', ')}), so their prices are not comparable. Extract the same positions for both legs.`
      );
    }

    const describe = (legKey, leg) =>
      leg.positions.map((position, index) => {
        const entry = leg.entries[index];
        return `${legKey} #${position} ${entry.airline || 'unknown airline'}: ${entry.price}`;
      }).join(', ');

    const firstLegPrices = first.entries.map((entry) => entry.price);
    const secondLegPrices = second.entries.map((entry) => entry.price);

    expect(
      secondLegPrices.join(' | '),
      `[FlightResults.verifyPreferredAirlinesFilterPricesDifferBetweenLegs] The "Preferred airlines" filter ` +
      `showed identical prices for the "${firstLeg}" and "${secondLeg}" legs, so the filter did not refresh ` +
      `for the displayed leg. Captured -- ${describe(firstLeg, first)}; ${describe(secondLeg, second)}.`
    ).not.toBe(firstLegPrices.join(' | '));

    return { firstLegPrices, secondLegPrices };
  },

  /**
   * Extracts the displayed price of the first flight result as a number.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<number>} The first flight result price
   */
  async extractFirstFlightResultPrice(page) {
    if (!page) {
      throw new Error('[FlightResults.extractFirstFlightResultPrice] "page" is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const price = await flightResultsPage.getFirstFlightResultPriceValue();

    if (typeof price !== 'number' || Number.isNaN(price)) {
      throw new Error(
        `[FlightResults.extractFirstFlightResultPrice] Could not parse a numeric price from the first flight result, got: ${price}`
      );
    }

    return price;
  },

  /**
   * Verifies that the carriers-filter checkbox for the given airline is NOT checked.
   * Used after clearing filters to prove the previously-applied carrier filter was reset.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} airlineName - Airline label text (e.g. "Air Europa")
   * @returns {Promise<{airlineName: string, checked: boolean}>}
   */
  async verifyAirlineCheckboxNotChecked(page, airlineName) {
    if (!page) {
      throw new Error('[FlightResults.verifyAirlineCheckboxNotChecked] "page" is required');
    }
    if (!airlineName || typeof airlineName !== 'string') {
      throw new Error(`[FlightResults.verifyAirlineCheckboxNotChecked] "airlineName" must be a non-empty string, got: ${typeof airlineName}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const unchecked = await flightResultsPage.isAirlineCheckboxUnchecked(airlineName);

    expect(
      unchecked,
      `[FlightResults.verifyAirlineCheckboxNotChecked] Expected the "${airlineName}" carriers-filter checkbox to be unchecked after clearing all filters, but it remained checked — "clear all filters" did not reset the applied carrier filter.`
    ).toBe(true);

    return { airlineName, checked: false };
  },

  // Starts waiting for the flightSearch API response; wired into the generic intercept step
  // ("I start intercepting the \"flightSearch\" API response"). Call BEFORE the search.
  startCapturingSearchResponse(page) {
    return getPageObject(page, FlightResultsPage).captureSearchApiResponse();
  },

  /**
   * Asserts no flightSearch result flown by {carrier} (IATA code) came from the {source} source system —
   * a Joy "Carrier + Source System -> Hide Result" rule (79345: EI from YPSILON / office "Ypsilon Club" must
   * be hidden while EI from other sources remains). Fails if NO {carrier} result exists, so it never passes vacuously.
   */
  async verifyNoResultForCarrierFromSource(page, responsePromise, carrier, source) {
    if (!responsePromise) {
      throw new Error('[FlightResults.verifyNoResultForCarrierFromSource] no intercepted response — call the flightSearch intercept step before searching');
    }
    const wanted = String(carrier).toUpperCase();
    const forbidden = String(source).toUpperCase();

    const raw = await readJson(responsePromise);
    const body = Array.isArray(raw) ? raw[0] : raw;
    const results = Array.isArray(body?.results) ? body.results : [];

    const resultHasCarrier = (result) =>
      (Array.isArray(result?.segments) ? result.segments : []).some((seg) =>
        (Array.isArray(seg?.flights) ? seg.flights : []).some(
          (f) => String(f?.carrier ?? '').toUpperCase() === wanted
        )
      );
    const sourceOf = (result) => ({
      sourceSystem: String(result?.sourceSystem ?? '').toUpperCase(),
      officeId: String(result?.officeId ?? '').toUpperCase(),
    });
    const isFromForbidden = (result) => {
      const { sourceSystem, officeId } = sourceOf(result);
      return sourceSystem.includes(forbidden) || officeId.includes(forbidden);
    };

    const matching = results.filter(resultHasCarrier);
    const fromForbidden = matching.filter(isFromForbidden);

    // Distinct "sourceSystem / officeId" combos for the matched carrier, with counts
    const sourceBreakdown = {};
    for (const r of matching) {
      const { sourceSystem, officeId } = sourceOf(r);
      const key = `${sourceSystem} / ${officeId}`;
      sourceBreakdown[key] = (sourceBreakdown[key] || 0) + 1;
    }

    logger.info('Checked carrier/source display rule on flightSearch response', {
      totalResults: results.length,
      carrier: wanted,
      matchingCarrier: matching.length,
      forbiddenSource: forbidden,
      matchingFromForbidden: fromForbidden.length,
      sourceBreakdown,
    });

    expect(
      matching.length,
      `[FlightResults.verifyNoResultForCarrierFromSource] Expected at least one "${wanted}" result in the flightSearch response to verify its source, but found none (total results: ${results.length}). Cannot confirm the "${wanted}" hide-from-"${forbidden}" rule.`
    ).toBeGreaterThan(0);

    expect(
      fromForbidden.length,
      `[FlightResults.verifyNoResultForCarrierFromSource] Display-rule breach: ${fromForbidden.length} "${wanted}" result(s) came from the "${forbidden}" source and should be hidden. "${wanted}" source breakdown: ${JSON.stringify(sourceBreakdown)}.`
    ).toBe(0);

    return { totalResults: results.length, matchingCarrier: matching.length, matchingFromForbidden: 0 };
  },

  /**
   * Verifies every displayed leg departure time falls inside the searched time frame.
   *
   * The advanced-search time frame constrains each leg's DEPARTURE, so the check reads the
   * first .flight-time of every leg on the result cards.
   *
   * WARN — the frame is matched at HOUR granularity, i.e. "Afternoon (11:00-17:00)" accepts
   * 11:00 through 17:59, not 17:00 sharp. The app does not filter client-side: it sends the
   * frame to the supplier as a preferred time plus a window in whole hours
   * (Afternoon = timeString '1400' + deltaInHours 3, flight/models/consts.ts), and Amadeus
   * applies that window per hour bucket, so the whole 17:00 hour comes back (observed: 17:10
   * on a BRU-BCN afternoon search). Minute-exact bounds would fail on that boundary hour for
   * a supplier behaviour the app cannot control. This still fails loudly on results genuinely
   * outside the frame — an unfiltered BRU-BCN search returns a 06:40 inbound leg.
   *
   * @param {import('playwright').Page} page
   * @param {Object} timeFrame - Resolved frame from FlightSearch.resolveTimeFrame
   * @param {number} timeFrame.minHour - Window start hour, e.g. 11
   * @param {number} timeFrame.maxHour - Window end hour, e.g. 17
   * @param {string} [timeFrame.label] - Dropdown label, used in failure messages
   * @param {Object} [options]
   * @param {number} [options.maxCards] - How many result cards to check (default: 5)
   * @returns {Promise<{checked: number, departures: Array<{cardIndex: number, legIndex: number, time: string}>}>}
   */
  async verifyResultsDepartureTimesMatchTimeFrame(page, timeFrame, { maxCards = 5 } = {}) {
    if (!page) throw new Error('[FlightResults.verifyResultsDepartureTimesMatchTimeFrame] "page" is required.');
    const { minHour, maxHour, label } = timeFrame ?? {};
    if (!Number.isFinite(minHour) || !Number.isFinite(maxHour)) {
      throw new Error(
        '[FlightResults.verifyResultsDepartureTimesMatchTimeFrame] "timeFrame" must carry numeric minHour/maxHour ' +
        `(from FlightSearch.resolveTimeFrame), got: ${JSON.stringify(timeFrame)}`
      );
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const departures = await flightResultsPage.getResultsLegDepartureTimes({ maxCards });

    const frameText = label ?? `${minHour}:00-${maxHour}:00`;

    const outOfRange = [];
    for (const departure of departures) {
      const hour = Math.floor(parseTimeOfDayToMinutes(departure.time) / 60);
      if (hour < minHour || hour > maxHour) {
        outOfRange.push(departure);
      }
    }

    logger.info('Verified results departure times against the searched time frame', {
      timeFrame: frameText,
      acceptedHours: `${minHour}:00-${maxHour}:59`,
      checked: departures.length,
      outOfRange: outOfRange.length,
    });

    expect(
      outOfRange,
      `[FlightResults.verifyResultsDepartureTimesMatchTimeFrame] ${outOfRange.length} of ${departures.length} leg ` +
      `departure time(s) fall outside the searched time frame "${frameText}" (accepted at hour granularity: ` +
      `${minHour}:00-${maxHour}:59): ` +
      `${outOfRange.map((d) => `card ${d.cardIndex + 1} leg ${d.legIndex + 1} departs ${d.time}`).join('; ')}. ` +
      `All departures read: ${departures.map((d) => d.time).join(', ')}.`
    ).toEqual([]);

    return { checked: departures.length, departures };
  },

  /**
   * Captures the first result card's per-leg departure time, departure date and arrival time, so a
   * later step can hold the flight details drawer to what the results promised.
   *
   * Distinct from extractFirstFlightResultSegmentDetails, which feeds a strict deep-equality check
   * against the cart (test 42070) and therefore cannot grow a field.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<Array<{departureTime: string, departureDate: string, arrivalTime: string}>>}
   */
  async extractFirstResultLegTimeDates(page) {
    if (!page) {
      throw new Error('[FlightResults.extractFirstResultLegTimeDates] "page" is required.');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const legs = await flightResultsPage.getFirstResultLegTimeDates();

    logger.info('Captured the first result card leg times and dates', { legs });

    return legs;
  },

  /**
   * Verifies that the dates in the flight details drawer are the dates the results card showed
   * for the same itinerary.
   *
   * This is the drawer-vs-results comparison ADO 28992 asks for: the dates the results card showed
   * are what the traveler picked from, so the drawer must render the same ones. It does not compare
   * against the search input, so a timezone bug that shifted BOTH surfaces by the same day would
   * pass here — the manual test only asks that the two surfaces agree.
   *
   * Compares the leg DEPARTURE date only: an overnight leg legitimately arrives on another date.
   * Both sides are read by parseFlightDate, so a difference in rendered FORMAT cannot fail this.
   *
   * @param {import('playwright').Page} page
   * @param {Array<{departureDate: string}>} expectedLegs - Per-leg results-card dates, outbound first.
   * @returns {Promise<{compared: number, legs: Array<{results: string, details: string}>}>}
   */
  async verifyFlightDetailsDatesMatchResultsDates(page, expectedLegs) {
    if (!page) {
      throw new Error('[FlightResults.verifyFlightDetailsDatesMatchResultsDates] "page" is required.');
    }

    if (!Array.isArray(expectedLegs) || expectedLegs.length === 0) {
      throw new Error(
        '[FlightResults.verifyFlightDetailsDatesMatchResultsDates] "expectedLegs" must be a non-empty ' +
        `array of per-leg results-card dates, got: ${typeof expectedLegs} (${JSON.stringify(expectedLegs)}).`
      );
    }

    expectedLegs.forEach((leg, index) => {
      if (!leg || !leg.departureDate) {
        throw new Error(
          `[FlightResults.verifyFlightDetailsDatesMatchResultsDates] "expectedLegs[${index}]" must carry ` +
          `a departureDate, got: ${JSON.stringify(leg)}.`
        );
      }
    });

    logger.debug('Reading the flight details drawer leg dates', { expectedLegCount: expectedLegs.length });

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const renderedLegs = await flightResultsPage.getFlightDetailsLegTimeDates();

    logger.info('Comparing flight details dates against the results card dates', {
      resultsDates: expectedLegs.map((leg) => leg.departureDate),
      detailsDepartures: renderedLegs.map((leg) => leg.departure),
    });

    expect(
      renderedLegs.length,
      `The flight details drawer rendered ${renderedLegs.length} leg(s) but the results card showed ` +
      `${expectedLegs.length}. ` +
      `Results dates: ${expectedLegs.map((leg) => leg.departureDate).join(' | ')}. ` +
      `Drawer departures: ${renderedLegs.map((leg) => leg.departure).join(' | ')}.`
    ).toBe(expectedLegs.length);

    const mismatches = [];
    const legs = [];

    expectedLegs.forEach((expected, index) => {
      const rendered = renderedLegs[index].departure;
      const legLabel = index === 0 ? 'outbound' : index === 1 ? 'inbound' : `leg ${index + 1}`;

      legs.push({ results: expected.departureDate, details: rendered });

      const expectedDate = parseFlightDate(expected.departureDate);
      const actualDate = parseDrawerTimeDate(rendered);

      if (!expectedDate) {
        mismatches.push(
          `${legLabel}: could not parse the results card date "${expected.departureDate}"`
        );
        return;
      }

      if (!actualDate) {
        mismatches.push(
          `${legLabel}: could not parse the drawer's departure line "${rendered}" — expected the ` +
          'form "20:05 · Fri, 16 Oct 26"'
        );
        return;
      }

      // Year only when both sides render one — the drawer and the results card are free to differ
      // in whether they show it, and that is not what this asserts.
      const yearsComparable = expectedDate.year !== null && actualDate.year !== null;
      const sameDate = expectedDate.day === actualDate.day
        && expectedDate.month === actualDate.month
        && (!yearsComparable || expectedDate.year === actualDate.year);

      if (!sameDate) {
        mismatches.push(
          `${legLabel}: results show "${expected.departureDate}" but flight details show ` +
          `"${actualDate.dateText}"`
        );
      }
    });

    expect(
      mismatches,
      `Flight details dates do not match the results card dates. ${mismatches.join('; ')}.`
    ).toEqual([]);

    return { compared: expectedLegs.length, legs };
  },

  /**
   * Verifies that the departure and arrival times in the flight details drawer are the times the
   * results card showed for the same itinerary (ADO 28992).
   *
   * WHY THIS CAN DRIFT: both surfaces render the same instant client-side, but through different
   * code — the results card and the drawer each resolve the user's time pattern separately. A
   * change that makes one of them parse a full local-time string while the other does not shows
   * up here as a two-surface disagreement, which under an @timezone tag is what a timezone
   * regression looks like.
   *
   * COMPARED AT MINUTE GRANULARITY via parseTimeToMinutes, so "09:15" and "9:15 AM" are equal.
   * The two surfaces are free to differ in FORMAT — that is not what this asserts — and only a
   * difference in the actual time fails.
   *
   * @param {import('playwright').Page} page
   * @param {Array<{departureTime: string, arrivalTime: string}>} expectedLegs - Per-leg times as
   *   captured from the results card by extractFirstFlightResultSegmentDetails, outbound first.
   * @returns {Promise<{compared: number, legs: Array<object>}>}
   */
  async verifyFlightDetailsTimesMatchResultsTimes(page, expectedLegs) {
    if (!page) {
      throw new Error('[FlightResults.verifyFlightDetailsTimesMatchResultsTimes] "page" is required.');
    }

    if (!Array.isArray(expectedLegs) || expectedLegs.length === 0) {
      throw new Error(
        '[FlightResults.verifyFlightDetailsTimesMatchResultsTimes] "expectedLegs" must be a non-empty ' +
        `array of per-leg times captured from the results card, got: ${typeof expectedLegs} ` +
        `(${JSON.stringify(expectedLegs)}).`
      );
    }

    expectedLegs.forEach((leg, index) => {
      if (!leg || !leg.departureTime || !leg.arrivalTime) {
        throw new Error(
          `[FlightResults.verifyFlightDetailsTimesMatchResultsTimes] "expectedLegs[${index}]" must carry ` +
          `both departureTime and arrivalTime, got: ${JSON.stringify(leg)}.`
        );
      }
    });

    logger.debug('Reading the flight details drawer leg times', { expectedLegCount: expectedLegs.length });

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const renderedLegs = await flightResultsPage.getFlightDetailsLegTimeDates();

    logger.info('Comparing flight details times against the results card times', {
      resultsLegs: expectedLegs.map((leg) => `${leg.departureTime} - ${leg.arrivalTime}`),
      detailsLegs: renderedLegs.map((leg) => `${leg.departure} - ${leg.arrival}`),
    });

    expect(
      renderedLegs.length,
      `The flight details drawer rendered ${renderedLegs.length} leg(s) but the results card showed ` +
      `${expectedLegs.length}. A round trip must render both legs in the drawer. ` +
      `Results: ${expectedLegs.map((leg) => `${leg.departureTime}-${leg.arrivalTime}`).join(' | ')}. ` +
      `Drawer: ${renderedLegs.map((leg) => `${leg.departure} / ${leg.arrival}`).join(' | ')}.`
    ).toBe(expectedLegs.length);

    // Minute-of-day on both sides, so a format difference between the two surfaces cannot fail the
    // test while a real one-hour or one-day shift still does.
    const toMinutes = (value, legIndex, which) => {
      try {
        return parseTimeToMinutes(value);
      } catch (error) {
        throw new Error(
          `[FlightResults.verifyFlightDetailsTimesMatchResultsTimes] Could not parse the ${which} time ` +
          `"${value}" on leg ${legIndex + 1}. The app renders times as HH:mm or h:mm AM/PM; anything ` +
          `else means the time element now holds different text. Original: ${error.message}`
        );
      }
    };

    const mismatches = [];
    const legs = [];

    expectedLegs.forEach((expected, index) => {
      const rendered = renderedLegs[index];
      const legLabel = index === 0 ? 'outbound' : index === 1 ? 'inbound' : `leg ${index + 1}`;

      const departure = parseDrawerTimeDate(rendered.departure);
      const arrival = parseDrawerTimeDate(rendered.arrival);

      // Recorded before the parse guard returns, so the caller's diagnostics list every leg that
      // was looked at — including one whose text could not be parsed.
      legs.push({
        leg: index + 1,
        results: expected,
        details: departure && arrival
          ? { departureTime: departure.time, arrivalTime: arrival.time }
          : { raw: { departure: rendered.departure, arrival: rendered.arrival } },
      });

      if (!departure || !arrival) {
        mismatches.push(
          `${legLabel}: could not parse the drawer's time lines ` +
          `("${rendered.departure}" / "${rendered.arrival}") — expected the form "20:05 · Fri, 16 Oct 26"`
        );
        return;
      }

      // "06:20 +1" on the card and "06:20 · Sat, 24 Oct 26" in the drawer are the same arrival
      // stated two ways. The clock times are compared directly; the "+1" becomes the number of
      // days the drawer's arrival date must sit past its departure date, checked below.
      const expectedDeparture = splitResultsDayOffset(expected.departureTime);
      const expectedArrival = splitResultsDayOffset(expected.arrivalTime);

      if (toMinutes(expectedDeparture.time, index, 'results departure')
        !== toMinutes(departure.time, index, 'drawer departure')) {
        mismatches.push(
          `${legLabel} departure: results show "${expected.departureTime}" but flight details show ` +
          `"${departure.time}"`
        );
      }

      if (toMinutes(expectedArrival.time, index, 'results arrival')
        !== toMinutes(arrival.time, index, 'drawer arrival')) {
        mismatches.push(
          `${legLabel} arrival: results show "${expected.arrivalTime}" but flight details show ` +
          `"${arrival.time}"`
        );
      }

      // Skipped, not failed, when the drawer omits a year on either line: the offset cannot be
      // computed without one, and a rendering that shows no year is a formatting choice, not the
      // date defect this is looking for.
      const renderedOffset = daysBetweenParsedDates(departure, arrival);
      const expectedOffset = expectedArrival.dayOffset - expectedDeparture.dayOffset;

      if (renderedOffset !== null && renderedOffset !== expectedOffset) {
        mismatches.push(
          `${legLabel} arrival date: results show "${expected.arrivalTime}" — ` +
          `${expectedOffset === 0 ? 'the same day as departure' : `${expectedOffset} day(s) after departure`} — ` +
          `but flight details depart "${departure.dateText}" and arrive "${arrival.dateText}", ` +
          `${renderedOffset} day(s) apart`
        );
      }
    });

    expect(
      mismatches,
      `Flight details times do not match the results card times. ${mismatches.join('; ')}.`
    ).toEqual([]);

    return { compared: expectedLegs.length, legs };
  },

  /**
   * Reads what the airline actually filed for each brand of each leg, out of the Amadeus NDC offer
   * payloads the trip logged.
   *
   * This is the oracle for bug 84752. It deliberately does not read the app's own
   * FlightPricingSelection response: that response carries the values the app already derived, so a
   * card rendered from a wrong derivation matches it perfectly. Only the supplier payload says what
   * the airline filed, which is what the card is supposed to reflect.
   *
   * Facts are gathered per (leg, brand) across every offer that carries that brand on that leg, and
   * kept as the distinct values seen rather than a single value. When the offers disagree there is
   * no way to know which one fed the card, so the caller skips that brand instead of guessing -
   * which keeps the check honest rather than green by luck.
   *
   * @param {object} world - Cucumber world (carries the trip id)
   * @returns {Promise<{legs: Array<{legIndex: number, brands: object}>, callsRead: number}>}
   */
  async captureAmadeusNdcBrandOffers(world) {
    if (!world) {
      throw new Error('[FlightResults.captureAmadeusNdcBrandOffers] world is required');
    }

    const { perCall } = await PayloadValidation.collectXmlBlockTreesPerCall(
      world,
      NDC_OFFER_REQUEST_TYPE,
      {
        PriceClass: { fields: ['PriceClassID', 'Name'] },
        PaxJourney: { fields: ['PaxJourneyID', 'PaxSegmentRefID'] },
        ServiceDefinition: { fields: ['ServiceDefinitionID', 'Name', 'DescText'] },
        // Read through the list element: an offer carries BaggageAllowance blocks of its own, and
        // reading the tag at the top level would mix the definitions with the references to them.
        BaggageAllowanceList: {
          blocks: { BaggageAllowance: { fields: ['BaggageAllowanceID', 'TypeCode', 'TotalQty'] } },
        },
        Offer: {
          fields: ['OfferID', 'TotalAmount'],
          blocks: {
            JourneyPriceClass: { fields: ['PaxJourneyRefID', 'PriceClassRefID'] },
            BaggageAllowance: { fields: ['BaggageAllowanceRefID', 'PaxJourneyRefID'] },
            FareComponent: {
              fields: ['SegmentRefs'],
              blocks: {
                Penalty: {
                  attributes: ['CancelFeeInd', 'ChangeFeeInd'],
                  blocks: { Detail: { fields: ['Type', 'Application', 'CurrencyAmountValue'] } },
                },
              },
            },
            Service: {
              blocks: { ServiceDefinitionRef: { fields: ['ServiceDefinitionRefID', 'PaxSegmentRefID'] } },
            },
          },
        },
      },
      { source: 'response', purpose: 'read the brand rules the airline filed' }
    );

    const legs = [];
    const legFor = (legIndex) => {
      while (legs.length <= legIndex) legs.push({ legIndex: legs.length, brands: {} });
      return legs[legIndex];
    };

    for (const call of perCall) {
      // Ids are numbered per response, so every lookup below resolves within this call only.
      const brandOfPriceClass = new Map(
        call.PriceClass.map((pc) => [first(pc.PriceClassID), first(pc.Name)])
      );
      const segmentsOfJourney = new Map(
        call.PaxJourney.map((journey) => [first(journey.PaxJourneyID), journey.PaxSegmentRefID])
      );
      const journeyOrder = call.PaxJourney.map((journey) => first(journey.PaxJourneyID));
      const seatServiceIds = new Set(
        call.ServiceDefinition
          .filter((definition) => /seat/i.test(`${first(definition.Name)} ${first(definition.DescText)}`))
          .map((definition) => first(definition.ServiceDefinitionID))
      );
      // Only piece-based checked allowances: a weight-based one (23KG) files no TotalQty and the
      // card quotes it in kilos, which is a different comparison and not what this reads.
      const checkedPiecesOfAllowance = new Map(
        call.BaggageAllowanceList
          .flatMap((list) => list.BaggageAllowance)
          .filter((bag) => first(bag.TypeCode) === 'CheckedBag' && first(bag.TotalQty) !== null)
          .map((bag) => [first(bag.BaggageAllowanceID), first(bag.TotalQty)])
      );

      for (const offer of call.Offer) {
        const brandByJourney = new Map(
          offer.JourneyPriceClass.map((entry) => [
            first(entry.PaxJourneyRefID),
            brandOfPriceClass.get(first(entry.PriceClassRefID)) || null,
          ])
        );
        const brandsInOffer = new Set([...brandByJourney.values()].filter(Boolean));
        const totalAmount = first(offer.TotalAmount);

        for (const [journeyId, brandName] of brandByJourney) {
          const legIndex = journeyOrder.indexOf(journeyId);
          const segments = segmentsOfJourney.get(journeyId) || [];
          if (legIndex < 0 || !brandName || segments.length === 0) continue;

          // Only components wholly within this leg: one spanning both legs says nothing about
          // either card on its own, and attributing it to one of them would invent a rule.
          const components = offer.FareComponent.filter((component) =>
            component.SegmentRefs.length > 0 &&
            component.SegmentRefs.every((reference) => segments.includes(reference))
          );
          if (components.length === 0) continue;

          const penalties = components.flatMap((component) => component.Penalty);
          const changeDetails = penalties
            .flatMap((penalty) => penalty.Detail)
            .filter((detail) => /^change$/i.test(first(detail.Type)) && first(detail.Application) === BEFORE_DEPARTURE);

          const seatSegments = offer.Service
            .flatMap((service) => service.ServiceDefinitionRef)
            .filter((reference) => seatServiceIds.has(first(reference.ServiceDefinitionRefID)))
            .flatMap((reference) => reference.PaxSegmentRefID);

          // Bound to this journey only: the QA section's case is an offer whose 2PC is bound to PJ1
          // alone, where the outbound card must show 2PC and the return's own allowance must not.
          const checkedPieces = offer.BaggageAllowance
            .filter((reference) =>
              reference.PaxJourneyRefID.includes(journeyId) &&
              checkedPiecesOfAllowance.has(first(reference.BaggageAllowanceRefID))
            )
            .map((reference) => checkedPiecesOfAllowance.get(first(reference.BaggageAllowanceRefID)));

          // Keyed by price, not by brand name alone: one leg can carry two cards with the same
          // brand name and different fares - the bug's own trip has Light at 569.74 with no
          // penalties filed beside Light at 737.74 with them. Merging those two hides the defect.
          const key = `${brandName}|${totalAmount}`;
          const brand = legFor(legIndex).brands[key] || {
            brandName,
            totalAmount,
            offers: 0,
            filedRules: new Set(),
            changeFeeInd: new Set(),
            changeAmounts: new Set(),
            seatGranted: new Set(),
            checkedPieces: new Set(),
            spansTwoBrands: false,
          };
          brand.offers += 1;
          brand.filedRules.add(penalties.length > 0);
          for (const penalty of penalties) brand.changeFeeInd.add(penalty.ChangeFeeInd);
          for (const detail of changeDetails) {
            for (const amount of detail.CurrencyAmountValue) brand.changeAmounts.add(amount);
          }
          brand.seatGranted.add(segments.every((segment) => seatSegments.includes(segment)));
          // One entry per offer, so an offer binding no checked allowance to this leg is recorded
          // as such rather than silently leaving the brand looking like it files nothing.
          brand.checkedPieces.add(checkedPieces.length === 1 ? checkedPieces[0] : null);
          if (brandsInOffer.size > 1) brand.spansTwoBrands = true;
          legFor(legIndex).brands[key] = brand;
        }
      }
    }

    logger.info('[NdcBrandOffers] Read the brand rules the airline filed', {
      callsRead: perCall.length,
      legs: legs.map((leg) => ({
        legIndex: leg.legIndex,
        brands: Object.values(leg.brands).map((brand) =>
          `${brand.brandName} @${brand.totalAmount}: offers=${brand.offers} filedRules=[${[...brand.filedRules]}] ` +
          `changeFeeInd=[${[...brand.changeFeeInd]}] changeAmounts=[${[...brand.changeAmounts]}] ` +
          `seat=[${[...brand.seatGranted]}] checkedPieces=[${[...brand.checkedPieces]}]` +
          `${brand.spansTwoBrands ? ' spansTwoBrands' : ''}`
        ),
      })),
    });

    // A healthy trip answers every offer call with at least one offer. When some come back with
    // none, the airline did not price part of the screen - and the screen degrades with it, showing
    // "check fare rules" where the one call that did answer filed a fee. Judging the cards against
    // the surviving calls would then blame the product for the supplier's outage, so say what
    // happened instead: this is an environment condition, not a defect in what is on screen.
    const callsWithNoOffer = perCall.filter((call) => call.Offer.length === 0).length;
    if (callsWithNoOffer > 0) {
      throw new Error(
        `[FlightResults.captureAmadeusNdcBrandOffers] ${callsWithNoOffer} of ${perCall.length} Amadeus NDC offer ` +
        'responses carried no offer at all, so what the airline filed for this screen is only partly known and the ' +
        'brand cards cannot be judged against it. This is a supplier/environment condition - the screen itself may ' +
        'be rendering the incomplete data correctly. Re-run once the supplier answers in full.'
      );
    }

    if (legs.length === 0) {
      throw new Error(
        '[FlightResults.captureAmadeusNdcBrandOffers] No brand offers were read from the Amadeus NDC offer payloads. ' +
        'Either the trip logged no offer payload or its structure changed.'
      );
    }

    return { legs, callsRead: perCall.length };
  },

  /**
   * Reads every brand card of the pricing options screen, walking the cabin class tabs so the
   * cards of every cabin are seen and not only the one the screen happens to open on.
   *
   * Without this the read is silently partial: the screen opens on Economy, so a Business brand is
   * never rendered and a check over "every card" quietly skips it. Bug 84752 reported the same seat
   * defect on Premium Flex and on Business Flex, and only the first is reachable without switching.
   *
   * A leg priced in a single cabin renders no tabs at all, which is not an error - the cards on
   * screen are then already all of them.
   *
   * The return leg is read too. Its cards only render once an outbound brand is picked, so leaving
   * it out means half the fares of a round trip are never judged - and the filed data differs per
   * leg, which is the whole point of reading it per journey.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{cards: Array<object>, cabinsRead: string[], legsRead: number[]}>}
   */
  async readBrandCardsAcrossCabinTabs(page) {
    if (!page) {
      throw new Error('[FlightResults.readBrandCardsAcrossCabinTabs] page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const cards = [];
    const seen = new Set();
    const cabinsRead = [];
    const legsRead = [];

    const sweepLeg = async (legIndex) => {
      const tabNames = await flightResultsPage.getNewFlightFlowCabinClassTabNames(legIndex).catch(() => []);
      for (const cabinName of tabNames.length > 0 ? tabNames : [null]) {
        if (cabinName) {
          await this.selectCabinClassTabNewFlightFlow(page, cabinName, legIndex);
          cabinsRead.push(`L${legIndex} ${cabinName}`);
        }
        for (const card of await flightResultsPage.getPerLegBrandCardFeatureTexts()) {
          // Price is part of the key: two cards on one leg can share a brand name and differ only
          // in fare, and dropping one of them as a duplicate is dropping the card under test.
          const key = `${card.legIndex}|${normalizeBrandName(card.brandName)}|${card.priceText}`;
          if (seen.has(key)) continue;
          seen.add(key);
          cards.push({ ...card, cabinName });
        }
      }
      if (!legsRead.includes(legIndex)) legsRead.push(legIndex);
    };

    await sweepLeg(0);

    // Picking an outbound brand is what makes the return leg render, and which return fares are
    // then offered depends on which outbound brand was picked. A caller that already picked one
    // keeps its choice; otherwise the first card stands in. A one-way search has no second leg to
    // wait for, so a timeout here is the end of the read, not a failure.
    let inboundRendered = await flightResultsPage
      .waitForNewFlightFlowBrandCards(INBOUND_LEG_INDEX, 5000)
      .then(() => true)
      .catch(() => false);
    if (!inboundRendered) {
      await this.selectOutboundFirstBrandCardNewFlightFlow(page);
      inboundRendered = await flightResultsPage
        .waitForNewFlightFlowBrandCards(INBOUND_LEG_INDEX, 60000)
        .then(() => true)
        .catch(() => false);
    }
    if (inboundRendered) {
      await sweepLeg(INBOUND_LEG_INDEX);
    } else {
      logger.info('[NdcBrandOffers] No return leg rendered - reading the outbound only');
    }

    logger.info('[NdcBrandOffers] Read the brand cards of every cabin', {
      legsRead,
      cabinsRead,
      cards: cards.map((card) => `L${card.legIndex} ${card.brandName} ${card.priceText}`),
    });

    return { cards, cabinsRead, legsRead };
  },

  /**
   * Bug 84752: the change and cancellation badges on each brand card must reflect the penalties the
   * airline filed for that brand on that leg.
   *
   * Three things are asserted, each only where the filed data is unambiguous:
   *  - the airline filed no penalty at all -> the card must say "check fare rules", which is how the
   *    front end renders "no info". Rendering "Non-refundable" / "Changes not allowed" there is the
   *    reported defect, and it fails in the risky direction: it tells a traveller a fare is locked
   *    when nothing is known about it.
   *  - a change fee is filed -> the card must show that amount.
   *  - changes are filed as free -> the card must say "fare difference only".
   *
   * @param {import('playwright').Page} page
   * @param {object} world
   * @returns {Promise<{cardsChecked: number, assertions: number}>}
   */
  async verifyBrandCardRulesMatchNdcPenalties(page, world) {
    if (!page) {
      throw new Error('[FlightResults.verifyBrandCardRulesMatchNdcPenalties] page is required');
    }

    const { cards, legsRead } = await this.readBrandCardsAcrossCabinTabs(page);
    const { legs } = await this.captureAmadeusNdcBrandOffers(world);
    if (cards.length === 0) {
      throw new Error('[FlightResults.verifyBrandCardRulesMatchNdcPenalties] No brand cards were read from the UI.');
    }

    const mismatches = [];
    const skipped = [];
    let cardsChecked = 0;
    let assertions = 0;

    for (const card of cards) {
      // Outbound only. The front end builds these two badges from the pricing option PACKAGE
      // (extractRefundFeature/extractChangeFeature take nothing else), while seat and baggage are
      // built per segment - so once an outbound brand is picked, the return cards quote the chosen
      // combination's rule rather than the return leg's own. Measured: with Light picked outbound,
      // the return Standard card reads its 300.00 where the airline filed 150 for that leg.
      // Whether that is intended is a product question; asserting the leg's own figure there would
      // be asserting a mapping nobody has stated.
      if (card.legIndex !== 0) {
        skipped.push(
          `Leg ${card.legIndex} brand "${card.brandName}": change and cancellation badges are package-level, not per leg`
        );
        continue;
      }

      const brand = findFiledBrand(legs, card);
      if (!brand) {
        skipped.push(`leg ${card.legIndex} "${card.brandName}": no offer in the payload carries this brand on this leg`);
        continue;
      }

      const { refundText, changeText } = splitFeatureTexts(card.featureTexts);
      const observedRefund = classifyRefundText(refundText);
      const observedChange = classifyChangeText(changeText);
      const where = `Leg ${card.legIndex} brand "${card.brandName}"`;
      cardsChecked++;

      const filedRules = onlyValue(brand.filedRules);
      if (filedRules === false) {
        assertions++;
        if (observedRefund !== RULE_CATEGORY.REFUND_CHECK_FARE_RULES || observedChange !== RULE_CATEGORY.CHANGE_CHECK_FARE_RULES) {
          mismatches.push(
            `${where}: the airline filed no penalty at all for this brand, so both badges must read ` +
            `"check fare rules", but the card reads cancellation "${refundText}" and change "${changeText}".`
          );
        }
        continue;
      }
      if (filedRules === undefined) {
        skipped.push(`${where}: the ${brand.offers} offers carrying this brand disagree on whether rules were filed`);
        continue;
      }

      const changeFeeInd = onlyValue(brand.changeFeeInd);
      const changeAmount = onlyValue(brand.changeAmounts);

      if (changeFeeInd === 'true' && changeAmount !== undefined && Number(changeAmount) > 0) {
        assertions++;
        const expectedFee = Number(changeAmount) / MINOR_UNITS_PER_UNIT;
        const renderedFee = firstNumberIn(changeText);
        if (observedChange !== RULE_CATEGORY.CHANGE_WITH_AMOUNT) {
          mismatches.push(
            `${where}: the airline filed a change fee of ${expectedFee}, so the card must show that fee, ` +
            `but it reads "${changeText}".`
          );
        } else if (renderedFee !== null && renderedFee !== expectedFee) {
          mismatches.push(
            `${where}: the airline filed a change fee of ${expectedFee} but the card shows ${renderedFee} ("${changeText}").`
          );
        }
        continue;
      }

      // brand.changeAmounts.size === 0 is "no change amount filed at all", which is not the same as
      // onlyValue() returning undefined because the offers filed several different ones.
      if (changeFeeInd === 'false' && (changeAmount === '0' || brand.changeAmounts.size === 0)) {
        assertions++;
        if (observedChange !== RULE_CATEGORY.CHANGE_FARE_DIFFERENCE_ONLY) {
          mismatches.push(
            `${where}: the airline filed changes as carrying no fee, so the card must read ` +
            `"Changes - fare difference only", but it reads "${changeText}".`
          );
        }
        continue;
      }

      skipped.push(`${where}: filed change data is not conclusive (ChangeFeeInd=[${[...brand.changeFeeInd]}], amounts=[${[...brand.changeAmounts]}])`);
    }

    if (skipped.length > 0) {
      logger.warn('[NdcBrandOffers] Brand cards not cross-checked', { skipped });
    }

    // Thrown rather than asserted with expect(): these run under cucumber, and the custom message
    // of a Playwright expect() is only rendered by Playwright's own runner - under cucumber it is
    // dropped and the report shows a bare "Expected: 0 / Received: 3" with none of the detail.
    if (mismatches.length > 0) {
      throw new Error(
        '[FlightResults.verifyBrandCardRulesMatchNdcPenalties] Each brand card must reflect the penalties the airline ' +
        `filed for that brand and leg, but ${mismatches.length} did not:\n${mismatches.join('\n')}`
      );
    }

    if (assertions === 0) {
      throw new Error(
        '[FlightResults.verifyBrandCardRulesMatchNdcPenalties] No brand card could be cross-checked against the filed ' +
        `penalties, so nothing was proven. Skipped: ${skipped.join(' | ')}`
      );
    }

    logger.info('[NdcBrandOffers] Brand card change and cancellation badges match the filed penalties', {
      cardsChecked,
      assertions,
      legsRead,
    });

    return { cardsChecked, assertions, legsRead };
  },

  /**
   * Bug 84752: a seat service the airline grants must be shown on the brand card, including when the
   * offer that carries it spans two brand names.
   *
   * The reported defect was exactly that: for an offer priced across two brands the app could not
   * resolve a single brand name and dropped the seat service, so a fare that includes free seat
   * selection advertised "seat not included" - while the baggage of the same offer resolved fine.
   *
   * @param {import('playwright').Page} page
   * @param {object} world
   * @returns {Promise<{cardsChecked: number, cardsSpanningTwoBrands: number}>}
   */
  async verifyBrandCardSeatMatchesNdcServices(page, world) {
    if (!page) {
      throw new Error('[FlightResults.verifyBrandCardSeatMatchesNdcServices] page is required');
    }

    const { cards, legsRead } = await this.readBrandCardsAcrossCabinTabs(page);
    const { legs } = await this.captureAmadeusNdcBrandOffers(world);
    if (cards.length === 0) {
      throw new Error('[FlightResults.verifyBrandCardSeatMatchesNdcServices] No brand cards were read from the UI.');
    }

    const mismatches = [];
    const skipped = [];
    let cardsChecked = 0;
    let cardsSpanningTwoBrands = 0;

    for (const card of cards) {
      const brand = findFiledBrand(legs, card);
      if (!brand) {
        skipped.push(`leg ${card.legIndex} "${card.brandName}": no offer in the payload carries this brand on this leg`);
        continue;
      }

      const seatGranted = onlyValue(brand.seatGranted);
      const where = `Leg ${card.legIndex} brand "${card.brandName}"`;
      if (seatGranted !== true) {
        skipped.push(`${where}: the offers carrying this brand do not all grant a seat service on every segment of the leg`);
        continue;
      }

      cardsChecked++;
      if (brand.spansTwoBrands) cardsSpanningTwoBrands++;

      const seatText = card.featureTexts.find((text) => /seat/i.test(text)) || null;
      if (!isFreeSeatText(seatText)) {
        mismatches.push(
          `${where}: the airline grants a free seat service on every segment of this leg` +
          `${brand.spansTwoBrands ? ' (carried by an offer that spans two brand names)' : ''}, ` +
          `so the card must show free seat selection, but it reads "${seatText}".`
        );
      }
    }

    if (skipped.length > 0) {
      logger.warn('[NdcBrandOffers] Brand cards not cross-checked for seat', { skipped });
    }

    if (mismatches.length > 0) {
      throw new Error(
        '[FlightResults.verifyBrandCardSeatMatchesNdcServices] A seat service the airline grants must be shown on the ' +
        `brand card, but ${mismatches.length} card(s) hid it:\n${mismatches.join('\n')}`
      );
    }

    if (cardsChecked === 0) {
      throw new Error(
        '[FlightResults.verifyBrandCardSeatMatchesNdcServices] No brand card on offer granted a seat service, so nothing ' +
        `was proven. Skipped: ${skipped.join(' | ')}`
      );
    }

    logger.info('[NdcBrandOffers] Brand cards show the seat service the airline grants', {
      cardsChecked,
      cardsSpanningTwoBrands,
      legsRead,
    });

    return { cardsChecked, cardsSpanningTwoBrands, legsRead };
  },

  /**
   * Bug 84752: the checked baggage badge on each brand card must reflect the allowance the airline
   * bound to that leg.
   *
   * The binding is the point, not the number. An offer can bind 2 pieces to the outbound journey
   * alone and a different allowance to the return; the outbound card must then show the outbound
   * figure and the return's allowance must not leak into it. Reading the allowance per journey is
   * what makes that checkable - a payload-wide read would find both and could not tell them apart.
   *
   * Baggage is the control the bug's own analysis leaned on: it resolved correctly inside the very
   * offer whose seat service was dropped, which is what showed the offer had been matched at all.
   * A regression here would remove that ground.
   *
   * @param {import('playwright').Page} page
   * @param {object} world
   * @returns {Promise<{cardsChecked: number, cabinsRead: string[]}>}
   */
  async verifyBrandCardBaggageMatchesNdcAllowance(page, world) {
    if (!page) {
      throw new Error('[FlightResults.verifyBrandCardBaggageMatchesNdcAllowance] page is required');
    }

    const { cards, cabinsRead, legsRead } = await this.readBrandCardsAcrossCabinTabs(page);
    const { legs } = await this.captureAmadeusNdcBrandOffers(world);
    if (cards.length === 0) {
      throw new Error('[FlightResults.verifyBrandCardBaggageMatchesNdcAllowance] No brand cards were read from the UI.');
    }

    const mismatches = [];
    const skipped = [];
    let cardsChecked = 0;

    for (const card of cards) {
      const brand = findFiledBrand(legs, card);
      const where = `Leg ${card.legIndex} brand "${card.brandName}"`;
      if (!brand) {
        skipped.push(`${where}: no offer in the payload carries this brand on this leg`);
        continue;
      }

      const pieces = onlyValue(brand.checkedPieces);
      if (pieces === undefined) {
        skipped.push(`${where}: the ${brand.offers} offers carrying this brand bind different checked allowances to this leg`);
        continue;
      }
      if (pieces === null) {
        skipped.push(`${where}: no piece-based checked allowance is bound to this leg (a weight-based one is quoted in kilos)`);
        continue;
      }

      const baggageText = card.featureTexts.find((text) => /^(checked|baggage)\b/i.test(text)) || null;
      cardsChecked++;

      if (Number(pieces) === 0) {
        if (!/not included/i.test(String(baggageText))) {
          mismatches.push(
            `${where}: the airline bound a checked allowance of 0 pieces to this leg, so the card must say the ` +
            `checked bag is not included, but it reads "${baggageText}".`
          );
        }
        continue;
      }

      const shown = (String(baggageText).match(/(\d+)\s*PC\b/i) || [])[1];
      if (shown === undefined) {
        mismatches.push(
          `${where}: the airline bound ${pieces} checked piece(s) to this leg, so the card must show that ` +
          `allowance, but it reads "${baggageText}".`
        );
      } else if (Number(shown) !== Number(pieces)) {
        mismatches.push(
          `${where}: the airline bound ${pieces} checked piece(s) to this leg but the card shows ${shown} ("${baggageText}").`
        );
      }
    }

    if (skipped.length > 0) {
      logger.warn('[NdcBrandOffers] Brand cards not cross-checked for baggage', { skipped });
    }

    if (mismatches.length > 0) {
      throw new Error(
        '[FlightResults.verifyBrandCardBaggageMatchesNdcAllowance] Each brand card must show the checked allowance the ' +
        `airline bound to its leg, but ${mismatches.length} did not:\n${mismatches.join('\n')}`
      );
    }

    if (cardsChecked === 0) {
      throw new Error(
        '[FlightResults.verifyBrandCardBaggageMatchesNdcAllowance] No brand card could be cross-checked against a bound ' +
        `checked allowance, so nothing was proven. Skipped: ${skipped.join(' | ')}`
      );
    }

    logger.info('[NdcBrandOffers] Brand cards show the checked allowance bound to their leg', {
      cardsChecked,
      cabinsRead,
      legsRead,
    });

    return { cardsChecked, cabinsRead, legsRead };
  },

  /**
   * Bug 85493: every brand the airline offered on the outbound leg must reach the pricing options
   * screen as a card, and that card must carry its feature badges.
   *
   * The brand-details lookup behind each card failed silently - a cleanup step threw on a session
   * that was never opened, the caller logged it and dropped the brand. Nothing on screen said a
   * brand was missing, so the oracle has to be the supplier payload: the brands the Amadeus NDC
   * offers carry for the leg, compared by name with the cards the screen rendered on every cabin tab.
   *
   * Outbound only. The return cards render only once an outbound brand is picked, and which return
   * brands are then offered depends on that pick, so the return leg's payload brands are not all
   * expected on screen at once.
   *
   * An offer with a single brand proves nothing about brands being dropped, so fewer than two
   * offered brands is reported as a test-data problem rather than passed.
   *
   * @param {import('playwright').Page} page
   * @param {object} world
   * @returns {Promise<{offeredBrands: string[], cardsChecked: number, cabinsRead: string[]}>}
   */
  async verifyEveryNdcOfferedBrandHasCardWithDetails(page, world) {
    if (!page) {
      throw new Error('[FlightResults.verifyEveryNdcOfferedBrandHasCardWithDetails] page is required');
    }

    const { cards, cabinsRead } = await this.readBrandCardsAcrossCabinTabs(page);
    const { legs } = await this.captureAmadeusNdcBrandOffers(world);

    const outbound = legs.find((leg) => leg.legIndex === 0);
    const offeredBrands = [...new Set(
      Object.values(outbound ? outbound.brands : {}).map((brand) => normalizeBrandName(brand.brandName))
    )].filter((name) => name.length > 0);

    if (offeredBrands.length < 2) {
      throw new Error(
        '[FlightResults.verifyEveryNdcOfferedBrandHasCardWithDetails] The Amadeus NDC offers carry ' +
        `${offeredBrands.length} brand(s) on the outbound leg (${offeredBrands.join(', ') || 'none'}), so a dropped ` +
        'brand cannot be detected. Search a route whose NDC offer has several brands.'
      );
    }

    const outboundCards = cards.filter((card) => card.legIndex === 0);
    const missing = [];
    const withoutDetails = [];
    let cardsChecked = 0;

    for (const brandName of offeredBrands) {
      const matching = outboundCards.filter((card) => normalizeBrandName(card.brandName) === brandName);
      if (matching.length === 0) {
        missing.push(brandName);
        continue;
      }
      for (const card of matching) {
        cardsChecked++;
        if (card.featureTexts.length === 0) {
          withoutDetails.push(`${card.brandName} ${card.priceText || ''}`.trim());
        }
      }
    }

    if (missing.length > 0 || withoutDetails.length > 0) {
      throw new Error(
        '[FlightResults.verifyEveryNdcOfferedBrandHasCardWithDetails] Every brand the airline offered on the outbound ' +
        'leg must have a brand card with its details. ' +
        (missing.length > 0 ? `Offered but not shown: ${missing.join(', ')}. ` : '') +
        (withoutDetails.length > 0 ? `Shown without any details: ${withoutDetails.join(', ')}. ` : '') +
        `Offered: ${offeredBrands.join(', ')}. Shown: ${outboundCards.map((card) => card.brandName).join(', ')}.`
      );
    }

    logger.info('[NdcBrandOffers] Every offered outbound brand has a card with details', {
      offeredBrands,
      cardsChecked,
      cabinsRead,
    });

    return { offeredBrands, cardsChecked, cabinsRead };
  },
}

module.exports = FlightResults;
