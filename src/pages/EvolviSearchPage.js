const { normalizeText } = require("@utils/text");

/**
 * Page Object for evolvi search page.
 * Contains only UI-level interactions.
 */

/**
 * The UK Rail search form itself (evolvi-search-inputs.vue's root). Every other product's form stays
 * mounted behind its tab, so `:visible` is what makes this mean "the UK Rail form is on screen" —
 * and its leaving the screen is the proof that a Search click actually submitted. Hoisted out of
 * SELECTORS because everything inside the form resolves against it.
 */
const SEARCH_FORM = ".uk-rail-search:visible";

/**
 * The split-type radio group inside Advanced search, rendered only while the split-ticket checkbox
 * is checked (`v-if="railInfo.isSplitTicket"`). It carries no class of its own, so it is addressed
 * by the one thing unique to it: `.radio-info` is rendered nowhere else in the UK Rail search form.
 * Hoisted out of SELECTORS because three of its entries build on it.
 */
const SPLIT_TICKET_TYPE_RADIO_GROUP =
  `${SEARCH_FORM} .checkbox-container .el-radio-group:has(.radio-info)`;

/**
 * The `data-track` attribute of each UK Rail search checkbox a test addresses by label.
 *
 * The indirection is what lets a step take the checkbox label as a parameter while the selector
 * still resolves through the stable attribute instead of the rendered text. Matching the text would
 * be a locale trap: these labels all come from $t(), and test 49309 deliberately runs Evolvi with
 * the app in another language, where a text match finds nothing.
 *
 * Add an entry when a test needs another one — the siblings in the same row are
 * `evolvi-search-via` and `evolvi-search-avoid`.
 */
const SEARCH_CHECKBOX_TRACK_IDS = {
  "Request Split Ticket": "evolvi-search-split-ticket",
};

/** el-checkbox renders `data-track` on its label element; `.el-checkbox__inner` is the node inside
 * it that isChecked() answers correctly for. */
const searchCheckbox = (trackId) => `label[data-track='${trackId}'] .el-checkbox__inner`;

const SELECTORS = {
  SPLIT_TICKET_CHECKBOX: searchCheckbox(SEARCH_CHECKBOX_TRACK_IDS["Request Split Ticket"]),
  // evolvi-search-inputs.vue's trip-type radio group. UK Rail's three options are Return / One Way
  // / Open Return — there is no "Round Trip" here, and matching on the rendered label could not
  // separate "Return" from "Open Return" anyway (both are localized via $t('ukRail.*')), so this
  // goes through the radio's stable data-track attribute instead.
  RETURN_TRIP_TYPE_RADIO: "label[data-track='evolvi-search-return']",
  // Traveller-count select in evolvi-search-inputs.vue's `.extra-details-container`: the FIRST
  // .app-column there holds it, the second holds one rail-card select per traveller. Neither
  // app-select passes a `name`, so position inside that container is the only stable handle.
  // `:visible` keeps the other products' search forms — mounted but hidden while the Rail tab is
  // active — from being matched first by DOM order.
  TRAVELERS_COUNT_SELECT: `${SEARCH_FORM} .extra-details-container > .app-column:first-child .el-select`,
  // Option rows of the open traveller-count select. app-select renders through el-select/el-option,
  // so each option is `<li class="el-select-dropdown__item"><span>3 Traveller</span></li>` inside the
  // shared `.app-select-popper`. Only one popper is open at a time, so `:visible` on the popper
  // isolates this one from the rail-card and time-type poppers that linger hidden in the DOM;
  // `:visible` on the item too because an app-select popper can hold hidden/responsive duplicate
  // options (see SearchPage.verifyOnlyGuestPassengerType) and the count of options is asserted on.
  TRAVELERS_COUNT_OPTION:
    ".app-select-popper:visible .el-select-dropdown__item:visible",
  // The SplitTix glyph app-img renders inside the "Request Split Ticket" checkbox label
  // (app-img.vue has a single <img> root, so the class lands on the image itself).
  SPLIT_TICKET_ICON:
    "label[data-track='evolvi-search-split-ticket'] .evolvi-splittix-icon",
  // The app-tooltip that sits beside the checkbox. app-tooltip.vue puts the hover target on its own
  // `.app-tooltip__content` wrapper, which is what this hovers.
  //
  // NOT scoped by the "evoli-splittix-Info" class evolvi-search-inputs.vue passes to that
  // <app-tooltip>: that class never reaches the DOM. app-tooltip's root is an el-tooltip, which
  // renders trigger + content as sibling nodes rather than one root, so Vue has nowhere to apply an
  // inherited class and drops it (verified live — 0 matches for `.evoli-splittix-Info`, 1 for this
  // selector). The UK Rail search form mounts exactly one app-tooltip, so scoping to the form is
  // enough to identify it.
  SPLIT_TICKET_INFO_TRIGGER: `${SEARCH_FORM} .app-tooltip__content`,
  // app-tooltip renders through el-tooltip with popper-class "app-tooltip", appended at body
  // level, so the popper is NOT reachable under `.uk-rail-search`. Its description carries the
  // $t('ukRail.splitTixInformation') line the manual test quotes.
  SPLIT_TICKET_INFO_TOOLTIP_DESCRIPTION:
    ".el-popper.app-tooltip:visible .app-tooltip__description",
  SPLIT_TICKET_TYPE_RADIO_GROUP,
  // One el-radio per split type — "Split at board / alight stations" (splitTixType 1) and
  // "Split at calling stations" (splitTixType 2). Matched on the rendered label the manual test
  // names rather than on the numeric value, so the step reads the way the test case is written.
  SPLIT_TICKET_TYPE_RADIO: (label) =>
    `${SPLIT_TICKET_TYPE_RADIO_GROUP} .el-radio:has(.el-radio__label:text-is("${label}"))`,
  SPLIT_TICKET_TYPE_INFO_ICON: `${SPLIT_TICKET_TYPE_RADIO_GROUP} .radio-info`,
  // The split-type info icon opens a bare el-tooltip (placement="top" effect="light") with no
  // popper-class of its own, so the only way to tell it apart from the app-tooltip popper above
  // is to exclude that one.
  SPLIT_TICKET_TYPE_TOOLTIP: ".el-popper.is-light:visible:not(.app-tooltip)",

  SEARCH_FORM,
  // Rail-card selects live in the SECOND .app-column of `.extra-details-container` — one per
  // traveller, in traveller order (v-for="(passenger, passengerIdx) in railInfo.numOfTravellers").
  // Like TRAVELERS_COUNT_SELECT, app-select passes no `name`/testid here, so position is the only
  // stable handle; `nth(travelerIndex)` (0-based) picks the row for a given traveller.
  RAILCARD_SELECT:
    ".uk-rail-search:visible .extra-details-container > .app-column:nth-child(2) .el-select",
  // Same popper markup TRAVELERS_COUNT_OPTION targets — app-select always renders its open options
  // through the shared .app-select-popper regardless of which select opened it. Kept as its own
  // named constant (rather than reusing TRAVELERS_COUNT_OPTION) so a reader of the rail-card methods
  // below isn't misled into thinking they're scoped to the traveller-count select.
  OPEN_POPPER_OPTION:
    ".app-select-popper:visible .el-select-dropdown__item:visible",
};

class EvolviSearchPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Reports whether the UK Rail search form has left the screen, which is how a submitted search is
   * told apart from a swallowed Search click. Waits up to `timeout` for it to go, then answers with
   * a boolean instead of throwing so a caller can retry the click.
   *
   * @param {number} [timeout=15000]
   * @returns {Promise<boolean>} true once the form is gone, false if it is still on screen
   */
  async isSearchFormGone(timeout = 15000) {
    try {
      await this.page.locator(SELECTORS.SEARCH_FORM).first().waitFor({ state: "hidden", timeout });
      return true;
    } catch {
      return false;
    }
  }

  /** Toggles the "Request Split Ticket" checkbox */
  async toggleSplitTicketCheckbox() {
    await this.page.click(SELECTORS.SPLIT_TICKET_CHECKBOX);
  }

  /**
   * Selects the "Return" trip type — UK Rail's name for a round trip. Clicked explicitly even
   * though evolvi-search-inputs.ts already defaults railInfo.tripType to 'return', so the search
   * does not silently depend on that default staying put.
   *
   * @param {number} [timeout=30000]
   */
  async selectReturnTripType(timeout = 30000) {
    const returnRadio = this.page.locator(SELECTORS.RETURN_TRIP_TYPE_RADIO);
    await returnRadio.waitFor({ state: "visible", timeout });
    await returnRadio.click();
  }

  /**
   * Opens the traveller-count select in the UK Rail search form and waits for its options to render.
   *
   * @param {number} [timeout=30000]
   */
  async openTravelersCountDropdown(timeout = 30000) {
    const select = this.page.locator(SELECTORS.TRAVELERS_COUNT_SELECT).first();
    await select.waitFor({ state: "visible", timeout });
    await select.click();
    await this.page
      .locator(SELECTORS.TRAVELERS_COUNT_OPTION)
      .first()
      .waitFor({ state: "visible", timeout });
  }

  /**
   * Reads the label of every option the open traveller-count select currently offers
   * (e.g. ["3 Traveller", "4 Traveller", "5 Traveller"]).
   *
   * @returns {Promise<string[]>} Option labels in the order they are rendered
   */
  async getTravelersCountOptionLabels() {
    const labels = await this.page
      .locator(SELECTORS.TRAVELERS_COUNT_OPTION)
      .allTextContents();
    return labels.map((label) => normalizeText(label)).filter(Boolean);
  }

  /**
   * Closes the traveller-count select without changing the selection, so a later step is not left
   * clicking through an open popper.
   *
   * @param {number} [timeout=10000]
   */
  async closeTravelersCountDropdown(timeout = 10000) {
    await this.page.keyboard.press("Escape");
    await this.page
      .locator(SELECTORS.TRAVELERS_COUNT_OPTION)
      .first()
      .waitFor({ state: "hidden", timeout })
      .catch(() => {});
  }

  /**
   * Reads whether the "Request Split Ticket" checkbox is currently ticked.
   *
   * @param {number} [timeout=30000]
   * @returns {Promise<boolean>}
   */
  async isSplitTicketCheckboxChecked(timeout = 30000) {
    const checkbox = this.page.locator(SELECTORS.SPLIT_TICKET_CHECKBOX).first();
    await checkbox.waitFor({ state: "visible", timeout });
    return checkbox.isChecked();
  }

  /**
   * Reads whether a checkbox in the UK Rail search form is on screen and already ticked, addressed
   * by its rendered label.
   *
   * Answers with a `visible` flag instead of throwing when the checkbox never appears, so the
   * calling assertion can report "not displayed" as the failure rather than surfacing a raw locator
   * timeout that says nothing about which checkbox was missing.
   *
   * @param {string} label - The checkbox label as rendered, e.g. "Request Split Ticket"
   * @param {number} [timeout=30000]
   * @returns {Promise<{visible: boolean, checked: boolean}>}
   */
  async readSearchCheckboxState(label, timeout = 30000) {
    if (!label || typeof label !== "string") {
      throw new Error(
        `[EvolviSearchPage.readSearchCheckboxState] "label" must be a non-empty string, got: ${label}`,
      );
    }

    const trackId = SEARCH_CHECKBOX_TRACK_IDS[label];
    if (!trackId) {
      throw new Error(
        `[EvolviSearchPage.readSearchCheckboxState] "${label}" is not a known UK Rail search ` +
          `checkbox. Known labels: ${Object.keys(SEARCH_CHECKBOX_TRACK_IDS).join(", ")}. Add its ` +
          `data-track attribute to SEARCH_CHECKBOX_TRACK_IDS rather than matching on label text, ` +
          `which is localized.`,
      );
    }

    const checkbox = this.page.locator(searchCheckbox(trackId)).first();
    const visible = await checkbox
      .waitFor({ state: "visible", timeout })
      .then(() => true)
      .catch(() => false);

    return { visible, checked: visible ? await checkbox.isChecked() : false };
  }

  /**
   * Reads whether the SplitTix glyph is displayed next to the "Request Split Ticket" checkbox.
   *
   * @param {number} [timeout=30000]
   * @returns {Promise<boolean>}
   */
  async isSplitTicketIconVisible(timeout = 30000) {
    const icon = this.page.locator(SELECTORS.SPLIT_TICKET_ICON).first();
    return icon
      .waitFor({ state: "visible", timeout })
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Hovers the info icon beside the "Request Split Ticket" checkbox and returns the tooltip's
   * description text.
   *
   * Element Plus mounts the popper at body level on the first pointer-enter, so a single hover can
   * lose the race when the form is still settling — the retry re-arms the pointer from a neutral
   * position, the same way HotelLevelResultsPage.hoverAgreementLabelAndGetTooltip does.
   *
   * @param {number} [timeout=10000]
   * @returns {Promise<string>} The tooltip description text
   */
  async hoverSplitTicketInfoAndGetDescription(timeout = 10000) {
    const trigger = this.page.locator(SELECTORS.SPLIT_TICKET_INFO_TRIGGER).first();
    await trigger.waitFor({ state: "visible", timeout: 30000 });
    await trigger.scrollIntoViewIfNeeded().catch(() => {});
    await trigger.hover();

    const description = this.page
      .locator(SELECTORS.SPLIT_TICKET_INFO_TOOLTIP_DESCRIPTION)
      .first();
    try {
      await description.waitFor({ state: "visible", timeout });
    } catch {
      await this.page.mouse.move(0, 0);
      await this.page.waitForTimeout(300);
      await trigger.hover();
      await description.waitFor({ state: "visible", timeout });
    }
    return ((await description.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  /**
   * Selects one of the split-type radio buttons inside Advanced search by its rendered label.
   *
   * @param {string} label - e.g. "Split at calling stations"
   * @param {number} [timeout=30000]
   */
  async selectSplitTicketTypeRadio(label, timeout = 30000) {
    if (!label || typeof label !== "string") {
      throw new Error(
        `[EvolviSearchPage.selectSplitTicketTypeRadio] "label" must be a non-empty string, got: ${label}`,
      );
    }
    const radio = this.page.locator(SELECTORS.SPLIT_TICKET_TYPE_RADIO(label)).first();
    try {
      await radio.waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[EvolviSearchPage.selectSplitTicketTypeRadio] The "${label}" split-type radio never became ` +
          "visible. It only renders inside an expanded Advanced search while the " +
          `"Request Split Ticket" checkbox is ticked. Original: ${err.message}`,
      );
    }
    await radio.scrollIntoViewIfNeeded().catch(() => {});
    await radio.click();
  }

  /**
   * Hovers the info icon inside the split-type radio group and returns the tooltip's full text.
   *
   * The one tooltip describes BOTH split types (splitAtBoard + splitAtBoardInfo, then
   * splitAtCallingStations + splitAtCallingStationsInfo), so the whole text is returned and the
   * caller asserts on the line it cares about.
   *
   * @param {number} [timeout=10000]
   * @returns {Promise<string>} The tooltip text
   */
  async hoverSplitTicketTypeInfoAndGetTooltipText(timeout = 10000) {
    const trigger = this.page.locator(SELECTORS.SPLIT_TICKET_TYPE_INFO_ICON).first();
    await trigger.waitFor({ state: "visible", timeout: 30000 });
    await trigger.scrollIntoViewIfNeeded().catch(() => {});
    await trigger.hover();

    const tooltip = this.page.locator(SELECTORS.SPLIT_TICKET_TYPE_TOOLTIP).first();
    try {
      await tooltip.waitFor({ state: "visible", timeout });
    } catch {
      await this.page.mouse.move(0, 0);
      await this.page.waitForTimeout(300);
      await trigger.hover();
      await tooltip.waitFor({ state: "visible", timeout });
    }
    return ((await tooltip.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  /**
   * Opens the rail-card select for a given traveller row and waits for its options to render.
   *
   * @param {number} travelerIndex - 0-based traveller row
   * @param {number} [timeout=30000]
   */
  async openRailcardDropdown(travelerIndex, timeout = 30000) {
    const select = this.page.locator(SELECTORS.RAILCARD_SELECT).nth(travelerIndex);
    await select.waitFor({ state: "visible", timeout });

    // A prior traveller's railcard select re-flows this container (rows above/below shift as their
    // el-select fills with a value), so this row's own select can still be settling into its final
    // position right as we click it — Playwright's stability check then sees it move mid-click and
    // times out even though a real click at that point would have landed fine. Same fallback pattern
    // as SearchPage.clickCalendarNextArrow: force the click once normal actionability gives up.
    try {
      await select.click({ timeout: 5000 });
    } catch (error) {
      if (!(error instanceof Error) || !/not stable|intercepts pointer events|timeout/i.test(error.message)) {
        throw error;
      }
      await select.click({ force: true, timeout: 5000 });
    }

    await this.page
      .locator(SELECTORS.OPEN_POPPER_OPTION)
      .first()
      .waitFor({ state: "visible", timeout });
  }

  /**
   * Clicks the option matching the given text in the currently open rail-card/traveller-count
   * popper (both share the same app-select-popper markup).
   *
   * @param {string} optionText - Exact option label, e.g. "YNG - 16-25 Railcard"
   * @param {number} [timeout=15000]
   */
  async selectOpenPopperOption(optionText, timeout = 15000) {
    const option = this.page
      .locator(SELECTORS.OPEN_POPPER_OPTION)
      .filter({ hasText: optionText })
      .first();
    await option.waitFor({ state: "visible", timeout });

    // app-select (evolvi-search-inputs.vue) closes the popper (blur()) the instant Vue processes the
    // option's select event — which can start tearing down the popper mid-click, before Playwright's
    // own hover/stability check finishes. A real user's click still lands (the app reacts on
    // mousedown), but Playwright's synthetic click keeps re-checking stability and eventually sees the
    // option go from "not stable" to "not visible" without ever completing — same race documented in
    // SearchPage.clickCalendarNextArrow. Force the click once normal actionability gives up so the
    // pointer event dispatches immediately instead of waiting out a close animation that never settles.
    try {
      await option.click({ timeout: 5000 });
    } catch (error) {
      if (!(error instanceof Error) || !/not stable|not visible|intercepts pointer events|timeout/i.test(error.message)) {
        throw error;
      }
      await this.page
        .locator(SELECTORS.OPEN_POPPER_OPTION)
        .filter({ hasText: optionText })
        .first()
        .click({ force: true, timeout: 5000 })
        .catch(() => {});
    }
  }
}

module.exports = {
  EvolviSearchPage,
  SELECTORS,
};
