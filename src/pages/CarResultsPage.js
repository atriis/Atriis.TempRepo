/**
 * Page Object for car results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  // Search results
  LOCATION_LABEL: '.location-label',
  LOCATION_CITY_CENTER: '.has-text-weight-bold.is-size-7',
  LOCATION_AIRPORT: 'a[href*="maps.google.com"][target="_blank"]',
  // Payment type label on each car result card (.payment-method <p>)
  PAYMENT_TYPE_LABEL: '.payment-method p',
  PAYMENT_METHOD_TEXT: '.btns-container .payment-method p',
  PAYMENT_TYPE_TEXT: '.quote-extras--payment-method .el-radio__label, .quote-extras--payment-method .el-radio, .payment-restrictions-container .app-label.grayed, .app-label.grayed, .payment-type',
  BTNS_CONTAINER: '.btns-container',
  CARD_ANCESTOR_XPATH: 'ancestor::*[contains(@class,"card") or contains(@class,"quote") or contains(@class,"result")][1]',
};

const KNOWN_PAYMENT_TYPES = [
  'Pay On Departure',
  'Pre paid',
];

class CarResultsPage {
  constructor(page) {
    this.page = page;
  }

  escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Gets a location element by index.
   * @param {number} index - Zero-based index of the location element
   * @param {string} [locationType='cityCenter'] - Type of location: 'cityCenter' or 'airport'
   * @returns {import('playwright').Locator}
   */
  getLocationByIndex(index, locationType = 'cityCenter') {
    const selector = locationType === 'airport' ? SELECTORS.LOCATION_AIRPORT : SELECTORS.LOCATION_CITY_CENTER;
    return this.page.locator(selector).nth(index);
  }

  async waitForLocationVisible(index = 0, locationType = 'cityCenter') {
    const selector = locationType === 'airport' ? SELECTORS.LOCATION_AIRPORT : SELECTORS.LOCATION_CITY_CENTER;
    await this.page.locator(selector).nth(index).waitFor({ state: 'visible', timeout: 60000 });
  }

  /**
    * Gets the location label text (e.g., "Pick up", "Drop off") at the given index.
    * @param {number} index - Zero-based index of the location element (ex. pick-up > index 0 or drop-off > index 1 for the first quote, two indexes per quote)
    * @returns {Promise<string>} The label text
    */
  getLocationLabelByIndex(index) {
    const selector = SELECTORS.LOCATION_LABEL;
    return this.page.locator(selector).nth(index);
  }

  /**
   * Gets the payment type label element at the given result index.
   * Displays "Pre paid" when isPrePaid=true, "Pay On Departure" otherwise.
   * @param {number} index - Zero-based index of the car result card
   * @returns {import('playwright').Locator}
   */
  getPaymentTypeLabelAtIndex(index) {
    return this.page.locator(SELECTORS.PAYMENT_TYPE_LABEL).nth(index);
  }

  async waitForPaymentTypeVisible(index = 0, { timeout = 60000 } = {}) {
    await this.page.locator(SELECTORS.PAYMENT_TYPE_LABEL).nth(index).waitFor({ state: 'visible', timeout });
  }

  /**
   * Returns the currently visible payment type text from car results.
   * Tries dedicated payment labels first, then known payment-type phrases.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<string>}
   */
  async getCurrentFOPText({ timeout = 15000, agencyName } = {}) {
    const normalizeFOP = (value) => {
      const text = (value || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (text.includes('pay on departure')) {
        return 'Pay on departure';
      }
      if (text.includes('pre paid') || text.includes('pre-paid')) {
        return 'Pre paid';
      }
      return null;
    };

    let scope = this.page;
    const addToTripBtn = this.page.getByRole('button', { name: /add to trip/i });

    // Best structural scope from provided DOM:
    // pick the container that includes both Add to trip and payment-method.
    const containerWithAddBtn = this.page
      .locator('.btns-container')
      .filter({ has: addToTripBtn.first() })
      .first();

    if (await containerWithAddBtn.isVisible().catch(() => false)) {
      scope = containerWithAddBtn;
    }

    if (agencyName) {
      const agency = this.page.getByText(new RegExp(this.escapeRegex(agencyName), 'i')).first();
      await agency.waitFor({ state: 'visible', timeout });

      const cardFromAddToTrip = agency
        .locator('xpath=' + SELECTORS.CARD_ANCESTOR_XPATH)
        .first();

      if (await cardFromAddToTrip.isVisible().catch(() => false)) {
        scope = cardFromAddToTrip;
      } else {
        const cardFallback = agency
          .locator('xpath=' + SELECTORS.CARD_ANCESTOR_XPATH)
          .first();
        if (await cardFallback.isVisible().catch(() => false)) {
          scope = cardFallback;
        } else {
          scope = agency;
        }
      }
    }

    const paymentMethodLabels = scope
      .locator(SELECTORS.BTNS_CONTAINER)
      .filter({ has: scope.getByRole('button', { name: /add to trip/i }).first() })
      .locator(SELECTORS.PAYMENT_TYPE_LABEL);

    const fallbackPaymentMethodLabels = scope.locator(SELECTORS.PAYMENT_METHOD_TEXT);
    const labels = scope.locator(SELECTORS.PAYMENT_TYPE_TEXT);
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
      // Primary source for Cars results (matches payment-method block in result card).
      const paymentMethodCount = await paymentMethodLabels.count().catch(() => 0);
      for (let i = 0; i < paymentMethodCount; i++) {
        const label = paymentMethodLabels.nth(i);
        const visible = await label.isVisible().catch(() => false);
        if (!visible) {
          continue;
        }

        const text = (await label.textContent().catch(() => '') || '').replace(/\s+/g, ' ').trim();
        const normalized = normalizeFOP(text);
        if (normalized) {
          return normalized;
        }
      }

      // Fallback if structural relation is different in some suppliers/responsive modes.
      const fallbackPaymentMethodCount = await fallbackPaymentMethodLabels.count().catch(() => 0);
      for (let i = 0; i < fallbackPaymentMethodCount; i++) {
        const label = fallbackPaymentMethodLabels.nth(i);
        const visible = await label.isVisible().catch(() => false);
        if (!visible) {
          continue;
        }

        const text = (await label.textContent().catch(() => '') || '').replace(/\s+/g, ' ').trim();
        const normalized = normalizeFOP(text);
        if (normalized) {
          return normalized;
        }
      }

      // Secondary selectors for variants where payment-method block differs.
      const count = await labels.count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        const label = labels.nth(i);
        const visible = await label.isVisible().catch(() => false);
        if (!visible) {
          continue;
        }

        const text = (await label.textContent().catch(() => '') || '').replace(/\s+/g, ' ').trim();
        const normalized = normalizeFOP(text);
        if (normalized) {
          return normalized;
        }
      }

      for (const type of KNOWN_PAYMENT_TYPES) {
        const candidate = scope.getByText(type, { exact: false }).first();
        if (await candidate.isVisible().catch(() => false)) {
          return normalizeFOP(type) || type;
        }
      }

      await this.page.waitForTimeout(200);
    }

    const scopeHint = agencyName ? ` for agency "${agencyName}"` : '';
    throw new Error(`Could not detect current car FOP on results${scopeHint}. Expected "Pay on departure" or "Pre paid".`);
  }
}

module.exports = CarResultsPage;
