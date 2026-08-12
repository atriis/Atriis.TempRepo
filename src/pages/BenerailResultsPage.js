const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const { ResultsPage } = require("@pages/ResultsPage");
const { SELECTORS: COMMON_SELECTORS } = require("@pages/CommonPage");

/**
 * Page Object for Benerail (EU Rail) results.
 * Contains only UI-level interactions specific to Benerail — shared results actions
 * (Select/Add to trip, no-results detection) remain on ResultsPage.
 */

const SELECTORS = {
  // eu-rail-preview.vue's root class (bound on <ticket-layout>) — one per Benerail result card.
  RESULT_CARD: ".eu-rail-preview",
  // Both the departure and arrival blocks share this wrapper class; departure renders first in
  // DOM order (see eu-rail-preview.vue's journey-details section), so .first() on a card's
  // matches is the departure time, not the arrival time.
  RESULT_TIME_BLOCK: ".journey-duration-container p.has-text-weight-bold",
  // eu-rail-preview.vue renders one .journey-change-dot per rail.railChanges entry (only when
  // length > 1) inside .journey-timeline, and the "N changes"/"Direct" label in a sibling
  // .change-text span — both driven off the same rail.railChanges array. For exactly one change,
  // eu-rail-preview.scss draws the single dot as a CSS ::after pseudo-element on .journey-timeline
  // itself (its "Default behavior" comment) instead of a real .journey-change-dot span — see
  // getJourneySummaryForResultAtIndex.
  JOURNEY_TIMELINE: ".journey-timeline",
  JOURNEY_CHANGE_DOTS: ".journey-change-dot",
  JOURNEY_CHANGE_TEXT: ".change-text",
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
  // eu-rail-preview.vue renders an alternative's OOP badge with app-oop-badge's `isIconOnly` prop
  // (the only product using that variant) — its shield icon is the el-tooltip trigger directly,
  // unlike the default OOP badge elsewhere in the app where a separate info icon triggers the
  // tooltip (see CommonPage.getOOPInfoIcon). Same root class as CommonPage.OOP_INFO either way.
  ALTERNATIVE_OOP_SHIELD_ICON: `${COMMON_SELECTORS.OOP_INFO} .shield-icon`,
  // app-oop-badge.vue's violations-list content — identical markup between the icon-only and
  // default badge variants, so this reuses CommonPage.OOP_TOOLTIP_TEXT's value. Read directly
  // rather than via CommonPage.getOOPTooltipText, whose internal visibility wait gates on the info
  // icon and never resolves for the icon-only variant (see the method below).
  OOP_TOOLTIP_TEXT: `li${COMMON_SELECTORS.OOP_TOOLTIP_TEXT}`,
  // Journey Details panel (eu-rail-preview.vue's el-dialog wrapping eu-rail-journey-details.vue),
  // scoped to :visible since every result card mounts its own instance and hidden ones can linger.
  JOURNEY_DETAILS_DIALOG: ".el-dialog:has(.eu-rail-journey-details):visible",
  // eu-rail-timeline.vue: one .rail-timeline-item.departure/.arrival per route-details leg. .first()
  // on departure / .last() on arrival covers both a direct journey (exactly one of each) and a
  // journey with changes (multiple legs) — the overall journey's start/end times and stations.
  JOURNEY_DETAILS_DEPARTURE_ITEM: ".eu-rail-timeline .rail-timeline-item.departure",
  JOURNEY_DETAILS_ARRIVAL_ITEM: ".eu-rail-timeline .rail-timeline-item.arrival",
  JOURNEY_DETAILS_STATION_TEXT: ".is-capitalized.header",
  JOURNEY_DETAILS_TIME_TEXT: ".railSegment-hour-container.header",
  // eu-rail-journey-details.vue's heading, e.g. "Direct - Travel Time : 1h 45m" or "2 changes -
  // Travel Time : 2h 10m" — the $t('euRail.travelTime') label ("Travel Time") plus rail.durationText.
  JOURNEY_DETAILS_TRAVEL_TIME_TEXT: ".eu-rail-heading h5",
  JOURNEY_DETAILS_CLOSE_BUTTON: ".el-dialog__headerbtn",
  // eu-rail-results.vue's app-breadcrumb — first item is the "Search" link back to the trip
  // search page (see FlightResultsPage.RESULTS_BREADCRUMB_SEARCH_LINK for the same pattern).
  RESULTS_BREADCRUMB_SEARCH_LINK: ".eu-rail-results .breadcrumb li:first-child a",
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
   * Gets the first Benerail result card (eu-rail-preview.vue).
   * @returns {Locator}
   */
  getFirstResultCard() {
    return this.page.locator(SELECTORS.RESULT_CARD).first();
  }

  /**
   * Counts how many Benerail result cards are currently rendered. "Show Later Departures"
   * appends newly-loaded results to the end of this list (eu-rail.store.ts's loadLaterRails
   * dispatches `appendRailSegments`, not a replace) rather than refreshing it in place, so this
   * count is what identifies where the newly-opened later departures start.
   * @returns {Promise<number>}
   */
  async getResultCardCount() {
    return this.page.locator(SELECTORS.RESULT_CARD).count();
  }

  /**
   * Reads the departure time displayed on the Benerail result card at the given index (e.g.
   * "14:32" or "2:32 PM", depending on the user's time-format setting). Scrolls the card into
   * view first since newly-appended later/earlier results render below the fold.
   * @param {number} [index=0]
   * @param {number} [timeout=60000]
   * @returns {Promise<string>} The raw displayed departure time text
   */
  async getDepartureTimeTextForResultAtIndex(index = 0, timeout = 60000) {
    const card = this.page.locator(SELECTORS.RESULT_CARD).nth(index);
    await card.waitFor({ state: "visible", timeout });
    await card.scrollIntoViewIfNeeded();
    const departureTime = card.locator(SELECTORS.RESULT_TIME_BLOCK).first();
    await departureTime.waitFor({ state: "visible", timeout });
    return ((await departureTime.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  /**
   * Reads the departure time displayed on the first Benerail result card. Used as the initial
   * baseline before any "Show Later Departures" / "Show Earlier Departures" click.
   * @param {number} [timeout=60000]
   * @returns {Promise<string>} The raw displayed departure time text
   */
  async getFirstResultDepartureTimeText(timeout = 60000) {
    return this.getDepartureTimeTextForResultAtIndex(0, timeout);
  }

  /**
   * Reads the arrival time displayed on the Benerail result card at the given index. Mirrors
   * getDepartureTimeTextForResultAtIndex, but reads the second RESULT_TIME_BLOCK match (see that
   * selector's comment — departure renders first in DOM order, arrival second).
   * @param {number} [index=0]
   * @param {number} [timeout=60000]
   * @returns {Promise<string>} The raw displayed arrival time text
   */
  async getArrivalTimeTextForResultAtIndex(index = 0, timeout = 60000) {
    const card = this.page.locator(SELECTORS.RESULT_CARD).nth(index);
    await card.waitFor({ state: "visible", timeout });
    await card.scrollIntoViewIfNeeded();
    const arrivalTime = card.locator(SELECTORS.RESULT_TIME_BLOCK).nth(1);
    await arrivalTime.waitFor({ state: "visible", timeout });
    return ((await arrivalTime.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  /**
   * Reads the arrival time displayed on the first Benerail result card.
   * @param {number} [timeout=60000]
   * @returns {Promise<string>} The raw displayed arrival time text
   */
  async getFirstResultArrivalTimeText(timeout = 60000) {
    return this.getArrivalTimeTextForResultAtIndex(0, timeout);
  }

  /**
   * Opens the Journey Details panel for the Benerail result card at the given index. Clicks the
   * card's "Journey Details" text (eu-rail-preview.vue renders exactly one visible instance per
   * card — a mobile OR desktop variant via v-if, never both) and waits for its dialog to open.
   * @param {number} [index=0]
   * @param {number} [timeout=15000]
   * @throws {Error} If the button or the resulting dialog never appear
   */
  async openJourneyDetailsForResultAtIndex(index = 0, timeout = 15000) {
    try {
      const card = this.page.locator(SELECTORS.RESULT_CARD).nth(index);
      await card.waitFor({ state: "visible", timeout });
      await card.getByText("Journey Details", { exact: true }).click({ timeout });
      await this.page.locator(SELECTORS.JOURNEY_DETAILS_DIALOG).waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[BenerailResultsPage.openJourneyDetailsForResultAtIndex] Could not open the Journey Details ` +
        `panel for the Benerail result at index ${index}. Original: ${err.message}`
      );
    }
  }

  /**
   * Gets the currently open Journey Details dialog.
   * @returns {Locator}
   */
  getJourneyDetailsDialog() {
    return this.page.locator(SELECTORS.JOURNEY_DETAILS_DIALOG);
  }

  /**
   * Reads the departure or arrival station name from the open Journey Details panel
   * (eu-rail-timeline.vue already renders it lowercase, e.g. "bruxelles-midi (be)").
   * @param {object} [options]
   * @param {"departure"|"arrival"} [options.leg="departure"]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<string>}
   */
  async getJourneyDetailsStationText({ leg = "departure", timeout = 10000 } = {}) {
    const dialog = this.getJourneyDetailsDialog();
    const itemSelector = leg === "arrival" ? SELECTORS.JOURNEY_DETAILS_ARRIVAL_ITEM : SELECTORS.JOURNEY_DETAILS_DEPARTURE_ITEM;
    const items = dialog.locator(itemSelector);
    const station = leg === "arrival" ? items.last() : items.first();
    const stationText = station.locator(SELECTORS.JOURNEY_DETAILS_STATION_TEXT);
    await stationText.waitFor({ state: "visible", timeout });
    return ((await stationText.textContent()) ?? "").replace(/\s+/g, " ").trim();
  }

  /**
   * Reads the departure and arrival times from the open Journey Details panel.
   * @param {number} [timeout=10000]
   * @returns {Promise<{departureRaw: string, arrivalRaw: string}>}
   */
  async getJourneyDetailsTimes(timeout = 10000) {
    const dialog = this.getJourneyDetailsDialog();
    const departureTime = dialog.locator(SELECTORS.JOURNEY_DETAILS_DEPARTURE_ITEM).first().locator(SELECTORS.JOURNEY_DETAILS_TIME_TEXT);
    const arrivalTime = dialog.locator(SELECTORS.JOURNEY_DETAILS_ARRIVAL_ITEM).last().locator(SELECTORS.JOURNEY_DETAILS_TIME_TEXT);
    await departureTime.waitFor({ state: "visible", timeout });
    await arrivalTime.waitFor({ state: "visible", timeout });
    const departureRaw = ((await departureTime.textContent()) ?? "").replace(/\s+/g, " ").trim();
    const arrivalRaw = ((await arrivalTime.textContent()) ?? "").replace(/\s+/g, " ").trim();
    return { departureRaw, arrivalRaw };
  }

  /**
   * Reads the "Travel Time" heading text from the open Journey Details panel (e.g. "Direct -
   * Travel Time : 1h 45m").
   * @param {number} [timeout=10000]
   * @returns {Promise<string>}
   */
  async getJourneyDetailsTravelTimeText(timeout = 10000) {
    const dialog = this.getJourneyDetailsDialog();
    const travelTimeText = dialog.locator(SELECTORS.JOURNEY_DETAILS_TRAVEL_TIME_TEXT);
    try {
      await travelTimeText.waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[BenerailResultsPage.getJourneyDetailsTravelTimeText] Could not find the "Travel Time" ` +
        `heading in the open Benerail Journey Details panel. Original: ${err.message}`
      );
    }
    return ((await travelTimeText.textContent()) ?? "").replace(/\s+/g, " ").trim();
  }

  /**
   * Closes the open Journey Details panel and waits for it to hide.
   * @param {number} [timeout=10000]
   */
  async closeJourneyDetailsDialog(timeout = 10000) {
    const dialog = this.getJourneyDetailsDialog();
    await dialog.locator(SELECTORS.JOURNEY_DETAILS_CLOSE_BUTTON).click({ timeout });
    await dialog.waitFor({ state: "hidden", timeout });
  }

  /**
   * Reads the journey-summary "N changes"/"Direct" text, its computed text color, and the
   * rendered change-dot count for the Benerail result card at the given index
   * (eu-rail-preview.vue's journey-timeline section). For a single change, the dot is a CSS
   * ::after pseudo-element on .journey-timeline rather than a real .journey-change-dot span —
   * invisible to a Playwright locator count — so this counts that state as 1 rather than 0 (see
   * JOURNEY_TIMELINE above).
   * @param {number} [index=0]
   * @param {number} [timeout=60000]
   * @returns {Promise<{changeText: string, changeTextColor: string, dotCount: number}>}
   */
  async getJourneySummaryForResultAtIndex(index = 0, timeout = 60000) {
    const card = this.page.locator(SELECTORS.RESULT_CARD).nth(index);
    await card.waitFor({ state: "visible", timeout });
    const changeTextEl = card.locator(SELECTORS.JOURNEY_CHANGE_TEXT).first();
    const [rawChangeText, changeTextColor, timelineClass, explicitDotCount] = await Promise.all([
      changeTextEl.textContent(),
      changeTextEl.evaluate((el) => window.getComputedStyle(el).color),
      card.locator(SELECTORS.JOURNEY_TIMELINE).first().getAttribute("class"),
      card.locator(SELECTORS.JOURNEY_CHANGE_DOTS).count(),
    ]);
    const changeText = (rawChangeText ?? "").replace(/\s+/g, " ").trim();
    const hasCssSingleDot = !(timelineClass ?? "").includes("has-multiple-changes") && !(timelineClass ?? "").includes("no-changes");
    const dotCount = hasCssSingleDot ? 1 : explicitDotCount;
    return { changeText, changeTextColor, dotCount };
  }

  /**
   * Waits for new result cards to be appended after clicking "Show Later Departures" /
   * "Show Earlier Departures" — the list grows in place, so the Select button that
   * clickShowLaterDeparturesButton waits on is already present before and after the click and
   * proves nothing about the new data having arrived.
   * @param {number} previousCardCount - The result-card count read before the click
   * @param {number} [timeout=20000]
   */
  async waitForNewResultCardsAppended(previousCardCount, timeout = 20000) {
    await expect
      .poll(() => this.getResultCardCount(), { timeout, message: "Timed out waiting for new Benerail result cards to be appended after clicking Show Later Departures" })
      .toBeGreaterThan(previousCardCount);
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
   * Gets the "Show Earlier Departures" navigation button on Benerail (EU Rail) results.
   * No data-testid on this control — role-based lookup matches the translated label.
   * @returns {Locator}
   */
  getShowEarlierDeparturesButton() {
    return this.page.getByRole("button", { name: "Show Earlier Departures" });
  }

  /** Clicks "Show Earlier Departures" and waits for the outbound results to refresh */
  async clickShowEarlierDeparturesButton() {
    const button = this.getShowEarlierDeparturesButton();
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
   * Gets the first "more options" alternative row (eu-rail-preview.vue's `.bottom-section-divider`)
   * that is out-of-policy. Filtering on the shield-icon trigger already narrows to rows whose
   * `<app-oop-badge isIconOnly>` rendered (i.e. `alternative.travelPolicyViolations?.length`) — no
   * per-row violation check needed, same pattern as getFirstMoreOptionsRowWithAgreement.
   * @returns {Locator}
   */
  getFirstMoreOptionsRowWithOOP() {
    return this.page
      .locator(SELECTORS.MORE_OPTIONS_ROW)
      .filter({ has: this.page.locator(SELECTORS.ALTERNATIVE_OOP_SHIELD_ICON) })
      .first();
  }

  /**
   * Hovers the OOP shield icon on the first out-of-policy alternative revealed by "More Options",
   * opening its el-tooltip. eu-rail-preview.vue's icon-only app-oop-badge has no separate info
   * icon, so the shield icon itself must be hovered (see ALTERNATIVE_OOP_SHIELD_ICON).
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   */
  async hoverFirstOOPShieldIconInMoreOptionsResults({ timeout = 15000 } = {}) {
    const trigger = this.getFirstMoreOptionsRowWithOOP().locator(SELECTORS.ALTERNATIVE_OOP_SHIELD_ICON).first();
    await trigger.waitFor({ state: "visible", timeout });
    await trigger.hover();
  }

  /**
   * Reads the currently open OOP tooltip's violation-list text after
   * hoverFirstOOPShieldIconInMoreOptionsResults. Does not use CommonPage.getOOPTooltipText — its
   * internal waitForOOPTooltipVisible() gates on the info icon, which the icon-only badge variant
   * never renders (see ALTERNATIVE_OOP_SHIELD_ICON).
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<string>}
   */
  async getOOPTooltipTextInMoreOptionsResults({ timeout = 10000 } = {}) {
    const tooltipText = this.page.locator(SELECTORS.OOP_TOOLTIP_TEXT);
    await tooltipText.first().waitFor({ state: "visible", timeout });
    return ((await tooltipText.first().textContent()) ?? "").trim();
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

  /**
   * Reads the text of the results-page breadcrumb's first item (the "Search" link).
   * @param {object} [options]
   * @param {number} [options.timeout=30000]
   * @returns {Promise<string>}
   */
  async getBreadcrumbSearchLinkText({ timeout = 30000 } = {}) {
    const link = this.page.locator(SELECTORS.RESULTS_BREADCRUMB_SEARCH_LINK).first();
    await link.waitFor({ state: "visible", timeout });
    return ((await link.textContent()) ?? "").trim();
  }
}

module.exports = { BenerailResultsPage };
