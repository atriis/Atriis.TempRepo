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

const MONTH_NAME_TO_INDEX = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

function getMonthIndex(monthToken) {
  const normalizedMonthToken = monthToken.toLowerCase().replace(/\./g, "").trim();
  const monthIndex = MONTH_NAME_TO_INDEX[normalizedMonthToken];

  if (monthIndex === undefined) {
    throw new Error(`Unsupported month token: "${monthToken}"`);
  }

  return monthIndex;
}

function parseDateValue(dateValue) {
  if (!dateValue || typeof dateValue !== "string") {
    throw new Error(`dateValue must be a non-empty string, got: ${typeof dateValue}`);
  }

  const trimmedDateValue = dateValue.trim();

  const ddMmYyyyMatch = trimmedDateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddMmYyyyMatch) {
    const [, day, month, year] = ddMmYyyyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const yyyyMmDdMatch = trimmedDateValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyyMmDdMatch) {
    const [, year, month, day] = yyyyMmDdMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const dayMonthYearMatch = trimmedDateValue.match(/^(?:[A-Za-z]{3,9},\s*)?(\d{1,2})\s+([A-Za-z]{3,9})\.?\s*,?\s*(\d{4})?$/);
  if (dayMonthYearMatch) {
    const [, day, monthToken, year = String(new Date().getFullYear())] = dayMonthYearMatch;
    return new Date(Number(year), getMonthIndex(monthToken), Number(day));
  }

  const monthDayYearMatch = trimmedDateValue.match(/^(?:[A-Za-z]{3,9},\s*)?([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:,\s*|\s+)?(\d{4})?$/);
  if (monthDayYearMatch) {
    const [, monthToken, day, year = String(new Date().getFullYear())] = monthDayYearMatch;
    return new Date(Number(year), getMonthIndex(monthToken), Number(day));
  }

  const nativeDate = new Date(trimmedDateValue);
  if (!Number.isNaN(nativeDate.getTime())) {
    return new Date(nativeDate.getFullYear(), nativeDate.getMonth(), nativeDate.getDate());
  }

  throw new Error(`Unsupported date value format: "${dateValue}"`);
}

function parseMonthHeaderLabel(monthHeaderLabel) {
  const normalizedMonthHeaderLabel = monthHeaderLabel.replace(/,/g, " ").replace(/\s+/g, " ").trim();

  const monthYearMatch = normalizedMonthHeaderLabel.match(/^([A-Za-z]{3,9})\.?\s+(\d{4})$/);
  if (monthYearMatch) {
    const [, monthToken, year] = monthYearMatch;
    return { monthIndex: getMonthIndex(monthToken), year: Number(year) };
  }

  const yearMonthMatch = normalizedMonthHeaderLabel.match(/^(\d{4})\s+([A-Za-z]{3,9})\.?$/);
  if (yearMonthMatch) {
    const [, year, monthToken] = yearMonthMatch;
    return { monthIndex: getMonthIndex(monthToken), year: Number(year) };
  }

  throw new Error(`Unsupported month header label: "${monthHeaderLabel}"`);
}

async function getVisibleMonthHeaderLabels(panel) {
  const rangeHeaderLabels = panel.locator(SELECTORS.DATE_RANGE_HEADER_LABEL);
  const rangeHeaderCount = await rangeHeaderLabels.count();

  if (rangeHeaderCount > 0) {
    const rangeHeaderTexts = (await rangeHeaderLabels.allTextContents())
      .map((text) => text.trim())
      .filter((text) => text.length > 0);

    if (rangeHeaderTexts.length > 0) {
      return rangeHeaderTexts;
    }
  }

  const singlePickerHeaderLabels = panel.locator(SELECTORS.DATE_PICKER_HEADER_LABEL);
  const singlePickerHeaderCount = await singlePickerHeaderLabels.count();

  if (singlePickerHeaderCount > 0) {
    const singlePickerHeaderTexts = (await singlePickerHeaderLabels.allTextContents())
      .map((text) => text.trim())
      .filter((text) => text.length > 0);

    if (singlePickerHeaderTexts.length > 0) {
      return singlePickerHeaderTexts;
    }
  }

  throw new Error("Could not read visible date picker month labels");
}

async function getVisibleMonthTableIndex(page, targetDate) {
  const panel = page.locator(SELECTORS.DATE_PICKER_PANEL).last();
  await panel.waitFor({ state: "visible", timeout: 10000 });

  const visibleMonthHeaderLabels = await getVisibleMonthHeaderLabels(panel);
  for (let index = 0; index < visibleMonthHeaderLabels.length; index++) {
    const visibleMonth = parseMonthHeaderLabel(visibleMonthHeaderLabels[index]);
    if (
      visibleMonth.year === targetDate.getFullYear()
      && visibleMonth.monthIndex === targetDate.getMonth()
    ) {
      return index;
    }
  }

  return -1;
}

async function clickNextVisibleMonth(page) {
  const nextArrow = page.locator(SELECTORS.DATE_PICKER_CALENDAR_NEXT_ARROW).first();
  await nextArrow.waitFor({ state: "visible", timeout: 10000 });
  await nextArrow.scrollIntoViewIfNeeded().catch(() => {});

  try {
    await nextArrow.click({ timeout: 3000 });
  } catch (error) {
    if (!(error instanceof Error) || !/not stable|intercepts pointer events|timeout/i.test(error.message)) {
      throw error;
    }

    await nextArrow.click({ force: true, timeout: 3000 });
  }
}

async function advanceCalendarUntilMonthVisible(page, targetDate, maxMonthAdvances = 24) {
  for (let attempt = 0; attempt <= maxMonthAdvances; attempt++) {
    const visibleMonthTableIndex = await getVisibleMonthTableIndex(page, targetDate);
    if (visibleMonthTableIndex >= 0) {
      return visibleMonthTableIndex;
    }

    if (attempt === maxMonthAdvances) {
      break;
    }

    await clickNextVisibleMonth(page);
  }

  throw new Error(
    `Target month ${targetDate.getMonth() + 1}/${targetDate.getFullYear()} was not visible after ${maxMonthAdvances} calendar advances.`,
  );
}

async function clickDayInVisibleMonth(page, targetDate, monthTableIndex) {
  const panel = page.locator(SELECTORS.DATE_PICKER_PANEL).last();
  const monthTable = panel.locator(SELECTORS.DATE_PICKER_MONTH_TABLE).nth(monthTableIndex);
  const dayNumber = String(targetDate.getDate());
  const dayCell = monthTable
    .locator(SELECTORS.DATE_PICKER_AVAILABLE_DAY_CELL, { hasText: new RegExp(`^${dayNumber}$`) })
    .first();

  await dayCell.waitFor({ state: "visible", timeout: 10000 });
  await dayCell.click();
}

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
  await start.waitFor({ state: "visible", timeout: 15000 });
  await start.click({ force: true });

  // One-way flows stop here
  if (endIndex === null) return;

  // Select the end date
  const end = days.nth(endIndex);
  await end.waitFor({ state: "visible", timeout: 15000 });
  await end.click({ force: true });
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

async function selectDatesByInputValues(
  page,
  {
    startDateValue,
    endDateValue = undefined,
  } = {},
) {
  const startDate = parseDateValue(startDateValue);
  const endDate = endDateValue ? parseDateValue(endDateValue) : undefined;

  const startMonthTableIndex = await advanceCalendarUntilMonthVisible(page, startDate);
  await clickDayInVisibleMonth(page, startDate, startMonthTableIndex);

  if (!endDate) {
    return;
  }

  const endMonthTableIndex = await advanceCalendarUntilMonthVisible(page, endDate);
  await clickDayInVisibleMonth(page, endDate, endMonthTableIndex);
}

/**
 * Selects a round-trip date pair from next month: the Nth occurrence of a specific
 * weekday as the outbound date and the next calendar day as the inbound date.
 *
 * Navigates to next month with the forward arrow, then clicks both dates in order.
 *
 * @param {Object} page - Playwright page instance
 * @param {Object} opts
 * @param {string} opts.dayOfWeek - Day name: "monday","tuesday","wednesday","thursday","friday","saturday","sunday"
 * @param {number} [opts.nth=1] - Which occurrence to select as outbound (1 = first, 2 = second, etc.)
 */
async function selectRoundTripDatesOnNthWeekday(page, { dayOfWeek, nth = 1 } = {}) {
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

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  let count = 0;
  let outboundDayNumber = null;
  for (let d = 1; d <= 31; d++) {
    const candidate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), d);
    if (candidate.getMonth() !== nextMonth.getMonth()) break;
    if (candidate.getDay() === targetDay) {
      count++;
      if (count === nth) {
        outboundDayNumber = d;
        break;
      }
    }
  }
  if (outboundDayNumber === null) {
    throw new Error(`Could not find ${nth} ${dayOfWeek} in next month`);
  }

  // Confirm next day still falls within the same month so both cells exist in the same picker view
  const inboundCandidate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), outboundDayNumber + 1);
  if (inboundCandidate.getMonth() !== nextMonth.getMonth()) {
    throw new Error(`Outbound ${dayOfWeek} (${outboundDayNumber}) is the last day of next month; next day would spill into following month`);
  }

  const nextArrow = page.locator(SELECTORS.DATE_PICKER_CALENDAR_NEXT_ARROW).first();
  await nextArrow.waitFor({ state: 'visible', timeout: 10000 });
  await nextArrow.click();

  await selectDatesByNthAvailable(page, {
    startIndex: outboundDayNumber - 1,
    endIndex: outboundDayNumber,
  });
}

module.exports = {
  selectDatesByNthAvailable,
  selectDatesByNthAvailableFromNextVisibleMonth,
  selectDatesByInputValues,
  selectTodayFromVisibleCalendar,
  selectNthWeekdayFromNextMonth,
  selectRoundTripDatesOnNthWeekday,
};
