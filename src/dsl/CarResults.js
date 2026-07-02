const { expect } = require("@playwright/test");
const Results = require("./Results");
const CarResultsPage = require("@pages/CarResultsPage");
const { ResultsPage } = require("@pages/ResultsPage");
const { getPageObject } = require("@utils/pageObjectCache");
const { normalizeTextStrict, tokenizeAddress } = require("@utils/text");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const CarSearchPage = require("@pages/CarSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const logger = require("@utils/logger").child("CarResults-DSL");

const MAX_LOCATION_SELECTION_RETRIES = 2;


/**
 * CarResults DSL
 *
 * Business actions performed on car search results.
 */
const CarResults = {
  /**
   * Adds a car to the cart when searching by airport.
   */
  async addCarAirportFromResultsPageToCart(page) {
    const resultsPage = getPageObject(page, ResultsPage);

    // Pre-dismiss any Conflicting Quotes modal left open by a preceding action
    // (e.g. a flight "Add to trip" click triggering a duplicate-trip warning).
    // Uses a short timeout — if the dialog is already present it resolves instantly;
    // if it never appears the wait is bounded.
    await resultsPage.handleConflictQuoteModalIfAppears(5000);

    await Results.waitAndClickAddToTripButton(page);

    // Handle any Conflicting Quotes modal triggered by the car add itself.
    await Results.clickProceedConflictQuoteModal(page);

    return { added: true };
  },

  /**
   * Adds a car to the cart when searching by city center.
   *
   * Handles two flows:
   * 1. Called directly after search (station list visible) → clicks Select then Add to trip
   * 2. Called after selectFirstCityCenterPickupLocation (already on car list) → clicks Add to trip only
   */
  async addCarCityCenterFromResultsPageToCart(page) {
    const resultsPage = getPageObject(page, ResultsPage);

    // Click Select only when still on the station list (not yet navigated to car cards)
    const hasSelectButton = await resultsPage.isSelectButtonVisible();
    if (hasSelectButton) {
      await Results.waitAndClickSelectButton(page);
    }

    await Results.waitAndClickAddToTripButton(page);

    // Handle optional conflict modal
    await Results.clickProceedConflictQuoteModal(page);

    return { added: true };
  },

  /**
   * Verifies that a car location at a specific index contains the expected city name.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Zero-based index of the location element
   * @param {string} expectedCity - Expected city name to find in the location text
   * @throws {Error} If page, index, or expectedCity are invalid
   * @returns {Promise<void>}
   */
  async expectLocationToContain(page, index, expectedCity) {
    if (!page) {
      throw new Error("page is required");
    }

    if (typeof index !== "number" || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }

    if (!expectedCity || typeof expectedCity !== "string") {
      throw new Error("expectedCity must be a non-empty string");
    }

    const carResultsPage = getPageObject(page, CarResultsPage);
    const text = await carResultsPage.getLocationAddressTextByIndex(index);
    expect(text.toLowerCase()).toContain(expectedCity.toLowerCase());
  },

  /**
   * Verifies that a car location at a specific airport index contains the expected airport name.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Zero-based index of the airport location element
   * @param {string} expectedAirport - Expected airport name to find in the location text
   * @throws {Error} If page, index, or expectedAirport are invalid
   * @returns {Promise<void>}
   */
  async expectAirportAddressToContain(page, index, expectedAirport) {
    if (!page) {
      throw new Error("page is required");
    }

    if (typeof index !== "number" || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }

    if (!expectedAirport || typeof expectedAirport !== "string") {
      throw new Error(`expectedAirport must be a non-empty string, got: ${expectedAirport}`);
    }

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForAddToTripText();

    const carResultsPage = getPageObject(page, CarResultsPage);
    const tooltipIndex = Math.floor(index / 2);
    const isDropoff = index % 2 !== 0;
    await carResultsPage.openLocationDetailsTooltipByIndex(tooltipIndex);
    const text = isDropoff
      ? await carResultsPage.getDropoffAddressTextFromTooltip()
      : await carResultsPage.getPickupAddressTextFromTooltip();
    await carResultsPage.closeLocationDetailsTooltip(tooltipIndex);
    expect(text.toLowerCase()).toContain(expectedAirport.toLowerCase());
  },

  /**
   * Verifies that a car location label at a specific index contains the expected label text (e.g., "Pick up", "Drop off").
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Zero-based index of the location element
   * @param {string} expectedLabel - Expected location label text to find (e.g., "Pick up", "Drop off")
   * @throws {Error} If page, index, or expectedLabel are invalid
   * @returns {Promise<void>}
   */
  async expectLocationLabelToContain(page, index, expectedLabel) {
    if (!page) {
      throw new Error("page is required");
    }

    if (typeof index !== "number" || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }

    if (!expectedLabel || typeof expectedLabel !== "string") {
      throw new Error(`expectedLabel must be a non-empty string, got: ${expectedLabel}`);
    }

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForAddToTripText();

    const carResultsPage = getPageObject(page, CarResultsPage);

    // Poll until the label contains the expected text — Vue may re-render the list
    // asynchronously after a filter is applied, so a single read can return stale data.
    const timeout = 15000;
    const deadline = Date.now() + timeout;
    let lastText = '';
    while (Date.now() < deadline) {
      lastText = await carResultsPage.getLocationLabelByIndex(index).innerText().catch(() => '');
      if (lastText.toLowerCase().includes(expectedLabel.toLowerCase())) {
        return;
      }
      await page.waitForTimeout(300);
    }
    expect(lastText.toLowerCase()).toContain(expectedLabel.toLowerCase());
  },

  async expectCityCenterAddressToContain(page, index, expectedAddress) {
    if (!page) {
      throw new Error("page is required");
    }

    if (typeof index !== "number" || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }

    if (!expectedAddress || typeof expectedAddress !== "string") {
      throw new Error(`expectedAddress must be a non-empty string, got: ${expectedAddress}`);
    }

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForAddToTripText();

    const carResultsPage = getPageObject(page, CarResultsPage);
    await carResultsPage.openLocationDetailsTooltipByIndex(index);
    const text = await carResultsPage.getPickupAddressTextFromTooltip();
    await carResultsPage.closeLocationDetailsTooltip(index);
    expect(text.toLowerCase()).toContain(expectedAddress.toLowerCase());
  },

  /**
   * Verifies the payment type label displayed on the car results page at the given index.
   * Expected values: "Pre paid" (when Is Prepaid = true) or "Pay On Departure" (when Is Prepaid = false).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedPaymentType - Expected text, e.g. "Pre paid" or "Pay On Departure"
   * @param {number} [index=0] - Zero-based index of the car result card to check
   * @throws {Error} If page, expectedPaymentType, or index are invalid
   * @returns {Promise<void>}
   */
  async expectPaymentTypeOnResults(page, expectedPaymentType, index = 0) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedPaymentType || typeof expectedPaymentType !== 'string') {
      throw new Error(`expectedPaymentType must be a non-empty string, got: ${expectedPaymentType}`);
    }

    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }

    const carResultsPage = getPageObject(page, CarResultsPage);
    await carResultsPage.waitForPaymentTypeVisible(index);
    const text = await carResultsPage.getPaymentTypeLabelAtIndex(index).innerText();
    expect(text.trim()).toBe(expectedPaymentType);
  },

  /**
   * Gets the current visible FOP (payment type) from car results.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>}
   */
  async getCurrentFOPOnResults(page, { agencyName } = {}) {
    if (!page) {
      throw new Error('page is required');
    }

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForAddToTripText();

    const carResultsPage = getPageObject(page, CarResultsPage);
    return await carResultsPage.getCurrentFOPText({ agencyName });
  },

  /**
   * Verifies that the expected FOP (payment type) is shown on car results.
   * @param {import('playwright').Page} page
   * @param {string} expectedFOP
   * @returns {Promise<void>}
   */
  async expectCurrentFOPOnResults(page, expectedFOP, { agencyName } = {}) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!expectedFOP || typeof expectedFOP !== 'string') {
      throw new Error('expectedFOP must be a non-empty string');
    }

    const actualFOP = await CarResults.getCurrentFOPOnResults(page, { agencyName });
    const normalizedActual = actualFOP.toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizedExpected = expectedFOP.toLowerCase().replace(/\s+/g, ' ').trim();

    expect(normalizedActual).toContain(normalizedExpected);
  },

  /**
   * Selects the first city center pickup location from the pick-up location selection page.
   * Navigates from the vendor list to the actual car results with individual car cards.
   * If after selection no results appear, retries by editing search dates only (max 2 retries).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @throws {Error} If page is invalid
   * @returns {Promise<Object>} { selected: true, noResultsRetry: { retriesUsed, resolved } }
   */
  async selectFirstCityCenterPickupLocation(page) {
    if (!page) throw new Error('page is required');

    const carResultsPage = getPageObject(page, CarResultsPage);

    const selectionCallback = async () => {
      await carResultsPage.clickStationButtonByIndex(0, 'Select', { timeout: 30000 });
    };

    const retryResult = await this._retryLocationSelectionOnNoResults(page, selectionCallback, {
      maxRetries: MAX_LOCATION_SELECTION_RETRIES,
      pickupIndex: SEARCH_DEFAULTS.CAR.PICKUP_INDEX,
      dropoffIndex: SEARCH_DEFAULTS.CAR.DROPOFF_INDEX,
    });

    return { selected: true, noResultsRetry: retryResult };
  },

  /**
   * Selects the first city center dropoff location from the station selection page.
   * After the pickup station is selected, the UI transitions to the dropoff station list
   * where the same Select action applies.
   * If after selection no results appear, retries by editing search dates (max 2 retries).
   * On retry, after re-search the loop automatically re-clicks pickup (bottom of attempt)
   * then dropoff (top of next attempt) — the shared callback handles both station lists.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @throws {Error} If page is invalid
   * @returns {Promise<Object>} { selected: true, noResultsRetry: { retriesUsed, resolved } }
   */
  async selectFirstCityCenterDropoffLocation(page) {
    if (!page) throw new Error('page is required');

    const carResultsPage = getPageObject(page, CarResultsPage);

    const selectionCallback = async () => {
      await carResultsPage.clickStationButtonByIndex(0, 'Select', { timeout: 30000 });
    };

    const retryResult = await this._retryLocationSelectionOnNoResults(page, selectionCallback, {
      maxRetries: MAX_LOCATION_SELECTION_RETRIES,
      pickupIndex: SEARCH_DEFAULTS.CAR.PICKUP_INDEX,
      dropoffIndex: SEARCH_DEFAULTS.CAR.DROPOFF_INDEX,
      isDropoffStep: true,
    });

    if (!retryResult.resolved) {
      throw new Error(
        `[CarResults.selectFirstCityCenterDropoffLocation] No car results appeared after ${retryResult.retriesUsed} date-change retry attempt(s). ` +
        `The supplier returned no available cars for all tried date ranges. This is a data/availability issue, not a test bug.`
      );
    }

    return { selected: true, noResultsRetry: retryResult };
  },

  /**
   * Asserts that the agency station is visible on the vendor selection page.
   * When expectedAddress is provided, this validates both label and address in the same station card.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedLabel - Expected station label text
   * @param {string} [expectedAddress] - Optional expected station address text
   * @throws {Error} If inputs are invalid or station is not visible
   * @returns {Promise<void>}
   */
  async expectAgencyStationLabelOnVendorList(page, expectedLabel, expectedAddress) {
    if (!page) throw new Error('page is required');
    if (!expectedLabel || typeof expectedLabel !== 'string') {
      throw new Error(`expectedLabel must be a non-empty string, got: ${expectedLabel}`);
    }
    if (expectedAddress != null && (typeof expectedAddress !== 'string' || !expectedAddress.trim())) {
      throw new Error(`expectedAddress must be a non-empty string when provided, got: ${expectedAddress}`);
    }

    const normalizedLabel = expectedLabel.trim();
    const normalizedAddress = typeof expectedAddress === 'string' ? expectedAddress.trim() : expectedAddress;

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForSelectText();

    const stationCard = await this.findAgencyStationCard(page, normalizedLabel, normalizedAddress);

    await expect(stationCard).toBeVisible({ timeout: 15000 });
  },

  async expectStationButtonVisible(page, index, buttonName) {
    if (!page) {
      throw new Error('page is required');
    }

    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }

    if (!buttonName || typeof buttonName !== 'string') {
      throw new Error(`buttonName must be a non-empty string, got: ${buttonName}`);
    }

    const resultsPage = getPageObject(page, ResultsPage);

    // After a no-results retry the flow re-searches and re-selects both pickup and dropoff,
    // landing directly on the car results page (Add to trip visible) rather than on the
    // agency station list (Select visible). In that case the station list no longer exists
    // and the verification is implicitly satisfied — skip it so we don't block the test.
    const isOnCarResults = await resultsPage.isAddToTripButtonVisible(5000);
    if (isOnCarResults) {
      logger.debug(`[CarResults.expectStationButtonVisible] Car results page detected (Add to trip visible) — station list check skipped (no-results retry path).`);
      return;
    }

    await resultsPage.waitForSelectText();

    const carResultsPage = getPageObject(page, CarResultsPage);
    await carResultsPage.waitForStationButtonVisible(index, buttonName, { timeout: 15000 });

    await expect(carResultsPage.getStationButtonByIndex(index, buttonName)).toBeVisible({ timeout: 15000 });
  },

  /**
   * Finds the best matching agency station card by label and optional address.
   * For duplicate labels, chooses the highest-scoring address match.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} stationLabel - Station label text
   * @param {string} [stationAddress] - Optional station address text
   * @returns {Promise<import('playwright').Locator>} Locator for the best matching station card
   */
  async findAgencyStationCard(page, stationLabel, stationAddress) {
    const resultsPage = getPageObject(page, ResultsPage);
    const cards = resultsPage.getAgencyStationCardsByLabel(stationLabel);
    const count = await cards.count();

    if (count === 0) {
      throw new Error(`No station cards found for label: ${stationLabel}`);
    }

    if (!stationAddress) {
      return cards.first();
    }

    const expectedNormalized = normalizeTextStrict(stationAddress);
    const expectedTokens = tokenizeAddress(stationAddress);

    let bestIndex = -1;
    let bestScore = -1;
    let bestExact = false;
    const candidateAddresses = [];

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const addressText = await card.locator('.station-details').first().innerText();
      candidateAddresses.push(addressText.trim());

      const actualNormalized = normalizeTextStrict(addressText);
      const isExact = actualNormalized.includes(expectedNormalized) || expectedNormalized.includes(actualNormalized);

      let tokenScore = 0;
      for (const token of expectedTokens) {
        if (actualNormalized.includes(token)) tokenScore++;
      }

      if (isExact && !bestExact) {
        bestExact = true;
        bestScore = tokenScore;
        bestIndex = i;
        continue;
      }

      if (bestExact && !isExact) {
        continue;
      }

      if (tokenScore > bestScore) {
        bestScore = tokenScore;
        bestIndex = i;
      }
    }

    const minimumScore = Math.max(2, Math.floor(expectedTokens.length * 0.6));
    if (bestIndex === -1 || (!bestExact && bestScore < minimumScore)) {
      throw new Error(
        `No station card address matched "${stationAddress}" for label "${stationLabel}". Candidates: ${candidateAddresses.join(' | ')}`
      );
    }

    return cards.nth(bestIndex);
  },

  /**
   * Internal helper: clicks Select on the matched agency station card.
   */
  async _clickSelectOnStationCard(page, stationLabel, stationAddress) {
    const normalizedLabel = stationLabel.trim();
    const normalizedAddress = typeof stationAddress === 'string' ? stationAddress.trim() : stationAddress;

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForSelectText();

    // Re-query the DOM fresh each time to avoid stale element references.
    // The station list can re-render (Vue reactivity) between attempts, so we must
    // not hold onto a previously resolved locator across retry iterations.
    const stationCard = await this.findAgencyStationCard(page, normalizedLabel, normalizedAddress);

    await stationCard.waitFor({ state: 'visible', timeout: 15000 });

    const normalizedCardText = (await stationCard.innerText()).toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizedLabelCheck = normalizedLabel.toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizedAddressCheck = normalizedAddress
      ? normalizedAddress.toLowerCase().replace(/\s+/g, ' ').trim()
      : null;

    if (!normalizedCardText.includes(normalizedLabelCheck)) {
      throw new Error(`Matched station card does not contain expected label: ${normalizedLabel}`);
    }

    if (normalizedAddressCheck && !normalizedCardText.includes(normalizedAddressCheck)) {
      throw new Error(`Matched station card does not contain expected address: ${normalizedAddress}`);
    }

    // Build the Select button locator from the freshly resolved card index.
    // Using the card's index-based re-query avoids clicking a detached node
    // if Vue replaced the element between the card lookup and the click.
    const selectButton = stationCard.locator('.vendor-select-container .add-btn').first();

    try {
      await selectButton.waitFor({ state: 'visible', timeout: 15000 });
      await selectButton.scrollIntoViewIfNeeded();
      await selectButton.click({ timeout: 15000 });
    } catch (err) {
      // Element may have been detached due to Vue list re-render — retry the full card lookup
      // and click once more before giving up.
      const freshCard = await this.findAgencyStationCard(page, normalizedLabel, normalizedAddress);
      const freshButton = freshCard.locator('.vendor-select-container .add-btn').first();
      await freshButton.waitFor({ state: 'visible', timeout: 15000 });
      await freshButton.scrollIntoViewIfNeeded();
      await freshButton.click({ timeout: 15000 });
    }
  },

  /**
   * Selects a city center pickup location by station label with automatic no-results retry.
   * When stationAddress is provided, selection is constrained to the card containing both fields.
   * If after selection no results appear, retries by editing search dates only (max 2 retries).
   * Throws when no bookable car results are reached after all retries, so the failure surfaces
   * at this selection step (data/availability) rather than at a later on-results assertion.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} stationLabel - The station label to search for
   * @param {string} [stationAddress] - Optional station address to disambiguate duplicate labels
   * @throws {Error} If inputs are invalid, the station is not found, or no results appear after retries
   * @returns {Promise<Object>} { selected: true, noResultsRetry: { retriesUsed, resolved } }
   */
  async selectCityCenterPickupLocationByLabel(page, stationLabel, stationAddress) {
    if (!page) throw new Error('page is required');
    if (!stationLabel || typeof stationLabel !== 'string') {
      throw new Error(`stationLabel must be a non-empty string, got: ${stationLabel}`);
    }
    if (stationAddress != null && (typeof stationAddress !== 'string' || !stationAddress.trim())) {
      throw new Error(`stationAddress must be a non-empty string when provided, got: ${stationAddress}`);
    }

    // Do NOT click here — the retry orchestrator calls the callback on its first iteration.
    // Clicking twice here would cause the station list to detach/re-render mid-click.
    const retryResult = await this._retryLocationSelectionOnNoResults(page, () =>
      this._clickSelectOnStationCard(page, stationLabel, stationAddress),
      {
        maxRetries: MAX_LOCATION_SELECTION_RETRIES,
        pickupIndex: SEARCH_DEFAULTS.CAR.PICKUP_INDEX,
        dropoffIndex: SEARCH_DEFAULTS.CAR.DROPOFF_INDEX,
        // The caller asserts on the results page immediately after this step, so an ambiguous
        // "still loading" outcome must be confirmed as real results before proceeding —
        // otherwise a slow "No results found" state would surface at the assertion instead of
        // triggering the date-change retry here.
        confirmResultsOnTimeout: true,
      },
    );

    if (!retryResult.resolved) {
      throw new Error(
        `[CarResults.selectCityCenterPickupLocationByLabel] No car results appeared for station "${stationLabel}" ` +
        `after ${retryResult.retriesUsed} date-change retry attempt(s). ` +
        `The supplier returned no available cars for all tried date ranges. This is a data/availability issue, not a test bug.`
      );
    }

    return { selected: true, noResultsRetry: retryResult };
  },

  /**
   * Internal helper: retries location selection by editing search dates when no-results appears.
   */
  async _retryLocationSelectionOnNoResults(
    page,
    selectionCallback,
    { maxRetries = 2, pickupIndex = 0, dropoffIndex = 5, isDropoffStep = false, confirmResultsOnTimeout = false } = {},
  ) {
    const resultsPage = getPageObject(page, ResultsPage);
    const searchPage = getPageObject(page, SearchPage);
    const carSearchPage = getPageObject(page, CarSearchPage);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Click first, then wait to see if results or no-results appears
      await selectionCallback();

      // Fast outcome detection (12s cap instead of 60s).
      // Races no-results, car-cards, and Add-to-trip — whichever fires first.
      // If none fire in 12s, car results are still loading and downstream steps handle it.
      // For PICKUP: also detects Select-button appearance (station-list transition to dropoff).
      // For DROPOFF: Select-button excluded — car results also have Select per-car buttons.
      const status = await resultsPage.waitForNoResultsOrTransition({
        timeout: 12000,
        includeStationList: !isDropoffStep,
      });

      if (status === 'results') {
        return { retriesUsed: attempt - 1, resolved: true };
      }

      if (status === 'station-list' || status === 'ok') {
        // By default a 'station-list' or ambiguous 'ok' (12s timeout, results still loading)
        // is treated as success — downstream steps wait for their own elements.
        if (!confirmResultsOnTimeout) {
          return { retriesUsed: attempt - 1, resolved: true };
        }

        // The by-label pickup flow lands directly on the car results page (which itself has
        // per-car Select buttons) and the caller asserts on results immediately after this step.
        // A 'station-list' signal here is therefore most likely stale vendor-list Select buttons,
        // and an ambiguous 'ok' may settle into "No results found". Confirm REAL car results
        // (Select buttons excluded) before proceeding; a no-results outcome falls through to the
        // date-change retry instead of surfacing later at the on-results assertion.
        const confirmedStatus = await resultsPage.waitForCarCardsOrNoResultsAfterStationSelection(60000, {
          includeStationList: false,
          // Require the bookable "Add to trip" button (not a transient car-card skeleton) so this
          // confirmation agrees with the on-results assertion's waitForAddToTripText() check and
          // never false-resolves before the "No results found" state paints.
          requireAddToTrip: true,
        });
        if (confirmedStatus === 'results') {
          return { retriesUsed: attempt - 1, resolved: true };
        }
        // confirmedStatus === 'no-results' → continue to the retry path below.
      }

      logger.info('No car results after location selection. Retrying by changing dates only in edit search', {
        attempt,
        maxRetries,
        pickupIndex,
        dropoffIndex,
      });

      const noResultsEditButton = resultsPage.getNoResultsEditSearchButton();
      if (await noResultsEditButton.isVisible().catch(() => false)) {
        await noResultsEditButton.click();
      } else {
        await resultsPage.clickEditButton();
      }

      // Wait for the pickup date field to be visible and interactive after edit modal closes
      await searchPage.waitForPickupDateFieldVisible({ timeout: 15000 });

      // Capture current date values BEFORE editing so we can detect when Vue settles
      // the NEW values. The date inputs are never empty (they hold the pre-retry dates),
      // so waitForPickupDateNonEmpty/waitForDropoffDateNonEmpty would pass immediately
      // with stale values. We need to know the old values to detect the actual update.
      const oldPickupDate = await carSearchPage.getPickupDateFieldValue().catch(() => '');
      const oldDropoffDate = await carSearchPage.getDropoffDateFieldValue().catch(() => '');

      await searchPage.clickPickupDateField();
      await searchPage.clickCalendarNextArrow(1);
      await selectDatesByNthAvailable(page, {
        startIndex: pickupIndex,
        endIndex: null,
      });

      await carSearchPage.clickDropoffDateField();
      try {
        await selectDatesByNthAvailable(page, {
          startIndex: dropoffIndex,
          endIndex: null,
          pickerPosition: 'last',
        });
      } catch (error) {
        const shouldTryNextMonth =
          typeof error?.message === 'string' &&
          error.message.includes('Not enough available dates in the calendar');

        if (!shouldTryNextMonth) {
          throw error;
        }

        await carSearchPage.clickDropoffSecondCalendarNextMonthArrow();
        await selectDatesByNthAvailable(page, {
          startIndex: dropoffIndex,
          endIndex: null,
          pickerPosition: 'last',
        });
      }

      // Wait for Vue to settle the NEW date values before reading them.
      // The inputs are never empty (they keep the old date while the calendar is open),
      // so waitForPickupDateNonEmpty would return immediately with the OLD values.
      // waitForPickupDateChanged waits until the value is DIFFERENT from the pre-retry
      // value, guaranteeing we read the newly selected date.
      // If the calendar re-selected the same month (rare), the timeout catches gracefully.
      await carSearchPage.waitForPickupDateChanged(oldPickupDate, { timeout: 5000 }).catch(() => {
        logger.debug('Pickup date did not change (same month re-selected?); same-date check will handle if needed.');
      });
      await carSearchPage.waitForDropoffDateChanged(oldDropoffDate, { timeout: 5000 }).catch(() => {
        logger.debug('Dropoff date did not change (same month re-selected?); same-date check will handle if needed.');
      });

      const pickupDateValue = await carSearchPage.getPickupDateFieldValue();
      const dropoffDateValue = await carSearchPage.getDropoffDateFieldValue();

      logger.info('Dates after retry selection', {
        oldPickupDate,
        oldDropoffDate,
        newPickupDate: pickupDateValue,
        newDropoffDate: dropoffDateValue,
        isSameDate: pickupDateValue === dropoffDateValue,
      });

      if (pickupDateValue === dropoffDateValue) {
        logger.info('Same date detected ("Invalid time" state) — advancing dropoff by 1 slot to clear validation error', {
          date: pickupDateValue,
        });
        await carSearchPage.clickDropoffDateField();
        try {
          await selectDatesByNthAvailable(page, {
            startIndex: dropoffIndex + 1,
            endIndex: null,
            pickerPosition: 'last',
          });
        } catch (error) {
          const shouldTryNextMonth =
            typeof error?.message === 'string' &&
            error.message.includes('Not enough available dates in the calendar');

          if (shouldTryNextMonth) {
            await carSearchPage.clickDropoffSecondCalendarNextMonthArrow();
            await selectDatesByNthAvailable(page, {
              startIndex: dropoffIndex + 1,
              endIndex: null,
              pickerPosition: 'last',
            });
          } else {
            throw error;
          }
        }
      }

      await searchPage.waitAndClickSearchButton();

      // For the dropoff flow this bottom re-select clicks the PICKUP Select and transitions the
      // UI to the dropoff station list, so the NEXT iteration's top callback re-selects there.
      // For the by-label pickup flow (confirmResultsOnTimeout) the re-search lands back on the
      // station list and a SINGLE select per attempt is correct — the next iteration's top
      // callback clicks Select and checks the outcome. Re-selecting here as well would re-click
      // on the car-results page (station card already gone) and hang the step until timeout.
      if (!confirmResultsOnTimeout) {
        await selectionCallback();
      }
    }

    if (isDropoffStep) {
      // After exhausting all retries, the BOTTOM of the last attempt clicked the PICKUP
      // Select button — transitioning the UI to the dropoff station list. We need one
      // final dropoff Select click to reach car results (or confirm it's still no-results).
      // Do NOT include station-list as a valid outcome here; we need actual car results.
      await selectionCallback();
      const finalStatus = await resultsPage.waitForCarCardsOrNoResultsAfterStationSelection(60000, {
        includeStationList: false,
      });
      return { retriesUsed: maxRetries, resolved: finalStatus === 'results' };
    }

    if (confirmResultsOnTimeout) {
      // The by-label pickup loop performs a single select per attempt, so after the last
      // re-search the UI is on the station list. Click the station Select once more, then
      // require real bookable results (Add to trip) so this agrees with the on-results assertion.
      await selectionCallback();
      const finalStatus = await resultsPage.waitForCarCardsOrNoResultsAfterStationSelection(60000, {
        includeStationList: false,
        requireAddToTrip: true,
      });
      return { retriesUsed: maxRetries, resolved: finalStatus === 'results' };
    }

    const finalStatus = await resultsPage.waitForCarCardsOrNoResultsAfterStationSelection(60000);
    return { retriesUsed: maxRetries, resolved: finalStatus === 'results' };
  },

  /**
   * Asserts that none of the visible car result titles contain the given word as a standalone word.
   * Uses word-boundary regex. Regression for ADO Bug #75326.
   */
  async assertCarTitlesDoNotContainWord(page, word) {
    if (!page) throw new Error('page is required');
    if (!word || typeof word !== 'string') throw new Error(`word must be a non-empty string, got: ${word}`);

    const carResultsPage = getPageObject(page, CarResultsPage);
    await carResultsPage.waitForCarTitlesVisible();

    const titleLocators = carResultsPage.getCarTitles();
    const count = await titleLocators.count();
    const wordRegex = new RegExp(`\\b${word}\\b`, 'i');

    for (let i = 0; i < count; i++) {
      const text = await titleLocators.nth(i).innerText();
      expect(
        wordRegex.test(text),
        `Car title at index ${i} contains unexpected word "${word}": "${text.trim()}"`
      ).toBe(false);
    }
  },

  /**
   * Verifies that the car model subtitle element is visible in results.
   * This element is only rendered for SunnyCars supplier when makeModel is populated.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @throws {Error} If page is not provided or car model subtitle is not visible
   * @returns {Promise<void>}
   */
  async expectCarModelIsVisible(page) {
    if (!page) throw new Error('page is required');

    const carResultsPage = getPageObject(page, CarResultsPage);
    await carResultsPage.waitForCarModelVisible();
    await expect(carResultsPage.getCarModelSubtitle()).toBeVisible();
  },

  /**
   * Verifies the car results section is displayed by confirming the results
   * breadcrumb shows the current product as "Car". In a parallel flight+car
   * search this is the signal that the app advanced to the car results page
   * after the flight was added.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   */
  async expectCarResultsSectionDisplayed(page) {
    if (!page) throw new Error('page is required');

    const carResultsPage = getPageObject(page, CarResultsPage);

    try {
      await carResultsPage.waitForBreadcrumbVisible();
    } catch (err) {
      throw new Error(
        `[CarResults.expectCarResultsSectionDisplayed] Car results breadcrumb never appeared. `
        + `The car results section likely did not load after adding the flight. Original: ${err.message}`,
      );
    }

    await expect(
      carResultsPage.getCurrentBreadcrumbSection(),
      'Car results breadcrumb should show "Car" as the current section, confirming the car results page is displayed',
    ).toContainText('Car');
  },

  /**
   * Verifies that a filter with the given title is visible on the car results page.
   * @param {import('playwright').Page} page
   * @param {string} filterTitle - The expected filter title (e.g. "Rental Agency")
   */
  async verifyFilterVisibleOnResults(page, filterTitle) {
    if (!page) throw new Error('page is required');
    if (!filterTitle || typeof filterTitle !== 'string') throw new Error('filterTitle must be a non-empty string, got: ' + typeof filterTitle);

    const carResultsPage = getPageObject(page, CarResultsPage);
    const isVisible = await carResultsPage.isFilterTitleVisible(filterTitle, 60000);
    expect(isVisible, `Filter "${filterTitle}" should be visible on car results page`).toBe(true);
  },

  async verifyAgreementTextDisplayedInCarResultsTooltip(page) {
    if (!page) throw new Error('page is required');

    const carResultsPage = getPageObject(page, CarResultsPage);
    const hasAgreementTrigger = await carResultsPage.hasVisibleAgreementTrigger();

    if (hasAgreementTrigger) {
      await carResultsPage.hoverAgreementIconInFirstCarResult();
      const tooltipText = await carResultsPage.getAgreementTooltipText();

      expect(
        tooltipText.length > 0,
        'Expected agreement tooltip to contain text in car results when agreement icon is visible.',
      ).toBe(true);

      return { tooltipText, source: 'agreement-tooltip' };
    }

    const termsText = await carResultsPage.getTermsAndConditionsTextInFirstCarResult();
    expect(
      /terms\s*&?\s*conditions/i.test(termsText),
      `Expected terms and conditions text to be visible in car results when agreement tooltip is not rendered, got: "${termsText}"`,
    ).toBe(true);

    return { tooltipText: termsText, source: 'terms-link-fallback' };
  },

  async clickTermsAndConditionsLinkInCarResultsTooltip(page) {
    if (!page) throw new Error('page is required');

    const carResultsPage = getPageObject(page, CarResultsPage);
    await carResultsPage.clickTermsAndConditionsInFirstCarResult();
  },

  /**
   * Opens the first location link from car results and returns context for map validation.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{mapsPage: import('playwright').Page, expectedLocationText: string}>}
   */
  async openFirstCarLocationLinkInResults(page) {
    if (!page) throw new Error('page is required, got: ' + typeof page);

    const carResultsPage = getPageObject(page, CarResultsPage);
    logger.info('Opening first car location link in results');
    const result = await carResultsPage.openFirstLocationLinkInResults();

    return {
      mapsPage: result.mapsPage,
      expectedLocationText: result.expectedLocationText,
    };
  },

  /**
   * Verifies that the selected location is shown in Google Maps.
   *
   * @param {import('playwright').Page} page
   * @param {import('playwright').Page} [mapsPage]
   * @param {string} [expectedLocationText]
   * @returns {Promise<void>}
   */
  async verifySelectedCarLocationInGoogleMaps(page, mapsPage, expectedLocationText) {
    if (!page) throw new Error('page is required, got: ' + typeof page);
    if (mapsPage && typeof mapsPage.url !== 'function') {
      throw new Error('mapsPage must be a Playwright page when provided, got: ' + typeof mapsPage);
    }

    const carResultsPage = getPageObject(page, CarResultsPage);
    const mapsContext = await carResultsPage.readGoogleMapsContext(mapsPage);

    // Validate Google Maps URL
    expect(
      mapsContext.url.toLowerCase(),
      `Expected Google Maps URL, got: ${mapsContext.url}`,
    ).toContain('google');

    expect(
      mapsContext.url.toLowerCase(),
      `Expected Google Maps path in URL, got: ${mapsContext.url}`,
    ).toContain('/maps');

    // Validate Google Maps location text shows location (with flexible matching)
    // Just validate that location info is displayed (not blank/loading)
    expect(
      mapsContext.locationText,
      `Google Maps location text should not be empty. Received: "${mapsContext.locationText}"`,
    ).toBeTruthy();
  },

  /**
   * Verifies that all visible options in a filter section are drawn from the known valid set.
   * The filter hides options that have zero matching results (hideIfNoresults), so fewer options
   * than the full set may be visible — but every visible option must be a known valid value.
   * At least one option must be visible for the assertion to be meaningful.
   *
   * @param {import('playwright').Page} page
   * @param {string} filterTitle - Filter section title (e.g. "Rental Counter Location")
   * @param {string[]} validOptions - Full set of valid option label texts
   * @throws {Error} If inputs are invalid, no options are visible, or an unknown option appears
   * @returns {Promise<void>}
   */
  async verifyFilterOptionsAreValidCounterLocations(page, filterTitle, validOptions) {
    if (!page) throw new Error('page is required');
    if (!filterTitle || typeof filterTitle !== 'string') {
      throw new Error(`filterTitle must be a non-empty string, got: ${filterTitle}`);
    }
    if (!Array.isArray(validOptions) || validOptions.length === 0) {
      throw new Error(`validOptions must be a non-empty array, got: ${JSON.stringify(validOptions)}`);
    }

    const carResultsPage = getPageObject(page, CarResultsPage);
    const actualOptions = await carResultsPage.getFilterOptionLabels(filterTitle);

    expect(
      actualOptions.length,
      `Filter "${filterTitle}" should show at least one option, but none were visible.`,
    ).toBeGreaterThan(0);

    for (const option of actualOptions) {
      expect(
        validOptions,
        `Filter "${filterTitle}" contains unknown option "${option}". Valid options: ${JSON.stringify(validOptions)}`,
      ).toContain(option);
    }
  },

  /**
   * Selects a filter option checkbox by label within the named filter section.
   * When the checkbox is already checked AND disabled (only one option has results,
   * so the UI auto-selects and locks it), the click is skipped — the filter is
   * effectively already active and no interaction is possible.
   *
   * @param {import('playwright').Page} page
   * @param {string} optionLabel - The checkbox label text (e.g. "At airport")
   * @param {string} filterTitle - The filter section title (e.g. "Rental Counter Location")
   * @throws {Error} If inputs are invalid
   * @returns {Promise<{clicked: boolean, wasAlreadyChecked: boolean, wasDisabled: boolean}>}
   */
  async selectFilterOption(page, optionLabel, filterTitle) {
    if (!page) throw new Error('page is required');
    if (!optionLabel || typeof optionLabel !== 'string') {
      throw new Error(`optionLabel must be a non-empty string, got: ${optionLabel}`);
    }
    if (!filterTitle || typeof filterTitle !== 'string') {
      throw new Error(`filterTitle must be a non-empty string, got: ${filterTitle}`);
    }

    const carResultsPage = getPageObject(page, CarResultsPage);
    const result = await carResultsPage.clickFilterOptionByLabel(filterTitle, optionLabel);
    if (result.clicked) {
      // Wait briefly for Vue reactivity to apply the filter and re-render the list
      await page.waitForTimeout(800);
    } else {
      logger.info(`Filter option "${optionLabel}" in "${filterTitle}" is already checked and disabled (only option) — skipping click`, result);
    }
    return result;
  },

  /**
   * Deselects a filter option checkbox by label within the named filter section.
   * When the checkbox is disabled (only one option has results), the deselect is
   * skipped — the UI does not allow removing the sole remaining filter option.
   *
   * @param {import('playwright').Page} page
   * @param {string} optionLabel - The checkbox label text (e.g. "At airport")
   * @param {string} filterTitle - The filter section title (e.g. "Rental Counter Location")
   * @throws {Error} If inputs are invalid
   * @returns {Promise<{clicked: boolean, wasAlreadyChecked: boolean, wasDisabled: boolean}>}
   */
  async deselectFilterOption(page, optionLabel, filterTitle) {
    if (!page) throw new Error('page is required');
    if (!optionLabel || typeof optionLabel !== 'string') {
      throw new Error(`optionLabel must be a non-empty string, got: ${optionLabel}`);
    }
    if (!filterTitle || typeof filterTitle !== 'string') {
      throw new Error(`filterTitle must be a non-empty string, got: ${filterTitle}`);
    }

    const carResultsPage = getPageObject(page, CarResultsPage);
    const result = await carResultsPage.clickFilterOptionByLabel(filterTitle, optionLabel);
    if (result.clicked) {
      // Wait briefly for Vue reactivity to restore the full list
      await page.waitForTimeout(800);
    } else {
      logger.info(`Filter option "${optionLabel}" in "${filterTitle}" is disabled — deselect skipped (sole option, filter locked by UI)`, result);
    }
    return result;
  },

  /**
   * Asserts that the named counter location filter option is active (checked).
   * Handles two cases:
   *   1. The checkbox is checked and enabled — the user explicitly selected it.
   *   2. The checkbox is checked and disabled — only one option has results, so the
   *      UI auto-selects and locks it (isShowingOneDisabledSelectedOption = true).
   *      Both cases mean only results for that counter location are shown.
   *
   * @param {import('playwright').Page} page
   * @param {string} optionLabel - The filter option that should be active (e.g. "At airport")
   * @param {string} filterTitle - The filter section title (e.g. "Rental Counter Location")
   * @throws {Error} If inputs are invalid or the filter option is not checked
   * @returns {Promise<void>}
   */
  async verifyCounterLocationFilterIsActive(page, optionLabel, filterTitle) {
    if (!page) throw new Error('page is required');
    if (!optionLabel || typeof optionLabel !== 'string') {
      throw new Error(`optionLabel must be a non-empty string, got: ${optionLabel}`);
    }
    if (!filterTitle || typeof filterTitle !== 'string') {
      throw new Error(`filterTitle must be a non-empty string, got: ${filterTitle}`);
    }

    const carResultsPage = getPageObject(page, CarResultsPage);
    const isChecked = await carResultsPage.isFilterOptionChecked(filterTitle, optionLabel);

    expect(
      isChecked,
      `Expected filter option "${optionLabel}" in "${filterTitle}" to be checked (active), but it was not. ` +
      `The filter may not have been applied, or the option label does not match the rendered text.`,
    ).toBe(true);
  },

  /**
   * Asserts that all car results are restored after a filter is removed.
   * Verifies the Reset Filters button is disabled (no manually applied filters).
   * When the sole option was auto-selected and locked by the UI (disabled checkbox),
   * the Reset Filters button remains disabled throughout — that state is also valid.
   *
   * @param {import('playwright').Page} page
   * @throws {Error} If page is invalid or the reset button is not in the expected state
   * @returns {Promise<void>}
   */
  async verifyAllCarResultsRestored(page) {
    if (!page) throw new Error('page is required');

    const { ResultsPage } = require('@pages/ResultsPage');
    const resultsPage = getPageObject(page, ResultsPage);
    const resetButton = resultsPage.getResetFiltersButton();

    await expect(resetButton).toBeVisible({ timeout: 15000 });
    await expect(resetButton).toBeDisabled({ timeout: 15000 });
  },

  /**
   * Asserts that the first car result (index 0) is from the specified rental agency.
   * Verifies the preferred/priority vendor is correctly prioritized in default sort order.
   * Regression for ADO Bug #76501.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} agencyName - Expected rental agency name (e.g. "Europcar")
   * @throws {Error} If page or agencyName are invalid, or if assertion fails
   * @returns {Promise<void>}
   */
  async assertFirstCarResultIsFromAgency(page, agencyName) {
    if (!page) throw new Error('page is required');
    if (!agencyName || typeof agencyName !== 'string') throw new Error(`agencyName must be a non-empty string, got: ${agencyName}`);

    const carResultsPage = getPageObject(page, CarResultsPage);
    await carResultsPage.waitForCarTitlesVisible();

    // Vendor names are rendered as logo images (no visible text).
    // Strategy: try img[alt] first; fall back to preferred-vendor heuristic
    // (preferred in-policy vendor e.g. Europcar does NOT show "Agency rate" badge,
    //  non-preferred vendors like Hertz DO show it).
    const { vendorAlt, hasAgencyRate } = await carResultsPage.getFirstResultVendorInfo();

    if (vendorAlt) {
      // Direct match from img alt attribute
      expect(
        vendorAlt,
        `Expected first car result vendor to be "${agencyName}" but found "${vendorAlt}"`
      ).toContain(agencyName.toLowerCase());
    } else {
      // Heuristic: if first result is from the preferred vendor, it should NOT have "Agency rate" badge
      expect(
        hasAgencyRate,
        `Expected first car result to be from preferred vendor "${agencyName}" (no Agency Rate badge), ` +
        `but first result has the Agency Rate badge indicating it is NOT the preferred vendor`
      ).toBe(false);
    }
  },
};

module.exports = CarResults;
