/**
 * Page Object for car results page.
 * Contains only UI-level interactions.
 */
const { escapeRegex } = require("@utils/text");

const SELECTORS = {
  // Search results
  STATION_PREVIEW: '.car-vendor-station-list > .preview-container',
  LOCATION_LABEL: '.location-label',
  CITY_CENTER_ADDRESS: '.location-label + a[target="_blank"]',
  FIRST_CAR_PREVIEW: '.car-preview',
  AGREEMENT_ICON_IN_CARD: '.agreements .agreement-img',
  AGREEMENT_TOOLTIP_TRIGGER_IN_CARD: '.agreements .ticket-agreement > div',
  AGREEMENT_TOOLTIP_DESCRIPTION: '.agreement-tooltip-list .agreement-tooltip__description',
  TERMS_BUTTON_IN_CARD: '.more-details-btn',
  TERMS_BUTTON_TEXT_IN_CARD: '.more-details-btn p',
  // Car model subtitle — visible only for SunnyCars supplier when makeModel is populated
  CAR_MODEL_SUBTITLE: '.car-model-subtitle',
  LOCATION_CITY_CENTER: '.has-text-weight-bold.is-size-7',
  LOCATION_AIRPORT: 'a[href*="maps.google.com"][target="_blank"]',
  FIRST_LOCATION_LINK: '.pickup-details a[href*="maps.google.com"][target="_blank"]',
  FIRST_LOCATION_LINK_WRAPPER: '.pickup-details',
  GOOGLE_MAPS_LOCATION_TEXT: '.DkEaL',
  GOOGLE_PRIVACY_ACCEPT_ALL: 'button:has-text("Accept all"), button[aria-label*="Accept"]',
  // Filter sidebar
  CAR_FILTER_CONTAINER: '.car-filter-container',
  FILTER_TITLE: '.car-filter-container h4.filter-title',
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

  getStationPreviewByIndex(index) {
    return this.page.locator(SELECTORS.STATION_PREVIEW).nth(index);
  }

  getStationButtonByIndex(index, buttonName) {
    return this.getStationPreviewByIndex(index)
      .getByRole('button', { name: buttonName })
      .first();
  }

  async waitForStationButtonVisible(index, buttonName, { timeout = 30000 } = {}) {
    await this.getStationButtonByIndex(index, buttonName).waitFor({ state: 'visible', timeout });
  }

  async clickStationButtonByIndex(index, buttonName, { timeout = 30000 } = {}) {
    const button = this.getStationButtonByIndex(index, buttonName);

    try {
      await button.waitFor({ state: 'visible', timeout });
      await button.scrollIntoViewIfNeeded();
      await button.click({ timeout });
    } catch (error) {
      throw new Error(
        `[CarResultsPage.clickStationButtonByIndex] Failed to click the "${buttonName}" button for station index ${index}. ` +
        `The station list may not have loaded yet, the button may be covered, or the city-centre station card may have re-rendered. ` +
        `Original: ${error.message}`
      );
    }
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

  getCityCenterAddressByIndex(index) {
    return this.page.locator(SELECTORS.CITY_CENTER_ADDRESS).nth(index);
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
      const agency = this.page.getByText(new RegExp(escapeRegex(agencyName), 'i')).first();
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

  /**
   * Returns a locator for all car result title elements (.car-title in car-preview component).
   * @returns {import('playwright').Locator}
   */
  getCarTitles() {
    return this.page.locator('.car-title');
  }

  async waitForCarTitlesVisible() {
    await this.page.locator('.car-title').first().waitFor({ state: 'visible', timeout: 60000 });
  }

  /**
   * Returns the first car model subtitle element.
   * Rendered only for SunnyCars supplier when makeModel is present.
   * @returns {import('playwright').Locator}
   */
  getCarModelSubtitle() {
    return this.page.locator(SELECTORS.CAR_MODEL_SUBTITLE).first();
  }

  async waitForCarModelVisible({ timeout = 60000 } = {}) {
    await this.page.locator(SELECTORS.CAR_MODEL_SUBTITLE).first().waitFor({ state: 'visible', timeout });
  }

  getFirstCarPreview() {
    return this.page.locator(SELECTORS.FIRST_CAR_PREVIEW).first();
  }

  async hoverAgreementIconInFirstCarResult({ timeout = 15000 } = {}) {
    const card = this.getFirstCarPreview();
    await card.waitFor({ state: 'visible', timeout });

    const firstAgreementTrigger = this.page
      .locator(`${SELECTORS.FIRST_CAR_PREVIEW} ${SELECTORS.AGREEMENT_TOOLTIP_TRIGGER_IN_CARD}`)
      .first();

    try {
      await firstAgreementTrigger.waitFor({ state: 'visible', timeout });
      await firstAgreementTrigger.hover();
      return;
    } catch {
      // Fallback to direct icon hover for older markup variants.
      const firstAgreementIcon = this.page
        .locator(`${SELECTORS.FIRST_CAR_PREVIEW} ${SELECTORS.AGREEMENT_ICON_IN_CARD}`)
        .first();

      try {
        await firstAgreementIcon.waitFor({ state: 'visible', timeout });
        await firstAgreementIcon.hover();
        return;
      } catch (err) {
        throw new Error(
          `[CarResultsPage.hoverAgreementIconInFirstCarResult] Could not open the agreement tooltip in car results. ` +
          `No visible agreement trigger/icon was found in the returned car cards within ${timeout}ms. ` +
          `Original: ${err.message}`,
        );
      }
    }
  }

  async hasVisibleAgreementTrigger({ timeout = 3000 } = {}) {
    const trigger = this.page
      .locator(`${SELECTORS.FIRST_CAR_PREVIEW} ${SELECTORS.AGREEMENT_TOOLTIP_TRIGGER_IN_CARD}`)
      .first();

    try {
      await trigger.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      const icon = this.page
        .locator(`${SELECTORS.FIRST_CAR_PREVIEW} ${SELECTORS.AGREEMENT_ICON_IN_CARD}`)
        .first();
      try {
        await icon.waitFor({ state: 'visible', timeout });
        return true;
      } catch {
        return false;
      }
    }
  }

  async getTermsAndConditionsTextInFirstCarResult({ timeout = 15000 } = {}) {
    const card = this.getFirstCarPreview();
    await card.waitFor({ state: 'visible', timeout });

    const termsTextElement = card.locator(SELECTORS.TERMS_BUTTON_TEXT_IN_CARD).filter({ hasText: /terms/i }).first();

    try {
      await termsTextElement.waitFor({ state: 'visible', timeout });
      return ((await termsTextElement.textContent()) || '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      throw new Error(
        `[CarResultsPage.getTermsAndConditionsTextInFirstCarResult] Could not find visible terms and conditions text in the first car result within ${timeout}ms. ` +
        `Original: ${err.message}`,
      );
    }
  }

  async getAgreementTooltipText({ timeout = 10000 } = {}) {
    const tooltipDescriptions = this.page.locator(SELECTORS.AGREEMENT_TOOLTIP_DESCRIPTION);
    await tooltipDescriptions.first().waitFor({ state: 'visible', timeout });

    const count = await tooltipDescriptions.count();
    const lines = [];
    for (let i = 0; i < count; i++) {
      const text = ((await tooltipDescriptions.nth(i).textContent()) || '').replace(/\s+/g, ' ').trim();
      if (text) {
        lines.push(text);
      }
    }

    return lines.join(' | ');
  }

  async clickTermsAndConditionsInFirstCarResult({ timeout = 15000 } = {}) {
    const card = this.getFirstCarPreview();
    await card.waitFor({ state: 'visible', timeout });

    const termsButton = card.locator(SELECTORS.TERMS_BUTTON_IN_CARD).filter({ hasText: /terms/i }).first();
    await termsButton.waitFor({ state: 'visible', timeout });
    await termsButton.click();
  }

  /**
   * Checks if a filter with the given title text is visible in the car filter sidebar.
   * @param {string} filterTitle - The expected filter title text (e.g. "Rental Agency")
   * @param {number} timeout - Timeout in ms (default: 30000)
   * @returns {Promise<boolean>}
   */
  async isFilterTitleVisible(filterTitle, timeout = 30000) {
    const filterEl = this.page
      .locator(SELECTORS.FILTER_TITLE, { hasText: filterTitle })
      .first();
    try {
      await filterEl.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async openFirstLocationLinkInResults() {
    const link = this.page.locator(SELECTORS.FIRST_LOCATION_LINK).first();
    await link.waitFor({ state: 'visible', timeout: 30000 });

    const popupPromise = this.page.waitForEvent('popup', { timeout: 30000 });
    await link.click();
    const mapsPage = await popupPromise;

    await mapsPage.waitForLoadState('domcontentloaded', { timeout: 30000 });

    return {
      mapsPage,
    };
  }

  async readGoogleMapsContext(mapsPage) {
    if (!mapsPage) {
      throw new Error('mapsPage is required, got: ' + typeof mapsPage);
    }

    await mapsPage.waitForLoadState('domcontentloaded', { timeout: 30000 });

    // Handle Google privacy consent dialog
    const acceptAllButton = mapsPage.getByRole('button', { name: /accept all/i }).first();
    const isAcceptButtonVisible = await acceptAllButton.isVisible().catch(() => false);
    if (isAcceptButtonVisible) {
      await acceptAllButton.click().catch(() => {});
      await mapsPage.waitForTimeout(2000); // Wait for consent to process and page to re-render
    }

    // Wait for location text to become visible — try multiple selectors with explicit waits
    const locationSelectors = [
      SELECTORS.GOOGLE_MAPS_LOCATION_TEXT,  // .DkEaL — plus code result item
      '[role="heading"]',                   // location heading in results panel
      '.gm-style-iw-c [role="button"]',     // info window on pin click
      'h1[data-attrid="title"]',            // place title for named locations
    ];

    let locationText = '';
    for (const selector of locationSelectors) {
      const locator = mapsPage.locator(selector).first();
      const visible = await locator
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() => true)
        .catch(() => false);
      if (visible) {
        locationText = ((await locator.textContent().catch(() => '')) || '')
          .replace(/\s+/g, ' ')
          .trim();
        if (locationText) break;
      }
    }

    return {
      mapsPage,
      url: mapsPage.url(),
      locationText,
    };
  }
}

module.exports = CarResultsPage;
