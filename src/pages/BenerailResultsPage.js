const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const { ResultsPage } = require("@pages/ResultsPage");

/**
 * Page Object for Benerail (EU Rail) results.
 * Contains only UI-level interactions specific to Benerail — shared results actions
 * (Select/Add to trip, no-results detection) remain on ResultsPage.
 */

const SELECTORS = {
  // eu-rail-preview.vue's static hint (agreements-in-additional-indication) — rendered whenever a
  // result's alternatives contain a corporate/agency agreement fare.
  MORE_OPTIONS_AGREEMENT_INDICATION_ICON: ".agreements-in-additional-indication .agreement-img",
  // Each "More Options" alternative row (eu-rail-preview.vue's v-for over rail.alternatives).
  MORE_OPTIONS_ROW: ".bottom-section-divider",
  // ticket-agreements.vue's tooltip trigger — only renders when that alternative has an agreement.
  AGREEMENT_TOOLTIP_TRIGGER: ".ticket-agreement > div",
  AGREEMENT_TOOLTIP_DESCRIPTION: ".agreement-tooltip-list .agreement-tooltip__description",
  AGREEMENT_TOOLTIP_LOGO: ".agreement-tooltip-list .agreement-tooltip__icon img",
  // Matches the app's own typo in ticket-agreements.vue (`--palceholder`, not "--placeholder") —
  // rendered instead of a logo image when the agreement has no logo URL configured.
  AGREEMENT_TOOLTIP_LOGO_PLACEHOLDER: ".agreement-tooltip-list .agreement-tooltip__icon--palceholder",
};

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
   * Gets the "More Options" toggle for the first visible Benerail (EU Rail) result — expands
   * that result's alternative fares.
   * @returns {Locator}
   */
  getFirstMoreOptionsButton() {
    return this.page.getByRole("button", { name: "More Options" }).first();
  }

  /**
   * Expands the alternative fares for the first visible Benerail result and waits for its
   * alternative's "Select" button to render, without selecting it. Polls the total "Select"
   * button count rather than a fixed index, since expanding the first result inserts its
   * alternative row in the middle of the DOM order, not at the end.
   */
  async expandFirstResultMoreOptions() {
    const moreOptionsButton = this.getFirstMoreOptionsButton();
    await moreOptionsButton.waitFor({ state: "visible", timeout: 60000 });
    const selectButtons = this.page.getByRole("button", { name: "Select" });
    const selectButtonCountBeforeExpand = await selectButtons.count();
    await moreOptionsButton.click();

    await expect.poll(() => selectButtons.count(), { timeout: 15000 }).toBeGreaterThan(
      selectButtonCountBeforeExpand
    );
  }

  /**
   * Checks if the "Contract fares available in options" handshake badge is visible for at least
   * one Benerail result. The badge (eu-rail-preview.vue's agreements-in-additional-indication) is
   * a hint rendered whenever a result's alternatives contain a corporate/agency agreement fare.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<boolean>}
   */
  async isHandshakeBadgeVisibleInMoreOptionsResults({ timeout = 15000 } = {}) {
    const badges = this.page.locator(SELECTORS.MORE_OPTIONS_AGREEMENT_INDICATION_ICON);
    try {
      await badges.first().waitFor({ state: "attached", timeout });
    } catch {
      return false;
    }
    const count = await badges.count();
    for (let index = 0; index < count; index += 1) {
      if (await badges.nth(index).isVisible()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Gets the first "more options" alternative row (eu-rail-preview.vue's `.bottom-section-divider`)
   * that carries a corporate/agency agreement. `<ticket-agreements>` only renders its tooltip
   * trigger (`.ticket-agreement > div`) when that alternative's fare has an agreement, so filtering
   * on it already narrows to agreement-bearing rows — no per-row agreement check needed.
   * @returns {Locator}
   */
  getFirstMoreOptionsRowWithAgreement() {
    return this.page
      .locator(SELECTORS.MORE_OPTIONS_ROW)
      .filter({ has: this.page.locator(SELECTORS.AGREEMENT_TOOLTIP_TRIGGER) })
      .first();
  }

  /**
   * Hovers the agreement (handshake) logo on the first agreement-bearing alternative revealed by
   * "More Options", opening its el-tooltip.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   */
  async hoverFirstAgreementLogoInMoreOptionsResults({ timeout = 15000 } = {}) {
    const trigger = this.getFirstMoreOptionsRowWithAgreement().locator(SELECTORS.AGREEMENT_TOOLTIP_TRIGGER).first();
    await trigger.waitFor({ state: "visible", timeout });
    await trigger.hover();
  }

  /**
   * Reads the currently open agreement tooltip's text (ticket-agreements.vue's el-tooltip content,
   * teleported to the document body — same markup/selector as CarResultsPage.getAgreementTooltipText).
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<string>}
   */
  async getAgreementTooltipText({ timeout = 10000 } = {}) {
    const tooltipDescriptions = this.page.locator(SELECTORS.AGREEMENT_TOOLTIP_DESCRIPTION);
    await tooltipDescriptions.first().waitFor({ state: "visible", timeout });

    const count = await tooltipDescriptions.count();
    const lines = [];
    for (let index = 0; index < count; index += 1) {
      const text = ((await tooltipDescriptions.nth(index).textContent()) || "").replace(/\s+/g, " ").trim();
      if (text) {
        lines.push(text);
      }
    }
    return lines.join(" | ");
  }

  /**
   * Reads the agreement logo rendered inside the currently open agreement tooltip — same
   * markup/selectors as CarResultsPage.getAgreementTooltipLogoDetails (shared ticket-agreements.vue
   * component). Read-only — the caller owns the assertion.
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<{visible: boolean, src: string, alt: string, placeholderOnly: boolean}>}
   *   `placeholderOnly` is true when no logo image appeared but the generic handshake fallback did.
   */
  async getAgreementTooltipLogoDetails({ timeout = 10000 } = {}) {
    const logo = this.page.locator(SELECTORS.AGREEMENT_TOOLTIP_LOGO).first();

    try {
      await logo.waitFor({ state: "visible", timeout });
    } catch {
      const placeholderOnly = await this.page
        .locator(SELECTORS.AGREEMENT_TOOLTIP_LOGO_PLACEHOLDER)
        .first()
        .isVisible();
      return { visible: false, src: "", alt: "", placeholderOnly };
    }

    return {
      visible: true,
      src: (await logo.getAttribute("src")) ?? "",
      alt: (await logo.getAttribute("alt")) ?? "",
      placeholderOnly: false,
    };
  }

  /**
   * Clicks "Select" on the first agreement-bearing alternative revealed by "More Options".
   * Same teardown-confirmation guard as selectLastResultAlternativeFare: this transition is
   * purely client-side, so a click landing mid-transition can be silently swallowed.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   */
  async selectFirstAgreementFareFromMoreOptions({ timeout = 15000 } = {}) {
    const row = this.getFirstMoreOptionsRowWithAgreement();
    await row.waitFor({ state: "visible", timeout });
    const selectButton = row.getByRole("button", { name: "Select" });
    await selectButton.waitFor({ state: "visible", timeout });
    const rowHandle = await row.elementHandle();
    await selectButton.click();

    if (rowHandle) {
      await rowHandle.waitForElementState("hidden", { timeout: 20000 }).catch(() => {});
    }
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
