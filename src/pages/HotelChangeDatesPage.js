const { toNumber } = require("@utils/numbers");

/**
 * Page Object for the hotel "Change Dates" modification page.
 *
 * Reached from the cart by opening the hotel quote's 3-dots menu and clicking
 * "Change Dates". The page lives at
 * `/trips/{tripId}/quote-change/hotel/{quoteId}` and is guarded by a router
 * history-state flag, so it can only be reached by clicking through the menu —
 * never by navigating to the URL directly.
 *
 * Contains only UI-level interactions (locators + atomic actions). Business
 * flow and assertions live in the HotelChangeDates DSL / step layer.
 *
 * No `data-testid` exists anywhere on this flow, so locators are text / role /
 * CSS-class based (verified against ../Atriis.App hotel-change-dates and
 * hotel-change-dates-result components).
 */

const SELECTORS = {
  PAGE_ROOT: ".hotel-change-dates",
  PAGE_TITLE: ".hotel-change-dates h2.title",
  // Element-Plus range editor rendered by <app-daterange> on the page.
  DATE_RANGE_EDITOR: ".hotel-change-dates .el-range-editor",
  DATE_RANGE_INPUT: ".hotel-change-dates input.el-range-input",
  CHECK_AVAILABILITY_BUTTON: ".hotel-change-dates button",
  AVAILABILITY_TITLE: ".hotel-change-dates p.title",
  NEW_DATE_RANGE: ".hotel-change-dates .date-range",
  RESULT_ROOT: ".hotel-change-dates-result",
  PRICE_BREAKDOWN: ".hotel-change-dates-result .price-breakdown",
  PRICE_VALUE: ".hotel-change-dates-result .price-breakdown .price-value",
  DELTA_VALUE: ".hotel-change-dates-result .price-breakdown .delta-value",
  CONTINUE_BUTTON: ".hotel-change-dates-result .continue-btn",
};

const CHECK_AVAILABILITY_LABEL = "Check Availability";
const CONTINUE_LABEL = "Continue";
const AVAILABILITY_HEADING = "Availability";

class HotelChangeDatesPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Waits for the Change Dates page to render (title + URL confirm we navigated
   * in the same tab).
   * @param {object} [options]
   * @param {number} [options.timeout=30000]
   */
  async waitForPage({ timeout = 30000 } = {}) {
    await this.page.locator(SELECTORS.PAGE_TITLE).first().waitFor({ state: "visible", timeout });
  }

  /** @returns {Promise<boolean>} true if the URL is the change-dates route */
  async isOnChangeDatesUrl() {
    return /\/quote-change\/hotel\//.test(this.page.url());
  }

  /** @returns {Promise<string>} the page title text (expected "Change Dates") */
  async getPageTitleText({ timeout = 15000 } = {}) {
    const el = this.page.locator(SELECTORS.PAGE_TITLE).first();
    await el.waitFor({ state: "visible", timeout });
    return ((await el.innerText()) ?? "").trim();
  }

  /**
   * Opens the date-range picker by clicking the range editor.
   */
  async openDateRangePicker() {
    const editor = this.page.locator(SELECTORS.DATE_RANGE_EDITOR).first();
    await editor.waitFor({ state: "visible", timeout: 15000 });
    await editor.click();
  }

  /**
   * Reads the two range-input values (check-in, check-out) currently shown on
   * the page and returns them joined — used to capture the newly selected dates.
   * @returns {Promise<string>}
   */
  async getSelectedDateRangeText({ timeout = 15000 } = {}) {
    const inputs = this.page.locator(SELECTORS.DATE_RANGE_INPUT);
    await inputs.first().waitFor({ state: "visible", timeout });
    const count = await inputs.count();
    const values = [];
    for (let i = 0; i < count; i++) {
      const value = (await inputs.nth(i).inputValue().catch(() => "")).trim();
      if (value) values.push(value);
    }
    return values.join(" - ");
  }

  /**
   * Clicks the "Check Availability" button (scoped to the page so it never hits
   * a same-labelled button elsewhere).
   */
  async clickCheckAvailability() {
    const button = this.page
      .locator(SELECTORS.CHECK_AVAILABILITY_BUTTON, { hasText: CHECK_AVAILABILITY_LABEL })
      .first();
    await button.waitFor({ state: "visible", timeout: 15000 });
    await button.click();
  }

  /**
   * Waits for the availability result to render — the "Continue" button appearing
   * is the signal the availability round-trip finished. The availability check
   * hits the supplier, so this is bounded generously.
   * @param {object} [options]
   * @param {number} [options.timeout]
   */
  async waitForAvailabilityResult({ timeout = process.env.CI ? 120000 : 90000 } = {}) {
    await this.page.locator(SELECTORS.CONTINUE_BUTTON).first().waitFor({ state: "visible", timeout });
  }

  /** @returns {Promise<string>} the "Availability" heading text on the result panel */
  async getAvailabilityHeadingText({ timeout = 15000 } = {}) {
    const heading = this.page
      .locator(SELECTORS.AVAILABILITY_TITLE, { hasText: AVAILABILITY_HEADING })
      .first();
    await heading.waitFor({ state: "visible", timeout });
    return ((await heading.innerText()) ?? "").trim();
  }

  /** @returns {Promise<string>} the chosen new-dates range text (e.g. "12 Sep - 13 Sep") */
  async getNewDatesRangeText({ timeout = 15000 } = {}) {
    const el = this.page.locator(SELECTORS.NEW_DATE_RANGE).first();
    await el.waitFor({ state: "visible", timeout });
    return ((await el.innerText()) ?? "").trim();
  }

  /** @returns {Promise<string>} the full visible text of the availability result panel */
  async getResultPanelText({ timeout = 15000 } = {}) {
    const panel = this.page.locator(SELECTORS.RESULT_ROOT).first();
    await panel.waitFor({ state: "visible", timeout });
    return ((await panel.innerText()) ?? "").trim();
  }

  /**
   * Reads the three totals from the price breakdown.
   * Order in the DOM: price-value[0] = Original total, price-value[1] = Updated
   * total, delta-value = Difference (parsed as absolute numbers).
   * @returns {Promise<{originalTotal:number, updatedTotal:number, difference:number}>}
   */
  async getAvailabilityTotals({ timeout = 15000 } = {}) {
    const priceValues = this.page.locator(SELECTORS.PRICE_VALUE);
    await priceValues.first().waitFor({ state: "visible", timeout });
    const count = await priceValues.count();
    if (count < 2) {
      throw new Error(`Expected at least 2 price values (original + updated), found ${count}`);
    }
    const originalText = (await priceValues.nth(0).innerText()) ?? "";
    const updatedText = (await priceValues.nth(1).innerText()) ?? "";
    const deltaText = (await this.page.locator(SELECTORS.DELTA_VALUE).first().innerText().catch(() => "")) ?? "";

    return {
      originalTotal: toNumber(originalText, "Original total"),
      updatedTotal: toNumber(updatedText, "Updated total"),
      difference: toNumber(deltaText, "Difference"),
    };
  }

  /**
   * Clicks "Continue" to apply the date modification. Navigation back to the cart
   * is awaited by the caller (DSL) via the cart page.
   */
  async clickContinue() {
    const button = this.page
      .locator(SELECTORS.CONTINUE_BUTTON, { hasText: CONTINUE_LABEL })
      .first();
    await button.waitFor({ state: "visible", timeout: 15000 });
    await button.click();
  }
}

module.exports = { HotelChangeDatesPage, HOTEL_CHANGE_DATES_SELECTORS: SELECTORS };
