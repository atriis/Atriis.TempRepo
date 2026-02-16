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
    
    const resultsPage = new ResultsPage(page);
    await resultsPage.waitForAddToTripText();
    await resultsPage.clickFirstAddToTripButton();
    return { clicked: true };
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
    
    const resultsPage = new ResultsPage(page);
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
    
    const resultsPage = new ResultsPage(page);
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
   * Verifies that Out of Policy indicators are visible in results page.
   * Used when validating travel policy enforcement on results.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   */
  async verifyOutOfPolicyIndicatorVisibleInResults(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const commonPage = new CommonPage(page);
    await commonPage.waitForOOPVisible();
    await expect(page.locator(SELECTORS.OOP_INFO)).toBeVisible();
  },

  /**
   * Verifies that Out of Policy indicators are not visible in results page.
   * Used when validating in-policy options on results.
   * @param {import('playwright').Page} page - Playwright page instance
   */
  async verifyOutOfPolicyIndicatorNotVisibleInResults(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const commonPage = new CommonPage(page);
    await commonPage.waitForOOPNotVisible();
    await expect(page.locator(SELECTORS.OOP_INFO)).toBeHidden();
  },

  /**
   * Hovers over the Out of Policy info icon and validates tooltip text.
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedText - The expected tooltip text
   */
  async verifyOutOfPolicyTooltipInResultsPage(page, expectedText) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }
    
    const resultsPage = new ResultsPage(page);
    await resultsPage.waitForAddToTripText(); // Ensure results are loaded before checking OOP tooltip
    const commonPage = new CommonPage(page);
    await commonPage.hoverOverOOPInfoIcon();
    const actualText = await commonPage.getOOPTooltipText();
    expect(actualText).toBe(expectedText);
  },

  // ===== FLIGHT CAPACITY RESTRICTION MODAL =====

  /**
   * Asserts that the Flight Capacity Restriction modal is visible.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   */
  async assertFlightCapacityRestrictionModalIsVisible(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    await expect(page.getByRole("heading", {
      name: "Flight Capacity Restriction",
      level: 2,
    })).toBeVisible({ timeout: 30000 });
  },

  /**
   * Validates Flight Capacity Restriction modal is visible and clicks 'Go Back'.
   * Used when booking exceeds traveler capacity and user wants to return to results.
   * @param {import('playwright').Page} page - Playwright page instance
   */
  async validateFlightCapacityModalIsVisibleInResultsAndClickGoBack(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const commonPage = new CommonPage(page);
    const resultsPage = new ResultsPage(page);
    await Results.assertFlightCapacityRestrictionModalIsVisible(page);
    await commonPage.clickGoBackOnFlightCapacityRestrictionPopUp();
    await resultsPage.waitForAddToTripText(); // Wait for results to reload after going back
  },

  /**
   * Validates Flight Capacity Restriction modal is visible and clicks 'Proceed Anyway'.
   * Used when booking exceeds traveler capacity but user wants to continue.
   * @param {import('playwright').Page} page - Playwright page instance
   */
  async validateFlightCapacityModalIsVisibleAfterAddToCart(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const commonPage = new CommonPage(page);
    const resultsPage = new ResultsPage(page);
    await resultsPage.clickFirstAddToTripButton(); // Ensure results are loaded before checking modal
    await Results.assertFlightCapacityRestrictionModalIsVisible(page);
    await commonPage.clickProceedAnywayOnFlightCapacityRestrictionPopUp();
    await Results.clickProceedConflictQuoteModal(page);
  },

  /**
   * Hovers over the Out of Policy info icon and validates tooltip text.
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedText - The expected tooltip text
   */
  async hoverOverResultsOOPInfoAndVerifyTooltipTextIs(page, expectedText) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }
    
    const resultsPage = new ResultsPage(page);
    await resultsPage.waitForAddToTripText(); // Ensure results are loaded before checking OOP tooltip
    const commonPage = new CommonPage(page);
    await commonPage.waitForOOPVisible();
    await commonPage.hoverOverOOPInfoIcon();
    const actualText = await commonPage.getOOPTooltipText();
    expect(actualText).toBe(expectedText);
  },
};

module.exports = Results;
