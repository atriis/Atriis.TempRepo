const { waitForText } = require("@utils/wait");
const { normalizeText } = require("@utils/text");
const { parseAmountText } = require("@utils/dom");

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
  // Inside a direction's .data-section, the .btn-container above the journey columns holds exactly
  // two .change-time-btn buttons — "Earlier" (uk-rail-results.ts's earlierSearch) then "Later"
  // (laterSearch), in DOM order. They are rendered by the same v-if that renders that direction's
  // journeys, so their presence is what says the search came back with results to page through
  // rather than with an empty grid. Each button prints its label in a <p>, next to a chevron
  // <app-img>, hence the text is read off the button itself.
  DIRECTION_TIME_NAV_BUTTON: ".btn-container .change-time-btn",
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

  // "Railcard Assignment" Cart Extra (uk-rail-railcard-assignment.vue) — rendered on the Cart /
  // Trip Overview, not the results grid above, but kept in this Evolvi-specific page rather than
  // the generic CartPage since it is UK Rail-only. Each row is one traveller in trip.passengers
  // order; the row's select carries a dynamic `uk-rail.railcard-assignment.select-${passenger.id}`
  // testid (passenger.id is not known ahead of time), so rows are addressed positionally instead.
  //
  // extras-layout.vue renders every Cart Extra collapsed by default — an "Add"/"Edit"/"View" span
  // that calls open() — and only its OPEN state exposes the #extra-content slot the rows above live
  // in. `.railcard-row` never appears until that opener is clicked, which is what
  // RAILCARD_ASSIGNMENT_OPENER exists to click first. Scoped by the extra's own title text (`.extra`
  // wraps one Cart Extra card each — Delivery Method, Seating, Railcard Assignment, ... — sharing
  // the same extras-layout markup) so this can't accidentally click a sibling extra's opener.
  RAILCARD_ASSIGNMENT_OPENER: ".extra:has-text('Railcard Assignment') .extra__btns .is-clickable",
  // NOT scoped by a `[data-testid="uk-rail.railcard-assignment.rows"]` ancestor: the source template
  // has that attribute, but it is absent from the deployed app (confirmed live — 0 matches for the
  // attribute, 3 for `.railcard-row` alone, immediately, no wait needed). `.railcard-row` is specific
  // enough on its own; every timeout raised chasing this before finding that out was solving nothing.
  RAILCARD_ASSIGNMENT_ROWS: ".railcard-row",
  RAILCARD_ASSIGNMENT_ROW_SELECT: ".el-select",
  // Same deployed-vs-source testid gap as RAILCARD_ASSIGNMENT_ROWS (confirmed live: 0 matches for
  // either testid, but real `<button>Save</button>` / `<button>Cancel</button>` elements exist).
  // `.extras-card` is the el-card class the Vue template renders around the rows AND these buttons,
  // regardless of the outer extras-layout open/close state — stable enough to scope by, filtered to
  // the Railcard Assignment card specifically since every Cart Extra shares that same el-card class.
  RAILCARD_ASSIGNMENT_SAVE_BTN: ".extras-card:has-text('Railcard Assignment') button:has-text('Save')",
  // Same shared app-select-popper markup EvolviSearchPage's rail-card select opens into.
  RAILCARD_ASSIGNMENT_OPEN_POPPER_OPTION: ".app-select-popper:visible .el-select-dropdown__item:visible",

  // ===== Named fare groups (a fare type addressed by its title, e.g. "Anytime Return") =====
  //
  // uk-rail-results.vue renders one .main-rows group per entry of formattedTickets, keyed by the
  // supplier's ticket description, and prints that key as <p class="title"> inside the group's
  // .title-cell (the SplitTix groups take the other branch of that v-if, so .title is exactly the
  // set of plainly-titled fare types). Addressing a group by its title is what lets a scenario name
  // the fare it is testing instead of settling for "the cheapest one".
  FARE_GROUP_TITLE: ".results .main-rows > .title-cell .title",
  FARE_GROUP_BY_TITLE: (title) => `.results .main-rows:has(> .title-cell .title:text-is("${title}"))`,
  // A group's first price row, for the reason FIRST_PRICE_ROW gives: a collapsed
  // .price-row-container is `max-height: 72px; overflow: hidden`, so only that row is genuinely
  // clickable without expanding the group. Resolved RELATIVE to a FARE_GROUP_BY_TITLE locator.
  FARE_GROUP_FIRST_PRICE_ROW: ".price-row-container > .price-row:first-child",
  // The row's outbound and inbound halves. The grid is always 10 .price-cell children in DOM order
  // (uk-rail-results.ts's isOutboundCell: 0-4 outbound, 5-9 inbound), so the split is positional —
  // :nth-child is 1-based, hence cells 1-5 and 6-10.
  OUTBOUND_PRICE_CELLS: ".price-cell:nth-child(-n+5)",
  INBOUND_PRICE_CELLS: ".price-cell:nth-child(n+6)",
  // The "Select Time" cell of an Anytime Return group. Its fare carries no separate inbound price,
  // so uk-rail-results.vue renders <p class="select-time"> in place of the app-price — and clicking
  // it is the ONLY way to pick the inbound leg of such a fare (uk-rail-results.ts's
  // selectReturnTicket). Same is-clickable/disabled pair as a priced cell.
  SELECT_TIME_OPTION: "p.select-time.is-clickable:not(.disabled)",
  // The priced-cell shape only, for the outbound half of a named group — SELECTABLE_FARE_OPTION
  // above deliberately matches either shape, which is wrong here: an outbound Anytime Return cell
  // always carries a real price, and accepting a select-time cell instead would silently pick the
  // inbound leg first.
  SELECTABLE_PRICE_OPTION: ".app-price.price.is-clickable:not(.disabled)",

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

  // ===== Greenest (lowest carbon) suggested fare =====
  //
  // The results header's .suggested-container holds exactly two suggested-fare buttons
  // (uk-rail-results.vue): the cheapest one — app-btn "blue-bgd blue suggested-btn" @click
  // selectCheapestFare — and the greenest one — app-btn "green-bgd green suggested-btn" @click
  // selectGreenFare. So .green-bgd is what separates "lowest carbon" from "lowest price"; the
  // existing CHEAPEST_SUGGESTED_FARE above deliberately resolves the blue twin instead.
  //
  // NOTE: the green button is v-if'd on `displayGreenPrice > 0`, so a route that comes back with no
  // carbon-efficient fare renders no button at all — hence the named error in
  // _requireGreenestSuggestedFare rather than a bare Playwright timeout.
  GREENEST_SUGGESTED_FARE: ".results-header .suggested-container .suggested-btn.green-bgd",
  // Its tooltip is a bare <el-tooltip effect="light"> with no popper-class of its own, so it lands
  // at body level as `.el-popper.is-light` and can only be told apart from the other poppers in
  // this view by excluding the ones that DO carry a class — the price-grid cell tooltips
  // (popper-class "uk-rail-tooltip") and app-tooltip's popper ("app-tooltip"). Same idiom as
  // EvolviSearchPage.SPLIT_TICKET_TYPE_TOOLTIP.
  GREENEST_SUGGESTED_FARE_TOOLTIP: ".el-popper.is-light:visible:not(.uk-rail-tooltip):not(.app-tooltip)",

  // ===== Selected-fare total (results header) =====
  //
  // Once a fare is picked, uk-rail-results.vue's header prints "Total: <app-price>" — in
  // .one-way-total for a one-way search (v-if selectedOutboundTicket) and in its round-trip twin
  // .total-container (v-if both legs). Both live inside .selected-prices-container, so one selector
  // covers either trip type.
  //
  // NOT reusing SELECTED_SUMMARY (".selected-prices > .selected-price"): that block only exists in
  // the round-trip branch of the header, so gating a one-way test on it would hang.
  SELECTED_FARE_TOTAL: ".selected-prices-container :is(.one-way-total, .total-container)",
  // app-price renders its non-plain format into <h4 class="amount">, currency symbol included and
  // the cents in a nested <span class="price-decimal"> — innerText concatenates both.
  SELECTED_FARE_TOTAL_AMOUNT: ".app-price .amount",

  // ===== Journey "More Details" (test 66963) =====
  //
  // Every journey column closes with a .route-desc block — the stops label plus an info glyph —
  // and it is that whole div, not the glyph, that carries @click="openJourneyDetails(journey)"
  // (uk-rail-results.vue). So the manual test's "information icon" and the stops label below
  // address the same clickable element.
  JOURNEY_ROUTE_DESC: ".route-desc",
  // The label inside it: "Direct" when stopQuantity is "0", otherwise "<n> stops". Scoped by
  // .blue because the column prints its duration in a plain .time-summary right above the block,
  // which a bare .time-summary would match first.
  JOURNEY_STOPS_LABEL: ".time-summary.blue",
  // The el-dialog openJourneyDetails() shows. Three dialogs in this view share
  // .uk-rail-results-dialog (journey details, SplitTix, flexible policy), so this pins the journey
  // one by the component only it renders — uk-rail-journey-details.vue's root <section>.
  JOURNEY_DETAILS_DIALOG: ".uk-rail-results-dialog:visible:has(.uk-rail-journey-details)",
  // One row per stop, in travel order: the departure station first and the final arrival last
  // (v-for over journeyDetails.stations). Desktop shape only — uk-rail-journey-details.vue swaps
  // the table for a .stations-container card list when the store reports isMobile.
  JOURNEY_DETAILS_ROW: "table.table tbody tr",
  // Leading cell of a row. It prints the station name as its own text node, and may append a
  // change-station seats <p> underneath — hence the first-line read in the getter below.
  JOURNEY_DETAILS_STATION_CELL: "td.station-cell",
  // Last cell of a row — the <th>Transport</th> column, printing station.trainServiceType
  // (e.g. "TRAIN"). Only rendered for a change station that is not the final row
  // (shouldShowTrainServiceType), so a trailing row is legitimately blank.
  JOURNEY_DETAILS_TRANSPORT_CELL: "td:last-child",

  // ===== Travel-together (GroupSave) discount label (US 52510, test 46785) =====
  //
  // When the search carries enough travellers for Evolvi to price a group fare, uk-rail-results.vue
  // appends <span class="discount-label">{{ $t('ukRail.discount') }}</span> INSIDE the affected
  // .price-cell, next to the fare amount — guarded by v-if="priceDetails?.isTravelTogether". So
  // the label's presence in a cell IS the app's statement that that fare is a travel-together one,
  // and no cell renders the span otherwise.
  //
  // Scoped to ".results" — the DESKTOP grid. The view renders a second, mobile copy of the whole
  // price grid further down (v-if isMobile), which carries the same classes; anchoring on the
  // desktop container is what keeps a run from counting the same fare twice.
  //
  // Deliberately NOT restricted to each group's first .price-row the way FIRST_PRICE_ROW is. That
  // restriction exists so a CLICK target is genuinely reachable in a collapsed group, which is a
  // different question from the one this asks: the manual test only wants the discount to appear on
  // at least one fare in the grid, and a label in a collapsed group's second row is still the app
  // having priced a travel-together fare.
  TRAVEL_TOGETHER_DISCOUNT_LABEL: ".results .price-cell .discount-label",

  // ===== Group / GroupSave fare confirmation dialog (US 52510) =====
  //
  // handleAddToTrip() does NOT add the quote when the selected fare is a group fare: it raises this
  // dialog and returns, and only confirmGroupFare() — behind the dialog's "Continue" button — goes
  // on to addToTrip(). The app gates the dialog on isGroupFareSelected, which is false for a single
  // passenger (numberOfPassengers <= 1), so this only ever stands in the way of a MULTI-TRAVELLER
  // Evolvi booking; a one-traveller run never raises it and never waits on it.
  //
  // A fourth dialog sharing .uk-rail-results-dialog, so it is pinned by its own body class rather
  // than the shared one (journey details, SplitTix and flexible policy carry that too).
  GROUP_FARE_DIALOG: ".uk-rail-results-dialog:visible:has(.group-fare-content)",
  // app-btn type="primary" renders <button class="btn btn--primary">. The footer's other button is
  // the default-typed Cancel, which closes the dialog WITHOUT taking the fare.
  GROUP_FARE_DIALOG_CONTINUE_BUTTON: ".group-fare-btns .btn--primary",
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

