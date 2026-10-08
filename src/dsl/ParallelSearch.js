require("module-alias/register");
const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const { CartPage } = require("@pages/CartPage");
const FlightSearchPage = require("@pages/FlightSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const CarSearchPage = require("@pages/CarSearchPage");
const FlightResultsPage = require("@pages/FlightResultsPage");
const FlightSearch = require("./FlightSearch");
const logger = require("@utils/logger").child("ParallelSearch");

/**
 * ParallelSearch DSL
 *
 * Business workflows for parallel searches, where a secondary product (car, hotel)
 * is searched alongside the flight and its details must stay aligned to the flight
 * itinerary in the resulting trip.
 */
const ParallelSearch = {
  /**
   * Verifies the rental car pick-up / drop-off hours follow the flight hours, applying the
   * 30-minute buffer used when a car is searched in parallel with a round-trip flight:
   *   - pick-up  = outbound flight ARRIVAL time  + toleranceMinutes
   *   - drop-off = return   flight DEPARTURE time - toleranceMinutes
   *
   * Times are read from the trip-overview quote cards, so the flight quote and the car quote
   * must both already be in the cart. Ported from the Testim `validate_hours` time-math.
   *
   * @param {import('playwright').Page} page
   * @param {object} [options]
   * @param {number} [options.toleranceMinutes=30] - buffer applied to the flight hours
   * @returns {Promise<void>}
   */
  async verifyCarHoursMatchFlightHours(page, { toleranceMinutes = 30 } = {}) {
    if (!page) throw new Error('[ParallelSearch.verifyCarHoursMatchFlightHours] "page" is required.');
    if (typeof toleranceMinutes !== 'number' || Number.isNaN(toleranceMinutes)) {
      throw new Error(`[ParallelSearch.verifyCarHoursMatchFlightHours] "toleranceMinutes" must be a number, got: ${typeof toleranceMinutes}`);
    }

    const cartPage = getPageObject(page, CartPage);

    logger.debug('Reading flight and car hours from the trip overview');
    const outboundArrivalRaw = await cartPage.getFlightQuoteOutboundArrivalTime();
    const returnDepartureRaw = await cartPage.getFlightQuoteReturnDepartureTime();
    const carHoursText = await cartPage.getCarQuotePickupDropoffText();

    const outboundArrival = extractTime(outboundArrivalRaw);
    const returnDeparture = extractTime(returnDepartureRaw);
    if (!outboundArrival) {
      throw new Error(`[ParallelSearch.verifyCarHoursMatchFlightHours] Could not parse an HH:MM time from the outbound flight arrival "${outboundArrivalRaw}".`);
    }
    if (!returnDeparture) {
      throw new Error(`[ParallelSearch.verifyCarHoursMatchFlightHours] Could not parse an HH:MM time from the return flight departure "${returnDepartureRaw}".`);
    }

    const expectedPickup = shiftTime(outboundArrival, toleranceMinutes);
    const expectedDropoff = shiftTime(returnDeparture, -toleranceMinutes);

    // The car label reads "<pickup date> · <pickup time> - <dropoff date> · <dropoff time>".
    const [pickupLabel = '', dropoffLabel = ''] = carHoursText.split(' - ');

    // Log the flight (and derived car) times so a failure is diagnosable from the run output.
    logger.info('Parallel car hours vs flight hours', {
      outboundFlightArrival: outboundArrival,
      returnFlightDeparture: returnDeparture,
      toleranceMinutes,
      expectedCarPickup: expectedPickup,
      expectedCarDropoff: expectedDropoff,
      carPickupLabel: pickupLabel.trim(),
      carDropoffLabel: dropoffLabel.trim(),
    });

    expect(
      pickupLabel,
      `[ParallelSearch.verifyCarHoursMatchFlightHours] Expected the car pick-up hour to be the outbound flight arrival (${outboundArrival}) + ${toleranceMinutes}m = ${expectedPickup}, ` +
      `but the car pick-up label was "${pickupLabel.trim()}" (full car label: "${carHoursText}").`
    ).toContain(expectedPickup);

    expect(
      dropoffLabel,
      `[ParallelSearch.verifyCarHoursMatchFlightHours] Expected the car drop-off hour to be the return flight departure (${returnDeparture}) - ${toleranceMinutes}m = ${expectedDropoff}, ` +
      `but the car drop-off label was "${dropoffLabel.trim()}" (full car label: "${carHoursText}").`
    ).toContain(expectedDropoff);
  },

  /**
   * Searches for a round-trip flight with BOTH a parallel hotel (whose destination is inherited
   * from the flight destination) and a parallel car whose pick-up location is edited to a different
   * city.
   *
   * The car location is edited AFTER the flight route is entered, because selecting the flight
   * destination overwrites the parallel destinations. The entered flight dates and the derived car
   * pick-up/drop-off dates are captured and returned so later steps can assert they are retained in
   * the edit-search drawer.
   *
   * @param {import('playwright').Page} page
   * @param {object} options
   * @param {string} options.to - Flight destination code (e.g. "AMS")
   * @param {string} options.carLocation - Parallel car pick-up location to edit to (e.g. "MAD")
   * @param {string} [options.from="LON"] - Flight origin code
   * @returns {Promise<{from: string, to: string, carLocation: string, flightDepartDate: string, flightReturnDate: string, carPickupDate: string, carDropoffDate: string}>}
   */
  async searchFlightWithParallelHotelAndEditedCar(page, { to, carLocation, from = 'LON' } = {}) {
    if (!page) throw new Error('[ParallelSearch.searchFlightWithParallelHotelAndEditedCar] "page" is required.');
    if (!to || typeof to !== 'string') {
      throw new Error(`[ParallelSearch.searchFlightWithParallelHotelAndEditedCar] "to" must be a non-empty string, got: ${typeof to}`);
    }
    if (!carLocation || typeof carLocation !== 'string') {
      throw new Error(`[ParallelSearch.searchFlightWithParallelHotelAndEditedCar] "carLocation" must be a non-empty string, got: ${typeof carLocation}`);
    }
    if (!from || typeof from !== 'string') {
      throw new Error(`[ParallelSearch.searchFlightWithParallelHotelAndEditedCar] "from" must be a non-empty string, got: ${typeof from}`);
    }

    logger.info('Searching flight with parallel hotel and an edited parallel car', { from, to, carLocation });
    return searchFlightWithEditedParallelCar(page, { from, to, carLocation, includeParallelHotel: true });
  },

  /**
   * Searches for a round-trip flight with a parallel car whose pick-up location is edited to a
   * different city — WITHOUT a parallel hotel. Sibling of searchFlightWithParallelHotelAndEditedCar
   * for flows (e.g. an NL-government booker) that pair a flight with a car only.
   *
   * Returns the same shape as searchFlightWithParallelHotelAndEditedCar so the shared
   * "dates retained" steps work against either search.
   *
   * @param {import('playwright').Page} page
   * @param {object} options
   * @param {string} options.to - Flight destination code (e.g. "TLV")
   * @param {string} options.carLocation - Parallel car pick-up location to edit to (e.g. "MAD")
   * @param {string} [options.from="LON"] - Flight origin code
   * @returns {Promise<{from: string, to: string, carLocation: string, flightDepartDate: string, flightReturnDate: string, carPickupDate: string, carDropoffDate: string}>}
   */
  async searchFlightAndEditCar(page, { to, carLocation, from = 'LON' } = {}) {
    if (!page) throw new Error('[ParallelSearch.searchFlightAndEditCar] "page" is required.');
    if (!to || typeof to !== 'string') {
      throw new Error(`[ParallelSearch.searchFlightAndEditCar] "to" must be a non-empty string, got: ${typeof to}`);
    }
    if (!carLocation || typeof carLocation !== 'string') {
      throw new Error(`[ParallelSearch.searchFlightAndEditCar] "carLocation" must be a non-empty string, got: ${typeof carLocation}`);
    }
    if (!from || typeof from !== 'string') {
      throw new Error(`[ParallelSearch.searchFlightAndEditCar] "from" must be a non-empty string, got: ${typeof from}`);
    }

    logger.info('Searching flight with an edited parallel car (no parallel hotel)', { from, to, carLocation });
    return searchFlightWithEditedParallelCar(page, { from, to, carLocation, includeParallelHotel: false });
  },

  /**
   * Verifies the flight departure and return dates shown in the (already-open) edit-search drawer
   * match the dates entered during the parallel search. Whitespace is normalized before comparison.
   *
   * @param {import('playwright').Page} page
   * @param {object} expected
   * @param {string} expected.expectedDepartureDate - Departure date entered during the search
   * @param {string} expected.expectedReturnDate - Return date entered during the search
   * @returns {Promise<{expectedDepartureDate: string, expectedReturnDate: string, actualDepartureDate: string, actualReturnDate: string}>}
   */
  async verifyFlightDatesRetained(page, { expectedDepartureDate, expectedReturnDate } = {}) {
    if (!page) throw new Error('[ParallelSearch.verifyFlightDatesRetained] "page" is required.');
    if (!expectedDepartureDate || typeof expectedDepartureDate !== 'string') {
      throw new Error(`[ParallelSearch.verifyFlightDatesRetained] "expectedDepartureDate" must be a non-empty string, got: ${typeof expectedDepartureDate}. Ensure the parallel search step captured the entered dates first.`);
    }
    if (!expectedReturnDate || typeof expectedReturnDate !== 'string') {
      throw new Error(`[ParallelSearch.verifyFlightDatesRetained] "expectedReturnDate" must be a non-empty string, got: ${typeof expectedReturnDate}. Ensure the parallel search step captured the entered dates first.`);
    }

    const searchPage = getPageObject(page, SearchPage);
    const normalize = (value) => value.replace(/\s+/g, ' ').trim();

    const actualDepartureDate = await searchPage.getDepartureDateFieldValue();
    const actualReturnDate = await searchPage.getReturnDateFieldValue();

    expect(
      normalize(actualDepartureDate),
      `[ParallelSearch.verifyFlightDatesRetained] Expected the flight departure date in the edit search to stay the entered "${expectedDepartureDate}", but it showed "${actualDepartureDate}".`,
    ).toBe(normalize(expectedDepartureDate));

    expect(
      normalize(actualReturnDate),
      `[ParallelSearch.verifyFlightDatesRetained] Expected the flight return date in the edit search to stay the entered "${expectedReturnDate}", but it showed "${actualReturnDate}".`,
    ).toBe(normalize(expectedReturnDate));

    return { expectedDepartureDate, expectedReturnDate, actualDepartureDate, actualReturnDate };
  },

  /**
   * Verifies the car pick-up and drop-off dates shown in the (already-open) edit-search drawer match
   * the dates derived during the parallel search. Whitespace is normalized before comparison.
   *
   * @param {import('playwright').Page} page
   * @param {object} expected
   * @param {string} expected.expectedPickupDate - Pick-up date derived during the search
   * @param {string} expected.expectedDropoffDate - Drop-off date derived during the search
   * @returns {Promise<{expectedPickupDate: string, expectedDropoffDate: string, actualPickupDate: string, actualDropoffDate: string}>}
   */
  async verifyCarDatesRetained(page, { expectedPickupDate, expectedDropoffDate } = {}) {
    if (!page) throw new Error('[ParallelSearch.verifyCarDatesRetained] "page" is required.');
    if (!expectedPickupDate || typeof expectedPickupDate !== 'string') {
      throw new Error(`[ParallelSearch.verifyCarDatesRetained] "expectedPickupDate" must be a non-empty string, got: ${typeof expectedPickupDate}. Ensure the parallel search step captured the entered dates first.`);
    }
    if (!expectedDropoffDate || typeof expectedDropoffDate !== 'string') {
      throw new Error(`[ParallelSearch.verifyCarDatesRetained] "expectedDropoffDate" must be a non-empty string, got: ${typeof expectedDropoffDate}. Ensure the parallel search step captured the entered dates first.`);
    }

    const carSearchPage = getPageObject(page, CarSearchPage);
    const normalize = (value) => value.replace(/\s+/g, ' ').trim();

    const actualPickupDate = await carSearchPage.getPickupDateFieldValue();
    const actualDropoffDate = await carSearchPage.getDropoffDateFieldValue();

    expect(
      normalize(actualPickupDate),
      `[ParallelSearch.verifyCarDatesRetained] Expected the car pick-up date in the edit search to stay the entered "${expectedPickupDate}", but it showed "${actualPickupDate}".`,
    ).toBe(normalize(expectedPickupDate));

    expect(
      normalize(actualDropoffDate),
      `[ParallelSearch.verifyCarDatesRetained] Expected the car drop-off date in the edit search to stay the entered "${expectedDropoffDate}", but it showed "${actualDropoffDate}".`,
    ).toBe(normalize(expectedDropoffDate));

    return { expectedPickupDate, expectedDropoffDate, actualPickupDate, actualDropoffDate };
  },

  /**
   * Verifies the "Best" sort explanation tooltip on the flight results page. Hovers the info icon
   * next to the "Best" quick-sort option and asserts the revealed tooltip explains how the ranking
   * is calculated (price, travel time, stops, and preferred airlines reflecting corporate preferences).
   *
   * @param {import('playwright').Page} page
   * @param {object} [options]
   * @param {number} [options.timeout=30000] - Max wait for the tooltip trigger and popper
   * @returns {Promise<{expectedExplanation: string, actualTooltip: string}>}
   */
  async verifyBestSortingExplanation(page, { timeout = 30000 } = {}) {
    if (!page) throw new Error('[ParallelSearch.verifyBestSortingExplanation] "page" is required.');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const normalize = (value) => value.replace(/\s+/g, ' ').trim();
    const expectedExplanation =
      'Best calculates the most suitable option for you based on specified settings for price, ' +
      'travel time, number of stops, and preferred airlines, which reflect your corporate preferences.';

    logger.debug('Hovering the "Best" sort explanation info icon to reveal its tooltip');
    await flightResultsPage.hoverBestSortTooltip({ timeout });
    const actualTooltip = await flightResultsPage.getVisibleTooltipText({ timeout });

    logger.info('Best sorting explanation tooltip', { actualTooltip });

    expect(
      normalize(actualTooltip),
      `[ParallelSearch.verifyBestSortingExplanation] Expected the "Best" sort tooltip to explain the ranking ` +
      `("${expectedExplanation}"), but the visible tooltip showed "${actualTooltip}".`,
    ).toContain(normalize(expectedExplanation));

    return { expectedExplanation, actualTooltip };
  },

  /**
   * Starts recording the calls of a flight + hotel parallel search: every FlightSelect and
   * /hotelsearch request (start, end, the cache key sent and the cache key returned) and times in ms from this call. Arm it on flight results BEFORE the
   * flight is added to the trip; the verify* methods below read the returned recorder.
   *
   * A /hotelsearch sent WITHOUT a cache key is a fresh supplier search (several seconds); hotel
   * results then sends the key it returned to read the results.
   *
   * @param {import("playwright").Page} page
   * @returns {{calls: object[], whenSettled: () => Promise<void>, stop: () => void}}
   */
  startRecordingParallelHotelSearch(page) {
    if (!page) throw new Error("[ParallelSearch.startRecordingParallelHotelSearch] \"page\" is required.");

    const t0 = Date.now();
    const calls = [];
    const pendingBodies = [];
    const byRequest = new Map();
    const kindOf = (url) => {
      const { pathname } = new URL(url);
      if (/\/hotelsearch$/i.test(pathname)) return "hotelsearch";
      if (/\/FlightSelect$/i.test(pathname)) return "FlightSelect";
      return null;
    };

    const onRequest = (request) => {
      const kind = kindOf(request.url());
      if (!kind || request.method() === "OPTIONS") return;
      let sentCacheKey = null;
      if (kind === "hotelsearch") {
        try {
          sentCacheKey = JSON.parse(request.postData() || "{}").cacheKey || null;
        } catch {
          sentCacheKey = null;
        }
      }
      const call = { kind, start: Date.now() - t0, end: null, status: null, sentCacheKey, returnedCacheKey: null, hotelsCount: null };
      calls.push(call);
      byRequest.set(request, call);
      logger.debug("Parallel search call started", { kind, start: call.start, hasCacheKey: !!sentCacheKey });
    };
    const onDone = (request) => {
      const call = byRequest.get(request);
      if (!call) return;
      call.end = Date.now() - t0;
      pendingBodies.push((async () => {
        const response = await request.response().catch(() => null);
        call.status = response ? response.status() : "failed";
        if (call.kind === "hotelsearch" && response) {
          const body = await response.json().catch(() => null);
          call.returnedCacheKey = body?.cacheKey || null;
          call.hotelsCount = Array.isArray(body?.hotels) ? body.hotels.length : null;
        }
        logger.debug("Parallel search call finished", { kind: call.kind, end: call.end, status: call.status, hotelsCount: call.hotelsCount });
      })());
    };

    page.on("request", onRequest);
    page.on("requestfinished", onDone);
    page.on("requestfailed", onDone);

    return {
      calls,
      whenSettled: () => Promise.all(pendingBodies).then(() => {}),
      stop: () => {
        page.off("request", onRequest);
        page.off("requestfinished", onDone);
        page.off("requestfailed", onDone);
      },
    };
  },

  /**
   * Verifies the fresh hotel search (/hotelsearch without a cache key) started together with
   * FlightSelect instead of after it returned (AB#85879): it must start before FlightSelect ends
   * and within maxStartGapMs of FlightSelect starting.
   *
   * @param {object} recorder - from startRecordingParallelHotelSearch
   * @param {object} [options]
   * @param {number} [options.maxStartGapMs=2000]
   * @returns {Promise<{flightSelect: object, freshHotelSearch: object}>}
   */
  async verifyHotelSearchStartedWithFlightSelect(recorder, { maxStartGapMs = 2000 } = {}) {
    const { flightSelect, freshHotelSearch } = await settledParallelCalls(recorder, "verifyHotelSearchStartedWithFlightSelect");
    logger.info("FlightSelect and fresh hotel search timing (ms from recording start)", {
      flightSelect: [flightSelect.start, flightSelect.end],
      freshHotelSearch: [freshHotelSearch.start, freshHotelSearch.end],
    });

    expect(
      freshHotelSearch.start,
      `[ParallelSearch.verifyHotelSearchStartedWithFlightSelect] The hotel search started at +${freshHotelSearch.start} ms, ` +
      `after FlightSelect returned at +${flightSelect.end} ms: it waited for FlightSelect instead of running alongside it.`,
    ).toBeLessThan(flightSelect.end);
    expect(
      Math.abs(freshHotelSearch.start - flightSelect.start),
      `[ParallelSearch.verifyHotelSearchStartedWithFlightSelect] The hotel search started ${freshHotelSearch.start - flightSelect.start} ms ` +
      `away from FlightSelect (+${flightSelect.start} ms); expected both to start together (within ${maxStartGapMs} ms).`,
    ).toBeLessThanOrEqual(maxStartGapMs);

    return { flightSelect, freshHotelSearch };
  },

  /**
   * Verifies hotel results read the results of the parallel search: a later /hotelsearch sent the
   * cache key the fresh search returned, and it returned hotels.
   *
   * @param {object} recorder - from startRecordingParallelHotelSearch
   * @returns {Promise<{cacheKey: string, hotelsCount: number}>}
   */
  async verifyHotelResultsReusedParallelCacheKey(recorder) {
    const { freshHotelSearch } = await settledParallelCalls(recorder, "verifyHotelResultsReusedParallelCacheKey");
    if (!freshHotelSearch.returnedCacheKey) {
      throw new Error(`[ParallelSearch.verifyHotelResultsReusedParallelCacheKey] The fresh hotel search returned no cache key (status ${freshHotelSearch.status}).`);
    }
    const reuse = recorder.calls.find((call) => call.kind === "hotelsearch" && call.sentCacheKey === freshHotelSearch.returnedCacheKey);
    if (!reuse) {
      throw new Error(
        "[ParallelSearch.verifyHotelResultsReusedParallelCacheKey] No /hotelsearch sent the cache key returned by the parallel search. " +
        `Sent keys: ${JSON.stringify(recorder.calls.filter((call) => call.kind === "hotelsearch").map((call) => call.sentCacheKey))}`,
      );
    }
    logger.info("Hotel results reused the parallel search cache key", { start: reuse.start, hotelsCount: reuse.hotelsCount });

    expect(
      reuse.hotelsCount,
      "[ParallelSearch.verifyHotelResultsReusedParallelCacheKey] The /hotelsearch that sent the parallel cache key returned no hotels.",
    ).toBeGreaterThan(0);

    return { cacheKey: reuse.sentCacheKey, hotelsCount: reuse.hotelsCount };
  },
};

/**
 * Waits for the recorder's response bodies to be read and returns the FlightSelect call and the
 * first fresh /hotelsearch (no cache key) that started after it was armed.
 *
 * @param {object} recorder
 * @param {string} caller - DSL method name, for error messages
 * @returns {Promise<{flightSelect: object, freshHotelSearch: object}>}
 */
async function settledParallelCalls(recorder, caller) {
  if (!recorder || !Array.isArray(recorder.calls)) {
    throw new Error(`[ParallelSearch.${caller}] No parallel search recording. Run "I start recording the parallel hotel search requests" before adding the flight.`);
  }
  await recorder.whenSettled();
  const flightSelect = recorder.calls.find((call) => call.kind === "FlightSelect");
  if (!flightSelect || flightSelect.end === null) {
    throw new Error(`[ParallelSearch.${caller}] No completed FlightSelect request was recorded.`);
  }
  const freshHotelSearch = recorder.calls.find((call) => call.kind === "hotelsearch" && !call.sentCacheKey);
  if (!freshHotelSearch || freshHotelSearch.end === null) {
    throw new Error(`[ParallelSearch.${caller}] No completed fresh /hotelsearch (without a cache key) was recorded after adding the flight.`);
  }
  return { flightSelect, freshHotelSearch };
}

/**
 * Shared flow for the two edited-parallel-car searches: fills a round-trip flight WITHOUT submitting,
 * enables the parallel car (and optionally a parallel hotel whose destination inherits the flight
 * destination), edits the car pick-up location, captures the entered flight dates and the
 * Vue-derived car dates, then submits. The car location must be edited AFTER the flight route is
 * entered — selecting the flight destination overwrites the parallel destinations.
 *
 * @param {import('playwright').Page} page
 * @param {object} options
 * @param {string} options.from - Flight origin code
 * @param {string} options.to - Flight destination code
 * @param {string} options.carLocation - Parallel car pick-up location to edit to
 * @param {boolean} options.includeParallelHotel - also enable a parallel hotel search
 * @returns {Promise<{from: string, to: string, carLocation: string, flightDepartDate: string, flightReturnDate: string, carPickupDate: string, carDropoffDate: string}>}
 */
async function searchFlightWithEditedParallelCar(page, { from, to, carLocation, includeParallelHotel }) {
  const flightSearchPage = getPageObject(page, FlightSearchPage);
  const searchPage = getPageObject(page, SearchPage);
  const carSearchPage = getPageObject(page, CarSearchPage);

  // Fill the round-trip flight (tab, trip type, route, dates, complete-trip) WITHOUT submitting,
  // so the parallel options can be configured before the search runs.
  await FlightSearch.searchFlightRoundTripWithoutSearch(page, { from, to });

  // Enable the parallel product(s). When present, the hotel destination inherits the flight
  // destination; the car is always enabled so its pick-up location can be edited next.
  if (includeParallelHotel) {
    await flightSearchPage.checkParallelHotelSearch();
  }
  await flightSearchPage.checkParallelCarSearch();

  // Edit ONLY the car pick-up location. Must run after the flight route is entered — selecting the
  // flight destination overwrites the parallel destinations (see FlightSearch.editParallelHotelDestination).
  logger.debug('Opening the parallel car edit inputs before typing the pick-up location');
  await flightSearchPage.openParallelCarEditInputs();
  await flightSearchPage.typeParallelCarDestination(carLocation);

  // Capture the entered flight dates (entered directly, so already settled) so the "dates retained"
  // checks (after clicking edit search on the flight and on the car results) have ground-truth values.
  const flightDepartDate = await searchPage.getDepartureDateFieldValue();
  const flightReturnDate = await searchPage.getReturnDateFieldValue();

  // The parallel car dates are DERIVED from the flight dates via Vue reactivity and settle
  // asynchronously; reading immediately can capture an empty/stale value. Wait for the car date
  // inputs to be populated first (best-effort — if they never settle, the downstream
  // verifyCarDatesRetained non-empty guard surfaces a clear error rather than a raw timeout here).
  await carSearchPage.waitForPickupDateNonEmpty({ timeout: 10000 }).catch(() => {});
  await carSearchPage.waitForDropoffDateNonEmpty({ timeout: 10000 }).catch(() => {});
  const carPickupDate = await carSearchPage.getPickupDateFieldValue();
  const carDropoffDate = await carSearchPage.getDropoffDateFieldValue();

  logger.info('Captured entered flight and derived car dates', {
    flightDepartDate,
    flightReturnDate,
    carPickupDate,
    carDropoffDate,
  });

  await searchPage.waitAndClickSearchButton();

  return { from, to, carLocation, flightDepartDate, flightReturnDate, carPickupDate, carDropoffDate };
}

/**
 * Extracts the first time token from a flight-time string and normalizes it to a zero-padded
 * 24-hour HH:MM. Handles extra markup such as an overnight "+1" indicator and both time formats
 * the app can render (metric users see "14:30"; imperial users see "02:30 PM") — while the car
 * pickup/drop-off label is always 24-hour — so both sides are comparable in 24-hour form.
 * @param {string} text
 * @returns {string|null}
 */
function extractTime(text) {
  if (typeof text !== 'string') return null;
  const match = text.match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])?/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const meridiem = match[3] ? match[3].toUpperCase() : null;
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

/**
 * Shifts an HH:MM string by the given number of minutes (negative to subtract), wrapping
 * within a 24-hour day, and returns the result as a zero-padded HH:MM string.
 * @param {string} hhmm
 * @param {number} minutes
 * @returns {string}
 */
function shiftTime(hhmm, minutes) {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

module.exports = ParallelSearch;
