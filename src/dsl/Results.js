const { getPageObject } = require("@utils/pageObjectCache");
const { ResultsPage } = require("@pages/ResultsPage");
const { CommonPage, SELECTORS } = require("@pages/CommonPage");
const { expect } = require("@playwright/test");

/**
 * Results DSL
 *
 * High-level actions related to generic results screens.
 * Describes WHAT the user does, not HOW the UI works.
 */
const Results = {

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
    
    const commonPage = getPageObject(page, CommonPage);
    await commonPage.waitForOOPNotVisible();
    return await page.locator(SELECTORS.OOP_INFO).first().isHidden();
  },

  // ===== FLIGHT CAPACITY RESTRICTION MODAL =====

  /**
   * Checks if the Flight Capacity Restriction modal is visible.
   * Returns visibility status for validation in step definitions.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<boolean>} True if modal is visible
   */
  async isFlightCapacityRestrictionModalVisible(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const modal = page.getByRole("heading", {
      name: "Flight Capacity Restriction",
      level: 2,
    });
    
    try {
      await modal.waitFor({ state: 'visible', timeout: 30000 });
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

};

module.exports = Results;
