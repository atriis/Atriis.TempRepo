/**
 * Page Object for car results page.
 * Contains only UI-level interactions.
 */
const { escapeRegex } = require("@utils/text");

const SELECTORS = {
  // Results page breadcrumb — trailing "gray" span shows the current product section (e.g. "Car")
  RESULTS_BREADCRUMB_CURRENT: '.car-results-container .breadcrumbs span.gray',
  // Car info bar (car-info-bar.vue) at the top of results — the first `.ellipsis-txt` in
  // `.locations` is the pick-up location name (e.g. "Madrid,Spain,(MAD)").
  CAR_INFO_BAR_LOCATION: '.car-info-bar .locations .ellipsis-txt',
  // Search results
  STATION_PREVIEW: '.car-vendor-station-list > .preview-container',
  LOCATION_LABEL: ".location-lines .location-address-text",
  CITY_CENTER_ADDRESS: '.location-label + a[target="_blank"]',
  FIRST_CAR_PREVIEW: '.car-preview',
  // One wrapper per rendered car result (car-list.vue). MUST stay scoped under `.car-list` —
  // the unrelated station list above reuses `.preview-container` (see STATION_PREVIEW).
  CAR_RESULT_CARD: '.car-list .preview-container',
  // "Eco Option" tag inside a card's `.agreements` row — the plain variant of eco-label.vue,
  // rendered only when carService.isElectricCarType(car) is true. `.eco-option-plain` exists
  // only in that variant, so it cannot match the CO2/carbon-quantity eco-label in the same card.
  ECO_OPTION_TAG: '.eco-label .eco-option-plain p',
  AGREEMENT_ICON_IN_CARD: '.agreements .agreement-img',
  AGREEMENT_TOOLTIP_TRIGGER_IN_CARD: '.agreements .ticket-agreement > div',
  AGREEMENT_TOOLTIP_DESCRIPTION: '.agreement-tooltip-list .agreement-tooltip__description',
  TERMS_BUTTON_IN_CARD: '.more-details-btn',
  TERMS_BUTTON_TEXT_IN_CARD: '.more-details-btn p',
  // Car model subtitle — visible only for SunnyCars supplier when makeModel is populated
  CAR_MODEL_SUBTITLE: '.car-model-subtitle',
  LOCATION_CITY_CENTER: '.has-text-weight-bold.is-size-7',
  LOCATION_AIRPORT: 'a[href*="maps.google.com"][target="_blank"]',
  LOCATION_ADDRESS_TEXT: ".location-address-text",
  LOCATION_DETAILS_BTN: ".location-details-link",
  CAR_LOCATION_DETAILS_TOOLTIP: ".car-location-details-tooltip",
  TOOLTIP_ANY_ADDRESS: ".car-location-details-tooltip .location-address-plain",
  TOOLTIP_PICKUP_ADDRESS: ".car-location-details-tooltip .pickup-details .location-address-plain",
  TOOLTIP_DROPOFF_ADDRESS: ".car-location-details-tooltip .dropoff-details .location-address-plain",
  FIRST_LOCATION_LINK: ".car-location-details-tooltip .pickup-details a[href*=\"maps.google.com\"][target=\"_blank\"]",
  FIRST_LOCATION_LINK_WRAPPER: ".car-location-details-tooltip .pickup-details",
  GOOGLE_MAPS_LOCATION_TEXT: '.DkEaL',
  GOOGLE_PRIVACY_ACCEPT_ALL: 'button:has-text("Accept all"), button[aria-label*="Accept"]',
  // Filter sidebar
  CAR_FILTER_CONTAINER: '.car-filter-container',
  FILTER_TITLE: '.car-filter-container h4.filter-title',
  // Counter Location filter — inside the app-checkbox-group for counterLocations
  FILTER_SECTION: '.car-filter-container .filter-container',
  FILTER_CHECKBOX_LABEL: '.car-filter-container .filter-container .el-checkbox__label p',
  FILTER_CHECKBOX: '.car-filter-container .filter-container .el-checkbox',
  // Sustainability ("Low emission cars") filter — car-filter.vue renders this as a BARE
  // el-checkbox with a plain-text default slot, so Element Plus emits the label as
  // `<span class="el-checkbox__label">` with NO inner <p>, and it sits outside any
  // `.filter-container` group. Both differences mean the generic
  // ResultsPage.filterByCheckboxOption helper (which requires `p:text-is(...)`) cannot match it.
  SUSTAINABILITY_CHECKBOX: (label) =>
    `.car-filter-container label.el-checkbox:visible:has(.el-checkbox__label:text-is("${label}"))`,
  SUSTAINABILITY_CHECKBOX_INPUT: '.el-checkbox__input',
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
    const getButton = () => this.getStationButtonByIndex(index, buttonName);

    try {
      const button = getButton();
      await button.waitFor({ state: 'visible', timeout });
      await button.scrollIntoViewIfNeeded();
      await button.click({ timeout });
    } catch (error) {
      // Vue list re-renders can detach the element between resolving and clicking.
      // Re-query the button fresh and retry once before giving up.
      if (/detached|not attached/i.test(error.message || '')) {
        try {
          const freshButton = getButton();
          await freshButton.waitFor({ state: 'visible', timeout });
          await freshButton.scrollIntoViewIfNeeded();
          await freshButton.click({ timeout });
          return;
        } catch (retryError) {
          throw new Error(
            `[CarResultsPage.clickStationButtonByIndex] Failed to click "${buttonName}" at station index ${index} even after retrying due to DOM re-render. ` +
            `Original: ${error.message}. Retry: ${retryError.message}`
          );
        }
      }
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

  async getLocationAddressTextByIndex(index, { timeout = 60000 } = {}) {
    const el = this.page.locator(SELECTORS.LOCATION_ADDRESS_TEXT).nth(index);
    await el.waitFor({ state: "visible", timeout });
    return (await el.innerText()).trim();
  }

  async openLocationDetailsTooltipByIndex(index, { timeout = 15000 } = {}) {
    const btn = this.page.locator(SELECTORS.LOCATION_DETAILS_BTN).nth(index);
    await btn.waitFor({ state: "visible", timeout });
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await this.page.locator(SELECTORS.CAR_LOCATION_DETAILS_TOOLTIP).first().waitFor({ state: "visible", timeout });
  }

  async getPickupAddressTextFromTooltip({ timeout = 10000 } = {}) {
    const el = this.page.locator(SELECTORS.TOOLTIP_PICKUP_ADDRESS).first();
    await el.waitFor({ state: "visible", timeout });
    return (await el.innerText()).trim();
  }

  async getAnyAddressTextFromTooltip({ timeout = 10000 } = {}) {
    const el = this.page.locator(SELECTORS.TOOLTIP_ANY_ADDRESS).first();
    await el.waitFor({ state: "visible", timeout });
    return (await el.innerText()).trim();
  }

  async getDropoffAddressTextFromTooltip({ timeout = 10000 } = {}) {
    const el = this.page.locator(SELECTORS.TOOLTIP_DROPOFF_ADDRESS).first();
    await el.waitFor({ state: "visible", timeout });
    return (await el.innerText()).trim();
  }

  async closeLocationDetailsTooltip(index = 0) {
    const btn = this.page.locator(SELECTORS.LOCATION_DETAILS_BTN).nth(index);
    await btn.click();
    await this.page.locator(SELECTORS.CAR_LOCATION_DETAILS_TOOLTIP).first()
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => {});
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
   * Note: .car-title contains the car CLASS (e.g. "Economy 2/4 doors"), NOT the vendor name.
   * @returns {import('playwright').Locator}
   */
  getCarTitles() {
    return this.page.locator('.car-title');
  }

  async waitForCarTitlesVisible() {
    await this.page.locator('.car-title').first().waitFor({ state: 'visible', timeout: 60000 });
  }

  /**
   * Clicks a sustainability filter checkbox in the car filter panel by its label text.
   *
   * @param {string} label - Visible checkbox label, e.g. "Low emission cars"
   * @param {{ timeout?: number }} [options]
   * @throws {Error} If label is invalid or the checkbox never becomes visible
   * @returns {Promise<void>}
   */
  async clickSustainabilityFilterCheckbox(label, { timeout = 30000 } = {}) {
    if (typeof label !== 'string' || !label.trim()) {
      throw new Error(
        `[CarResultsPage.clickSustainabilityFilterCheckbox] "label" must be a non-empty string, got: ${typeof label} (${label})`
      );
    }

    const selector = SELECTORS.SUSTAINABILITY_CHECKBOX(label.trim());
    const checkbox = this.page.locator(selector).first();

    try {
      await checkbox.waitFor({ state: 'visible', timeout });
    } catch (error) {
      throw new Error(
        `[CarResultsPage.clickSustainabilityFilterCheckbox] The "${label}" sustainability checkbox ` +
        `did not become visible in the car filter panel within ${timeout}ms (selector: ${selector}). ` +
        `The filter panel may not have loaded, or the label text may differ in the active language. ` +
        `Original: ${error.message}`
      );
    }

    await checkbox.locator(SELECTORS.SUSTAINABILITY_CHECKBOX_INPUT).click();
  }

  /**
   * Returns true when the sustainability filter checkbox is in the checked state.
   *
   * @param {string} label - Visible checkbox label, e.g. "Low emission cars"
   * @returns {Promise<boolean>}
   */
  async isSustainabilityFilterChecked(label) {
    if (typeof label !== 'string' || !label.trim()) {
      throw new Error(
        `[CarResultsPage.isSustainabilityFilterChecked] "label" must be a non-empty string, got: ${typeof label} (${label})`
      );
    }

    const checkbox = this.page.locator(SELECTORS.SUSTAINABILITY_CHECKBOX(label.trim())).first();
    const className = (await checkbox.getAttribute('class')) || '';
    return className.includes('is-checked');
  }

  /**
   * Returns a locator for every rendered car result card.
   *
   * On desktop the whole filtered list is rendered up-front — car-list.ts only attaches its
   * lazy-load IntersectionObserver when the store reports `isMobile` — so this covers all cars.
   *
   * @returns {import('playwright').Locator}
   */
  getCarResultCards() {
    return this.page.locator(SELECTORS.CAR_RESULT_CARD);
  }

  /**
   * Returns the "Eco Option" tag locator inside the car result card at the given index.
   *
   * @param {number} index - Zero-based index of the car result card
   * @returns {import('playwright').Locator}
   * @throws {Error} If index is not a non-negative integer
   */
  getEcoOptionTagInCard(index) {
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(
        `[CarResultsPage.getEcoOptionTagInCard] "index" must be a non-negative integer, got: ${index}`
      );
    }
    return this.getCarResultCards().nth(index).locator(SELECTORS.ECO_OPTION_TAG);
  }

  /**
   * Waits for the "Eco Option" tag to be visible in the car result card at the given index.
   *
   * @param {number} index - Zero-based index of the car result card
   * @param {{ timeout?: number }} [options]
   * @throws {Error} If the tag does not become visible before the timeout
   * @returns {Promise<void>}
   */
  async waitForEcoOptionTagInCard(index, { timeout = 15000 } = {}) {
    const tag = this.getEcoOptionTagInCard(index);
    try {
      await tag.waitFor({ state: 'visible', timeout });
    } catch (error) {
      throw new Error(
        `[CarResultsPage.waitForEcoOptionTagInCard] "Eco Option" tag did not become visible in ` +
        `car result card at index ${index} within ${timeout}ms (selector: ` +
        `${SELECTORS.CAR_RESULT_CARD} >> nth=${index} >> ${SELECTORS.ECO_OPTION_TAG}). ` +
        `The card is likely not a low-emission car, so eco-label was not rendered. ` +
        `Original: ${error.message}`
      );
    }
  }

  /**
   * Returns the trimmed "Eco Option" tag text from the car result card at the given index.
   *
   * @param {number} index - Zero-based index of the car result card
   * @param {{ timeout?: number }} [options]
   * @throws {Error} If the tag text cannot be read
   * @returns {Promise<string>}
   */
  async getEcoOptionTagTextInCard(index, { timeout = 15000 } = {}) {
    const tag = this.getEcoOptionTagInCard(index);
    try {
      return (await tag.innerText({ timeout })).trim();
    } catch (error) {
      throw new Error(
        `[CarResultsPage.getEcoOptionTagTextInCard] Could not read the "Eco Option" tag text from ` +
        `car result card at index ${index} within ${timeout}ms (selector: ` +
        `${SELECTORS.CAR_RESULT_CARD} >> nth=${index} >> ${SELECTORS.ECO_OPTION_TAG}). ` +
        `The tag may have re-rendered while the results list was still updating. ` +
        `Original: ${error.message}`
      );
    }
  }

  /**
   * Returns the vendor name of the first result card.
   *
   * The vendor name is NOT available as visible text — it is rendered as a logo image.
   * However, non-preferred vendors (e.g. Hertz in an agency-rate contract) display
   * an "Agency rate" text badge. Preferred/in-policy vendors (e.g. Europcar) do NOT
   * display this badge.
   *
   * This method returns the img[alt] of the vendor logo if found, or a best-effort
   * signal based on presence/absence of the agency-rate badge.
   *
   * @returns {Promise<{vendorAlt: string, hasAgencyRate: boolean}>}
   */
  async getFirstResultVendorInfo() {
    const firstTitle = this.page.locator('.car-title').first();
    await firstTitle.waitFor({ state: 'visible', timeout: 60000 });

    return await this.page.evaluate(() => {
      const firstTitle = document.querySelector('.car-title');
      if (!firstTitle) return { vendorAlt: '', hasAgencyRate: false };

      // Walk up to the nearest card ancestor (up to 15 levels)
      let card = firstTitle.parentElement;
      for (let i = 0; i < 15; i++) {
        if (!card) break;
        const cls = (card.className || '').toLowerCase();
        if (cls.includes('result') || cls.includes('card') || cls.includes('quote') || cls.includes('item')) break;
        if (card.tagName === 'BODY') break;
        card = card.parentElement;
      }
      if (!card) card = document.body;

      // Sabre vendor code → canonical name mapping
      const SABRE_VENDOR_CODES = {
        zi: 'avis', ze: 'avis', zd: 'avis',
        zr: 'hertz', hz: 'hertz',
        ep: 'europcar', eu: 'europcar',
        et: 'enterprise', ea: 'enterprise',
        zl: 'national', nl: 'national',
        al: 'alamo',
        bu: 'budget', bw: 'budget',
        sc: 'sixt', sx: 'sixt',
        ff: 'fox', fv: 'fox',
        ey: 'enterprise', ez: 'europcar',
        th: 'thrifty', tt: 'thrifty',
        dollar: 'dollar', dl: 'dollar',
        av: 'avis',
      };

      // Try to find the vendor logo img - vendor logos are SVG files with the vendor name as filename
      // e.g. europcar.svg, hertz.svg, zi.svg (Avis)
      // Dynamic car images use: retrievecaritem?prov=zi (Sabre code)
      let vendorAlt = '';
      const imgs = Array.from(card ? card.querySelectorAll('img') : []);
      for (const img of imgs) {
        const src = (img.src || img.getAttribute('src') || '').toLowerCase();
        const alt = (img.alt || '').trim().toLowerCase();
        // Skip known UI icons
        if (src.includes('close') || src.includes('check') || src.includes('bolt') || src.includes('eco') || src.includes('handshake')) continue;
        if (alt.includes('close') || alt.includes('check') || alt.includes('bolt') || alt.includes('eco')) continue;
        // Prefer: img with meaningful alt text (static SVG logos often have alt="europcar.svg")
        if (alt && alt.length > 1) {
          vendorAlt = alt.replace(/\.svg$/i, '');
          break;
        }
        // Prefer: static SVG logo src (e.g. /assets/europcar.svg) — skip dynamic retrievecaritem URLs
        if (!alt && src && src.includes('.svg') && !src.includes('retrievecaritem')) {
          const srcFile = src.split('/').pop().replace(/\.svg$/i, '');
          if (srcFile && srcFile.length > 1 && !['close', 'check', 'bolt', 'eco', 'handshake', 'icon'].includes(srcFile)) {
            vendorAlt = srcFile;
            break;
          }
        }
        // Fallback: dynamic API URL — extract prov= Sabre code and map to vendor name
        if (!alt && src.includes('retrievecaritem') && src.includes('prov=')) {
          const match = src.match(/prov=([a-z0-9]+)/);
          if (match) {
            const code = match[1].toLowerCase();
            vendorAlt = SABRE_VENDOR_CODES[code] || code;
            break;
          }
        }
      }

      // Check if first result card has "agency rate" badge text
      const cardText = (card.textContent || '').toLowerCase();
      const hasAgencyRate = cardText.includes('agency rate');

      return { vendorAlt, hasAgencyRate };
    });
  }

  /**
   * Returns the first car model subtitle element.
   * Rendered only for SunnyCars supplier when makeModel is present.
   * @returns {import('playwright').Locator}
   */
  getCarModelSubtitle() {
    return this.page.locator(SELECTORS.CAR_MODEL_SUBTITLE).first();
  }

  getCurrentBreadcrumbSection() {
    return this.page.locator(SELECTORS.RESULTS_BREADCRUMB_CURRENT).first();
  }

  /**
   * Reads the pick-up location shown in the car info bar at the top of the results page
   * (e.g. "Madrid,Spain,(MAD)"). The first `.ellipsis-txt` in `.locations` is the pick-up name.
   * @returns {Promise<string>} Trimmed location text (whitespace collapsed)
   */
  async getCarInfoBarLocationText() {
    const location = this.page.locator(SELECTORS.CAR_INFO_BAR_LOCATION).first();
    try {
      await location.waitFor({ state: 'visible', timeout: 30000 });
    } catch (err) {
      throw new Error(
        `[CarResultsPage.getCarInfoBarLocationText] Pick-up location not visible in the car info bar ` +
        `(selector: ${SELECTORS.CAR_INFO_BAR_LOCATION}). The car results page may not have loaded, ` +
        `or the info bar is not rendered in this flow. Original: ${err.message}`
      );
    }
    return ((await location.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }

  async waitForBreadcrumbVisible({ timeout = 60000 } = {}) {
    await this.getCurrentBreadcrumbSection().waitFor({ state: 'visible', timeout });
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
    // The Google Maps link only renders inside the location-details tooltip
    // (el-tooltip trigger="click" in car-location-details-tooltip.vue) - it isn't shown
    // eagerly, so "Location details" must be clicked to open it first, on both the results
    // page (car-preview.vue) and the cart's car quote card (car-quote-card.vue).
    await this.openLocationDetailsTooltipByIndex(0);

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

  /**
   * Gets all visible option labels within a filter section that has the given title.
   * @param {string} filterTitle - Title of the filter section (e.g. "Rental Counter Location")
   * @param {number} [timeout=30000]
   * @returns {Promise<string[]>} Array of option label texts
   */
  async getFilterOptionLabels(filterTitle, { timeout = 30000 } = {}) {
    const section = this.page
      .locator(SELECTORS.FILTER_SECTION)
      .filter({ has: this.page.locator('h4.filter-title', { hasText: filterTitle }) });
    await section.first().waitFor({ state: 'visible', timeout });
    // Target the label text element only — p.filter-title inside el-checkbox__label.
    // The sibling p.option-count shows the numeric count and must be excluded.
    const labels = section.first().locator('.el-checkbox__label p.filter-title');
    await labels.first().waitFor({ state: 'visible', timeout });
    const count = await labels.count();
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(((await labels.nth(i).textContent()) || '').trim());
    }
    return result;
  }

  /**
   * Clicks a filter option checkbox by its label text within the named filter section.
   * Returns metadata about the checkbox state so the caller can decide whether the click
   * was meaningful (e.g. already-checked+disabled when only one option exists).
   *
   * @param {string} filterTitle - Filter section title (e.g. "Rental Counter Location")
   * @param {string} optionLabel - Option label text (e.g. "At airport")
   * @param {number} [timeout=15000]
   * @returns {Promise<{clicked: boolean, wasAlreadyChecked: boolean, wasDisabled: boolean}>}
   */
  async clickFilterOptionByLabel(filterTitle, optionLabel, { timeout = 15000 } = {}) {
    const section = this.page
      .locator(SELECTORS.FILTER_SECTION)
      .filter({ has: this.page.locator('h4.filter-title', { hasText: filterTitle }) });
    await section.first().waitFor({ state: 'visible', timeout });

    // Find the el-checkbox whose label p.filter-title exactly matches optionLabel.
    // Use section-scoped getByText on the label text element so we stay within this filter section
    // and avoid ambiguous matches from other filter groups on the page.
    const labelEl = section.first()
      .locator('.el-checkbox__label p.filter-title')
      .filter({ hasText: optionLabel })
      .first();
    await labelEl.waitFor({ state: 'visible', timeout });

    // Walk up to the parent .el-checkbox to read its state classes (is-checked, is-disabled)
    const checkbox = labelEl.locator('xpath=ancestor::label[contains(@class,"el-checkbox")][1]');
    const cls = await checkbox.getAttribute('class').catch(() => '') || '';
    const wasAlreadyChecked = cls.includes('is-checked');
    const wasDisabled = cls.includes('is-disabled');
    if (wasDisabled) {
      // The checkbox is disabled — cannot be clicked. Return state info to caller.
      return { clicked: false, wasAlreadyChecked, wasDisabled };
    }

    // Click the .el-checkbox__inner element — the actual clickable toggle box.
    // Clicking the outer label wrapper can be intercepted by child elements (the inner <label>
    // rendered by app-checkbox-group), so we target the checkbox box directly as the Playwright
    // recording confirmed: label > .el-checkbox__input > .el-checkbox__inner
    const inner = checkbox.locator('.el-checkbox__inner').first();
    await inner.waitFor({ state: 'visible', timeout });
    await inner.scrollIntoViewIfNeeded();
    await inner.click({ timeout });
    return { clicked: true, wasAlreadyChecked, wasDisabled };
  }

  /**
   * Returns whether a filter option checkbox in the named filter section is checked.
   * @param {string} filterTitle - Filter section title
   * @param {string} optionLabel - Option label text
   * @param {number} [timeout=15000]
   * @returns {Promise<boolean>}
   */
  async isFilterOptionChecked(filterTitle, optionLabel, { timeout = 15000 } = {}) {
    const section = this.page
      .locator(SELECTORS.FILTER_SECTION)
      .filter({ has: this.page.locator('h4.filter-title', { hasText: filterTitle }) });
    await section.first().waitFor({ state: 'visible', timeout });

    // Use the same label-text locator strategy as clickFilterOptionByLabel for consistency.
    const labelEl = section.first()
      .locator('.el-checkbox__label p.filter-title')
      .filter({ hasText: optionLabel })
      .first();
    await labelEl.waitFor({ state: 'visible', timeout });
    const checkbox = labelEl.locator('xpath=ancestor::label[contains(@class,"el-checkbox")][1]');

    // Poll for the is-checked class to appear — Vue reactivity may not settle immediately
    // after a click, so reading the class once can produce a false negative.
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const cls = await checkbox.getAttribute('class').catch(() => '');
      if ((cls || '').includes('is-checked')) {
        return true;
      }
      await this.page.waitForTimeout(200);
    }
    return false;
  }

  /**
   * Returns the count of currently visible car result cards.
   * @param {number} [timeout=30000]
   * @returns {Promise<number>}
   */
  async getCarResultsCount({ timeout = 30000 } = {}) {
    await this.page.locator(SELECTORS.FIRST_CAR_PREVIEW).first().waitFor({ state: 'visible', timeout });
    return this.page.locator(SELECTORS.FIRST_CAR_PREVIEW).count();
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
