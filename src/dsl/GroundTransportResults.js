const GroundTransportResultsPage = require("@pages/GroundTransportResultsPage");
const { getPageObject } = require("@utils/pageObjectCache");
const logger = require("@utils/logger").child("GroundTransportResults-DSL");

/**
 * GroundTransportResults DSL
 *
 * Business actions performed on ground transport (Transferz) search results.
 */
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
};

module.exports = GroundTransportResults;
