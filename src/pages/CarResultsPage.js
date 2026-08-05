/**
 * Page Object for car results page.
 * Contains only UI-level interactions.
 */
const { escapeRegex } = require("@utils/text");
const { waitForText } = require("@utils/wait");

const SELECTORS = {
  // Results page breadcrumb — trailing "gray" span shows the current product section (e.g. "Car")
  RESULTS_BREADCRUMB_CURRENT: '.car-results-container .breadcrumbs span.gray',
  // Car info bar (car-info-bar.vue) at the top of results — the first `.ellipsis-txt` in
  // `.locations` is the pick-up location name (e.g. "Madrid,Spain,(MAD)").
  CAR_INFO_BAR_LOCATION: '.car-info-bar .locations .ellipsis-txt',
  // Search results
  STATION_PREVIEW: '.car-vendor-station-list > .preview-container',
  // City station-selection view (car-city-search.vue) renders the station list beside a Google map
  // (car-stations-google-map.vue). The wrapping `.city-map-container` is `v-if="!isMobile"`, so the
  // map exists on DESKTOP ONLY — on mobile the same component is moved inside an el-drawer behind a
  // "View on map" button.
  STATION_MAP_CONTAINER: '.car-city-search .city-map-container .car-stations-google-map',
  // One Google Maps marker per station that has coordinates. Google's marker DOM is version- and
  // option-dependent, so the marker is resolved by probing these candidates in order (see
  // waitForStationMapMarkers) rather than betting on a single shape. Both candidates were verified
  // against the live Skipton search (6 stations): each returned exactly 6, stable across repeated
  // reads. Classic `google.maps.Marker` renders TWO images per marker — the icon plus a
  // transparent click-area overlay — so each candidate deliberately counts a marker WRAPPER or the
  // click-area image, never the icon, to avoid double counting:
  //  1. the focusable wrapper Google puts around each clickable marker (markers get role="button"
  //     because car-stations-google-map.vue attaches a click listener to emit `markStation`);
  //  2. Google's per-marker click-area image, maps.gstatic.com/mapfiles/transparent.png.
  // Do NOT match the icon by `src`: the icon is imported into JS, and Vite inlines
  // car-station-marker.svg (3.2 KB, under the default 4 KB assetsInlineLimit) as a URL-ENCODED
  // data URI of the SVG source, so no filename survives to match on. A generic
  // `img[src^="data:image/svg"]` must not be used either — it also matches Google's own control
  // icons (measured 12 visible against 6 stations, which is what made this assertion fail).
  // Every candidate MUST stay scoped under `.car-stations-google-map`: the same marker asset is
  // also rendered inside each station card and in the mobile carousel, so an unscoped selector
  // would count those instead and pass for the wrong reason.
  STATION_MAP_MARKER_CANDIDATES: [
    '.car-stations-google-map .gm-style [role="button"]:has(img)',
    '.car-stations-google-map .gm-style img[src*="transparent.png"]',
  ],
  // A station card renders its numbered marker badge only under `v-if="hasLocation"`
  // (car-vendor-station-preview.vue) — the exact `latitude && longitude` predicate the map's
  // `stationMarkers` computed filters on, which is what makes marker count == badge count an
  // invariant rather than an approximation. Always match this with `:has()` on the CARD, never
  // count the badge directly: each card renders it twice (is-hidden-tablet + is-hidden-mobile
  // responsive duplicates), which would double the count.
  STATION_PREVIEW_MARKER_BADGE: '.marker-img-container p.icon-number',
  // The location NAME and street ADDRESS lines inside a station card's `.station-details`
  // (car-vendor-station-preview.vue): `stationAddress` then `stationStreet`, both rendered as
  // `<p class="has-text-weight-bold is-size-7">`. MUST be used card-scoped (via
  // getStationPreviewByIndex) — the bare class pair is what LOCATION_CITY_CENTER matches
  // page-wide, so an unscoped read would pull in lines from outside the station list.
  // The SECOND line is `v-if="stationAddress !== stationStreet"`, so a station whose name and
  // street resolve to the same value renders ONE <p>, not two — callers must tolerate a single
  // line rather than treating two as invariant.
  STATION_DETAIL_LINE: '.station-details p.has-text-weight-bold.is-size-7',
  LOCATION_LABEL: ".location-lines .location-address-text",
  CITY_CENTER_ADDRESS: '.location-label + a[target="_blank"]',
  FIRST_CAR_PREVIEW: '.car-preview',
  // One wrapper per rendered car result (car-list.vue). MUST stay scoped under `.car-list` —
  // the unrelated station list above reuses `.preview-container` (see STATION_PREVIEW).
  CAR_RESULT_CARD: '.car-list .preview-container',
  // Price block (car-preview.vue -> app-price). Title renders "{N} days total" (numberOfDays);
  // subtitle renders "{currency}{avgPerDayPrice} / Per day" and only exists when numberOfDays > 1.
  // MUST be scoped to a single card (via CAR_RESULT_CARD) — every rendered card has its own.
  CARD_PRICE_TITLE: '.price-container .price .price-title p',
  CARD_PRICE_SUBTITLE: '.price-container .price .price-subtitle p',
  // "Eco Option" tag inside a card's `.agreements` row — the plain variant of eco-label.vue,
  // rendered only when carService.isElectricCarType(car) is true. `.eco-option-plain` exists
  // only in that variant, so it cannot match the CO2/carbon-quantity eco-label in the same card.
  ECO_OPTION_TAG: '.eco-label .eco-option-plain p',
  // "Add to trip" button inside a car result card (car-preview.vue). The card renders the button
  // twice — a desktop copy (`.desktop-btn.is-hidden-mobile`) and a mobile copy
  // (`.mobile-btn.is-hidden-tablet`) — so `:visible` is REQUIRED to keep exactly one match at any
  // viewport. app-btn.vue binds `:disabled="isDisabled"` on a real <button>, so toBeDisabled() works.
  CAR_RESULT_ADD_TO_TRIP_BUTTON: 'button.add-btn:visible',
  // Sort bar (car-sort-bar.vue) — the component renders NO data-testid, so the app-select's own
  // `car-sort` class is the anchor. The bar is rendered on desktop; on mobile it moves into the
  // "Sort and filters" drawer.
  CAR_SORT_SELECT: '.car-sort-bar .car-sort .el-select',
  // Element Plus renders the currently selected value of the new el-select inside
  // `.el-select__placeholder` (same shape as HotelLevelResultsPage.SORT_SELECTED_ITEM).
  CAR_SORT_SELECTED_LABEL: '.car-sort-bar .car-sort .el-select .el-select__placeholder',
  // Element Plus TELEPORTS every el-select popper to <body>, so each select on the results page
  // keeps its own option list in the DOM at all times and only the OPEN one is visible. Scoping to
  // that single visible panel — never to the popper wrapper class — is what keeps this stable: the
  // wrapper class depends on whether the select came through app-select.vue (which adds
  // `app-select-popper`) or is a plain el-select, and the deployed build does not always match the
  // Atriis.App source. `.el-select-dropdown:visible` is the panel every version renders (same
  // pattern as CartPage.EL_SELECT_VISIBLE_DROPDOWN_ITEM).
  CAR_SORT_DROPDOWN_PANEL: '.el-select-dropdown:visible',
  // One option row inside the panel above. el-option renders `<li class="el-select-dropdown__item">
  // <span>Price</span></li>`, so the label must be matched with an anchored `hasText` filter on the
  // <li> — NOT with `:text-is("Price")`, which only ever matches the SMALLEST element holding the
  // text (the inner <span>) and therefore never resolves the clickable <li>.
  CAR_SORT_OPTION_ITEM: '.el-select-dropdown__item',
  // Results pagination (car-results.vue → app-pagination.vue, el-pagination layout
  // "prev, pager, next, jumper"). Rendered `v-if="!isMobile"`, i.e. DESKTOP ONLY, and only inside
  // the `carsToShow?.length > 0` block — so it is simply ABSENT when there is a single page.
  CAR_RESULTS_PAGINATION: '.car-results-container .app-pagination',
  // el-pagination renders a real <button> that carries the `disabled` attribute on the last page.
  CAR_RESULTS_PAGINATION_NEXT: '.car-results-container .app-pagination button.btn-next',
  CAR_RESULTS_PAGINATION_ACTIVE_PAGE: '.car-results-container .app-pagination .el-pager li.number.is-active',
  // car-list.vue stamps id="last-item" on the LAST rendered card of the current page — the same
  // sentinel HotelLevelResultsPage.LAST_HOTEL_VIEW_RATES_BUTTON relies on.
  LAST_CAR_RESULT_CARD: ".car-list [id='last-item']",
  // car-preview.vue renders the out-of-policy badge on EVERY card and merely hides it with Bulma's
  // `is-invisible` (visibility: hidden) when car.travelPolicyViolations is empty. An UNSCOPED
  // `.app-out-of-policy` is therefore ALWAYS present in the DOM and `.first()` resolves to an
  // in-policy hidden badge — scoping to the last-item card is what makes the assertion meaningful.
  LAST_CAR_RESULT_OOP_BADGE: ".car-list [id='last-item'] .app-out-of-policy",
  // The "Out of policy" wording itself (app-oop-badge.vue → p.out-of-policy-badge).
  LAST_CAR_RESULT_OOP_BADGE_TEXT: ".car-list [id='last-item'] .out-of-policy-badge",
  AGREEMENT_ICON_IN_CARD: '.agreements .agreement-img',
  AGREEMENT_TOOLTIP_TRIGGER_IN_CARD: '.agreements .ticket-agreement > div',
  AGREEMENT_TOOLTIP_DESCRIPTION: '.agreement-tooltip-list .agreement-tooltip__description',
  // ticket-agreements.vue renders the agreement's own logo inside the tooltip via `app-img
  // :externalUrl="agreement.icon"` — a real <img>. The tooltip is el-tooltip content, teleported to
  // a body-level `el-popper-container`, so these selectors must stay UNSCOPED from the car card
  // (same reason as AGREEMENT_TOOLTIP_DESCRIPTION above).
  AGREEMENT_TOOLTIP_LOGO: '.agreement-tooltip-list .agreement-tooltip__icon img',
  // When `agreement.icon` is empty the component falls back to a generic handshake glyph instead of
  // the logo (note the app's own typo: `--palceholder`). Detecting it separately is what lets the DSL
  // say "placeholder rendered, not a logo" rather than reporting a bare missing-element timeout.
  AGREEMENT_TOOLTIP_LOGO_PLACEHOLDER: '.agreement-tooltip-list .agreement-tooltip__icon--palceholder',
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
   * Locator for the "{N} days total" text above a car result card's price.
   * @param {number} index - Zero-based card index
   * @returns {import('playwright').Locator}
   */
  getDaysTotalTextByIndex(index) {
    return this.getCarResultCards().nth(index).locator(SELECTORS.CARD_PRICE_TITLE);
  }

  /**
   * Locator for the "{currency}{rate} / Per day" text under a car result card's price.
   * Only rendered when the card's numberOfDays > 1.
   * @param {number} index - Zero-based card index
   * @returns {import('playwright').Locator}
   */
  getDailyRateTextByIndex(index) {
    return this.getCarResultCards().nth(index).locator(SELECTORS.CARD_PRICE_SUBTITLE);
  }

  /**
   * Waits for both the days-total and daily-rate text to be visible on a car result card.
   * @param {number} [index=0] - Zero-based card index
   * @param {number} [timeout=15000]
   * @throws {Error} If either element never becomes visible
   */
  async waitForDaysTotalAndDailyRateVisible(index = 0, timeout = 15000) {
    try {
      await this.getDaysTotalTextByIndex(index).waitFor({ state: 'visible', timeout });
      await this.getDailyRateTextByIndex(index).waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CarResultsPage.waitForDaysTotalAndDailyRateVisible] The days-total/daily-rate price text ` +
        `never appeared on car result card index ${index} within ${timeout}ms (selectors: ` +
        `${SELECTORS.CARD_PRICE_TITLE} / ${SELECTORS.CARD_PRICE_SUBTITLE}). Original: ${err.message}`
      );
    }
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
   * Returns the visible "Add to trip" button locator inside the car result card at the given index.
   *
   * @param {number} index - Zero-based index of the car result card
   * @returns {import('playwright').Locator}
   * @throws {Error} If index is not a non-negative integer
   */
  getAddToTripButtonInCard(index) {
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(
        `[CarResultsPage.getAddToTripButtonInCard] "index" must be a non-negative integer, got: ${index}`
      );
    }
    return this.getCarResultCards()
      .nth(index)
      .locator(SELECTORS.CAR_RESULT_ADD_TO_TRIP_BUTTON)
      .first();
  }

  /**
   * Waits for the "Add to trip" button in the car result card at the given index to be visible.
   *
   * @param {number} index - Zero-based index of the car result card
   * @param {{ timeout?: number }} [options]
   * @throws {Error} If the button does not become visible before the timeout
   * @returns {Promise<void>}
   */
  async waitForAddToTripButtonInCard(index, { timeout = 30000 } = {}) {
    const button = this.getAddToTripButtonInCard(index);
    try {
      await button.waitFor({ state: 'visible', timeout });
    } catch (error) {
      throw new Error(
        `[CarResultsPage.waitForAddToTripButtonInCard] The "Add to trip" button did not become visible in ` +
        `car result card at index ${index} within ${timeout}ms (selector: ` +
        `${SELECTORS.CAR_RESULT_CARD} >> nth=${index} >> ${SELECTORS.CAR_RESULT_ADD_TO_TRIP_BUTTON}). ` +
        `The results list may not have rendered yet, or the page is in share mode where car-preview.vue ` +
        `swaps the button for share-btns. Original: ${error.message}`
      );
    }
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

  /**
   * Reads the agreement logo rendered inside the open agreement tooltip.
   * Read-only — the caller owns the assertion.
   *
   * @param {Object} [options]
   * @param {number} [options.timeout=10000] - How long to wait for the logo image to be visible
   * @returns {Promise<{visible: boolean, src: string, alt: string, placeholderOnly: boolean}>}
   *   `placeholderOnly` is true when no logo image appeared but the generic handshake fallback did.
   */
  async getAgreementTooltipLogoDetails({ timeout = 10000 } = {}) {
    const logo = this.page.locator(SELECTORS.AGREEMENT_TOOLTIP_LOGO).first();

    try {
      await logo.waitFor({ state: 'visible', timeout });
    } catch {
      const placeholderOnly = await this.page
        .locator(SELECTORS.AGREEMENT_TOOLTIP_LOGO_PLACEHOLDER)
        .first()
        .isVisible();

      return { visible: false, src: '', alt: '', placeholderOnly };
    }

    return {
      visible: true,
      src: (await logo.getAttribute('src')) ?? '',
      alt: (await logo.getAttribute('alt')) ?? '',
      placeholderOnly: false,
    };
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
   * Selects a sort option in the car results sort bar by its visible label.
   *
   * Completion is proven by the el-select's own displayed value switching to `label` — never by a
   * fixed wait — because Element Plus updates that label in the same tick it emits the new sort.
   *
   * @param {string} label - Visible sort option: "Most recommended", "Price" or "Agency"
   * @param {{ timeout?: number }} [options]
   * @throws {Error} If label is invalid, the dropdown cannot be opened, the option is missing,
   *                 or the selection never takes effect
   * @returns {Promise<void>}
   */
  async selectCarSortOption(label, { timeout = 15000 } = {}) {
    if (typeof label !== 'string' || !label.trim()) {
      throw new Error(
        `[CarResultsPage.selectCarSortOption] "label" must be a non-empty string, got: ${typeof label} (${label})`
      );
    }

    const sortLabel = label.trim();
    const sortSelect = this.page.locator(SELECTORS.CAR_SORT_SELECT).first();

    try {
      await sortSelect.waitFor({ state: 'visible', timeout });
      await sortSelect.click({ timeout });
    } catch (error) {
      throw new Error(
        `[CarResultsPage.selectCarSortOption] Could not open the car results sort dropdown ` +
        `(selector: ${SELECTORS.CAR_SORT_SELECT}) within ${timeout}ms. The results page may still be ` +
        `showing its skeleton (car-sort-bar-skeleton), the search may have returned no cars at all, or ` +
        `the viewport is mobile-sized where car-sort-bar moves into the "Sort and filters" drawer. ` +
        `Original: ${error.message}`
      );
    }

    // The click above leaves exactly one el-select popper open, so the visible panel IS the sort
    // dropdown. Resolving the option inside it keeps the closed poppers of the other selects out.
    // The label is matched exactly (anchored regex) so "Price" cannot resolve another option.
    const option = this.page
      .locator(SELECTORS.CAR_SORT_DROPDOWN_PANEL)
      .first()
      .locator(SELECTORS.CAR_SORT_OPTION_ITEM)
      .filter({ hasText: new RegExp(`^\\s*${escapeRegex(sortLabel)}\\s*$`) })
      .first();

    try {
      await option.waitFor({ state: 'visible', timeout });
      await option.click({ timeout });
    } catch (error) {
      throw new Error(
        `[CarResultsPage.selectCarSortOption] The "${sortLabel}" sort option did not become visible in the ` +
        `car sort dropdown within ${timeout}ms (option: ${SELECTORS.CAR_SORT_OPTION_ITEM} with exact text ` +
        `"${sortLabel}", panel: ${SELECTORS.CAR_SORT_DROPDOWN_PANEL}). car-sort-bar.ts offers exactly ` +
        `"Most recommended", "Price" and "Agency", so the label is either misspelled or translated in the ` +
        `active language — or the dropdown never opened, in which case no panel is visible at all. ` +
        `Original: ${error.message}`
      );
    }

    const selectedLabel = this.page
      .locator(SELECTORS.CAR_SORT_SELECTED_LABEL)
      .filter({ hasText: new RegExp(`^\\s*${escapeRegex(sortLabel)}\\s*$`) })
      .first();

    try {
      await selectedLabel.waitFor({ state: 'visible', timeout });
    } catch (error) {
      throw new Error(
        `[CarResultsPage.selectCarSortOption] Clicked the "${sortLabel}" sort option but the sort dropdown ` +
        `never displayed it as the selected value within ${timeout}ms ` +
        `(selector: ${SELECTORS.CAR_SORT_SELECTED_LABEL}). The click likely landed on the popper of a ` +
        `different el-select, or the sort was rejected by the store. Original: ${error.message}`
      );
    }
  }

  /**
   * Returns the sort option currently displayed in the car results sort bar.
   *
   * @param {{ timeout?: number }} [options]
   * @throws {Error} If the sort bar never renders a selected value
   * @returns {Promise<string>} Trimmed label (whitespace collapsed), e.g. "Price"
   */
  async getSelectedCarSortLabel({ timeout = 15000 } = {}) {
    const selectedLabel = this.page.locator(SELECTORS.CAR_SORT_SELECTED_LABEL).first();

    try {
      await selectedLabel.waitFor({ state: 'visible', timeout });
    } catch (error) {
      throw new Error(
        `[CarResultsPage.getSelectedCarSortLabel] The car sort bar never displayed a selected sort value ` +
        `within ${timeout}ms (selector: ${SELECTORS.CAR_SORT_SELECTED_LABEL}). The results page may still be ` +
        `loading, or the sort bar is hidden in the mobile "Sort and filters" drawer. Original: ${error.message}`
      );
    }

    return ((await selectedLabel.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Pages the car results list forward until the "next page" button is disabled, i.e. until the
   * last page of results is displayed.
   *
   * Returns `{ pages: 1 }` without throwing when no pagination is rendered — car-results.vue only
   * renders app-pagination on desktop and only inside the `carsToShow?.length > 0` block, so a
   * single page of results simply has no pager and is already the last page.
   *
   * The loop is bounded by `maxPages`: an unbounded loop against a pager that never disables would
   * silently consume the 120s Cucumber step budget and surface as an opaque "function timed out"
   * instead of the diagnostics below.
   *
   * @param {{ maxPages?: number, timeout?: number }} [options]
   * @throws {Error} If the results list never renders, a page change never takes effect, or the
   *                 "next page" button never becomes disabled within `maxPages` page changes
   * @returns {Promise<{ pages: number }>} The page number the list ended on
   */
  async goToLastCarResultsPage({ maxPages = 20, timeout = 15000 } = {}) {
    if (!Number.isInteger(maxPages) || maxPages < 1) {
      throw new Error(
        `[CarResultsPage.goToLastCarResultsPage] "maxPages" must be a positive integer, got: ${maxPages}`
      );
    }

    // The car list and the pager are rendered by the same `v-if`, so once the last card of the
    // current page is attached the pager (if there is one) is attached too. Gating on the card
    // first is what lets the "no pagination" check below be an instant count() instead of a wait
    // that would burn the full timeout on every single-page search.
    const lastCard = this.page.locator(SELECTORS.LAST_CAR_RESULT_CARD).first();
    try {
      await lastCard.waitFor({ state: 'attached', timeout });
    } catch (error) {
      throw new Error(
        `[CarResultsPage.goToLastCarResultsPage] The car results list never rendered a last card within ` +
        `${timeout}ms (selector: ${SELECTORS.LAST_CAR_RESULT_CARD}). The search likely returned no cars, or ` +
        `the active filters removed every result. Original: ${error.message}`
      );
    }

    if ((await this.page.locator(SELECTORS.CAR_RESULTS_PAGINATION).count()) === 0) {
      // Single page of results — already on the last page.
      return { pages: 1 };
    }

    const nextButton = this.page.locator(SELECTORS.CAR_RESULTS_PAGINATION_NEXT).first();
    const activePage = this.page.locator(SELECTORS.CAR_RESULTS_PAGINATION_ACTIVE_PAGE).first();
    const readActivePage = async () =>
      ((await activePage.textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim();

    let currentPage = (await readActivePage()) || '1';

    for (let pageChanges = 0; pageChanges < maxPages; pageChanges++) {
      let isLastPage;
      try {
        await nextButton.waitFor({ state: 'visible', timeout });
        isLastPage = await nextButton.isDisabled();
      } catch (error) {
        throw new Error(
          `[CarResultsPage.goToLastCarResultsPage] The "next page" button of the car results pager was not ` +
          `usable on page "${currentPage}" within ${timeout}ms ` +
          `(selector: ${SELECTORS.CAR_RESULTS_PAGINATION_NEXT}). Original: ${error.message}`
        );
      }

      if (isLastPage) {
        return { pages: Number(currentPage) || 1 };
      }

      const previousPage = currentPage;
      // el-pagination's "next" always advances by exactly one page, so the change can be awaited as
      // a concrete expected value instead of polled for "any change at all".
      const expectedPage = String((Number(previousPage) || 1) + 1);
      await nextButton.click({ timeout });

      // A page change is proven by the active pager number advancing — el-pagination re-renders it
      // together with the new slice of cars, so no fixed wait is needed. Delegated to the shared
      // waitForText helper rather than hand-rolling a poll loop.
      try {
        await waitForText(this.page, SELECTORS.CAR_RESULTS_PAGINATION_ACTIVE_PAGE, expectedPage, timeout);
      } catch (error) {
        throw new Error(
          `[CarResultsPage.goToLastCarResultsPage] Clicked the "next page" button on page "${previousPage}" but ` +
          `page "${expectedPage}" never became the active pager number within ${timeout}ms ` +
          `(selector: ${SELECTORS.CAR_RESULTS_PAGINATION_ACTIVE_PAGE}). The click may have been swallowed by ` +
          `the sticky sort bar, or the pager re-rendered because a filter/sort reset the list to page 1. ` +
          `Original: ${error.message}`
        );
      }

      currentPage = expectedPage;
    }

    throw new Error(
      `[CarResultsPage.goToLastCarResultsPage] The "next page" button never became disabled after ${maxPages} ` +
      `page changes (stopped on page "${currentPage}"). The loop is deliberately bounded so this reports a ` +
      `real problem instead of exhausting the 120s Cucumber step budget. Either the result set is larger than ` +
      `expected — raise "maxPages" — or the pager is stuck re-rendering.`
    );
  }

  /**
   * Scrolls the last car result card of the current page into view.
   *
   * MUST run AFTER any pagination: car-results.ts `setPage()` scrolls the window back to the top on
   * every page change, so scrolling first would be undone.
   *
   * @param {{ timeout?: number }} [options]
   * @throws {Error} If the last card never attaches or cannot be scrolled to
   * @returns {Promise<void>}
   */
  async scrollToLastCarResult({ timeout = 15000 } = {}) {
    const lastCard = this.page.locator(SELECTORS.LAST_CAR_RESULT_CARD).first();

    try {
      await lastCard.waitFor({ state: 'attached', timeout });
      await lastCard.scrollIntoViewIfNeeded({ timeout });
    } catch (error) {
      throw new Error(
        `[CarResultsPage.scrollToLastCarResult] Could not scroll to the last car result card within ` +
        `${timeout}ms (selector: ${SELECTORS.LAST_CAR_RESULT_CARD}). car-list.vue only stamps id="last-item" ` +
        `once the list has rendered, so the results may still be loading or the list may be empty. ` +
        `Original: ${error.message}`
      );
    }
  }

  /**
   * Returns the out-of-policy badge locator of the LAST car result card on the current page.
   *
   * Scoped to the last-item card on purpose: car-preview.vue renders the badge on every card and
   * only hides it with `is-invisible`, so an unscoped locator would always find one.
   *
   * @returns {import('playwright').Locator}
   */
  getLastCarResultOOPBadge() {
    return this.page.locator(SELECTORS.LAST_CAR_RESULT_OOP_BADGE).first();
  }

  /**
   * Returns the locator of the "Out of policy" wording inside the LAST car result card's badge.
   *
   * @returns {import('playwright').Locator}
   */
  getLastCarResultOOPBadgeText() {
    return this.page.locator(SELECTORS.LAST_CAR_RESULT_OOP_BADGE_TEXT).first();
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

  /**
   * Waits for the station map to draw its first marker and returns the marker selector that matched.
   *
   * Waiting on a marker rather than on the container is what proves the overlay is actually painted:
   * `.google-map` exists in the DOM long before Google finishes loading its script from an external
   * CDN, dropping the markers (Animation.DROP) and refreshing their z-index 300ms after
   * `tilesloaded`. Google's marker DOM is version-dependent, so each candidate in
   * STATION_MAP_MARKER_CANDIDATES is probed in order and the first one to become visible wins.
   *
   * `timeout` is the budget for this whole call, not per wait: the container wait and every marker
   * candidate share one deadline. Bounding the total matters because the caller still has to poll
   * the marker/card comparison afterwards — letting each candidate spend the full budget could
   * overrun the 120s Cucumber step budget and replace every diagnostic below with an opaque
   * "function timed out".
   *
   * @param {number} [timeout=30000] Total budget for the container wait and all marker candidates
   * @returns {Promise<string>} The marker selector that matched — pass it to getStationMapMarkerCount
   * @throws {Error} If the map container never appears, or no marker candidate ever matches
   */
  async waitForStationMapMarkers({ timeout = 30000 } = {}) {
    const deadline = Date.now() + timeout;

    try {
      await this.page.locator(SELECTORS.STATION_MAP_CONTAINER).first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CarResultsPage.waitForStationMapMarkers] The station map container ` +
          `("${SELECTORS.STATION_MAP_CONTAINER}") never became visible within ${timeout}ms. ` +
          'Likely causes: the page is not on the city station-selection view (the map never renders ' +
          'for an airport search), or the viewport is mobile-sized — `.city-map-container` is ' +
          `v-if="!isMobile", and on mobile the map lives in a "View on map" drawer. Original: ${err.message}`,
      );
    }

    const candidates = SELECTORS.STATION_MAP_MARKER_CANDIDATES;
    for (const [index, candidate] of candidates.entries()) {
      // Split whatever is left of the budget across the candidates still to probe, so a leading
      // candidate that never matches cannot starve the ones behind it.
      const remaining = deadline - Date.now();
      const candidateTimeout = Math.max(2000, Math.floor(remaining / (candidates.length - index)));
      const isVisible = await this.page
        .locator(candidate)
        .first()
        .waitFor({ state: 'visible', timeout: candidateTimeout })
        .then(() => true)
        .catch(() => false);
      if (isVisible) {
        return candidate;
      }
    }

    throw new Error(
      `[CarResultsPage.waitForStationMapMarkers] The station map rendered no marker within the ${timeout}ms ` +
        `budget. None of the probed marker selectors matched: ` +
        `${candidates.map((candidate) => `"${candidate}"`).join(', ')}. ` +
        'Likely causes: the Google Maps script failed to load from its CDN, no returned station has ' +
        'coordinates, or Google changed its marker DOM and a new candidate is needed.',
    );
  }

  /**
   * Returns the number of station markers currently drawn on the station map.
   * @param {string} markerSelector - Selector returned by waitForStationMapMarkers
   * @returns {Promise<number>}
   */
  async getStationMapMarkerCount(markerSelector) {
    if (!markerSelector || typeof markerSelector !== 'string') {
      throw new Error(
        '[CarResultsPage.getStationMapMarkerCount] "markerSelector" must be a non-empty string ' +
          `(the selector returned by waitForStationMapMarkers), got: ${typeof markerSelector} "${markerSelector}"`,
      );
    }

    try {
      return await this.page.locator(`${markerSelector}:visible`).count();
    } catch (err) {
      throw new Error(
        `[CarResultsPage.getStationMapMarkerCount] Could not count the markers on the station map ` +
          `("${markerSelector}"). The map may have unmounted or re-rendered mid-read. Original: ${err.message}`,
      );
    }
  }

  /**
   * Returns the number of station cards that render a numbered map-marker badge, i.e. the stations
   * the page itself treats as located (and therefore plottable).
   * @returns {Promise<number>}
   */
  async getLocatedStationPreviewCount() {
    const locatedCardSelector = `${SELECTORS.STATION_PREVIEW}:has(${SELECTORS.STATION_PREVIEW_MARKER_BADGE})`;
    try {
      return await this.page.locator(locatedCardSelector).count();
    } catch (err) {
      throw new Error(
        '[CarResultsPage.getLocatedStationPreviewCount] Could not count the station cards carrying a ' +
          `map-marker badge ("${locatedCardSelector}"). Original: ${err.message}`,
      );
    }
  }

  /**
   * Returns the total number of station cards in the city station list, including any station
   * without coordinates (which the map cannot plot). Diagnostic only — never assert on this.
   * @returns {Promise<number>}
   */
  async getStationPreviewCount() {
    try {
      return await this.page.locator(SELECTORS.STATION_PREVIEW).count();
    } catch (err) {
      throw new Error(
        `[CarResultsPage.getStationPreviewCount] Could not count the station cards ` +
          `("${SELECTORS.STATION_PREVIEW}"). The station list may have re-rendered mid-read. ` +
          `Original: ${err.message}`,
      );
    }
  }

  /**
   * Reads the `.station-details` text lines of one station card — the location name followed by
   * the street address (see SELECTORS.STATION_DETAIL_LINE for why the second line is optional).
   * @param {number} index - Zero-based index of the station card
   * @param {object} [options]
   * @param {number} [options.timeout=30000]
   * @returns {Promise<string[]>} Trimmed line texts in DOM order (1 or 2 entries)
   */
  async getStationDetailTextsByIndex(index, { timeout = 30000 } = {}) {
    if (typeof index !== 'number' || index < 0) {
      throw new Error(
        `[CarResultsPage.getStationDetailTextsByIndex] "index" must be a number >= 0, got: ${index}`,
      );
    }

    const lines = this.getStationPreviewByIndex(index).locator(SELECTORS.STATION_DETAIL_LINE);

    try {
      await lines.first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CarResultsPage.getStationDetailTextsByIndex] No visible station detail line ` +
          `("${SELECTORS.STATION_DETAIL_LINE}") appeared in station card ${index} within ${timeout}ms. ` +
          `The station list may still be loading, or the card may render no location text at all. ` +
          `Original: ${err.message}`,
      );
    }

    try {
      const texts = await lines.allInnerTexts();
      return texts.map((text) => text.replace(/\s+/g, ' ').trim());
    } catch (err) {
      throw new Error(
        `[CarResultsPage.getStationDetailTextsByIndex] Could not read the station detail lines of ` +
          `station card ${index}. The station list likely re-rendered mid-read. Original: ${err.message}`,
      );
    }
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
