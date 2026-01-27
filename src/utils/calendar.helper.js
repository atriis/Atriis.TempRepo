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

const { SELECTORS } = require('@pages/SearchPage');

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
  { startIndex = 0, endIndex = null } = {}
) {
  if (startIndex < 0) {
    throw new Error(`startIndex must be >= 0. Received: ${startIndex}`);
  }

  if (endIndex !== null && endIndex < 0) {
    throw new Error(`endIndex must be >= 0. Received: ${endIndex}`);
  }

  // The calendar must already be open before calling this helper
  const picker = page.locator(SELECTORS.DATE_PICKER_PANEL).first();
  await picker.waitFor({ state: 'visible' });

  const monthTable = picker.locator(SELECTORS.DATE_PICKER_MONTH_TABLE).first();

  // This is still your existing selector:
  // "td.available .el-date-table-cell__text"
  const dayTexts = monthTable.locator(SELECTORS.DATE_PICKER_AVAILABLE_DAY_CELL);

  const count = await dayTexts.count();
  const maxIndexNeeded =
    endIndex === null ? startIndex : Math.max(startIndex, endIndex);

  if (count <= maxIndexNeeded) {
    throw new Error(
      `Not enough available dates in the calendar. Found ${count}, need at least ${maxIndexNeeded + 1}.`
    );
  }

  const clickDayByIndex = async (idx) => {
    const text = dayTexts.nth(idx);
    await text.waitFor({ state: 'visible' });

    // Click the parent <td> (more stable than clicking the <span>)
    const cell = text.locator('..');

    await cell.scrollIntoViewIfNeeded();
    await cell.click({ timeout: 15000 });
  };

  // Select the start date
  await clickDayByIndex(startIndex);

  // One-way flows stop here
  if (endIndex === null) return;

  // Select the end date
  await clickDayByIndex(endIndex);
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
  } = {}
) {
  if (!startDate) {
    throw new Error(
      'startDate is required when using fixed-date calendar selection'
    );
  }

  if (typeof dateSelectorBuilder !== 'function') {
    throw new Error('dateSelectorBuilder must be a function');
  }

  const startSelector = dateSelectorBuilder(startDate);
  const start = page.locator(startSelector).first();

  await start.waitFor({ state: 'visible' });
  await start.click();

  if (!endDate) return;

  const endSelector = dateSelectorBuilder(endDate);
  const end = page.locator(endSelector).first();

  await end.waitFor({ state: 'visible' });
  await end.click();
}

module.exports = {
  selectDatesByNthAvailable,
  selectDatesByValue,
  defaultDateSelectorBuilder,
};