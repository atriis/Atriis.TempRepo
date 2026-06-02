const { waitForText } = require("@utils/wait");
const { buildFlexibleAddressRegex } = require("@utils/text");
const { SELECTORS: CART_SELECTORS } = require("@pages/CartPage");
const { SELECTORS: COMMON_SELECTORS } = require("@pages/CommonPage");

/**
 * Page Object for results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  RESULTS_BUTTON: ".btn.btn--primary",
  CAR_RESULT_CARD: '.car-preview',
  AGENCY_STATION_ADDRESS: '.station-details p.has-text-weight-bold.is-size-7',
  SHARE_MAIN_BUTTON: 'button.share-btn.mr-4',
  SHARE_QUOTE_RESULTS_BUTTON: '.share-btn.py-2',
  SHARE_QUOTE_EMAIL_BUTTON: '.share-bar button.share-btn.is-hidden-mobile',
  NO_RESULTS_CONTAINER: '.app-no-results',
  NO_RESULTS_TITLE: '.app-no-results h3',
  ALERT_TEXT: "[role='alert'] p",
  AIRPORTS_FILTER_CONTAINER: '.filter-container',
  AIRPORTS_FILTER_HEADER: 'h4',
  AIRPORT_ROUTE_TOGGLE_CONTAINER: '.view-txt-link',
  AIRPORT_ROUTE_TOGGLE_LABEL: '.view-more-btn',
  AIRPORT_FILTER_GROUP: '.airports-filter',
  FILTER_GROUP_TITLE: 'h4.filter-title',
  FILTER_CHECKBOX_LABEL: 'label.el-checkbox',
  FILTER_CHECKBOX_INNER: '.el-checkbox__input',
  AIRPORT_OPTION_TEXT: '.airports-content',
  FILTER_VIEW_MORE_CONTAINER: '.view-txt-link',
  FILTER_VIEW_MORE_BUTTON: 'button',
  FILTER_VIEW_MORE_LABEL: '.view-more-btn',
  FILTER_VIEW_MORE_AIRLINES_EXPANDER: '.carriers-filter .view-more-btn',
  CONFLICT_MODAL_PROCEED: '.conflicting-quotes-dialog .btn:has-text("Proceed")',
  EDIT_SEARCH_BUTTON_NAME: /^Edit(?: search)?$/i,
  SHARE_BAR_CLOSE_BUTTON: '.share-bar span.material-symbols-outlined.is-clickable',
};

const AIRLINE_FILTER_ALIASES = {
  AA: 'American Airlines',
};

class ResultsPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets the "Add to trip" button locator.
   * @returns {Locator} Playwright locator for the first "Add to trip" button
   */
  getAddToTripButton() {
    return this.page
      .locator(`${SELECTORS.RESULTS_BUTTON}:has-text("Add to trip")`)
      .first();
  }

  /**
   * Gets the first result action button containing the given text.
   * @param {string} text - Visible button text
   * @returns {Locator} Playwright locator for the first matching result button
   */
  getResultButtonByText(text) {
    return this.page
      .locator(SELECTORS.RESULTS_BUTTON, { hasText: text })
      .first();
  }

  /**
   * Gets the "Select" button locator.
   * @returns {Locator} Playwright locator for the first "Select" button
   */
  getSelectButton() {
    return this.page
      .locator(`${SELECTORS.RESULTS_BUTTON}:has-text("Select")`)
      .first();
  }

  /**
   * Gets the first agency station address element that contains the given text.
   * Used to validate labels on the vendor selection page before clicking Select.
   *
   * @param {string} text - Text to match inside the station address paragraph
   * @returns {Locator} Playwright locator for the matching agency station address
   */
  getAgencyStationAddressByText(text) {
    return this.page.locator(SELECTORS.AGENCY_STATION_ADDRESS, { hasText: text }).first();
  }

  /**
   * Gets the first agency station card that contains the given label.
   *
   * @param {string} stationLabel - Station label text to match
   * @returns {Locator} Playwright locator for the first matching station card
   */
  getAgencyStationCardByLabel(stationLabel) {
    return this.page
      .locator('.car-vendor-station-preview')
      .filter({ hasText: stationLabel })
      .first();
  }

  /**
   * Gets all agency station cards that contain the given label.
   *
   * @param {string} stationLabel - Station label text to match
   * @returns {Locator} Playwright locator for all matching station cards
   */
  getAgencyStationCardsByLabel(stationLabel) {
    return this.page
      .locator('.car-vendor-station-preview')
      .filter({ hasText: stationLabel });
  }

  /**
   * Gets the first agency station card that contains both label and address.
   *
   * @param {string} stationLabel - Station label text to match
   * @param {string} stationAddress - Station address text to match
   * @returns {Locator} Playwright locator for the first matching station card
   */
  getAgencyStationCardByLabelAndAddress(stationLabel, stationAddress) {
    const addressRegex = buildFlexibleAddressRegex(stationAddress);
    const addressLocator = this.page.locator(SELECTORS.AGENCY_STATION_ADDRESS, { hasText: addressRegex });

    return this.page
      .locator('.car-vendor-station-preview')
      .filter({ has: addressLocator })
      .filter({ hasText: stationLabel })
      .first();
  }

  /**
   * Gets the Select button within the agency station card that contains the given label.
   * Finds the car-vendor-station-preview that has the station address text,
   * then returns the Select button within that card.
   *
   * @param {string} stationLabel - The station address label text to find
   * @returns {Locator} Playwright locator for the Select button within the matching station card
   */
  getSelectButtonByAgencyStationLabel(stationLabel) {
    return this.getAgencyStationCardByLabel(stationLabel)
      .getByRole('button', { name: 'Select' })
      .first();
  }

  /**
   * Gets the Select button within the agency station card that matches label and address.
   *
   * @param {string} stationLabel - The station label text to find
   * @param {string} stationAddress - The station address text to find
   * @returns {Locator} Playwright locator for the Select button within the matching station card
   */
  getSelectButtonByAgencyStationLabelAndAddress(stationLabel, stationAddress) {
    return this.getAgencyStationCardByLabelAndAddress(stationLabel, stationAddress)
      .getByRole('button', { name: 'Select' })
      .first();
  }

  /**
   * Gets the "Share" button locator.
   * @returns {Locator} Playwright locator for the first "Share" button
   */
  getShareButton() {
    return this.page
      .locator(`${SELECTORS.RESULTS_BUTTON}:has-text("Share")`)
      .first();
  }

  /**
  * Gets the "Reset Filters" button locator.
  */
  getResetFiltersButton() {
    return this.page.getByRole('button', { name: 'Reset Filters' });
  }

  getNoResultsContainer() {
    return this.page.locator(SELECTORS.NO_RESULTS_CONTAINER).first();
  }

  getNoResultsTitle() {
    return this.page.locator(SELECTORS.NO_RESULTS_TITLE).first();
  }

  getNoResultsResetFiltersButton() {
    return this.getNoResultsContainer().getByRole('button', { name: 'Reset Filters' });
  }

  getNoResultsEditSearchButton() {
    return this.getNoResultsContainer().getByRole('button', { name: 'Edit search' });
  }

  getEditButton() {
      return this.page.getByRole('button', { name: SELECTORS.EDIT_SEARCH_BUTTON_NAME });
  }

  /**
   * Throws a descriptive error when the "No results found" empty state is
   * displayed on the results page instead of bookable products.
   *
   * Includes the empty-state title text so the failure message is actionable
   * in CI logs instead of a generic timeout.
   *
   * @param {string} expectedButton - The button label that was expected (e.g. "Select", "Add to trip")
   * @throws {Error} Always throws when this is called
   */
  async _throwNoResultsError(expectedButton) {
    let titleText = 'No results found';
    try {
      titleText = (await this.getNoResultsTitle().textContent({ timeout: 1000 }))?.trim() || titleText;
    } catch {
      // Title not readable — fall back to default text
    }
    throw new Error(
      `No results found on results page. The "${titleText}" empty state was displayed ` +
      `instead of bookable results; expected "${expectedButton}" button never appeared. ` +
      `This is typically a data/availability issue (supplier returned zero options for the search criteria), ` +
      `not a test bug.`
    );
  }

  /**
   * Waits for one of the result-action button locators or the "No results found"
   * empty state, whichever appears first. Throws a descriptive error when the
   * empty state wins the race; otherwise returns normally.
   *
   * @param {import('@playwright/test').Locator} buttonLocator - Locator for the expected result button
   * @param {string} expectedButton - Human-readable name of the expected button (for error message)
   * @param {number} timeout - Maximum wait time in milliseconds
   */
  async _waitForResultButtonOrNoResults(buttonLocator, expectedButton, timeout) {
    const buttonPromise = buttonLocator
      .waitFor({ state: 'visible', timeout })
      .then(() => 'button');
    const noResultsPromise = this.getNoResultsContainer()
      .waitFor({ state: 'visible', timeout })
      .then(() => 'no-results');

    const winner = await Promise.race([buttonPromise, noResultsPromise]).catch(() => null);

    if (winner === 'no-results') {
      await this._throwNoResultsError(expectedButton);
    }

    if (winner !== 'button') {
      // Neither resolved (both timed out / errored). Let the original button
      // wait surface the real Playwright timeout for diagnostics.
      await buttonLocator.waitFor({ state: 'visible', timeout });
    }
  }

  /** 
   * Waits until the first "Select" button is visible
   * Extended timeout for CI/CD environments where results load slower
   */
  async waitForSelectText() {
    await this._waitForResultButtonOrNoResults(this.getSelectButton(), 'Select', 60000);
  }

  /**
   * Fast post-click outcome detector for use inside station-selection retry loops.
   *
   * Races the most likely outcomes against a short timeout:
   * - 'no-results'   → supplier rejected, trigger retry
   * - 'station-list' → pickup succeeded, UI transitioned to dropoff picker (pickup step only)
   * - 'results'      → car results loaded (car cards or Add-to-trip visible)
   * - 'ok'           → 12s elapsed with no signal — results are still loading;
   *                    downstream steps already wait for their own elements
   *
   * Why 12s instead of 60s: no-results appears in 2-5s (backend rejection), car results in
   * 3-8s. If neither fires in 12s the result is still loading — the retry loop treats that
   * as success and lets downstream steps wait for their specific elements. This replaces the
   * 60s race that blocked on slow car-card rendering on every happy-path click.
   *
   * @param {Object} [options]
   * @param {number}  [options.timeout=12000]        Max ms to wait for any outcome
   * @param {boolean} [options.includeStationList=false] Also detect Select-button appearance (pickup only)
   * @returns {Promise<'no-results'|'station-list'|'results'|'ok'>}
   */
  async waitForNoResultsOrTransition({ timeout = 12000, includeStationList = false } = {}) {
    const promises = [
      this.getNoResultsContainer()
        .waitFor({ state: 'visible', timeout })
        .then(() => 'no-results'),

      // Car results positive signals — exit early rather than burning the full 12s.
      this.page.locator(SELECTORS.CAR_RESULT_CARD).first()
        .waitFor({ state: 'visible', timeout })
        .then(() => 'results'),

      this.getAddToTripButton()
        .waitFor({ state: 'visible', timeout })
        .then(() => 'results'),
    ];

    if (includeStationList) {
      // For the pickup step: after clicking pickup station Select, the UI transitions to
      // the dropoff station list — new Select buttons appear. Detecting this confirms pickup
      // succeeded without waiting for car cards to fully load.
      // NOT included for dropoff: car results also have Select buttons (per-car options)
      // which would fire immediately as a false positive.
      promises.push(
        this.getSelectButton()
          .waitFor({ state: 'visible', timeout })
          .then(() => 'station-list')
      );
    }

    // Timeout → 'ok': no negative signal in 12s = car results still loading = treat as success.
    // Downstream steps (expectStationButtonVisible, addCarAirportFromResultsPageToCart)
    // already wait for their own elements with appropriate timeouts.
    return Promise.race(promises).catch(() => 'ok');
  }

  /**
   * Returns true if a "Select" button is visible on the page within the given timeout.
   * Safe to call even when no Select button exists.
   * @param {number} [timeout=5000]
   * @returns {Promise<boolean>}
   */
  async isSelectButtonVisible(timeout = 5000) {
    try {
      await this.getSelectButton().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true if an "Add to trip" button is visible within the given timeout.
   * Used to detect whether we have landed on the car results page (vs the agency station list).
   * @param {number} [timeout=5000]
   * @returns {Promise<boolean>}
   */
  async isAddToTripButtonVisible(timeout = 5000) {
    try {
      await this.getAddToTripButton().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /** 
   * Waits until the first "Add to trip" button is visible
   * Extended timeout for CI/CD environments where results load slower
   */
  async waitForAddToTripText() {
    await this._waitForResultButtonOrNoResults(this.getAddToTripButton(), 'Add to trip', 60000);
  }

  /**
   * Waits until the first result button containing the given text is visible.
   * @param {string} text - Visible button text
   * @param {number} timeout - Maximum wait time in milliseconds
   */
  async waitForResultButtonText(text, timeout = 60000) {
    await this._waitForResultButtonOrNoResults(this.getResultButtonByText(text), text, timeout);
  }

  async waitForNoResultsTitle(expectedText, timeout = 60000) {
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    if (typeof timeout !== 'number' || timeout < 0) {
      throw new Error(`timeout must be a non-negative number, got ${timeout}`);
    }

    await this.getNoResultsContainer().waitFor({ state: 'visible', timeout });
    await waitForText(this.page, SELECTORS.NO_RESULTS_TITLE, expectedText, timeout);
  }

  async waitForNoResults(timeout = 60000) {
    if (typeof timeout !== 'number' || timeout < 0) {
      throw new Error(`timeout must be a non-negative number, got ${timeout}`);
    }

    await this.getNoResultsContainer().waitFor({ state: 'visible', timeout });
  }

  async waitForCarResultsOrNoResults(timeout = 60000) {
    if (typeof timeout !== 'number' || timeout < 0) {
      throw new Error(`timeout must be a non-negative number, got ${timeout}`);
    }

    const selectPromise = this.getSelectButton()
      .waitFor({ state: 'visible', timeout })
      .then(() => 'results');

    const addToTripPromise = this.getAddToTripButton()
      .waitFor({ state: 'visible', timeout })
      .then(() => 'results');

    const noResultsPromise = this.getNoResultsContainer()
      .waitFor({ state: 'visible', timeout })
      .then(() => 'no-results');

    const winner = await Promise.race([selectPromise, addToTripPromise, noResultsPromise]).catch(() => null);

    if (winner === 'results' || winner === 'no-results') {
      return winner;
    }

    throw new Error(
      `[ResultsPage.waitForCarResultsOrNoResults] Could not determine search outcome within ${timeout}ms. ` +
      `Expected either car results (Select/Add to trip) or the no-results state.`
    );
  }

  /**
   * City-centre only: waits for post-station-selection outcome.
   *
   * @param {number} timeout
   * @param {Object} [options]
   * @param {boolean} [options.includeStationList=true] - When true (pickup step), a visible
   *   Select button resolves as 'station-list', signalling the UI transitioned to the dropoff
   *   station list. Set false for the dropoff step: other station cards' Select buttons remain
   *   visible on the current page immediately after clicking, so including them in the race
   *   causes a false-positive 'station-list' result before the actual car-results page loads.
   */
  async waitForCarCardsOrNoResultsAfterStationSelection(timeout = 60000, { includeStationList = true } = {}) {
    if (typeof timeout !== 'number' || timeout < 0) {
      throw new Error(`timeout must be a non-negative number, got ${timeout}`);
    }

    const carCardPromise = this.page
      .locator(SELECTORS.CAR_RESULT_CARD)
      .first()
      .waitFor({ state: 'visible', timeout })
      .then(() => 'results');

    const addToTripPromise = this.getAddToTripButton()
      .waitFor({ state: 'visible', timeout })
      .then(() => 'results');

    const noResultsPromise = this.getNoResultsContainer()
      .waitFor({ state: 'visible', timeout })
      .then(() => 'no-results');

    const promises = [carCardPromise, addToTripPromise, noResultsPromise];

    if (includeStationList) {
      // After selecting the PICKUP station, the UI transitions to the dropoff station
      // list (Select button visible, no car cards yet). Detect this so the pickup step
      // can succeed and let the separate dropoff step handle the next selection.
      // NOT included for the dropoff step: other station cards keep their Select buttons
      // visible on the page immediately after clicking, which would falsely resolve as
      // 'station-list' before the actual car-results page finishes loading.
      const stationListPromise = this.getSelectButton()
        .waitFor({ state: 'visible', timeout })
        .then(() => 'station-list');
      promises.push(stationListPromise);
    }

    const winner = await Promise.race(promises).catch(() => null);

    if (winner === 'results' || winner === 'no-results' || winner === 'station-list') {
      return winner;
    }

    throw new Error(
      `[ResultsPage.waitForCarCardsOrNoResultsAfterStationSelection] Could not determine city-centre post-selection outcome within ${timeout}ms. ` +
      `Expected either visible car cards, Add to trip, or the no-results state.`
    );
  }

  async waitForNoResultsActionButtons(timeout = 60000) {
    if (typeof timeout !== 'number' || timeout < 0) {
      throw new Error(`timeout must be a non-negative number, got ${timeout}`);
    }

    await this.getNoResultsResetFiltersButton().waitFor({ state: 'visible', timeout });
    await this.getNoResultsEditSearchButton().waitFor({ state: 'visible', timeout });
  }

  async clickNoResultsResetFiltersButton(timeout = 60000) {
    if (typeof timeout !== 'number' || timeout < 0) {
      throw new Error(`timeout must be a non-negative number, got ${timeout}`);
    }

    const resetFiltersButton = this.getNoResultsResetFiltersButton();
    await resetFiltersButton.waitFor({ state: 'visible', timeout });
    await resetFiltersButton.click({ timeout });
  }

  /** Scrolls to the first "Add to trip" button, waiting for it to appear first */
  async scrollToFirstAddToTripButton() {
    // Retry up to 3 times to handle DOM re-renders invalidating the element reference
    for (let attempt = 0; attempt < 3; attempt++) {
      const button = this.getAddToTripButton();
      await button.waitFor({ state: "visible", timeout: 60000 });
      try {
        await button.scrollIntoViewIfNeeded({ timeout: 10000 });
        return;
      } catch (e) {
        if (attempt === 2) throw e;
      }
    }
  }

  /** Clicks the first available "Add to trip" button */
  async clickFirstAddToTripButton() {
    const button = this.getAddToTripButton();
    // Wait for button to be enabled (flight data loaded)
    await button.waitFor({ state: "attached", timeout: 45000 });

    // Retry loop to handle a Conflicting Quotes dialog that may appear mid-click
    // and intercept pointer events, preventing the click from completing.
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.handleConflictQuoteModalIfAppears(2000);
      try {
        await button.click({ timeout: 15000 });
        return;
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError;
  }

  /** Clicks the first available "Select" button */
  async clickFirstSelectButton() {
    await this.getSelectButton().click();
  }

/**
 * Clicks a "Share" button by position.
 * Defaults to the first available Share button.
 *
 * @param {number} index - Zero-based index of the Share button (default: 0)
 * @example
 *   clickShareButton()    // first Share button
 *   clickShareButton(1)   // second Share button
 *   clickShareButton(2)   // third Share button
 */
  async clickShareQuoteButton(index = 0) {
    const button = this.page
      .locator(SELECTORS.SHARE_QUOTE_RESULTS_BUTTON)
      .nth(index);
    await button.click({ timeout: 60000 }); // Waits automatically for actionable state
  }

  /**
   * Handles the "Conflicting Quotes" modal if it appears.
   * Races between the conflict modal and the cart page loading.
   * If neither appears within timeout, returns false (e.g., parallel search navigated elsewhere).
   *
   * Returns:
   * - true  → modal was shown and handled
   * - false → modal did not appear
   */
  async handleConflictQuoteModalIfVisible() {
    const proceedButton = this.page
      .locator(SELECTORS.CONFLICT_MODAL_PROCEED)
      .first();
    const tripOverviewTitle = this.page
      .locator(CART_SELECTORS.TRIP_OVERVIEW_TITLE);
    const quoteTitle = this.page
      .locator(CART_SELECTORS.QUOTE_TITLE)
      .first();
    const quoteStatus = this.page
      .locator(CART_SELECTORS.QUOTE_CARD_STATUS_LABEL)
      .first();
    const flightHeading = this.page
      .getByText(CART_SELECTORS.FLIGHT_QUOTE_HEADING_TEXT, { exact: false })
      .first();
    const timeout = 90000;
    const postCartSettleTimeout = 5000;

    // Race: wait for either the conflict modal's Proceed button or the cart page.
    // Each promise has its own .catch so the losing/orphaned promise never
    // becomes an unhandled rejection (e.g. when the page closes mid-wait).
    const modalPromise = proceedButton
      .waitFor({ state: "visible", timeout })
      .then(() => "modal")
      .catch(() => null);
    const cartUrlPromise = this.page
      .waitForURL(/\/cart(?:[/?#]|$)/, { timeout })
      .then(() => "cart")
      .catch(() => null);
    const cartTitlePromise = tripOverviewTitle
      .waitFor({ state: "visible", timeout })
      .then(() => "cart")
      .catch(() => null);

    const result = await Promise.race([modalPromise, cartUrlPromise, cartTitlePromise]);

    if (!result) {
      return false;
    }

    if (result === "cart") {
      const postCartOutcome = await Promise.race([
        proceedButton
          .waitFor({ state: "visible", timeout: postCartSettleTimeout })
          .then(() => "modal")
          .catch(() => null),
        Promise.any([
          quoteTitle.waitFor({ state: "visible", timeout: postCartSettleTimeout }),
          quoteStatus.waitFor({ state: "visible", timeout: postCartSettleTimeout }),
          flightHeading.waitFor({ state: "visible", timeout: postCartSettleTimeout }),
        ])
          .then(() => "cart-ready")
          .catch(() => null),
      ]);

      if (postCartOutcome !== "modal") {
        return false;
      }
    }

    await proceedButton.click({ force: true });

    try {
      await proceedButton.waitFor({ state: "hidden", timeout: 10000 });
    } catch {
      // Some flows navigate immediately after clicking Proceed.
    }

    // Confirm navigation to Trip Overview (not present in parallel hotel flows — that's fine)
    try {
      await Promise.any([
        this.page.waitForURL(/\/cart(?:[/?#]|$)/, { timeout: 60000 }),
        tripOverviewTitle.waitFor({ state: "visible", timeout: 60000 }),
      ]);
    } catch {
      // Parallel hotel flow navigates to hotel results instead of cart — not an error
    }

    return true;
  }

  /**
   * Waits briefly for a conflicting quotes modal after an action on an already-loaded page.
   * Returns false if the modal does not appear within the timeout.
   *
   * @param {number} timeout
   * @returns {Promise<boolean>}
   */
  async handleConflictQuoteModalIfAppears(timeout = 5000) {
    const proceedButton = this.page
      .locator(SELECTORS.CONFLICT_MODAL_PROCEED)
      .first();

    const appeared = await proceedButton
      .waitFor({ state: 'visible', timeout })
      .then(() => true)
      .catch(() => false);

    if (!appeared) {
      return false;
    }

    await proceedButton.click();

    try {
      await proceedButton.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Some flows navigate immediately after clicking Proceed.
    }

    return true;
  }

  /**
   * Waits for the conflicting quote modal to become visible.
   * Returns true once the Proceed button is visible.
   */
  async waitForConflictQuoteModal(timeout = 30000) {
    const proceedButton = this.page
      .locator(SELECTORS.CONFLICT_MODAL_PROCEED)
      .first();

    await proceedButton.waitFor({ state: 'visible', timeout });
    return true;
  }

  /**
   * Clicks the X (close) button on the share bar to exit share mode.
   */
  async clickExitShareModeButton() {
    const button = this.page.locator(SELECTORS.SHARE_BAR_CLOSE_BUTTON);
    await button.waitFor({ state: 'visible', timeout: 10000 });
    await button.click();
  }

  /**
   * Waits for the main Share button to be visible.
   * Used before clicking the share button to ensure it's ready.
   */
  async waitForShareMainButton() {
    await this.page.locator(SELECTORS.SHARE_MAIN_BUTTON).waitFor({ state: "visible" });
  }

  /**
   * Clicks the main Share button in results.
   * Opens the share options interface.
   */
  async clickShareMainButton() {
    await this.page.locator(SELECTORS.SHARE_MAIN_BUTTON).click();
  }

  /**
   * Clicks the email share button to open the share quote email dialog.
   * 
   * Note: Includes a stabilization wait and force click to handle cases
   * where the button may be temporarily disabled after closing pricing options.
   */
  async clickShareQuoteToGetEmailPopUp() {
    const button = this.page.locator(SELECTORS.SHARE_QUOTE_EMAIL_BUTTON).first();
    await button.waitFor({ state: 'visible', timeout: 10000 });
    await button.click({ timeout: 10000 });
  }

  /**
   * Extracts the displayed price amount from the results page.
   * 
   * @param {number} index - Zero-based index of the amount element (default: 0)
   * @returns {Promise<number|null>} The price value or null if not found
   * @example
   *   getAmountPriceValueResults(0)  → first price
   *   getAmountPriceValueResults(1)  → second price
   */
  async getAmountPriceValueResults(index = 0) {
    const { CommonPage } = require("@pages/CommonPage");
    const { getPageObject } = require("@utils/pageObjectCache");
    const commonPage = getPageObject(this.page, CommonPage);
    return commonPage.getAmountPriceValue(index);
  }

  getAirportsFilterContainer() {
    return this.page
      .locator(SELECTORS.AIRPORTS_FILTER_CONTAINER)
      .filter({ has: this.page.locator(SELECTORS.AIRPORTS_FILTER_HEADER, { hasText: 'Airports' }) })
      .first();
  }

  getAirportRouteContainer(routeLabel) {
    return this.getAirportsFilterContainer()
      .locator('div')
      .filter({
        has: this.page.locator(SELECTORS.AIRPORT_ROUTE_TOGGLE_LABEL, { hasText: routeLabel }),
      })
      .first();
  }

  getAirportRouteToggle(routeLabel) {
    return this.getAirportRouteContainer(routeLabel)
      .locator('button')
      .first();
  }

  getAirportSection(routeLabel, sectionTitle) {
    return this.getAirportRouteContainer(routeLabel)
      .locator(SELECTORS.AIRPORT_FILTER_GROUP)
      .filter({
        has: this.page.locator(SELECTORS.FILTER_GROUP_TITLE, { hasText: sectionTitle }),
      })
      .first();
  }

  getAirportOptionCheckbox(routeLabel, sectionTitle, airportCode) {
    return this.getAirportSection(routeLabel, sectionTitle)
      .locator(SELECTORS.FILTER_CHECKBOX_LABEL)
      .filter({
        has: this.page.locator(SELECTORS.AIRPORT_OPTION_TEXT, { hasText: new RegExp(`^${airportCode}\\s*-`) }),
      })
      .locator(SELECTORS.FILTER_CHECKBOX_INNER)
      .first();
  }

  getAirportSectionViewMoreButton(routeLabel, sectionTitle) {
    return this.getAirportSection(routeLabel, sectionTitle)
      .locator(SELECTORS.FILTER_VIEW_MORE_CONTAINER)
      .filter({
        has: this.page.locator(SELECTORS.FILTER_VIEW_MORE_LABEL, { hasText: 'View more' }),
      })
      .locator(SELECTORS.FILTER_VIEW_MORE_BUTTON)
      .first();
  }

  async scrollAirportFilterElementIntoView(locator, timeout = 60000) {
    if (!locator) {
      throw new Error('locator is required');
    }

    await this.getAirportsFilterContainer().waitFor({ state: 'visible', timeout });
    await this.getAirportsFilterContainer().scrollIntoViewIfNeeded();
    await locator.waitFor({ state: 'attached', timeout });
    await locator.scrollIntoViewIfNeeded();
  }

  async waitForAirportRouteLabel(routeLabel, timeout = 60000) {
    if (!routeLabel || typeof routeLabel !== 'string') {
      throw new Error('routeLabel must be a non-empty string');
    }

    const routeLabelLocator = this.page
      .locator(SELECTORS.AIRPORT_ROUTE_TOGGLE_LABEL, { hasText: routeLabel })
      .first();

    await this.scrollAirportFilterElementIntoView(routeLabelLocator, timeout);
    await routeLabelLocator.waitFor({ state: 'visible', timeout });
  }

  async expandAirportRouteIfNeeded(routeLabel, sectionTitle, timeout = 60000) {
    if (!routeLabel || typeof routeLabel !== 'string') {
      throw new Error('routeLabel must be a non-empty string');
    }

    if (!sectionTitle || typeof sectionTitle !== 'string') {
      throw new Error('sectionTitle must be a non-empty string');
    }

    await this.waitForAirportRouteLabel(routeLabel, timeout);

    const section = this.getAirportSection(routeLabel, sectionTitle);
    if (!(await section.isVisible())) {
      const routeToggle = this.getAirportRouteToggle(routeLabel);
      await this.scrollAirportFilterElementIntoView(routeToggle, timeout);
      await routeToggle.waitFor({ state: 'visible', timeout });
      await routeToggle.click();
    }

    await this.scrollAirportFilterElementIntoView(section, timeout);
    await section.waitFor({ state: 'visible', timeout });
  }

  async waitForAirportSection(routeLabel, sectionTitle, timeout = 60000) {
    if (!sectionTitle || typeof sectionTitle !== 'string') {
      throw new Error('sectionTitle must be a non-empty string');
    }

    await this.expandAirportRouteIfNeeded(routeLabel, sectionTitle, timeout);
  }

  async selectAirportOption(routeLabel, sectionTitle, airportCode, timeout = 60000) {
    if (!airportCode || typeof airportCode !== 'string') {
      throw new Error('airportCode must be a non-empty string');
    }

    await this.expandAirportRouteIfNeeded(routeLabel, sectionTitle, timeout);

    const normalizedAirportCode = airportCode.trim().toUpperCase();
    let checkbox = this.getAirportOptionCheckbox(routeLabel, sectionTitle, normalizedAirportCode);

    if (!(await checkbox.isVisible())) {
      const viewMoreButton = this.getAirportSectionViewMoreButton(routeLabel, sectionTitle);
      if (await viewMoreButton.isVisible()) {
        await this.scrollAirportFilterElementIntoView(viewMoreButton, timeout);
        await viewMoreButton.click();
      }

      checkbox = this.getAirportOptionCheckbox(routeLabel, sectionTitle, normalizedAirportCode);
    }

    await this.scrollAirportFilterElementIntoView(checkbox, timeout);
    await checkbox.waitFor({ state: 'visible', timeout });
    await checkbox.click();
  }

  async expandAllFilterViewMoreButtons(timeout = 5000) {
    const viewMoreContainers = this.page
      .locator(SELECTORS.FILTER_VIEW_MORE_CONTAINER)
      .filter({ has: this.page.locator(SELECTORS.FILTER_VIEW_MORE_LABEL, { hasText: 'View more' }) });

    const count = await viewMoreContainers.count();
    for (let i = 0; i < count; i++) {
      try {
        const btn = viewMoreContainers.nth(i).locator(SELECTORS.FILTER_VIEW_MORE_BUTTON).first();
        const isVisible = await btn.isVisible();
        if (isVisible) {
          await btn.click();
        }
      } catch (err) {
        throw new Error(
          `[ResultsPage.expandAllFilterViewMoreButtons] Failed to expand filter view-more section #${i}. ` +
          `Original: ${err.message}`
        );
      }
    }
  }

  /**
   * Clicks a filter checkbox identified by its label text.
   * If the option is not immediately visible, expands all filter "view more" sections and retries.
   * @param {string} option - The label text of the checkbox to click (e.g. 'Refundable', 'Mini')
   */
  async filterByCheckboxOption(option) {
    if (typeof option !== 'string' || !option.trim()) {
      throw new Error(`[ResultsPage.filterByCheckboxOption] option must be a non-empty string, got: ${typeof option}`);
    }
    const optionText = option.trim();
    const resolvedText = AIRLINE_FILTER_ALIASES[optionText] || optionText;

    const getCheckbox = (text) => this.page
      .locator(SELECTORS.FILTER_CHECKBOX_LABEL, { has: this.page.locator(`p:text-is('${text}')`) })
      .locator(SELECTORS.FILTER_CHECKBOX_INNER)
      .first();

    let checkbox = getCheckbox(optionText);

    if (!(await checkbox.isVisible())) {
      await this.expandAllFilterViewMoreButtons();
      checkbox = getCheckbox(resolvedText);
    }

    try {
      await checkbox.waitFor({ state: 'visible', timeout: 10000 });
      await checkbox.click();
    } catch (err) {
      throw new Error(
        `[ResultsPage.filterByCheckboxOption] Could not click checkbox "${optionText}" — option not visible after expanding all filter sections. ` +
        `Verify the filter panel is loaded and "${optionText}" is a valid option for this result set. ` +
        `Original: ${err.message}`
      );
    }
  }

  async clickEditButton() {
     await this.getEditButton().waitFor({ state: 'visible' }); 
     await this.getEditButton().click();
 }

    /**
     * Waits for a visible alert with the exact expected text.
     *
     * @param {string} expectedText
     * @param {number} timeout
     */
    async waitForAlertText(expectedText, timeout = 60000) {
      if (!expectedText || typeof expectedText !== 'string') {
        throw new Error('expectedText must be a non-empty string');
      }

      if (typeof timeout !== 'number' || timeout < 0) {
        throw new Error(`timeout must be a non-negative number, got ${timeout}`);
      }

      await waitForText(this.page, SELECTORS.ALERT_TEXT, expectedText, timeout);
    }

 async clickViewMoreAirlinesExpanderIfVisible(timeout = 5000) {
    const expander = this.page.locator(SELECTORS.FILTER_VIEW_MORE_AIRLINES_EXPANDER);
    const isVisible = await expander.waitFor({ state: 'visible', timeout }).then(() => true).catch(() => false);
    if (!isVisible) return;
    await expander.click();
 }

} 
module.exports = {
  ResultsPage,
  SELECTORS,
};
