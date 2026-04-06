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
 * @param {string} [opts.pickerPosition="first"] - which date picker to use ("first" or "last")
 * @param {number} [opts.monthTableIndex=0] - which month table to try first (0-based)
 * @throws {Error} If indices are invalid or if there are not enough available dates
 */
async function selectDatesByNthAvailable(
  page,
  { startIndex = 0, endIndex = null, pickerPosition = "first", monthTableIndex = 0 } = {},
) {
  if (startIndex < 0) {
    throw new Error(`startIndex must be >= 0. Received: ${startIndex}`);
  }

  if (endIndex !== null && endIndex < 0) {
    throw new Error(`endIndex must be >= 0. Received: ${endIndex}`);
  }

  if (pickerPosition !== "first" && pickerPosition !== "last") {
    throw new Error(
      `pickerPosition must be either "first" or "last". Received: ${pickerPosition}`,
    );
  }

  if (!Number.isInteger(monthTableIndex) || monthTableIndex < 0) {
    throw new Error(
      `monthTableIndex must be an integer >= 0. Received: ${monthTableIndex}`,
    );
  }

  // The calendar must already be open before calling this helper
  const pickers = page.locator(SELECTORS.DATE_PICKER_PANEL);
  const picker = pickerPosition === "last" ? pickers.last() : pickers.first();
  const maxIndexNeeded =
    endIndex === null ? startIndex : Math.max(startIndex, endIndex);

  const monthTables = picker.locator(SELECTORS.DATE_PICKER_MONTH_TABLE);
  const tableCount = await monthTables.count();

  if (tableCount === 0) {
    throw new Error("Date picker month table not found.");
  }

  let days = null;
  let count = 0;

  // Try the requested month-table first, then fallback to other tables in the same picker.
  for (let i = 0; i < tableCount; i++) {
    const tableIndex = (monthTableIndex + i) % tableCount;
    const candidateDays = monthTables
      .nth(tableIndex)
      .locator(SELECTORS.DATE_PICKER_AVAILABLE_DAY_CELL);
    const candidateCount = await candidateDays.count();

    if (candidateCount > maxIndexNeeded) {
      days = candidateDays;
      count = candidateCount;
      break;
    }

    if (candidateCount > count) {
      days = candidateDays;
      count = candidateCount;
    }
  }

  if (count <= maxIndexNeeded) {
    throw new Error(
      `Not enough available dates in the calendar. Found ${count}, need at least ${maxIndexNeeded + 1}. (pickerPosition=${pickerPosition}, monthTableCount=${tableCount})`,
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

/**
 * Selects the Nth occurrence of a specific weekday from next month in the calendar.
 * Clicks the forward arrow once to navigate to next month, then selects the date.
 * Works with both single-month and dual-month calendar pickers.
 *
 * @param {Object} page - Playwright page instance
 * @param {Object} opts
 * @param {string} opts.dayOfWeek - Day name: "monday","tuesday","wednesday","thursday","friday","saturday","sunday"
 * @param {number} [opts.nth=1] - Which occurrence to select (1 = first, 2 = second, etc.)
 */
async function selectNthWeekdayFromNextMonth(page, { dayOfWeek, nth = 1 } = {}) {
  if (!dayOfWeek || typeof dayOfWeek !== 'string') {
    throw new Error('dayOfWeek must be a non-empty string');
  }
  if (!Number.isInteger(nth) || nth < 1) {
    throw new Error(`nth must be a positive integer, got: ${nth}`);
  }

  const dayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  const targetDay = dayMap[dayOfWeek.toLowerCase()];
  if (targetDay === undefined) {
    throw new Error(`Invalid dayOfWeek "${dayOfWeek}". Use: ${Object.keys(dayMap).join(', ')}`);
  }

  // Calculate which day number (1-based) the Nth weekday falls on in the next month
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  let count = 0;
  let dayNumber = null;
  for (let d = 1; d <= 31; d++) {
    const candidate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), d);
    if (candidate.getMonth() !== nextMonth.getMonth()) break;
    if (candidate.getDay() === targetDay) {
      count++;
      if (count === nth) {
        dayNumber = d;
        break;
      }
    }
  }
  if (dayNumber === null) {
    throw new Error(`Could not find ${nth}${nth === 1 ? 'st' : nth === 2 ? 'nd' : nth === 3 ? 'rd' : 'th'} ${dayOfWeek} in next month`);
  }

  // Navigate to next month with the forward arrow
  const nextArrow = page.locator(SELECTORS.DATE_PICKER_CALENDAR_NEXT_ARROW).first();
  await nextArrow.waitFor({ state: 'visible', timeout: 10000 });
  await nextArrow.click();

  // dayNumber is 1-based, available cells are 0-indexed → index = dayNumber - 1
  const index = dayNumber - 1;

  await selectDatesByNthAvailable(page, { startIndex: index });
}

/**
 * Selects today's visible available date from the currently open calendar.
 *
 * This is used for short-notice / same-day scenarios where the UI must keep
 * the departure date on the current day rather than using the default nth-available strategy.
 *
 * @param {Object} page - Playwright page instance
 * @param {Object} opts
 * @param {string} [opts.pickerPosition="first"] - which visible picker to use ("first" or "last")
 * @param {number} [opts.monthTableIndex=0] - preferred month table index inside the picker
 */
async function selectTodayFromVisibleCalendar(
  page,
  { pickerPosition = "first", monthTableIndex = 0 } = {},
) {
  if (pickerPosition !== "first" && pickerPosition !== "last") {
    throw new Error(
      `pickerPosition must be either "first" or "last". Received: ${pickerPosition}`,
    );
  }

  if (!Number.isInteger(monthTableIndex) || monthTableIndex < 0) {
    throw new Error(
      `monthTableIndex must be an integer >= 0. Received: ${monthTableIndex}`,
    );
  }

  const pickers = page.locator(SELECTORS.DATE_PICKER_PANEL);
  const picker = pickerPosition === "last" ? pickers.last() : pickers.first();
  const monthTables = picker.locator(SELECTORS.DATE_PICKER_MONTH_TABLE);
  const tableCount = await monthTables.count();

  if (tableCount === 0) {
    throw new Error("Date picker month table not found.");
  }

  for (let i = 0; i < tableCount; i++) {
    const tableIndex = (monthTableIndex + i) % tableCount;
    const todayCell = monthTables
      .nth(tableIndex)
      .locator(SELECTORS.DATE_PICKER_TODAY_AVAILABLE_DAY_CELL)
      .first();

    if (await todayCell.count() > 0) {
      await todayCell.waitFor({ state: "visible", timeout: 10000 });
      await todayCell.click();
      return;
    }
  }

  throw new Error("Could not find a visible available date cell for today in the open calendar.");
}

module.exports = {
  selectDatesByNthAvailable,
  selectDatesByNthAvailableFromNextVisibleMonth,
  selectDatesByValue,
  selectTodayFromVisibleCalendar,
  selectNthWeekdayFromNextMonth,
  defaultDateSelectorBuilder,
};
