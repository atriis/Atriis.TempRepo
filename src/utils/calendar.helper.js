/**
 * Calendar Helper
 *
 * This file contains reusable logic for selecting dates from the UI calendar.
 *
 * IMPORTANT:
 * - This helper does NOT open the calendar
 * - It assumes the calendar is already visible
 * - It contains no product rules (flight, hotel, rail, etc.)
 *
 * Why this exists:
 * - Calendars are one of the most fragile UI components
 * - Centralizing this logic reduces flakiness
 */

const { SELECTORS } = require("@pages/SearchPage");

/**
 * Selects dates using the "nth available day" strategy.
 *
 * Why this strategy is preferred:
 * - Works reliably in CI
 * - Avoids timezone issues
 * - Avoids month boundary problems
 * - Does not depend on real calendar dates
 *
 * Examples:
 * - One-way search → startIndex only
 * - Round-trip search → startIndex + endIndex
 *
 * @param {Object} page - Playwright page instance
 * @param {Object} opts
 * @param {number} [opts.startIndex=0] - index of the first selectable day
 * @param {number|null} [opts.endIndex=null] - index of the second selectable day
 */
async function selectDatesByNthAvailable(
  page,
  { startIndex = 0, endIndex = null } = {},
) {
  if (startIndex < 0) {
    throw new Error(`startIndex must be >= 0. Received: ${startIndex}`);
  }

  if (endIndex !== null && endIndex < 0) {
    throw new Error(`endIndex must be >= 0. Received: ${endIndex}`);
  }

  // The calendar must already be open before calling this helper
  const picker = page.locator(SELECTORS.DATE_PICKER_PANEL).first();
  const monthTable = picker
    .locator(SELECTORS.DATE_PICKER_MONTH_TABLE)
    .first();
  const days = monthTable.locator(
    SELECTORS.DATE_PICKER_AVAILABLE_DAY_CELL,
  );

  // Ensure there are enough selectable days available
  const count = await days.count();

  const maxIndexNeeded =
    endIndex === null ? startIndex : Math.max(startIndex, endIndex);

  if (count <= maxIndexNeeded) {
    throw new Error(
      `Not enough available dates in the calendar. Found ${count}, need at least ${maxIndexNeeded + 1}.`,
    );
  }

  // Select the start date
  const start = days.nth(startIndex);
  await start.waitFor({ state: "visible" });
  await start.click();

  // One-way flows stop here
  if (endIndex === null) return;

  // Select the end date
  const end = days.nth(endIndex);
  await end.waitFor({ state: "visible" });
  await end.click();
}

/**
 * Default selector builder for fixed-date selection.
 *
 * This function converts a date value into a CSS selector
 * that matches a specific calendar day.
 *
 * IMPORTANT:
 * This is only an example.
 * Replace it if your calendar uses different attributes.
 *
 * @param {string} dateStr - date in the format expected by the UI
 * @returns {string} selector for the calendar day
 */
function defaultDateSelectorBuilder(dateStr) {
  // [Unverified] Example selector only.
  return `[data-date="${dateStr}"]`;
}

/**
 * Selects dates using explicit (fixed) date values.
 *
 * When to use this:
 * - Smoke tests
 * - Very specific scenarios
 * - Debugging or demos
 *
 * When NOT to use this:
 * - Large CI matrices
 * - Tests sensitive to date changes
 *
 * @param {Object} page - Playwright page instance
 * @param {Object} opts
 * @param {string} opts.startDate - required
 * @param {string|null} [opts.endDate=null] - optional
 * @param {(dateStr:string)=>string} [opts.dateSelectorBuilder]
 */
async function selectDatesByValue(
  page,
  {
    startDate,
    endDate = null,
    dateSelectorBuilder = defaultDateSelectorBuilder,
  } = {},
) {
  if (!startDate) {
    throw new Error(
      "startDate is required when using fixed-date calendar selection",
    );
  }

  if (typeof dateSelectorBuilder !== "function") {
    throw new Error("dateSelectorBuilder must be a function");
  }

  const startSelector = dateSelectorBuilder(startDate);
  const start = page.locator(startSelector).first();

  await start.waitFor({ state: "visible" });
  await start.click();

  if (!endDate) return;

  const endSelector = dateSelectorBuilder(endDate);
  const end = page.locator(endSelector).first();

  await end.waitFor({ state: "visible" });
  await end.click();
}

/**
 * Selects dates from the SECOND visible month table in the calendar.
 * Use this when the calendar shows two months side-by-side and you want
 * to pick from the next month without clicking the forward arrow.
 *
 * @param {Object} page - Playwright page instance
 * @param {Object} opts
 * @param {number} [opts.startIndex=0] - index of the first selectable day in the second month
 * @param {number|null} [opts.endIndex=null] - index of the second selectable day
 */
async function selectDatesByNthAvailableFromNextVisibleMonth(
  page,
  { startIndex = 0, endIndex = null } = {},
) {
  if (startIndex < 0) {
    throw new Error(`startIndex must be >= 0. Received: ${startIndex}`);
  }
  if (endIndex !== null && endIndex < 0) {
    throw new Error(`endIndex must be >= 0. Received: ${endIndex}`);
  }

  const picker = page.locator(SELECTORS.DATE_PICKER_PANEL).first();
  await picker.waitFor({ state: "visible", timeout: 10000 });
  const monthTables = picker.locator(SELECTORS.DATE_PICKER_MONTH_TABLE);
  await monthTables.nth(1).waitFor({ state: "attached", timeout: 10000 });
  const tableCount = await monthTables.count();
  if (tableCount < 2) {
    throw new Error(
      `Expected at least 2 month tables in the calendar, found ${tableCount}. Cannot select from next visible month.`,
    );
  }

  const secondMonthTable = monthTables.nth(1);
  const days = secondMonthTable.locator(SELECTORS.DATE_PICKER_AVAILABLE_DAY_CELL);
  const count = await days.count();
  const maxIndexNeeded = endIndex === null ? startIndex : Math.max(startIndex, endIndex);

  if (count <= maxIndexNeeded) {
    throw new Error(
      `Not enough available dates in the second month table. Found ${count}, need at least ${maxIndexNeeded + 1}.`,
    );
  }

  const start = days.nth(startIndex);
  await start.waitFor({ state: "visible" });
  await start.click();

  if (endIndex === null) return;

  const end = days.nth(endIndex);
  await end.waitFor({ state: "visible" });
  await end.click();
}

module.exports = {
  selectDatesByNthAvailable,
  selectDatesByNthAvailableFromNextVisibleMonth,
  selectDatesByValue,
  defaultDateSelectorBuilder,
};
