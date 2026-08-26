/**
 * Page Object for the ground transport (Transferz) results page.
 * Contains only UI-level interactions.
 */

const { normalizeText } = require('@utils/text');

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
  // Vehicle model line of a result card (ground-transport-preview.vue:47-50), rendered as
  // `<h3 class="ground-transport-desc">{{ transport.VehicleType }} (up to {N} people)</h3>` — so the
  // supplier's vehicle type ("Minibus", "Minivan", "Business limousine") is the LEADING token of that
  // text, followed by a localised capacity suffix. Read CARD-scoped: unlike
  // `.ground-transport-extra-info`, this node is not duplicated between the desktop and mobile blocks
  // (only the price/payment block is), so there is exactly one per card. The Testim original asserted
  // the same node (`waitForText(page, ".ground-transport-desc", /Minibus/)`).
  VEHICLE_TYPE_TEXT: 'h3.ground-transport-desc',
  // Desktop "Add to trip" button (ground-transport-preview.vue:155-157) — app-btn.vue:2 renders a
  // `button.btn` carrying the classes passed to the component.
  ADD_TO_TRIP_BUTTON: 'button.add-btn.desktop-btn',
  // Root of the ground transport results view (ground-transport-results.vue:2). Unique to that view
  // in Atriis.App, so it doubles as the "still on the results page" signal after a breadcrumb click.
  RESULTS_CONTAINER: '.ground-transport-results',
  // First (and only) link in the results breadcrumb (ground-transport-results.vue:18-25) — the
  // router-link back to the trip index for the ground transport product, labelled $t('btn.search').
  // Container-scoped because the trip bar renders its own breadcrumb; the whole block sits behind
  // `v-if="!isLoading"`, so waiting for it doubles as a results-ready gate.
  RESULTS_BREADCRUMB_SEARCH_LINK: '.ground-transport-results .breadcrumbs a',
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

  /**
   * Reads the vehicle model text of every rendered ground transport result card, in list order.
   *
   * Each entry is the whitespace-normalised `.ground-transport-desc` text, i.e.
   * "{VehicleType} (up to {N} people)". Callers match against it rather than parsing it, because the
   * capacity suffix is localised while the vehicle type comes straight from the supplier.
   *
   * Only the cards currently rendered are read — the results list can be paginated behind a
   * "View more" button, so this reflects what is on screen at call time.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=15000] - Maximum time to wait for the results list, in ms
   * @throws {Error} If no result card renders before the timeout, or a card has no model text node
   * @returns {Promise<string[]>} One model text per rendered result card
   */
  async getAllVehicleTypeTexts({ timeout = 15000 } = {}) {
    await this.waitForResults(timeout);

    const cards = this.page
      .locator(SELECTORS.GROUND_TRANSPORT_LIST)
      .locator(SELECTORS.RESULT_CARD);
    await cards.first().waitFor({ state: 'visible', timeout });

    const count = await cards.count();
    const texts = [];
    for (let index = 0; index < count; index += 1) {
      const desc = cards.nth(index).locator(SELECTORS.VEHICLE_TYPE_TEXT).first();
      if (!(await desc.count())) {
        throw new Error(
          `[GroundTransportResultsPage.getAllVehicleTypeTexts] Ground transport result card index ` +
          `${index} of ${count} has no ${SELECTORS.VEHICLE_TYPE_TEXT} node. The card markup may have ` +
          `changed, or a non-Transferz card is rendering inside ${SELECTORS.GROUND_TRANSPORT_LIST}.`
        );
      }
      texts.push(normalizeText(await desc.textContent()));
    }

    return texts;
  }

  /**
   * Clicks the "Search" link in the ground transport results breadcrumb to navigate back to the
   * trip search page. The search form keeps the criteria that were already submitted, so the caller
   * can change the travelers and re-submit the same search.
   *
   * The breadcrumb only renders once loading has finished (`v-if="!isLoading"` in
   * ground-transport-results.vue), so waiting for it doubles as a results-ready gate.
   *
   * @param {number} [timeout=30000] - Max wait time in ms
   * @throws {Error} If the link never becomes clickable, or the run never leaves the results view
   * @returns {Promise<void>}
   */
  async clickBreadcrumbSearchLink(timeout = 30000) {
    const link = this.page.locator(SELECTORS.RESULTS_BREADCRUMB_SEARCH_LINK).first();

    try {
      await link.waitFor({ state: 'visible', timeout });
      await link.click();
      // Confirm the router actually left the results route rather than trusting the click: the
      // search form and the results list are distinct views, so the results container
      // disappearing is the only reliable signal that the navigation happened.
      await this.page.locator(SELECTORS.RESULTS_CONTAINER).waitFor({ state: 'hidden', timeout });
    } catch (err) {
      throw new Error(
        `[GroundTransportResultsPage.clickBreadcrumbSearchLink] Could not navigate back via the ` +
        `"Search" link in the ground transport results breadcrumb (selector: ` +
        `"${SELECTORS.RESULTS_BREADCRUMB_SEARCH_LINK}"). Likely causes: the results page is still ` +
        `loading (the breadcrumb is hidden while isLoading), or the run is not on the ground ` +
        `transport results page at all. Original: ${err.message}`
      );
    }
  }
}

module.exports = GroundTransportResultsPage;
