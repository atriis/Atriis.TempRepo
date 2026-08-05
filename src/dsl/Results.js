const { getPageObject } = require("@utils/pageObjectCache");
const { ResultsPage } = require("@pages/ResultsPage");
const { CommonPage, SELECTORS } = require("@pages/CommonPage");
const { expect } = require("@playwright/test");
const { readJson } = require("@utils/networkInterceptor");
const logger = require("@utils/logger").child("Results-DSL");

/**
 * Results DSL
 *
 * High-level actions related to generic results screens.
 * Describes WHAT the user does, not HOW the UI works.
 */
const Results = {

  // ===== INTERCEPTED SEARCH RESPONSE =====

  /**
   * Counts results in an intercepted search response whose `field` equals `expectedValue`
   * (compared as strings, so booleans/numbers work — e.g. "hasUnusedTicket" is "true").
   *
   * Throws when the response carries no results at all, so a caller asserting "no result
   * matches" can never pass just because the payload was empty or its shape changed.
   *
   * @param {import('playwright').Page} page
   * @param {Promise<import('@playwright/test').Response>} responsePromise
   * @param {string} field
   * @param {string} expectedValue
   * @returns {Promise<{total: number, matches: number}>}
   */
  async countResultsWhereFieldEquals(page, responsePromise, field, expectedValue) {
    if (!page) throw new Error('page is required');
    if (!responsePromise) {
      throw new Error('[Results.countResultsWhereFieldEquals] no intercepted response — call the intercept step before triggering the search');
    }
    if (!field || typeof field !== 'string') throw new Error('field must be a non-empty string, got: ' + typeof field);
    if (typeof expectedValue !== 'string') throw new Error('expectedValue must be a string, got: ' + typeof expectedValue);

    const raw = await readJson(responsePromise);
    // The response may be the object itself or a single-element array wrapping it, e.g. [{ results: [...] }].
    const body = Array.isArray(raw) ? raw[0] : raw;
    const results = Array.isArray(body?.results) ? body.results : [];

    if (results.length === 0) {
      throw new Error(
        `[Results.countResultsWhereFieldEquals] the intercepted response carried no results, so "${field}" ` +
        `could not be evaluated. A "no result matches" assertion would pass vacuously here. ` +
        `Response keys: ${Object.keys(body ?? {}).join(', ') || '(none)'}`
      );
    }

    const matches = results.filter((r) => r && String(r[field]) === expectedValue).length;
    logger.info('Counted intercepted-response results where field equals value', {
      field, expectedValue, total: results.length, matches,
    });
    return { total: results.length, matches };
  },

  // ===== ADD TO TRIP / SELECT ACTIONS =====

  /**
   * Waits for the "Add to trip" button and clicks the first available option.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{clicked: boolean}>}
   */
  async waitAndClickAddToTripButton(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForAddToTripText();
    await resultsPage.clickFirstAddToTripButton();
    return { clicked: true };
  },

  /**
   * Verifies that a results button containing the expected text is visible.
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedText - Visible button text to wait for
   * @returns {Promise<boolean>} True if the button becomes visible
   */
  async isResultButtonTextVisible(page, expectedText) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForResultButtonText(expectedText);
    return true;
  },

  /**
   * Waits for the "Select" button and clicks the first available option.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{clicked: boolean}>}
   */
  async waitAndClickSelectButton(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForSelectText();
    await resultsPage.clickFirstSelectButton();
    return { clicked: true };
  },

  // ===== CONFLICT QUOTE MODAL =====

  /**
   * Handles the "Conflicting Quotes" modal if it appears.
   * Safe to call even if no modal is shown.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{proceeded: boolean}>}
   */
  async clickProceedConflictQuoteModal(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const resultsPage = getPageObject(page, ResultsPage);
    const proceeded = await resultsPage.handleConflictQuoteModalIfVisible();
    return { proceeded };
  },

  async verifyConflictQuoteModalVisible(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const resultsPage = getPageObject(page, ResultsPage);
    const visible = await resultsPage.waitForConflictQuoteModal();
    expect(visible, 'Expected the conflicting quote modal to be visible').toBe(true);
  },

  /**
   * Reads and returns the trip number displayed in the conflicting quotes modal.
   * Stores nothing — the caller (step) is responsible for persisting the value.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} Trip ID as a string (e.g. "12345")
   */
  async extractTripNumberFromConflictingQuoteModal(page) {
    if (!page) throw new Error('page is required');
    const resultsPage = getPageObject(page, ResultsPage);
    return await resultsPage.getConflictingQuoteModalTripNumber();
  },

  /**
   * Clicks the trip number link inside the conflicting quotes modal.
   * The app opens the trip cart in a new browser tab.
   * Returns the new tab's Page object so the caller can store and use it.
   * @param {import('playwright').Page} page
   * @returns {Promise<import('playwright').Page>} The newly opened cart tab
   */
  async clickTripNumberInConflictingQuoteModal(page) {
    if (!page) throw new Error('page is required');
    const resultsPage = getPageObject(page, ResultsPage);
    return await resultsPage.clickConflictingQuoteModalTripNumber();
  },

  /**
   * Verifies that the trip ID shown in the new-tab cart matches the stored conflicting trip ID.
   * Reads the numeric trip-id element from the cart info bar.
   * @param {import('playwright').Page} newTabPage - The page opened in the new tab
   * @param {string} storedTripId - Trip ID captured from the conflicting quotes modal
   * @returns {Promise<void>}
   */
  async verifyTripNumberInNewTabMatchesStored(newTabPage, storedTripId) {
    if (!newTabPage) throw new Error('"newTabPage" is required');
    if (!storedTripId || typeof storedTripId !== 'string') {
      throw new Error(`"storedTripId" must be a non-empty string, got: ${typeof storedTripId}`);
    }

    const { CartPage } = require('@pages/CartPage');
    const cartPage = getPageObject(newTabPage, CartPage);
    const tripIdInCart = await cartPage.getTripIdText();

    expect(
      tripIdInCart,
      `Expected trip ID in cart ("${tripIdInCart}") to match stored conflicting quote trip ID ("${storedTripId}")`,
    ).toBe(storedTripId);
  },

  // ===== JOURNEY SELECTION WORKFLOWS =====

  /**
   * For one-way journeys: clicks Select, then Add to Trip.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{workflowCompleted: boolean}>}
   */
  async clickSelectButtonOneWayAndClickAddToTrip(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    await Results.waitAndClickSelectButton(page);
    await Results.waitAndClickAddToTripButton(page);
    return { workflowCompleted: true };
  },

  /**
   * For round-trip journeys: clicks Select for both legs, then Add to Trip.
   * Waits for UI update between legs.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{workflowCompleted: boolean}>}
   */
  async clickSelectButtonRoundTripAndClickAddToTrip(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    // First leg
    await Results.waitAndClickSelectButton(page);

    // Second leg
    await Results.waitAndClickSelectButton(page);
    await Results.waitAndClickAddToTripButton(page);
    return { workflowCompleted: true };
  },

  // ===== OUT OF POLICY (OOP) VALIDATION =====

  /**
   * Checks if Out of Policy indicators are visible in results page.
   * Returns visibility status for validation in step definitions.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<boolean>} True if OOP indicator is visible
   */
  async isOutOfPolicyIndicatorVisibleInResults(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const commonPage = getPageObject(page, CommonPage);
    await commonPage.waitForOOPVisible();
    return await page.locator(SELECTORS.OOP_INFO).first().isVisible();
  },

  /**
   * Checks if Out of Policy indicators are hidden in results page.
   * Returns visibility status for validation in step definitions.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<boolean>} True if OOP indicator is hidden
   */
  async isOutOfPolicyIndicatorHiddenInResults(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForCarResultsOrNoResults();

    const commonPage = getPageObject(page, CommonPage);
    return await commonPage.isOOPHiddenEverywhere();
  },

  // ===== FLIGHT CAPACITY RESTRICTION MODAL =====

  /**
   * Checks if the Flight Capacity Restriction modal is visible.
   * Returns visibility status for validation in step definitions.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<boolean>} True if modal is visible
   */
  async isFlightCapacityRestrictionModalVisible(page, timeout = 30000) {
    if (!page) {
      throw new Error('page is required');
    }

    if (typeof timeout !== 'number' || timeout < 0) {
      throw new Error(`timeout must be a non-negative number, got: ${timeout}`);
    }
    
    const modal = page.getByRole("heading", {
      name: "Flight Capacity Restriction",
      level: 2,
    });
    
    try {
      await modal.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validates Flight Capacity Restriction modal is visible and clicks 'Go Back'.
   * Used when booking exceeds traveler capacity and user wants to return to results.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{modalVisible: boolean}>}
   */
  async validateFlightCapacityModalIsVisibleInResultsAndClickGoBack(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const commonPage = getPageObject(page, CommonPage);
    const resultsPage = getPageObject(page, ResultsPage);
    const modalVisible = await Results.isFlightCapacityRestrictionModalVisible(page);
    await commonPage.clickGoBackOnFlightCapacityRestrictionPopUp();
    await resultsPage.waitForAddToTripText(); // Wait for results to reload after going back
    return { modalVisible };
  },

  /**
   * Validates the currently visible Flight Capacity Restriction modal content.
   *
   * @param {import('playwright').Page} page
   * @param {string} flightNumber
   * @param {number} passengerCount
   * @returns {Promise<{modalVisible: boolean, modalText: string}>}
   */
  async verifyFlightCapacityRestrictionModalContent(page, flightNumbers, passengerCount) {
    if (!page) {
      throw new Error('page is required');
    }

    const normalizedFlightNumbers = Array.isArray(flightNumbers)
      ? flightNumbers.filter((flightNumber) => typeof flightNumber === 'string' && flightNumber.trim())
      : [flightNumbers].filter((flightNumber) => typeof flightNumber === 'string' && flightNumber.trim());

    if (!normalizedFlightNumbers.length) {
      throw new Error(`flightNumbers must include at least one non-empty string, got: ${typeof flightNumbers}`);
    }

    if (!Number.isInteger(passengerCount) || passengerCount < 1) {
      throw new Error(`passengerCount must be an integer >= 1, got: ${passengerCount}`);
    }

    const commonPage = getPageObject(page, CommonPage);
    const modalText = await commonPage.assertFlightCapacityRestrictionModalContent({
      flightNumbers: normalizedFlightNumbers,
      passengerCount,
    });
    return { modalVisible: true, modalText };
  },

  /**
   * Validates Flight Capacity Restriction modal is visible and clicks 'Proceed Anyway'.
   * Used when booking exceeds traveler capacity but user wants to continue.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{modalVisible: boolean}>}
   */
  async validateFlightCapacityModalIsVisibleAfterAddToCart(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const commonPage = getPageObject(page, CommonPage);
    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.clickFirstAddToTripButton(); // Ensure results are loaded before checking modal
    const modalVisible = await Results.isFlightCapacityRestrictionModalVisible(page);
    await commonPage.clickProceedAnywayOnFlightCapacityRestrictionPopUp();
    await Results.clickProceedConflictQuoteModal(page);
    return { modalVisible };
  },

  /**
   * Validates the visible Flight Capacity Restriction modal content and clicks 'Proceed Anyway'.
   *
   * @param {import('playwright').Page} page
   * @param {string} flightNumber
   * @param {number} passengerCount
   * @returns {Promise<{modalVisible: boolean, modalText: string}>}
   */
  async verifyFlightCapacityModalContentAndProceed(page, flightNumbers, passengerCount) {
    if (!page) {
      throw new Error('page is required');
    }

    const commonPage = getPageObject(page, CommonPage);
    const verification = await Results.verifyFlightCapacityRestrictionModalContent(page, flightNumbers, passengerCount);
    await commonPage.clickProceedAnywayOnFlightCapacityRestrictionPopUp();
    await Results.clickProceedConflictQuoteModal(page);
    return verification;
  },

  /**
   * Hovers over the Out of Policy info icon and gets tooltip text.
   * Returns the tooltip text for validation in step definitions.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<string>} The OOP tooltip text
   */
  async hoverAndGetOOPTooltipTextInResults(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const resultsPage = getPageObject(page, ResultsPage);
    const commonPage = getPageObject(page, CommonPage);
    await commonPage.waitForOOPVisible();
    await commonPage.hoverOverOOPInfoIcon();
    return await commonPage.getOOPTooltipText();
  },

  /**
   * Validates that the Reset Filters button is visible and disabled.
   * Used to verify initial state before any filters are applied.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{isVisible: boolean, isDisabled: boolean}>}
   */
  async validateResetFiltersButtonIsVisibleAndDisabled(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const resultsPage = getPageObject(page, ResultsPage);
    const resetButton = resultsPage.getResetFiltersButton();

    await expect(resetButton).toBeVisible();
    await expect(resetButton).toBeDisabled();
    
    return { isVisible: true, isDisabled: true };
  },

  /**
   * Validates the no-results title shown after filters remove all results.
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedText - Expected no-results title
   * @returns {Promise<{visible: boolean, expectedText: string}>}
   */
  async validateNoResultsTitle(page, expectedText = 'No results found') {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForNoResultsTitle(expectedText);

    return { visible: true, expectedText };
  },

  /**
   * Validates the no-results state shows Reset Filters and Edit search actions.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{resetFiltersVisible: boolean, editSearchVisible: boolean}>}
   */
  async validateNoResultsActionButtonsVisible(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForNoResultsActionButtons();

    await expect(resultsPage.getNoResultsResetFiltersButton()).toBeVisible();
    await expect(resultsPage.getNoResultsEditSearchButton()).toBeVisible();

    return { resetFiltersVisible: true, editSearchVisible: true };
  },

  /**
   * Clicks Reset Filters from the no-results state.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{clicked: boolean}>}
   */
  async clickNoResultsResetFilters(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.clickNoResultsResetFiltersButton();

    return { clicked: true };
  },

  /**
   * Clicks a filter checkbox by its label text.
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} option - The label text of the checkbox (e.g. 'Iberia')
   * @returns {Promise<{filtered: boolean, option: string}>}
   */
  async filterAirlineByCheckboxOption(page, option) {
    if (!page) throw new Error('page is required');
    if (typeof option !== 'string' || !option.trim()) {
      throw new Error(`option must be a non-empty string, got: ${typeof option}`);
    }
    const resultsPage = getPageObject(page, ResultsPage);

    await resultsPage.clickViewMoreAirlinesExpanderIfVisible(); // Ensure all airline options are visible before filtering
    await resultsPage.filterByCheckboxOption(option);
    return { filtered: true, option };
  },

  /**
   * Selects a filter option checkbox by label within a named filter section (e.g. "Car Class"),
   * handling that section's own "View more" expansion if the option isn't rendered yet.
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} optionLabel - The checkbox label text, e.g. "Van"
   * @param {string} filterTitle - The filter section's title, e.g. "Car Class"
   * @returns {Promise<{selected: boolean, optionLabel: string, filterTitle: string}>}
   */
  async selectFilterSectionOption(page, optionLabel, filterTitle) {
    if (!page) throw new Error('page is required');
    if (typeof optionLabel !== 'string' || !optionLabel.trim()) {
      throw new Error(`optionLabel must be a non-empty string, got: ${typeof optionLabel}`);
    }
    if (typeof filterTitle !== 'string' || !filterTitle.trim()) {
      throw new Error(`filterTitle must be a non-empty string, got: ${typeof filterTitle}`);
    }
    const resultsPage = getPageObject(page, ResultsPage);

    const result = await resultsPage.clickFilterSectionOptionByLabel(filterTitle, optionLabel);
    return { selected: result.clicked || result.wasAlreadyChecked, optionLabel, filterTitle };
  },

  /**
   * Removes an already-applied filter option checkbox within a named filter section. The checkbox
   * is a plain toggle, so clicking the same option again (via the same
   * clickFilterSectionOptionByLabel mechanism as selectFilterSectionOption) unchecks it.
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} optionLabel - The checkbox label text to remove, e.g. "SUV"
   * @param {string} filterTitle - The filter section's title, e.g. "Car Class"
   * @returns {Promise<{removed: boolean, optionLabel: string, filterTitle: string}>}
   */
  async removeFilterSectionOption(page, optionLabel, filterTitle) {
    if (!page) throw new Error('page is required');
    if (typeof optionLabel !== 'string' || !optionLabel.trim()) {
      throw new Error(`optionLabel must be a non-empty string, got: ${typeof optionLabel}`);
    }
    if (typeof filterTitle !== 'string' || !filterTitle.trim()) {
      throw new Error(`filterTitle must be a non-empty string, got: ${typeof filterTitle}`);
    }
    const resultsPage = getPageObject(page, ResultsPage);

    await resultsPage.clickFilterSectionOptionByLabel(filterTitle, optionLabel);
    return { removed: true, optionLabel, filterTitle };
  },

};

module.exports = Results;
