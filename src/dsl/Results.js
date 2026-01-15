const ResultsPage = require('../pages/ResultsPage');

/**
 * Results DSL
 *
 * High-level actions related to generic results screens.
 * Describes WHAT the user does, not HOW the UI works.
 */
const Results = {
  /** Waits for the "Add to trip" button and clicks the first available option. */
  async waitAndClickAddToTripButton(page) {
    const resultsPage = new ResultsPage(page);

    await resultsPage.waitForAddToTripText();
    await resultsPage.clickFirstAddToTripButton();

    return { clicked: true };
  },

  /** Waits for the "Select" button and clicks the first available option. */
  async waitAndClickSelectButton(page) {
    const resultsPage = new ResultsPage(page);

    await resultsPage.waitForSelectText();
    await resultsPage.clickFirstSelectButton();

    return { clicked: true };
  },

    /**
   * Handles the "Conflicting Quotes" modal if it appears.
   * Safe to call even if no modal is shown.
   */
  async clickProceedConflictQuoteModal(page) {
    const resultsPage = new ResultsPage(page);

    const proceeded = await resultsPage.handleConflictQuoteModalIfVisible();
    return { proceeded };
  },
};

module.exports = Results;