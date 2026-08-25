/**
 * Page Object for the ground transport (Transferz) results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  // Results list wrapper (ground-transport-list.vue:2) — every result card renders inside it.
  GROUND_TRANSPORT_LIST: '.ground-transport-list',
  // One card per offer (ground-transport-preview.vue:2). Always resolved LIST-scoped and by index
  // so a multi-card result set cannot cross-match between cards.
  RESULT_CARD: '.ground-transport-preview',
  // Results-count line, "Showing 6 of 6 Results" (ground-transport-sort-bar.vue:3-10). Scoped to
  // the ground transport sort bar because cars and parking render their own `.show-count`
  // (car-sort-bar.vue:3, parking-sort-bar.vue:3).
  RESULTS_COUNT: '.ground-transport-sort-bar .show-count p',
  // Primary CTA on a result card. Paired with RESULTS_COUNT because the count line is behind
  // `v-if="showAllInputs"` (ground-transport-sort-bar.vue:3) and so is not always rendered —
  // either one appearing proves the results list came back.
  RESULT_CARD_CTA: '.ground-transport-list .btn--primary',
  // Left column of the card's `.ticket-top-section` (ticket-layout.vue:14). The top section is
  // `is-flex`, i.e. a ROW on desktop, so `.ticket-details` sits to the LEFT of `.extra-info`.
  TICKET_DETAILS: '.ticket-details',
  // Pick-up date/time line rendered by car-pickupdropoff-details.vue:13 as "{date} · {time}".
  // The component is mounted into the ground transport ticket-details slot
  // (ground-transport-preview.vue:74-82), so this is read ticket-details scoped.
  PICKUP_DATE_TIME: 'li.pickup-details > p',
  // DESKTOP price block. `section.extra-info` (ticket-layout.vue:22) wraps the `ticket-extra-info`
  // slot, which on desktop holds `<section v-if="!isMobile" class="ground-transport-extra-info">`
  // (ground-transport-preview.vue:130-133).
  // CRITICAL: the `.extra-info >` prefix is load-bearing — `.ground-transport-extra-info` ALSO
  // names the MOBILE block rendered inside `.ticket-details` (ground-transport-preview.vue:92),
  // whose internal order is payment → expiry → price, i.e. REVERSED vs desktop for price/payment.
  PRICE_SECTION: '.extra-info > section.ground-transport-extra-info',
  // Price amount (ground-transport-preview.vue:136-142 + app-price.vue:2,18,39). The direct-child
  // chain is load-bearing: the sibling `p.vat` holds a SECOND nested `app-price`, so a descendant
  // selector would match both.
  PRICE_AMOUNT: '.price-container > .price-wrapper > .app-price h4.amount',
  // "Pre paid" / "Pay after service" label (ground-transport-preview.vue:143-147).
  PAYMENT_TYPE_LABEL: '.price-container > .payment-method > p',
  // Desktop "Add to trip" button (ground-transport-preview.vue:155-157) — app-btn.vue:2 renders a
  // `button.btn` carrying the classes passed to the component.
  ADD_TO_TRIP_BUTTON: 'button.add-btn.desktop-btn',
};

class GroundTransportResultsPage {
  /**
   * @param {import('playwright').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Waits for the ground transport results to have rendered — either the sort bar's results-count
   * line or a result card's primary CTA, whichever appears first.
   *
   * @param {number} [timeout=15000] - Maximum time to wait, in milliseconds
   * @throws {Error} If neither becomes visible before the timeout
   * @returns {Promise<void>}
   */
  async waitForResults(timeout = 15000) {
    const resultsReady = this.page
      .locator(`${SELECTORS.RESULTS_COUNT}, ${SELECTORS.RESULT_CARD_CTA}`)
      .first();

    try {
      await resultsReady.waitFor({ state: 'visible', timeout });
    } catch (error) {
      throw new Error(
        `[GroundTransportResultsPage.waitForResults] No ground transport results rendered within ${timeout}ms ` +
        `(neither ${SELECTORS.RESULTS_COUNT} nor ${SELECTORS.RESULT_CARD_CTA} became visible). The search may ` +
        `still be loading, or it returned no results. Original: ${error.message}`
      );
    }
  }

  /**
   * Returns the ground transport result card at the given index, scoped through the results list.
   *
   * @param {number} [index=0] - Zero-based index of the result card
   * @returns {import('playwright').Locator}
   * @throws {Error} If index is not a non-negative integer
   */
  getResultCard(index = 0) {
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(
        `[GroundTransportResultsPage.getResultCard] "index" must be a non-negative integer, got: ${index}`
      );
    }
    return this.page
      .locator(SELECTORS.GROUND_TRANSPORT_LIST)
      .locator(SELECTORS.RESULT_CARD)
      .nth(index);
  }

  /**
   * Returns the left ("ticket details") column of the result card at the given index.
   *
   * @param {number} [index=0] - Zero-based index of the result card
   * @returns {import('playwright').Locator}
   */
  getTicketDetails(index = 0) {
    return this.getResultCard(index).locator(SELECTORS.TICKET_DETAILS).first();
  }

  /**
   * Returns the pick-up date/time line ("{date} · {time}") in the result card at the given index.
   *
   * @param {number} [index=0] - Zero-based index of the result card
   * @returns {import('playwright').Locator}
   */
  getPickupDateTime(index = 0) {
    return this.getTicketDetails(index).locator(SELECTORS.PICKUP_DATE_TIME).first();
  }

  /**
   * Returns the DESKTOP price section of the result card at the given index.
   *
   * @param {number} [index=0] - Zero-based index of the result card
   * @returns {import('playwright').Locator}
   */
  getPriceSection(index = 0) {
    return this.getResultCard(index).locator(SELECTORS.PRICE_SECTION).first();
  }

  /**
   * Returns the price amount inside the price section of the result card at the given index.
   *
   * @param {number} [index=0] - Zero-based index of the result card
   * @returns {import('playwright').Locator}
   */
  getPriceAmount(index = 0) {
    return this.getPriceSection(index).locator(SELECTORS.PRICE_AMOUNT).first();
  }

  /**
   * Returns the payment type label inside the price section of the result card at the given index.
   *
   * @param {number} [index=0] - Zero-based index of the result card
   * @returns {import('playwright').Locator}
   */
  getPaymentTypeLabel(index = 0) {
    return this.getPriceSection(index).locator(SELECTORS.PAYMENT_TYPE_LABEL).first();
  }

  /**
   * Returns the "Add to trip" button inside the price section of the result card at the given index.
   *
   * @param {number} [index=0] - Zero-based index of the result card
   * @returns {import('playwright').Locator}
   */
  getAddToTripButton(index = 0) {
    return this.getPriceSection(index).locator(SELECTORS.ADD_TO_TRIP_BUTTON).first();
  }

  /**
   * Waits for the desktop price section of the result card at the given index to be visible.
   *
   * @param {number} [index=0] - Zero-based index of the result card
   * @param {number} [timeout=60000] - Maximum time to wait, in milliseconds
   * @throws {Error} If the price section does not become visible before the timeout
   * @returns {Promise<void>}
   */
  async waitForPriceSection(index = 0, timeout = 60000) {
    try {
      await this.getPriceSection(index).waitFor({ state: 'visible', timeout });
    } catch (error) {
      throw new Error(
        `[GroundTransportResultsPage.waitForPriceSection] The ground transport price section did not become ` +
        `visible in result card at index ${index} within ${timeout}ms (selector: ` +
        `${SELECTORS.GROUND_TRANSPORT_LIST} >> ${SELECTORS.RESULT_CARD} >> nth=${index} >> ` +
        `${SELECTORS.PRICE_SECTION}). The results list may not have rendered yet, or the run is on a ` +
        `mobile viewport where ground-transport-preview.vue renders the price block inside ` +
        `.ticket-details instead. Original: ${error.message}`
      );
    }
  }

  /**
   * Reads the on-screen bounding boxes of the layout-relevant elements of the result card at the
   * given index, so callers can compare their RELATIVE positions.
   *
   * Each value is Playwright's `{ x, y, width, height }`, or `null` when the element is not
   * rendered/visible — callers decide how to report a missing box.
   *
   * @param {number} [index=0] - Zero-based index of the result card
   * @returns {Promise<{pickupDateTime: Object|null, priceSection: Object|null, price: Object|null,
   *                    paymentType: Object|null, addToTrip: Object|null}>}
   */
  async getPriceSectionLayoutBoxes(index = 0) {
    const pickupDateTime = await this.getPickupDateTime(index).boundingBox();
    const priceSection = await this.getPriceSection(index).boundingBox();
    const price = await this.getPriceAmount(index).boundingBox();
    const paymentType = await this.getPaymentTypeLabel(index).boundingBox();
    const addToTrip = await this.getAddToTripButton(index).boundingBox();

    return { pickupDateTime, priceSection, price, paymentType, addToTrip };
  }
}

module.exports = GroundTransportResultsPage;
