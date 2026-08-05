const { getPageObject } = require("@utils/pageObjectCache");
const { ResultsPage } = require("@pages/ResultsPage");

/**
 * Page Object for Benerail (EU Rail) results.
 * Contains only UI-level interactions specific to Benerail — shared results actions
 * (Select/Add to trip, no-results detection) remain on ResultsPage.
 */

class BenerailResultsPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Clicks the first "Select" button, guarding both sides of the click against the same
   * multi-leg-continuation race: the results list can pass Playwright's visibility check
   * slightly before its component is fully interactive (click handlers not yet wired), and a
   * click landing in that window is silently lost, leaving the caller waiting forever for
   * "Add to trip". Reserved for continuations that immediately follow another leg's selection
   * (e.g. a Benerail round trip's inbound leg right after the outbound was chosen).
   */
  async clickFirstSelectButtonAndConfirmTransition(timeout = 20000) {
    // The transition here is purely client-side (no request to wait on), so networkidle
    // resolves immediately and gives no protection — confirmed empirically: 0/4 runs passed with
    // it vs. 3/3 and 4/4 with a fixed settle delay (AB#81914 fix-loop finding).
    await this.page.waitForTimeout(2000);
    const resultsPage = getPageObject(this.page, ResultsPage);
    const button = resultsPage.getSelectButton();
    const handle = await button.elementHandle();
    await button.click();
    if (handle) {
      await handle.waitForElementState("hidden", { timeout }).catch(() => {});
    }
  }

  /**
   * Gets the "Show Later Departures" navigation button on Benerail (EU Rail) results.
   * No data-testid on this control — role-based lookup matches the translated label.
   * @returns {Locator}
   */
  getShowLaterDeparturesButton() {
    return this.page.getByRole("button", { name: "Show Later Departures" });
  }

  /** Clicks "Show Later Departures" and waits for the outbound results to refresh */
  async clickShowLaterDeparturesButton() {
    const button = this.getShowLaterDeparturesButton();
    await button.waitFor({ state: "visible", timeout: 60000 });
    await button.click();
    const resultsPage = getPageObject(this.page, ResultsPage);
    await resultsPage.waitForSelectText();
  }

  /**
   * Gets the "More Options" toggle for the last visible Benerail (EU Rail) result — expands
   * that result's alternative fares.
   * @returns {Locator}
   */
  getLastMoreOptionsButton() {
    return this.page.getByRole("button", { name: "More Options" }).last();
  }

  /**
   * Expands the alternative fares for the last visible Benerail result, then selects the first
   * revealed alternative. The alternative's own "Select" button renders after the main result's
   * in DOM order once expanded, so it becomes the last "Select"-named button on the page.
   */
  async selectLastResultAlternativeFare() {
    const moreOptionsButton = this.getLastMoreOptionsButton();
    await moreOptionsButton.waitFor({ state: "visible", timeout: 60000 });
    // Captured before clicking so we can later confirm this exact node was torn down — the
    // outbound results list (this button included) is replaced wholesale once the alternative
    // fare is selected, and that replacement is not always preceded by network activity, so
    // networkidle can resolve before Vue actually swaps the DOM in a purely client-side update.
    const moreOptionsHandle = await moreOptionsButton.elementHandle();
    await moreOptionsButton.click();

    const alternativeSelectButton = this.page.getByRole("button", { name: "Select" }).last();
    await alternativeSelectButton.waitFor({ state: "visible", timeout: 15000 });
    await alternativeSelectButton.click();

    // Confirm the outbound results list (and the "More Options" button captured above) was
    // actually torn down before returning control to the caller, which immediately selects the
    // inbound leg. Without this, a click that lands mid-transition can be silently swallowed,
    // leaving the caller to select from the still-outbound list and stalling on "Add to trip".
    if (moreOptionsHandle) {
      await moreOptionsHandle.waitForElementState("hidden", { timeout: 20000 }).catch(() => {});
    }
  }
}

module.exports = { BenerailResultsPage };