/**
 * Guards a text argument a locator is built from, so an empty title fails with the caller's name
 * rather than silently widening the selector to every fare group in the grid.
 */
function assertNonEmptyString(methodName, argumentName, value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `[EvolviResultsPage.${methodName}] "${argumentName}" must be a non-empty string, got: ${JSON.stringify(value)}`,
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
   *
   * A per-passenger railcard picked at search (evolvi-search-inputs.vue's
   * `handleCardTypeSelect`) re-runs the fare search, since the discount depends on which railcards
   * are combined — with two or more travellers assigned a railcard, that means two or more
   * re-fetches stacked back to back before the grid settles. 90s (vs. the base 60s) gives that
   * enough room without masking a genuinely broken search elsewhere.
   */
  async waitForOutboundText(timeout = 90000) {
    await waitForText(
      this.page,
      SELECTORS.OUTBOUND_TEXT,
      "Outbound",
      timeout,
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
   * Confirms the group / GroupSave fare dialog when "Add to trip" raised one, and reports whether
   * it had to.
   *
   * The dialog is opened synchronously inside handleAddToTrip() — nothing is awaited before
   * `groupFareDialogVisible = true` — so it is on screen within a render tick of the click, and a
   * short bounded wait is enough to tell the two paths apart. On the path that does not raise it
   * (single traveller, or a fare Evolvi did not flag isTravelTogether) the app has already gone on
   * to addToTrip(), the wait expires against a dialog that will never exist, and the caller carries
   * on unchanged.
   *
   * @param {number} [timeout=5000] - How long to give the dialog to appear before concluding the
   *   fare was not a group fare.
   * @returns {Promise<boolean>} True when the dialog appeared and Continue was clicked.
   */
  async confirmGroupFareDialogIfPresent(timeout = 5000) {
    const dialog = this.page.locator(SELECTORS.GROUP_FARE_DIALOG).first();

    const appeared = await dialog
      .waitFor({ state: "visible", timeout })
      .then(() => true)
      .catch(() => false);

    if (!appeared) return false;

    await dialog.locator(SELECTORS.GROUP_FARE_DIALOG_CONTINUE_BUTTON).first().click();
    // confirmGroupFare() closes the dialog before awaiting addToTrip(), so the dialog going away is
    // the app's signal that the quote request is actually on its way.
    await dialog.waitFor({ state: "hidden", timeout: 30000 });

    return true;
  }

  // ===== Greenest (lowest carbon) suggested fare =====

  /**
   * Hovers the greenest suggested fare in the results header and waits for its tooltip to open.
   *
   * @param {number} [timeout=15000]
   */
  async hoverGreenestSuggestedFare(timeout = 15000) {
    const fare = await this._requireGreenestSuggestedFare(timeout);
    await fare.scrollIntoViewIfNeeded().catch(() => {});
    await fare.hover();

    const tooltip = this.page.locator(SELECTORS.GREENEST_SUGGESTED_FARE_TOOLTIP).first();
    try {
      await tooltip.waitFor({ state: "visible", timeout });
    } catch {
      // Element Plus mounts the popper on the first pointer-enter, which can lose the race while
      // the results grid is still settling. Re-arm the pointer from a neutral position and retry.
      await this.page.mouse.move(0, 0);
      await this.page.waitForTimeout(300);
      await fare.hover();
      try {
        await tooltip.waitFor({ state: "visible", timeout });
      } catch (err) {
        throw new Error(
          "[EvolviResultsPage.hoverGreenestSuggestedFare] Hovered the greenest suggested-fare button in the " +
            "Evolvi results header, but its tooltip never opened (selector: " +
            `${SELECTORS.GREENEST_SUGGESTED_FARE_TOOLTIP}). The el-tooltip may not have mounted its popper, ` +
            `or another light popper is masking it. Original: ${err.message}`,
        );
      }
    }
  }

  /**
   * Reads the greenest suggested fare's tooltip text. Re-hovers first when the popper is absent or
   * hidden, so the assertion step can read it even though the hover happened in a previous
   * Cucumber step and Element Plus may have dismissed it in between.
   *
   * @param {number} [timeout=15000]
   * @returns {Promise<string>}
   */
  async getGreenestSuggestedFareTooltipText(timeout = 15000) {
    const tooltip = this.page.locator(SELECTORS.GREENEST_SUGGESTED_FARE_TOOLTIP).first();

    if ((await tooltip.count()) === 0 || !(await tooltip.isVisible().catch(() => false))) {
      await this.hoverGreenestSuggestedFare(timeout);
    }

    try {
      await tooltip.waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        "[EvolviResultsPage.getGreenestSuggestedFareTooltipText] The greenest suggested-fare tooltip is not " +
          `open (selector: ${SELECTORS.GREENEST_SUGGESTED_FARE_TOOLTIP}). The re-hover did not raise it, so ` +
          "the popper may have been dismissed by a pointer move between the hover and this read. " +
          `Original: ${err.message}`,
      );
    }
    return ((await tooltip.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  /**
   * Clicks the greenest suggested fare in the results header, selecting it.
   *
   * uk-rail-results.ts's selectGreenFare ASSIGNS selectedOutboundTicket from greenOutboundIdx (and
   * expands the owning fare-group row) rather than toggling it, so a single click is safe.
   *
   * @param {number} [timeout=30000]
   */
  async clickGreenestSuggestedFareOption(timeout = 30000) {
    const fare = await this._requireGreenestSuggestedFare(timeout);
    await fare.scrollIntoViewIfNeeded().catch(() => {});
    await fare.click();
  }

  /**
   * Waits until one direction's journey grid has rendered at least one real journey column.
   *
   * The locale-independent counterpart of waitForOutboundText/waitForSuggestedFaresText: both of
   * those match English literals ("Outbound", "Suggested fares"), so neither can gate a read once
   * the application language has been switched away from English. The journey columns carry no
   * translated text at all, which makes their presence the one signal that survives a language
   * switch.
   *
   * @param {number} directionIndex - 0 for outbound, 1 for inbound
   * @param {number} [timeout=60000]
   */
  async waitForFirstJourneyColumn(directionIndex, timeout = 60000) {
    assertIndex("waitForFirstJourneyColumn", "directionIndex", directionIndex);
    const firstColumn = this.page
      .locator(SELECTORS.RESULTS_DATA_SECTION)
      .nth(directionIndex)
      .locator(SELECTORS.JOURNEY_COLUMN)
      .first();
    try {
      await firstColumn.waitFor({ state: "visible", timeout });
    } catch (error) {
      throw new Error(
        `[EvolviResultsPage.waitForFirstJourneyColumn] No journey column rendered for direction ` +
          `index ${directionIndex} within ${timeout}ms. The Evolvi results grid is either still ` +
          `loading, came back with no journeys for that leg, or — for an inbound read — the search ` +
          `was not a round trip, so the inbound .data-section is never shown. ` +
          `Original: ${error.message}`,
      );
    }
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
   * Reads the stops label of one direction's journey column — "Direct", or "<n> stops".
   * @param {number} directionIndex - 0 for outbound, 1 for inbound
   * @param {number} columnIndex - 0-based position of the column within that direction
   * @param {number} [timeout=60000]
   * @returns {Promise<string>} The raw displayed label text
   */
  async getJourneyStopsLabel(directionIndex, columnIndex, timeout = 60000) {
    assertIndex("getJourneyStopsLabel", "directionIndex", directionIndex);
    assertIndex("getJourneyStopsLabel", "columnIndex", columnIndex);
    const label = this.page
      .locator(SELECTORS.RESULTS_DATA_SECTION)
      .nth(directionIndex)
      .locator(SELECTORS.JOURNEY_COLUMN)
      .nth(columnIndex)
      .locator(`${SELECTORS.JOURNEY_ROUTE_DESC} ${SELECTORS.JOURNEY_STOPS_LABEL}`)
      .first();
    try {
      await label.waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[EvolviResultsPage.getJourneyStopsLabel] Journey column ${columnIndex} of direction ` +
          `${directionIndex} shows no stops label (selector: ${SELECTORS.JOURNEY_ROUTE_DESC} ` +
          `${SELECTORS.JOURNEY_STOPS_LABEL}) — either that column is not on screen or the results ` +
          `grid rendered fewer journeys than the scenario expects. Original: ${err.message}`,
      );
    }
    return normalizeText((await label.innerText()) ?? "");
  }

  /**
   * Opens the journey "More Details" dialog of one direction's journey column, by clicking the
   * column's route description — the div that carries openJourneyDetails(journey) — and waits for
   * the details table to replace the loading skeleton.
   *
   * @param {number} directionIndex - 0 for outbound, 1 for inbound
   * @param {number} columnIndex - 0-based position of the column within that direction
   * @param {number} [timeout=30000]
   */
  async openJourneyDetailsForJourney(directionIndex, columnIndex, timeout = 30000) {
    assertIndex("openJourneyDetailsForJourney", "directionIndex", directionIndex);
    assertIndex("openJourneyDetailsForJourney", "columnIndex", columnIndex);
    const routeDescription = this.page
      .locator(SELECTORS.RESULTS_DATA_SECTION)
      .nth(directionIndex)
      .locator(SELECTORS.JOURNEY_COLUMN)
      .nth(columnIndex)
      .locator(SELECTORS.JOURNEY_ROUTE_DESC)
      .first();
    try {
      await routeDescription.waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[EvolviResultsPage.openJourneyDetailsForJourney] Journey column ${columnIndex} of direction ` +
          `${directionIndex} renders no route description (selector: ${SELECTORS.JOURNEY_ROUTE_DESC}), ` +
          "so there is nothing to open the journey details from — that column is most likely not on " +
          `screen. Original: ${err.message}`,
      );
    }
    await routeDescription.scrollIntoViewIfNeeded().catch(() => {});
    await routeDescription.click();

    // The dialog opens immediately but fills from a getJourneyDetails() call, showing an
    // el-skeleton until it resolves — so gate on the first station row, not on the dialog itself.
    const firstRow = this.page
      .locator(SELECTORS.JOURNEY_DETAILS_DIALOG)
      .locator(SELECTORS.JOURNEY_DETAILS_ROW)
      .first();
    try {
      await firstRow.waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        "[EvolviResultsPage.openJourneyDetailsForJourney] The journey details dialog never showed its " +
          `station table (selector: ${SELECTORS.JOURNEY_DETAILS_DIALOG} ${SELECTORS.JOURNEY_DETAILS_ROW}) ` +
          "— the click did not open the dialog, or the journey-details request came back empty. " +
          `Original: ${err.message}`,
      );
    }
  }

  /**
   * Reads the station name of every row of the open journey details table, in travel order.
   *
   * Takes the first line of each station cell: a change-station row appends its seat information
   * as a <p> under the name, which innerText would otherwise fold into the returned value.
   *
   * @param {number} [timeout=30000]
   * @returns {Promise<string[]>}
   */
  async getJourneyDetailsStationNames(timeout = 30000) {
    const stationCells = this.page
      .locator(SELECTORS.JOURNEY_DETAILS_DIALOG)
      .locator(`${SELECTORS.JOURNEY_DETAILS_ROW} ${SELECTORS.JOURNEY_DETAILS_STATION_CELL}`);
    try {
      await stationCells.first().waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        "[EvolviResultsPage.getJourneyDetailsStationNames] The journey details table has no station " +
          `cells (selector: ${SELECTORS.JOURNEY_DETAILS_DIALOG} ${SELECTORS.JOURNEY_DETAILS_ROW} ` +
          `${SELECTORS.JOURNEY_DETAILS_STATION_CELL}) — the dialog is not open, or it rendered the ` +
          `mobile card list instead of the desktop table. Original: ${err.message}`,
      );
    }
    const cellTexts = await stationCells.allInnerTexts();
    return cellTexts.map((text) => normalizeText((text ?? "").split("\n")[0]));
  }

  /**
   * Reads the travel mode ("Transport" column) of one row of the open journey details table.
   *
   * @param {number} [rowIndex=0] - 0-based row of the table
   * @param {number} [timeout=30000]
   * @returns {Promise<string>}
   */
  async getJourneyDetailsTravelMode(rowIndex = 0, timeout = 30000) {
    assertIndex("getJourneyDetailsTravelMode", "rowIndex", rowIndex);
    const transportCell = this.page
      .locator(SELECTORS.JOURNEY_DETAILS_DIALOG)
      .locator(SELECTORS.JOURNEY_DETAILS_ROW)
      .nth(rowIndex)
      .locator(SELECTORS.JOURNEY_DETAILS_TRANSPORT_CELL)
      .first();
    try {
      await transportCell.waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[EvolviResultsPage.getJourneyDetailsTravelMode] Row ${rowIndex} of the journey details table ` +
          `has no transport cell (selector: ${SELECTORS.JOURNEY_DETAILS_DIALOG} ` +
          `${SELECTORS.JOURNEY_DETAILS_ROW} ${SELECTORS.JOURNEY_DETAILS_TRANSPORT_CELL}) — the dialog ` +
          `is not open, or the journey has fewer rows than that. Original: ${err.message}`,
      );
    }
    return normalizeText((await transportCell.innerText()) ?? "");
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
   * Reads every plainly-titled fare group heading currently in the price grid, e.g.
   * ["Off-Peak Return", "Anytime Return"]. Used to say what the grid actually offered when a
   * scenario asked for a group title that is not there, instead of failing on an empty locator.
   * @returns {Promise<string[]>} The group titles, in grid order
   */
  async listFareGroupTitles() {
    const titles = await this.page.locator(SELECTORS.FARE_GROUP_TITLE).allInnerTexts();
    return titles.map((title) => title.replace(/\s+/g, " ").trim()).filter(Boolean);
  }

  /**
   * Clicks the first selectable OUTBOUND price of one named fare group.
   *
   * The outbound half of a group's first price row is scanned rather than a caller-chosen column:
   * a named fare is only offered on the journeys that carry it, so the first priced, clickable
   * outbound cell of that group is the journey the fare can actually be booked on.
   *
   * @param {string} groupTitle - The fare group's title, e.g. "Anytime Return"
   * @param {number} [timeout=30000]
   */
  async clickFirstOutboundPriceInFareGroup(groupTitle, timeout = 30000) {
    assertNonEmptyString("clickFirstOutboundPriceInFareGroup", "groupTitle", groupTitle);
    const option = this._fareGroupRow(groupTitle)
      .locator(SELECTORS.OUTBOUND_PRICE_CELLS)
      .locator(SELECTORS.SELECTABLE_PRICE_OPTION)
      .first();

    try {
      await option.waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[EvolviResultsPage.clickFirstOutboundPriceInFareGroup] No selectable outbound price is on screen in the ` +
        `"${groupTitle}" fare group within ${timeout}ms. The grid offers these groups: ` +
        `${JSON.stringify(await this.listFareGroupTitles())}. Either that fare type was not returned for this ` +
        `route, or every one of its outbound fares is cancelled/company-disabled. Original: ${err.message}`,
      );
    }

    await option.scrollIntoViewIfNeeded();
    await option.click();
  }

  /**
   * Clicks the "Select Time" cell in the INBOUND half of one named fare group.
   *
   * An Anytime Return fare prices no separate inbound leg, so its inbound cells render
   * <p class="select-time"> instead of a price and clicking one builds the return ticket inline —
   * it is the only way to pick the inbound leg of such a fare. The cell only becomes clickable once
   * the matching outbound fare is selected, which is why this waits rather than reads.
   *
   * @param {string} groupTitle - The fare group's title, e.g. "Anytime Return"
   * @param {number} [timeout=30000]
   */
  async clickInboundSelectTimeInFareGroup(groupTitle, timeout = 30000) {
    assertNonEmptyString("clickInboundSelectTimeInFareGroup", "groupTitle", groupTitle);
    const option = this._fareGroupRow(groupTitle)
      .locator(SELECTORS.INBOUND_PRICE_CELLS)
      .locator(SELECTORS.SELECT_TIME_OPTION)
      .first();

    try {
      await option.waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[EvolviResultsPage.clickInboundSelectTimeInFareGroup] No clickable "Select Time" cell appeared in the ` +
        `inbound half of the "${groupTitle}" fare group within ${timeout}ms. The grid offers these groups: ` +
        `${JSON.stringify(await this.listFareGroupTitles())}. Either that group is not an Anytime Return fare ` +
        `(only those render "Select Time"), or its matching outbound fare was never selected — the inbound ` +
        `cells stay disabled until it is. Original: ${err.message}`,
      );
    }

    await option.scrollIntoViewIfNeeded();
    await option.click();
  }

  /**
   * The first price row of one named fare group — the shared anchor of the two clicks above.
   * @param {string} groupTitle - The fare group's title
   * @returns {import('playwright').Locator}
   */
  _fareGroupRow(groupTitle) {
    return this.page
      .locator(SELECTORS.FARE_GROUP_BY_TITLE(groupTitle))
      .locator(SELECTORS.FARE_GROUP_FIRST_PRICE_ROW)
      .first();
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
   * Reads the labels of a direction's two time-navigation buttons in the results header, in DOM
   * order — "Earlier" then "Later".
   *
   * Waits on the SECOND button as well as the first: the pair renders together with the direction's
   * journeys, so waiting on both is what distinguishes a painted results block from a half-rendered
   * one. The default timeout matches getResultsSectionHeadingText because this is typically the
   * first read after a search is submitted, so it is waiting on Evolvi to answer rather than on a
   * re-render.
   *
   * @param {number} sectionIndex - 0 for outbound, 1 for inbound
   * @param {number} [timeout=90000]
   * @returns {Promise<string[]>} The two button labels as rendered
   */
  async getDirectionTimeNavigationLabels(sectionIndex, timeout = 90000) {
    assertIndex("getDirectionTimeNavigationLabels", "sectionIndex", sectionIndex);
    const buttons = this.page
      .locator(SELECTORS.RESULTS_DATA_SECTION)
      .nth(sectionIndex)
      .locator(SELECTORS.DIRECTION_TIME_NAV_BUTTON);

    await buttons.first().waitFor({ state: "visible", timeout });
    await buttons.nth(1).waitFor({ state: "visible", timeout });

    const labels = await buttons.allInnerTexts();
    return labels.map((label) => normalizeText(label));
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

  /**
   * Reads the "Total:" amount the results header shows for the fare currently selected, as a
   * number — e.g. "£54.20" -> 54.2. Works for either trip type: the one-way header renders
   * .one-way-total and the round-trip header its .total-container twin.
   *
   * Waiting on that total is also the post-selection gate: it only renders once a fare has been
   * picked, so a visible total proves the click registered.
   *
   * @param {number} [timeout=30000]
   * @returns {Promise<number>}
   */
  async getSelectedFareTotalPriceValue(timeout = 30000) {
    const total = this.page.locator(SELECTORS.SELECTED_FARE_TOTAL).first();
    try {
      await total.waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        "[EvolviResultsPage.getSelectedFareTotalPriceValue] The selected-fare total is not displayed in the " +
          `Evolvi results header (selector: ${SELECTORS.SELECTED_FARE_TOTAL}). uk-rail-results.vue only ` +
          "renders it once a fare is selected — selectedOutboundTicket for a one way, both legs for a round " +
          `trip — so the fare selection may not have registered. Original: ${err.message}`,
      );
    }

    const amount = total.locator(SELECTORS.SELECTED_FARE_TOTAL_AMOUNT).first();
    try {
      await amount.waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        "[EvolviResultsPage.getSelectedFareTotalPriceValue] The selected-fare total block is displayed but " +
          `carries no price amount (selector: ${SELECTORS.SELECTED_FARE_TOTAL} ` +
          `${SELECTORS.SELECTED_FARE_TOTAL_AMOUNT}). app-price may have rendered its plain format instead of ` +
          `the h4.amount this reads. Original: ${err.message}`,
      );
    }

    const totalText = ((await amount.innerText()) ?? "").replace(/\s+/g, " ").trim();
    try {
      return parseAmountText(totalText, "the selected Evolvi fare total");
    } catch (err) {
      throw new Error(
        "[EvolviResultsPage.getSelectedFareTotalPriceValue] Could not read a number out of the selected-fare " +
          `total shown in the Evolvi results header (read: "${totalText}"). The amount may be rendered in an ` +
          `unexpected currency/number format. Original: ${err.message}`,
      );
    }
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
   * Resolves the results header's greenest suggested-fare button, failing with why it is missing
   * instead of letting the hover/click that follows time out on an empty locator.
   *
   * The button is v-if'd on `displayGreenPrice > 0` (uk-rail-results.vue), so "not there" means the
   * search came back without a carbon-efficient fare — not that the selector drifted.
   */
  async _requireGreenestSuggestedFare(timeout = 15000) {
    const fare = this.page.locator(SELECTORS.GREENEST_SUGGESTED_FARE).first();
    try {
      await fare.waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        "[EvolviResultsPage._requireGreenestSuggestedFare] No greenest (lowest carbon) suggested fare is " +
          `displayed in the Evolvi results header (selector: ${SELECTORS.GREENEST_SUGGESTED_FARE}). ` +
          "uk-rail-results.vue only renders that green button when displayGreenPrice > 0, so this route came " +
          `back without a green fare. Original: ${err.message}`,
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

  /**
   * Reads the travel-together (GroupSave) discount labels the price grid is currently rendering,
   * in DOM order — one entry per fare cell priced as a group fare.
   *
   * Waits for the FIRST label rather than reading straight away: this runs right after the results
   * grid paints, and the cells re-render as the view resolves each fare's price details, so a bare
   * count would race the render and read 0 on a grid that does show discounts a moment later. The
   * wait is bounded and its timeout is swallowed — a grid that genuinely prices no group fare is a
   * legitimate (failing) outcome for the caller to report, not an error from the page object.
   *
   * @param {number} [timeout=30000] - How long to allow the first discount label to appear
   * @returns {Promise<string[]>} The label texts as rendered, empty when no fare carries one
   */
  async getTravelTogetherDiscountLabels(timeout = 30000) {
    const labels = this.page.locator(SELECTORS.TRAVEL_TOGETHER_DISCOUNT_LABEL);
    try {
      await labels.first().waitFor({ state: "visible", timeout });
    } catch {
      return [];
    }
    const texts = await labels.allInnerTexts();
    return texts.map((text) => normalizeText(text ?? "")).filter((text) => text !== "");
  }

  /**
   * The titles of the fare groups whose cells carry a travel-together discount label, in grid
   * order. Diagnostic only — it names the fares a run actually found the discount on, so a failure
   * elsewhere in the scenario can be read without re-running with a screenshot.
   *
   * A SplitTix group takes the other branch of the title v-if and prints .splittix-title instead of
   * .title, so both are read; a group renders exactly one of them.
   *
   * @returns {Promise<string[]>}
   */
  async getFareGroupTitlesWithTravelTogetherDiscount() {
    const groups = this.page.locator(
      `.results .main-rows:has(${SELECTORS.TRAVEL_TOGETHER_DISCOUNT_LABEL.replace(".results ", "")})`,
    );
    const titles = await groups
      .locator("> .title-cell :is(.title, .splittix-title)")
      .allInnerTexts();
    return titles.map((text) => normalizeText(text ?? "")).filter((text) => text !== "");
  }

  /**
   * Opens the rail-card select for one traveller row in the "Railcard Assignment" Cart Extra and
   * waits for its options to render.
   *
   * @param {number} travelerIndex - 0-based row, in trip.passengers order
   * @param {number} [timeout=30000]
   */
  async openRailcardAssignmentDropdown(travelerIndex, timeout = 30000) {
    assertIndex("openRailcardAssignmentDropdown", "travelerIndex", travelerIndex);

    // extras-layout.vue renders every Cart Extra collapsed behind an "Add"/"Edit"/"View" opener;
    // the rows this method waits for below only exist once that's been clicked. Only the FIRST
    // traveler assigned in a quote needs this — by the second call the extra is already open and
    // the opener span is gone, so a timeout here (already open) is expected and swallowed; the row
    // wait below is what actually reports a genuine failure.
    const opener = this.page.locator(SELECTORS.RAILCARD_ASSIGNMENT_OPENER).first();
    try {
      await opener.waitFor({ state: "visible", timeout });
      await opener.click();
    } catch {
      // Either already open (no opener left for a later traveler) or genuinely never appeared -
      // the row wait immediately below fails loudly in the latter case instead of this swallowing it.
    }

    const row = this.page.locator(SELECTORS.RAILCARD_ASSIGNMENT_ROWS).nth(travelerIndex);
    await row.waitFor({ state: "visible", timeout });
    const select = row.locator(SELECTORS.RAILCARD_ASSIGNMENT_ROW_SELECT);

    // Same reflow race as EvolviSearchPage.openRailcardDropdown — a previously-assigned row above
    // this one can still be settling into place when this row's select is clicked. Force-click on a
    // stability timeout rather than waiting out a reflow that Playwright never sees finish.
    try {
      await select.click({ timeout: 5000 });
    } catch (error) {
      if (!(error instanceof Error) || !/not stable|intercepts pointer events|timeout/i.test(error.message)) {
        throw error;
      }
      await select.click({ force: true, timeout: 5000 });
    }

    await this.page
      .locator(SELECTORS.RAILCARD_ASSIGNMENT_OPEN_POPPER_OPTION)
      .first()
      .waitFor({ state: "visible", timeout });
  }

  /**
   * Clicks the option matching the given text in the currently open Railcard Assignment popper.
   *
   * @param {string} optionText - Exact option label, e.g. "YNG - 16-25 Railcard"
   * @param {number} [timeout=15000]
   */
  async selectRailcardAssignmentOption(optionText, timeout = 15000) {
    const option = this.page
      .locator(SELECTORS.RAILCARD_ASSIGNMENT_OPEN_POPPER_OPTION)
      .filter({ hasText: optionText })
      .first();
    await option.waitFor({ state: "visible", timeout });

    // Same close-on-select race as EvolviSearchPage.selectOpenPopperOption (shared app-select
    // component) — the popper can start closing before Playwright's stability check completes.
    try {
      await option.click({ timeout: 5000 });
    } catch (error) {
      if (!(error instanceof Error) || !/not stable|not visible|intercepts pointer events|timeout/i.test(error.message)) {
        throw error;
      }
      await this.page
        .locator(SELECTORS.RAILCARD_ASSIGNMENT_OPEN_POPPER_OPTION)
        .filter({ hasText: optionText })
        .first()
        .click({ force: true, timeout: 5000 })
        .catch(() => {});
    }
  }

  /** Clicks "Save" on the Railcard Assignment Cart Extra. */
  async clickRailcardAssignmentSave(timeout = 15000) {
    const saveBtn = this.page.locator(SELECTORS.RAILCARD_ASSIGNMENT_SAVE_BTN);
    await saveBtn.waitFor({ state: "visible", timeout });
    await saveBtn.click();
  }
}

module.exports = EvolviResultsPage;

