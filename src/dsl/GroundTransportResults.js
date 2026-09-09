const GroundTransportResultsPage = require("@pages/GroundTransportResultsPage");
const Results = require("./Results");
const { getPageObject } = require("@utils/pageObjectCache");
const { toNumber } = require("@utils/numbers");
const { stripWhitespaceAndLowercase } = require("@utils/text");
const logger = require("@utils/logger").child("GroundTransportResults-DSL");

/**
 * GroundTransportResults DSL
 *
 * Business actions performed on ground transport (Transferz) search results.
 */
// Title of the vehicle filter section on the ground transport results page
// (ground-transport-filter.ts:85 -> $t("groundTransport.vehicleType")). Ground transport renders this
// section where cars render "Car Class", which is why the generic `I filter results by` step (hard-wired
// to "Car Class") cannot drive it.
const VEHICLE_TYPE_FILTER_TITLE = 'Vehicle Type';

const GroundTransportResults = {
  /**
   * Verifies that the ground transport search returned results.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {object} [options]
   * @param {number} [options.timeout=15000] - Maximum time to wait, in milliseconds
   * @throws {Error} If page is missing or no results render before the timeout
   * @returns {Promise<void>}
   */
  async expectResultsDisplayed(page, { timeout = 15000 } = {}) {
    if (!page) {
      throw new Error('[GroundTransportResults.expectResultsDisplayed] "page" is required.');
    }

    logger.info('Verifying ground transport results are displayed', { timeout });

    const resultsPage = getPageObject(page, GroundTransportResultsPage);
    await resultsPage.waitForResults(timeout);
  },

  /**
   * Verifies the results on screen belong to the given route, by reading the pick-up/drop-off pair
   * the info bar echoes above them.
   *
   * This is what makes "results are displayed" mean something after a search has been edited: a
   * refilled form that changed the visible location text without re-resolving the location would
   * leave the previous route in the store, re-run it, and render results all the same.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {object} options
   * @param {string} options.pickup - Substring the pick-up address must contain
   * @param {string} options.dropOff - Substring the drop-off address must contain
   * @param {number} [options.timeout=60000] - Maximum time to wait per address, in milliseconds
   * @throws {Error} If page/pickup/dropOff are missing, or either address never matches
   * @returns {Promise<{pickup: string, dropOff: string}>}
   */
  async expectResultsRoute(page, { pickup, dropOff, timeout = 60000 } = {}) {
    if (!page) {
      throw new Error('[GroundTransportResults.expectResultsRoute] "page" is required.');
    }

    if (!pickup || typeof pickup !== 'string') {
      throw new Error(
        `[GroundTransportResults.expectResultsRoute] "pickup" must be a non-empty string, got: ${pickup}`
      );
    }

    if (!dropOff || typeof dropOff !== 'string') {
      throw new Error(
        `[GroundTransportResults.expectResultsRoute] "dropOff" must be a non-empty string, got: ${dropOff}`
      );
    }

    logger.info('Verifying the ground transport results belong to the searched route', { pickup, dropOff });

    const resultsPage = getPageObject(page, GroundTransportResultsPage);
    await resultsPage.waitForInfoBarRouteToContain(pickup, dropOff, timeout);

    return { pickup, dropOff };
  },

  /**
   * Verifies that the ground transport result card shows its price, type of payment, pick-up
   * date/time and "Add to trip" button, laid out in the expected reading order.
   *
   * Only RELATIVE positions are asserted — never absolute pixels, computed CSS or exact text —
   * so the check stays valid as copy, currency and styling change:
   *  - vertically, inside the price section column: price above type of payment above "Add to trip";
   *  - horizontally: the pick-up date/time (left `.ticket-details` column) sits left of the price
   *    section (right `.extra-info` column).
   *
   * DESKTOP-viewport assertion by construction: on mobile, ground-transport-preview.vue renders the
   * price block inside `.ticket-details` in the reverse order and moves the button to
   * `.mobile-btn-container` (ground-transport-preview.vue:159). There is deliberately no mobile
   * variant here.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {object} [options]
   * @param {number} [options.index=0] - Zero-based index of the ground transport result card
   * @param {number} [options.timeout=60000] - Maximum time to wait for each element, in milliseconds
   * @throws {Error} If page/index/timeout are invalid, an element never renders, or the elements
   *                 are not in the expected order
   * @returns {Promise<{index: number, boxes: Object}>}
   */
  async expectPriceSectionLayout(page, { index = 0, timeout = 60000 } = {}) {
    if (!page) {
      throw new Error('[GroundTransportResults.expectPriceSectionLayout] "page" is required.');
    }
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(
        `[GroundTransportResults.expectPriceSectionLayout] "index" must be a non-negative integer, got: ${index}`
      );
    }
    if (typeof timeout !== 'number' || timeout <= 0) {
      throw new Error(
        `[GroundTransportResults.expectPriceSectionLayout] "timeout" must be a positive number, got: ${timeout}`
      );
    }

    logger.info('Verifying ground transport price section layout', { index, timeout });

    const resultsPage = getPageObject(page, GroundTransportResultsPage);
    await resultsPage.waitForPriceSection(index, timeout);

    // Only the price section itself races the results render, so it gets the full budget. The
    // elements inside it are already painted by then, and giving each of them the full 60s too
    // would blow past the 120s Cucumber step timeout before any diagnostic could be reported.
    const elementTimeout = Math.min(timeout, 15000);

    // Playwright drops custom messages passed to expect() in this project's reports, so every
    // failure below is raised as a hand-built Error instead.
    const required = [
      ['the pick-up date and time', resultsPage.getPickupDateTime(index),
        " The card's pick-up/drop-off details may not have rendered."],
      ['the price', resultsPage.getPriceAmount(index), ''],
      ['the type of payment', resultsPage.getPaymentTypeLabel(index), ''],
      ['the "Add to trip" button', resultsPage.getAddToTripButton(index), ''],
    ];

    for (const [label, locator, hint] of required) {
      try {
        await locator.waitFor({ state: 'visible', timeout: elementTimeout });
      } catch (error) {
        throw new Error(
          `[GroundTransportResults.expectPriceSectionLayout] ${label} was not displayed on ground ` +
          `transport result index ${index}.${hint} Original: ${error.message}`
        );
      }
    }

    const boxes = await resultsPage.getPriceSectionLayoutBoxes(index);

    const missing = Object.entries(boxes)
      .filter(([, box]) => !box)
      .map(([name]) => name);
    if (missing.length > 0) {
      throw new Error(
        `[GroundTransportResults.expectPriceSectionLayout] Could not read the on-screen position of ` +
        `${missing.join(', ')} on ground transport result index ${index}. The element(s) resolved but have no ` +
        `bounding box, which means they are not actually rendered on screen (hidden, zero-sized, or ` +
        `detached by a re-render).`
      );
    }

    const { pickupDateTime, priceSection, price, paymentType, addToTrip } = boxes;

    // Vertical order — only among the three elements sharing the price section column.
    if (!(price.y < paymentType.y && paymentType.y < addToTrip.y)) {
      throw new Error(
        `[GroundTransportResults.expectPriceSectionLayout] Price section elements are not in the expected ` +
        `vertical order on ground transport result index ${index}. Expected price < type of payment < add to ` +
        `trip, got price y=${price.y}, type of payment y=${paymentType.y}, add to trip y=${addToTrip.y}.`
      );
    }

    // Horizontal order — pick-up date/time is in the LEFT column, the price section in the RIGHT.
    if (!(pickupDateTime.x < priceSection.x)) {
      throw new Error(
        `[GroundTransportResults.expectPriceSectionLayout] The pick-up date and time is not to the left of the ` +
        `price section on ground transport result index ${index}. Expected date and time < price section, got ` +
        `date and time x=${pickupDateTime.x}, price section x=${priceSection.x}.`
      );
    }

    return { index, boxes };
  },

  /**
   * Extracts the net price and the VAT from a ground transport result card.
   *
   * The card prints the two apart — `app-price` holds the price NET of tax and the `p.vat` line
   * holds the tax on top of it — while the cart charges their sum. So both are returned separately
   * and the caller adds them; see "the ground transport results price with VAT should equal the
   * cart price".
   *
   * An offer with no tax renders no VAT line at all, which is a valid state, so `vat` comes back 0
   * rather than raising.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {object} [options]
   * @param {number} [options.index=0] - Zero-based index of the ground transport result card
   * @param {number} [options.timeout=60000] - Maximum time to wait for the price, in milliseconds
   * @throws {Error} If page/index/timeout are invalid, the price never renders, or either value is
   *                 not parseable as a number
   * @returns {Promise<{price: number, vat: number, priceText: string, vatText: string|null}>}
   */
  async extractPriceAndVat(page, { index = 0, timeout = 60000 } = {}) {
    if (!page) {
      throw new Error('[GroundTransportResults.extractPriceAndVat] "page" is required.');
    }
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(
        `[GroundTransportResults.extractPriceAndVat] "index" must be a non-negative integer, got: ${index}`
      );
    }
    if (typeof timeout !== 'number' || timeout <= 0) {
      throw new Error(
        `[GroundTransportResults.extractPriceAndVat] "timeout" must be a positive number, got: ${timeout}`
      );
    }

    const resultsPage = getPageObject(page, GroundTransportResultsPage);
    const { priceText, vatText } = await resultsPage.getPriceAndVatText(index, timeout);

    let price;
    let vat;

    try {
      price = toNumber(priceText, 'ground transport results price');
      // The VAT line reads "VAT: <currency> <amount>" — toNumber strips the label and the currency
      // symbol along with it, so the raw text goes in as-is.
      vat = vatText === null ? 0 : toNumber(vatText, 'ground transport results VAT');
    } catch (error) {
      throw new Error(
        `[GroundTransportResults.extractPriceAndVat] Could not parse the price/VAT read from ground ` +
        `transport result index ${index} (price: "${priceText}", VAT: ${vatText === null ? 'not rendered' : `"${vatText}"`}). ` +
        `Original: ${error.message}`
      );
    }

    logger.info('Extracted ground transport results price and VAT', { index, price, vat, priceText, vatText });

    return { price, vat, priceText, vatText };
  },

  /**
   * Opens the Terms & Conditions dialog on a ground transport result card and asserts it contains
   * the expected text, then closes it again (the Page Object owns the closing, and raises if the
   * dialog will not dismiss).
   *
   * Matching mirrors Cart.verifyTextInCartTermsAndConditions — both go through the shared
   * stripWhitespaceAndLowercase: the disclaimer is v-html'd raw supplier HTML, so adjacent nodes
   * concatenate with no separator and line breaks land wherever the supplier put them, which means
   * all whitespace has to be stripped on both sides rather than merely collapsed.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedText - Text expected to appear in the results T&C dialog
   * @param {object} [options]
   * @param {number} [options.index=0] - Zero-based index of the ground transport result card
   * @throws {Error} If page/expectedText are invalid, or the dialog does not contain the text
   * @returns {Promise<{dialogText: string}>}
   */
  async verifyTermsAndConditionsInclude(page, expectedText, { index = 0 } = {}) {
    if (!page) {
      throw new Error('[GroundTransportResults.verifyTermsAndConditionsInclude] "page" is required.');
    }
    if (typeof expectedText !== 'string' || expectedText.trim().length === 0) {
      throw new Error(
        `[GroundTransportResults.verifyTermsAndConditionsInclude] "expectedText" must be a non-empty ` +
        `string, got: ${typeof expectedText}`
      );
    }
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(
        `[GroundTransportResults.verifyTermsAndConditionsInclude] "index" must be a non-negative ` +
        `integer, got: ${index}`
      );
    }

    logger.info('Verifying ground transport results terms and conditions', { index, expectedText });

    const resultsPage = getPageObject(page, GroundTransportResultsPage);
    const dialogText = await resultsPage.getTermsAndConditionsText(index);

    if (!stripWhitespaceAndLowercase(dialogText).includes(stripWhitespaceAndLowercase(expectedText))) {
      throw new Error(
        `[GroundTransportResults.verifyTermsAndConditionsInclude] Expected the ground transport ` +
        `results Terms & Conditions dialog on result index ${index} to contain "${expectedText}", but ` +
        `its text was: "${dialogText.slice(0, 500)}"`
      );
    }

    return { dialogText };
  },

  /**
   * Applies the ground transport "Vehicle Type" results filter for one vehicle type.
   *
   * Delegates to the shared filter-section mechanism, but with EXACT label matching: the section
   * lists both "Exclusive minivan" and "Minivan", so a substring match on "Minivan" would tick
   * "Exclusive minivan" (it comes first in DOM order) and silently filter to the wrong vehicle.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} vehicleType - Exact option label, e.g. "Minibus"
   * @returns {Promise<{selected: boolean, optionLabel: string, filterTitle: string}>}
   */
  async filterByVehicleType(page, vehicleType) {
    if (!page) throw new Error('[GroundTransportResults.filterByVehicleType] "page" is required.');
    if (typeof vehicleType !== 'string' || !vehicleType.trim()) {
      throw new Error(
        `[GroundTransportResults.filterByVehicleType] "vehicleType" must be a non-empty string, got: ` +
        `${vehicleType}`
      );
    }

    logger.info('Applying the ground transport vehicle type filter', { vehicleType });
    return Results.selectFilterSectionOption(page, vehicleType, VEHICLE_TYPE_FILTER_TITLE, {
      exact: true,
    });
  },

  /**
   * Removes a previously applied ground transport "Vehicle Type" filter option.
   *
   * The checkbox is a plain toggle, so this clicks the same option again. Exact matching for the
   * same reason as filterByVehicleType — unticking the wrong box would leave the filter applied.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} vehicleType - Exact option label, e.g. "Minibus"
   * @returns {Promise<{removed: boolean, optionLabel: string, filterTitle: string}>}
   */
  async removeVehicleTypeFilter(page, vehicleType) {
    if (!page) throw new Error('[GroundTransportResults.removeVehicleTypeFilter] "page" is required.');
    if (typeof vehicleType !== 'string' || !vehicleType.trim()) {
      throw new Error(
        `[GroundTransportResults.removeVehicleTypeFilter] "vehicleType" must be a non-empty string, got: ` +
        `${vehicleType}`
      );
    }

    logger.info('Removing the ground transport vehicle type filter', { vehicleType });
    return Results.removeFilterSectionOption(page, vehicleType, VEHICLE_TYPE_FILTER_TITLE, {
      exact: true,
    });
  },

  /**
   * Verifies that EVERY rendered ground transport result advertises the given vehicle type.
   *
   * Used after a vehicle-type filter to prove the filter actually narrowed the list. The match is
   * case-insensitive and substring-based against the card's model line, which reads
   * "{VehicleType} (up to {N} people)" — the capacity suffix is localised, so only the vehicle type
   * itself is compared.
   *
   * An empty result list FAILS: "every option matches" is vacuously true over zero cards, which is
   * exactly the false pass this assertion exists to catch.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} vehicleType - Expected vehicle type, e.g. "Minibus"
   * @param {object} [options]
   * @param {number} [options.timeout=15000] - Maximum time to wait for the results list, in ms
   * @throws {Error} If no results render, or any rendered result advertises a different vehicle type
   * @returns {Promise<{vehicleType: string, matched: number, texts: string[]}>}
   */
  async expectAllResultsVehicleType(page, vehicleType, { timeout = 15000 } = {}) {
    if (!page) {
      throw new Error('[GroundTransportResults.expectAllResultsVehicleType] "page" is required.');
    }
    if (typeof vehicleType !== 'string' || !vehicleType.trim()) {
      throw new Error(
        `[GroundTransportResults.expectAllResultsVehicleType] "vehicleType" must be a non-empty ` +
        `string, got: ${vehicleType}`
      );
    }

    logger.info('Verifying every ground transport result matches the vehicle type', { vehicleType });

    const resultsPage = getPageObject(page, GroundTransportResultsPage);
    const texts = await resultsPage.getAllVehicleTypeTexts({ timeout });

    if (!texts.length) {
      throw new Error(
        `[GroundTransportResults.expectAllResultsVehicleType] No ground transport results are rendered, ` +
        `so "every option is a ${vehicleType}" cannot be verified. The vehicle filter may have excluded ` +
        `every offer, or the search returned nothing.`
      );
    }

    const needle = vehicleType.trim().toLowerCase();
    const mismatched = texts.filter((text) => !text.toLowerCase().includes(needle));

    if (mismatched.length) {
      throw new Error(
        `[GroundTransportResults.expectAllResultsVehicleType] ${mismatched.length} of ${texts.length} ` +
        `ground transport results do not advertise "${vehicleType}": ` +
        `${mismatched.map((text) => JSON.stringify(text)).join(', ')}. All rendered results: ` +
        `${texts.map((text) => JSON.stringify(text)).join(', ')}.`
      );
    }

    logger.info('All ground transport results match the vehicle type', {
      vehicleType,
      matched: texts.length,
    });

    return { vehicleType, matched: texts.length, texts };
  },

  /**
   * Navigates back from the ground transport results page to the trip search page by clicking the
   * "Search" link in the results breadcrumb. The search form keeps the criteria that were already
   * submitted, so the caller can change the travelers and re-submit the same search with
   * "I click the search button".
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @throws {Error} If page is missing, or the run never leaves the results view
   * @returns {Promise<{navigated: boolean}>}
   */
  async navigateBackToSearchViaBreadcrumb(page) {
    if (!page) {
      throw new Error('[GroundTransportResults.navigateBackToSearchViaBreadcrumb] "page" is required.');
    }

    logger.info('Navigating back to the ground transport search via the results breadcrumb');

    const resultsPage = getPageObject(page, GroundTransportResultsPage);
    await resultsPage.clickBreadcrumbSearchLink();

    return { navigated: true };
  },
};

module.exports = GroundTransportResults;
