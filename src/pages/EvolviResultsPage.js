const { waitForText } = require("@utils/wait");

/**
 * Page Object for evolvi results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  OUTBOUND_TEXT: "h3",
  SUGGESTED_FARES_TEXT: ".price-container.mb-5 .desc",
  CHEAPEST_SUGGESTED_FARE: ".suggested-btn .app-price",
  // uk-rail-results.vue's results header holds one .data-section per direction — outbound at
  // index 0, inbound at index 1 (the inbound one is v-show'n, so it only renders on screen for a
  // round trip). The leading .suggested-container is a sibling, not a .data-section, so these
  // indexes stay stable.
  RESULTS_DATA_SECTION: ".results-header .data-section",
  // One column per journey inside a direction's .trains-info-container. The grid always reserves
  // 5 columns and pads the missing ones with .is-invisible placeholders (paddedOutboundJourneys /
  // paddedInboundJourneys), which Playwright's :visible correctly rejects (visibility: hidden).
  JOURNEY_COLUMN: ".trains-info-container .train-info:visible",
  // A column renders "Departs" + its h3.time, then "Arrives" + its h3.time — so .first() is the
  // departure time. Desktop prints the raw departureDateTime slice, i.e. 24h "HH:MM".
  JOURNEY_TIME: "h3.time",
  // The price grid: one .main-rows group per fare type, each holding rows of 10 .price-cell
  // columns — 0-4 outbound, 5-9 inbound (uk-rail-results.ts's isOutboundCell), aligned one-to-one
  // with the header's journey columns. Only a group's FIRST row is on screen while the group is
  // collapsed (.price-row-container is max-height: 72px; overflow: hidden until it gets .open), so
  // restricting to :first-child keeps every candidate cell genuinely clickable without having to
  // expand groups first — the remaining groups still give one candidate row each.
  FIRST_PRICE_ROW: ".results .main-rows .price-row-container > .price-row:first-child",
  PRICE_CELL: ".price-cell",
  // A cell offers its fare in one of two shapes, and both carry the same is-clickable/disabled
  // pair, so this matches either:
  //   - a priced cell — app-price.vue has a single root <div class="app-price ...">, so
  //     uk-rail-results.vue's class="price" and :class="{ 'is-clickable', disabled }" land on it;
  //   - an "Any time return" cell, whose fare has no separate inbound price and renders
  //     <p class="select-time">Select Time</p> instead. Clicking it doesn't open a picker — it
  //     builds the return ticket for that journey inline (uk-rail-results.ts's selectReturnTicket),
  //     which is the ONLY way to pick an inbound leg once the outbound is an Anytime Return fare.
  // isClickable already encodes everything that makes a cell selectable right now — not cancelled,
  // not company-disabled and, for an inbound cell, compatible with the outbound already chosen
  // (uk-rail-results.ts's isCellClickable).
  SELECTABLE_FARE_OPTION: ":is(.app-price.price, p.select-time).is-clickable:not(.disabled)",
  // The round-trip header summary above the grid: exactly two .selected-price blocks, outbound
  // then inbound. Each reads "Select outbound"/"Select inbound" until its leg is picked, then
  // "<direction>: HH:MM" plus the fare price — and only then gains .has-price.
  SELECTED_SUMMARY: ".selected-prices > .selected-price",
  SELECTED_SUMMARY_PICKED: ".has-price",
};

/**
 * Guards the 0-based positional arguments the results grid is addressed by, so a bad index fails
 * with the caller's name instead of silently resolving to an empty locator.
 */
function assertIndex(methodName, argumentName, value) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(
      `[EvolviResultsPage.${methodName}] "${argumentName}" must be a non-negative integer, got: ${value}`,
    );
  }
}

class EvolviResultsPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Confirms the Evolvi results page is loaded.
   *
   * Waits until the "Outbound" text is visible, which indicates
   * the outbound results section has been rendered.
   */
  async waitForOutboundText() {
    await waitForText(
      this.page,
      SELECTORS.OUTBOUND_TEXT,
      "Outbound",
      60000,
    );
  }

  /**
   * Waits until suggested fares are visible.
   *
   * The "Suggested fares" text only appears once fares
   * have finished loading and are ready for interaction.
   */
  async waitForSuggestedFaresText() {
    await waitForText(
      this.page,
      SELECTORS.SUGGESTED_FARES_TEXT,
      "Suggested fares",
      60000,
    );
  }

  /** Clicks the cheapest suggested fare option */
  async clickCheapestSuggestedFareOption() {
    await this.page
      .locator(SELECTORS.CHEAPEST_SUGGESTED_FARE)
      .first()
      .click();
  }

  /**
   * Counts the journey columns actually rendered for one direction, i.e. excluding the
   * .is-invisible placeholders the grid pads every direction up to 5 columns with.
   * @param {number} directionIndex - 0 for outbound, 1 for inbound
   * @returns {Promise<number>}
   */
  async getJourneyColumnCount(directionIndex) {
    assertIndex("getJourneyColumnCount", "directionIndex", directionIndex);
    return this.page
      .locator(SELECTORS.RESULTS_DATA_SECTION)
      .nth(directionIndex)
      .locator(SELECTORS.JOURNEY_COLUMN)
      .count();
  }

  /**
   * Reads the departure time displayed on one direction's journey column, e.g. "09:12".
   * @param {number} directionIndex - 0 for outbound, 1 for inbound
   * @param {number} columnIndex - 0-based position of the column within that direction
   * @param {number} [timeout=60000]
   * @returns {Promise<string>} The raw displayed departure time text
   */
  async getJourneyDepartureTimeText(directionIndex, columnIndex, timeout = 60000) {
    assertIndex("getJourneyDepartureTimeText", "directionIndex", directionIndex);
    assertIndex("getJourneyDepartureTimeText", "columnIndex", columnIndex);
    const departureTime = this.page
      .locator(SELECTORS.RESULTS_DATA_SECTION)
      .nth(directionIndex)
      .locator(SELECTORS.JOURNEY_COLUMN)
      .nth(columnIndex)
      .locator(SELECTORS.JOURNEY_TIME)
      .first();
    await departureTime.waitFor({ state: "visible", timeout });
    return ((await departureTime.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  /**
   * Counts the fares currently selectable in one grid column, across every fare-type group's
   * visible row. Zero means that journey cannot be booked right now — the whole column is
   * cancelled/disabled, or (for an inbound column) incompatible with the chosen outbound fare.
   * @param {number} cellIndex - 0-based grid column: 0-4 outbound, 5-9 inbound
   * @returns {Promise<number>}
   */
  async countSelectableFaresInColumn(cellIndex) {
    assertIndex("countSelectableFaresInColumn", "cellIndex", cellIndex);
    return this._selectableFaresInColumn(cellIndex).count();
  }

  /**
   * Clicks the topmost selectable fare in one grid column.
   * @param {number} cellIndex - 0-based grid column: 0-4 outbound, 5-9 inbound
   * @param {number} [timeout=30000]
   */
  async clickFirstSelectableFareInColumn(cellIndex, timeout = 30000) {
    assertIndex("clickFirstSelectableFareInColumn", "cellIndex", cellIndex);
    const fareOption = this._selectableFaresInColumn(cellIndex).first();
    await fareOption.waitFor({ state: "visible", timeout });
    await fareOption.scrollIntoViewIfNeeded();
    await fareOption.click();
  }

  /**
   * Waits until one leg's header summary has switched from its "Select outbound"/"Select inbound"
   * placeholder to the picked state, so its time and price can be read without racing the Vue
   * re-render that follows the fare click.
   * @param {number} summaryIndex - 0 for outbound, 1 for inbound
   * @param {number} [timeout=30000]
   */
  async waitForSelectedSummaryPicked(summaryIndex, timeout = 30000) {
    assertIndex("waitForSelectedSummaryPicked", "summaryIndex", summaryIndex);
    await this.page
      .locator(`${SELECTORS.SELECTED_SUMMARY}:nth-child(${summaryIndex + 1})${SELECTORS.SELECTED_SUMMARY_PICKED}`)
      .waitFor({ state: "visible", timeout });
  }

  /**
   * Reads one leg's header summary text, e.g. "Outbound: 09:12 £54.20".
   * @param {number} summaryIndex - 0 for outbound, 1 for inbound
   * @param {number} [timeout=30000]
   * @returns {Promise<string>} The raw displayed summary text
   */
  async getSelectedSummaryText(summaryIndex, timeout = 30000) {
    assertIndex("getSelectedSummaryText", "summaryIndex", summaryIndex);
    const summary = this.page.locator(SELECTORS.SELECTED_SUMMARY).nth(summaryIndex);
    await summary.waitFor({ state: "visible", timeout });
    return ((await summary.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  /** Every selectable fare sitting in one grid column, top group first. */
  _selectableFaresInColumn(cellIndex) {
    return this.page.locator(
      `${SELECTORS.FIRST_PRICE_ROW} > ${SELECTORS.PRICE_CELL}:nth-child(${cellIndex + 1}) ${SELECTORS.SELECTABLE_FARE_OPTION}`,
    );
  }
}

module.exports = EvolviResultsPage;

