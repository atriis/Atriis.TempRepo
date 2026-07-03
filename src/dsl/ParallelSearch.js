require("module-alias/register");
const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const { CartPage } = require("@pages/CartPage");
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
};

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
