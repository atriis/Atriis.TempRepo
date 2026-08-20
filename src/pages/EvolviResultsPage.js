const { waitForText } = require("@utils/wait");
const { normalizeText } = require("@utils/text");

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
  // Inside a direction's .data-section, `.stations-container` holds that direction's heading —
  // <h3>{{ $t('ukRail.outbound') }}</h3>. Scoped to .stations-container because the journey columns
  // in the same section also render h3s (JOURNEY_TIME below), so a bare "h3" would match a
  // departure time instead.
  RESULTS_SECTION_HEADING: ".stations-container h3",
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

  // ===== SplitTix (split ticket) =====
  //
  // uk-rail-results.vue renders one .main-rows group per fare type, and only the SplitTix group's
  // .title-cell carries the SplitTix glyph (`v-if="priceTypeGroup.title.indexOf('SplitTix') >= 0"`).
  // Anchoring on that glyph is what separates the split-ticket fares from every other fare type
  // without depending on where the group happens to be sorted.
  SPLIT_TICKET_GROUP: ".results .main-rows:has(.title-cell .evolvi-splittix-icon)",
  // The group's clickable title, e.g. "SplitTix Available" (uk-rail-results.ts's
  // formatSplitTixTitle splits the supplier title on its last word, so the head is the label the
  // manual test names and the tail is the fare class).
  SPLIT_TICKET_GROUP_TITLE: ".splittix-title",
  // The info glyph inside a SplitTix group title, scoped by that title's text so a page with more
  // than one SplitTix group still opens the dialog from the group the step names.
  SPLIT_TICKET_TITLE_INFO_ICON: (title) =>
    `.results .main-rows .title-cell:has(.splittix-title:has-text("${title}")) .splittix-helper-symbol`,
  // The "Save with SplitTix" el-dialog openSplitTixDetails() shows. Three dialogs in this view
  // share the .uk-rail-results-dialog class (journey details, SplitTix, flexible policy), so this
  // pins the SplitTix one by the glyph only its header renders.
  SPLIT_TICKET_DIALOG:
    ".uk-rail-results-dialog:visible:has(.el-dialog__header .evolvi-splittix-icon)",
  SPLIT_TICKET_DIALOG_BODY: ".el-dialog__body",
  SPLIT_TICKET_DIALOG_CLOSE: ".el-dialog__headerbtn, .el-dialog__close",
  // A fare cell "highlighted in blue": uk-rail-results.vue puts .blue-bgd on the .price-cell and
  // .blue on its app-price whenever priceDetails.isCheapest, and .blue-bgd is the light-blue cell
  // background the manual test describes (uk-rail-results.scss).
  //
  // Restricted to each group's FIRST .price-row for the same reason FIRST_PRICE_ROW is: a collapsed
  // .price-row-container is `max-height: 72px; overflow: hidden`, and clipped rows still report a
  // bounding box, so `:visible` would happily hand back an unclickable row.
  SPLIT_TICKET_BLUE_CELL:
    ".results .main-rows:has(.title-cell .evolvi-splittix-icon) .price-row-container > .price-row:first-child > .price-cell.blue-bgd",
  // The price inside that cell — the hover/click target. app-price.vue has a single root div, so
  // uk-rail-results.vue's class="price" and :class="{ blue, is-clickable }" all land on it.
  SPLIT_TICKET_BLUE_FARE: ".app-price.price.blue",
  // el-tooltip renders the cell tooltip with popper-class "uk-rail-tooltip" at body level; its
  // content is uk-rail-cell-tooltip-content.vue, whose .info-container block holds the
  // "SplitTix fare selected …" line and the "Saving of <amount>" sub-title.
  SPLIT_TICKET_FARE_TOOLTIP: ".uk-rail-tooltip:visible",
  SPLIT_TICKET_FARE_TOOLTIP_INFO: ".info-container",

  // ===== Fare rules ("Full information") =====
  //
  // Every price cell shares one el-tooltip whose popper-class is "uk-rail-tooltip"
  // (uk-rail-results.vue), and its content — uk-rail-cell-tooltip-content.vue — ends with the
  // "Full information" app-btn (.more-info-btn) that opens the fare rules. The button lives in the
  // body-level popper, OUTSIDE the cell that carries the select-on-click handler, so opening the
  // rules from here does NOT select the fare.
  FARE_TOOLTIP_FULL_INFORMATION_BUTTON: ".uk-rail-tooltip:visible .more-info-btn",
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
   * Reads one direction's heading from the results header, e.g. "Outbound".
   *
   * The default timeout is generous because this is typically the first read after a search is
   * submitted, so it is waiting on the Evolvi results to come back rather than on a re-render.
   *
   * @param {number} sectionIndex - 0 for outbound, 1 for inbound
   * @param {number} [timeout=90000]
   * @returns {Promise<string>} The heading text as rendered
   */
  async getResultsSectionHeadingText(sectionIndex, timeout = 90000) {
    assertIndex("getResultsSectionHeadingText", "sectionIndex", sectionIndex);
    const heading = this.page
      .locator(SELECTORS.RESULTS_DATA_SECTION)
      .nth(sectionIndex)
      .locator(SELECTORS.RESULTS_SECTION_HEADING)
      .first();
    await heading.waitFor({ state: "visible", timeout });
    return normalizeText((await heading.innerText()) ?? "");
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

  // ===== SplitTix (split ticket) =====

  /**
   * Waits until a SplitTix fare group is on the page, so "no blue fare" is never reported when the
   * real problem is "the search came back with no split-ticket fares at all".
   *
   * @param {number} [timeout=60000]
   */
  async _waitForSplitTicketGroup(timeout = 60000) {
    const title = this.page
      .locator(`${SELECTORS.SPLIT_TICKET_GROUP} ${SELECTORS.SPLIT_TICKET_GROUP_TITLE}`)
      .first();
    try {
      await title.waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        "[EvolviResultsPage._waitForSplitTicketGroup] No SplitTix fare group is displayed in the Evolvi " +
          `results (selector: ${SELECTORS.SPLIT_TICKET_GROUP}). The search may have come back without ` +
          `split-ticket fares. Original: ${err.message}`,
      );
    }
  }

  /**
   * Clicks the info glyph next to a SplitTix group title (e.g. "SplitTix Available"), which opens
   * the "Save with SplitTix" dialog, and waits for that dialog to render.
   *
   * @param {string} title - The group title the icon sits next to, e.g. "SplitTix Available"
   * @param {number} [timeout=30000]
   */
  async clickSplitTicketTitleInfoIcon(title, timeout = 30000) {
    if (!title || typeof title !== "string") {
      throw new Error(
        `[EvolviResultsPage.clickSplitTicketTitleInfoIcon] "title" must be a non-empty string, got: ${title}`,
      );
    }
    const icon = this.page.locator(SELECTORS.SPLIT_TICKET_TITLE_INFO_ICON(title)).first();
    try {
      await icon.waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[EvolviResultsPage.clickSplitTicketTitleInfoIcon] No info icon was found next to a "${title}" ` +
          `fare group in the Evolvi results (selector: ${SELECTORS.SPLIT_TICKET_TITLE_INFO_ICON(title)}). ` +
          `Original: ${err.message}`,
      );
    }
    await icon.scrollIntoViewIfNeeded().catch(() => {});
    await icon.click();
    await this.page
      .locator(SELECTORS.SPLIT_TICKET_DIALOG)
      .first()
      .waitFor({ state: "visible", timeout });
  }

  /**
   * Reads the body text of the open "Save with SplitTix" dialog.
   *
   * @param {number} [timeout=30000]
   * @returns {Promise<string>}
   */
  async getSplitTicketDialogText(timeout = 30000) {
    const body = this.page
      .locator(`${SELECTORS.SPLIT_TICKET_DIALOG} ${SELECTORS.SPLIT_TICKET_DIALOG_BODY}`)
      .first();
    await body.waitFor({ state: "visible", timeout });
    return ((await body.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  /**
   * Closes the "Save with SplitTix" dialog and waits for it to go away, so the following steps are
   * not left clicking through the overlay.
   *
   * @param {number} [timeout=15000]
   */
  async closeSplitTicketDialog(timeout = 15000) {
    const dialog = this.page.locator(SELECTORS.SPLIT_TICKET_DIALOG).first();
    const closeButton = dialog.locator(SELECTORS.SPLIT_TICKET_DIALOG_CLOSE).first();
    await closeButton.waitFor({ state: "visible", timeout });
    await closeButton.click();
    await dialog.waitFor({ state: "hidden", timeout });
  }

  /**
   * Hovers the first split-ticket fare highlighted in blue and waits for its fare tooltip to open.
   *
   * @param {number} [timeout=15000]
   */
  async hoverFirstBlueSplitTicketFare(timeout = 15000) {
    const fare = await this._requireFirstBlueSplitTicketFare();
    await fare.scrollIntoViewIfNeeded().catch(() => {});
    await fare.hover();

    const tooltip = this.page.locator(SELECTORS.SPLIT_TICKET_FARE_TOOLTIP).first();
    try {
      await tooltip.waitFor({ state: "visible", timeout });
    } catch {
      // Element Plus mounts the popper on the first pointer-enter, which can lose the race while
      // the results grid is still settling. Re-arm the pointer from a neutral position and retry.
      await this.page.mouse.move(0, 0);
      await this.page.waitForTimeout(300);
      await fare.hover();
      await tooltip.waitFor({ state: "visible", timeout });
    }
  }

  /**
   * Reads the text of the split-ticket fare tooltip's info block — the "SplitTix fare selected …"
   * line plus its "Saving of <amount>" sub-title. Re-hovers first when the tooltip is not open, so
   * consecutive assertion steps can each read it without racing the popper's dismissal.
   *
   * @param {number} [timeout=15000]
   * @returns {Promise<string>}
   */
  async getBlueSplitTicketFareTooltipInfoText(timeout = 15000) {
    const info = this.page
      .locator(`${SELECTORS.SPLIT_TICKET_FARE_TOOLTIP} ${SELECTORS.SPLIT_TICKET_FARE_TOOLTIP_INFO}`)
      .first();

    if ((await info.count()) === 0 || !(await info.isVisible().catch(() => false))) {
      await this.hoverFirstBlueSplitTicketFare(timeout);
    }

    try {
      await info.waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        "[EvolviResultsPage.getBlueSplitTicketFareTooltipInfoText] The split-ticket fare tooltip did not " +
          `show its SplitTix info block (selector: ${SELECTORS.SPLIT_TICKET_FARE_TOOLTIP} ` +
          `${SELECTORS.SPLIT_TICKET_FARE_TOOLTIP_INFO}). uk-rail-cell-tooltip-content.vue only renders ` +
          "it for a fare whose ticket.isSplitTicket is true, so the hovered fare may not be a split " +
          `ticket. Original: ${err.message}`,
      );
    }
    return ((await info.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  /**
   * Clicks the first split-ticket fare highlighted in blue, selecting it.
   *
   * @param {number} [timeout=30000]
   */
  async clickFirstBlueSplitTicketFare(timeout = 30000) {
    const fare = await this._requireFirstBlueSplitTicketFare(timeout);
    await fare.scrollIntoViewIfNeeded().catch(() => {});
    await fare.click();
  }

  /**
   * Opens the fare rules ("Full information") of the first selectable fare in the results grid without
   * selecting it: hovers the fare to raise its tooltip, then clicks the tooltip's "Full information"
   * button. The button sits in the body-level popper, outside the cell's select-on-click handler,
   * so the fare stays unselected.
   *
   * @param {number} [timeout=30000]
   */
  async openFareRulesFromFirstFare(timeout = 30000) {
    const fare = this._selectableFaresInColumn().first();
    try {
      await fare.waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        "[EvolviResultsPage.openFareRulesFromFirstFare] No selectable fare is on screen in the " +
          `results grid (selector: ${SELECTORS.FIRST_PRICE_ROW} > ${SELECTORS.PRICE_CELL} ` +
          `${SELECTORS.SELECTABLE_FARE_OPTION}). Either no fares came back for this route or every ` +
          `fare is cancelled/company-disabled. Original: ${err.message}`,
      );
    }
    await fare.scrollIntoViewIfNeeded().catch(() => {});
    await fare.hover();

    const fullInformationButton = this.page
      .locator(SELECTORS.FARE_TOOLTIP_FULL_INFORMATION_BUTTON)
      .first();
    try {
      await fullInformationButton.waitFor({ state: "visible", timeout });
    } catch {
      // Element Plus mounts the popper on the first pointer-enter, which can lose the race while
      // the results grid is still settling. Re-arm the pointer from a neutral position and retry.
      await this.page.mouse.move(0, 0);
      await this.page.waitForTimeout(300);
      await fare.hover();
      try {
        await fullInformationButton.waitFor({ state: "visible", timeout });
      } catch (err) {
        throw new Error(
          "[EvolviResultsPage.openFareRulesFromFirstFare] The fare tooltip never showed its " +
            `"Full information" button (selector: ${SELECTORS.FARE_TOOLTIP_FULL_INFORMATION_BUTTON}) ` +
            "after hovering the first selectable fare — the el-tooltip popper did not open, or the " +
            `hovered cell renders no tooltip content. Original: ${err.message}`,
        );
      }
    }
    await fullInformationButton.click();
  }

  /** Every blue-highlighted split-ticket fare in the SplitTix group's first price row. */
  _blueSplitTicketFares() {
    return this.page.locator(
      `${SELECTORS.SPLIT_TICKET_BLUE_CELL} ${SELECTORS.SPLIT_TICKET_BLUE_FARE}`,
    );
  }

  /**
   * Resolves the first blue-highlighted split-ticket fare, failing with what the page actually
   * offers rather than letting a later hover/click time out on an empty locator.
   */
  async _requireFirstBlueSplitTicketFare(timeout = 30000) {
    await this._waitForSplitTicketGroup(timeout);

    const fare = this._blueSplitTicketFares().first();
    try {
      await fare.waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        "[EvolviResultsPage._requireFirstBlueSplitTicketFare] The SplitTix fare group is displayed but " +
          "none of its fares is highlighted in blue — uk-rail-results.vue only adds .blue-bgd/.blue to a " +
          "cell whose priceDetails.isCheapest is true, so no split-ticket fare came back as the cheapest. " +
          `Original: ${err.message}`,
      );
    }
    return fare;
  }

  /**
   * Every selectable fare sitting in one grid column, top group first — or, with no cellIndex,
   * every selectable fare in the grid (used when any bookable fare will do, e.g. to open fare
   * rules from the first one).
   */
  _selectableFaresInColumn(cellIndex) {
    const cell =
      cellIndex === undefined ? SELECTORS.PRICE_CELL : `${SELECTORS.PRICE_CELL}:nth-child(${cellIndex + 1})`;
    return this.page.locator(
      `${SELECTORS.FIRST_PRICE_ROW} > ${cell} ${SELECTORS.SELECTABLE_FARE_OPTION}`,
    );
  }
}

module.exports = EvolviResultsPage;

