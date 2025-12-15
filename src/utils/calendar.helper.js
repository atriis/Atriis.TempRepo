/**
 * Calendar helper
 *
 * Reusable UI patterns for selecting dates from the calendar.
 * This file does NOT know about hotel/flight/rail rules — only how to click dates.
 *
 * Supported strategies:
 * 1) Nth-available selection (robust for CI)
 * 2) Fixed-date selection (deterministic) via a configurable selector builder
 */

const { SELECTORS } = require('../pages/SearchPage');

/**
 * Selects dates from the currently open calendar using "nth available day" logic.
 *
 * @param {Object} page
 * @param {Object} opts
 * @param {number} [opts.startIndex=0] - index for the first click (usually 0)
 * @param {number|null} [opts.endIndex=null] - index for the second click; if null, selects only one date (one-way)
 */
async function selectDatesByNthAvailable(page, { startIndex = 0, endIndex = null } = {}) {
  if (startIndex < 0) throw new Error(`startIndex must be >= 0. Got ${startIndex}`);
  if (endIndex !== null && endIndex < 0) throw new Error(`endIndex must be >= 0. Got ${endIndex}`);

  // Calendar must already be open before calling this helper
  const picker = page.locator(SELECTORS.DATE_PICKER_PANEL).first();
  const monthTable = picker.locator(SELECTORS.DATE_PICKER_MONTH_TABLE).first();
  const days = monthTable.locator(SELECTORS.DATE_PICKER_AVAILABLE_DAY_CELL);

  // Ensure we have enough selectable dates for requested indices
  const count = await days.count();
  const maxIndexNeeded = endIndex === null ? startIndex : Math.max(startIndex, endIndex);

  if (count <= maxIndexNeeded) {
    throw new Error(`Not enough available dates. Found ${count}, need at least ${maxIndexNeeded + 1}.`);
  }

  // Select start date
  const start = days.nth(startIndex);
  await start.waitFor({ state: 'visible' });
  await start.click();

  // If no end date needed (one-way flows), stop here
  if (endIndex === null) return;

  // Select end date
  const end = days.nth(endIndex);
  await end.waitFor({ state: 'visible' });
  await end.click();
}

/**
 * Default selector builder for fixed-date selection.
 *
 * IMPORTANT:
 * Replace this implementation to match your calendar DOM (data attributes, aria-labels, etc.).
 *
 * @param {string} dateStr - date in the format YOUR CALENDAR EXPECTS (example: "2025-04-19")
 * @returns {string} selector for the calendar day cell
 */
function defaultDateSelectorBuilder(dateStr) {
  // [Unverified] Example selector only. Update to match your app.
  return `[data-date="${dateStr}"]`;
}

/**
 * Selects dates by explicit (hardcoded) date values.
 * Assumes the calendar is open.
 *
 * @param {Object} page
 * @param {Object} opts
 * @param {string} opts.startDate - required
 * @param {string|null} [opts.endDate=null] - optional
 * @param {(dateStr:string)=>string} [opts.dateSelectorBuilder] - optional override for how to locate a day cell
 */
async function selectDatesByValue(
  page,
  { startDate, endDate = null, dateSelectorBuilder = defaultDateSelectorBuilder } = {}
) {
  if (!startDate) {
    throw new Error('startDate is required when using fixed-date selection');
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
  defaultDateSelectorBuilder, // exported so you can reuse/replace in tests if you want
};
