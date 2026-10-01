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

/**
 * Compares a date as rendered by a picker against a target Date, ignoring the display format —
 * the app localises picker formats per language ("20 Dec 2029" vs "Dec 20, 2029").
 * Returns false for anything unparseable (empty field, placeholder text).
 *
 * @param {string} renderedValue - the value read out of a date input
 * @param {Date} targetDate
 * @returns {boolean}
 */
function datesMatch(renderedValue, targetDate) {
  try {
    return parseDateValue(renderedValue).getTime() === targetDate.getTime();
  } catch {
    return false;
  }
}

/**
 * Like datesMatch, but compares only the day of month and the month — for labels that render no
 * year ("30 Nov", "Mon, 30 Nov", "Nov 30"). parseDateValue fills a missing year with the current
 * one, so a full-date comparison would wrongly fail for a target date in the next year.
 * Returns false for anything unparseable.
 *
 * @param {string} renderedValue - the value read out of the UI
 * @param {Date} targetDate
 * @returns {boolean}
 */
function dayAndMonthMatch(renderedValue, targetDate) {
  try {
    const renderedDate = parseDateValue(renderedValue);
    return renderedDate.getDate() === targetDate.getDate() && renderedDate.getMonth() === targetDate.getMonth();
  } catch {
    return false;
  }
}

/**
 * Parses a time as the application renders it into minutes since midnight, so the same instant
 * can be compared across two screens that print it differently.
 *
 * The app resolves its time pattern per user preference (utilService.getUserTimeFormat) and the
 * pickers additionally switch to 12h when the user's units are imperial (app-timepicker
 * `isAmPm`), so a search form reading "02:30 PM" and a cart reading "14:30" are the same time.
 * Accepts "HH:mm", "HH:mm:ss" and "h:mm AM/PM" (any casing, with or without a separating space).
 *
 * @param {string} timeValue - The time as read out of the UI
 * @returns {number} Minutes since midnight (0-1439)
 * @throws {Error} If the value is not one of the supported formats
 */
function parseTimeToMinutes(timeValue) {
  if (!timeValue || typeof timeValue !== "string") {
    throw new Error(
      `[calendar.helper.parseTimeToMinutes] "timeValue" must be a non-empty string, got: ${typeof timeValue}`,
    );
  }

  const trimmedTimeValue = timeValue.trim();
  const timeMatch = trimmedTimeValue.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*([AaPp])\.?[Mm]\.?)?$/);

  if (!timeMatch) {
    throw new Error(
      `[calendar.helper.parseTimeToMinutes] Unsupported time value format: "${timeValue}". `
      + "Expected \"HH:mm\", \"HH:mm:ss\" or \"h:mm AM/PM\" — the field was probably still empty "
      + "or still showing its placeholder.",
    );
  }

  const [, hourToken, minuteToken, meridiemToken] = timeMatch;
  const minute = Number(minuteToken);
  let hour = Number(hourToken);

  if (minute > 59) {
    throw new Error(`[calendar.helper.parseTimeToMinutes] "${timeValue}" has an out-of-range minute: ${minute}`);
  }

  if (meridiemToken) {
    if (hour < 1 || hour > 12) {
      throw new Error(`[calendar.helper.parseTimeToMinutes] "${timeValue}" has an out-of-range 12h hour: ${hour}`);
    }

    hour = (hour % 12) + (/p/i.test(meridiemToken) ? 12 : 0);
  } else if (hour > 23) {
    throw new Error(`[calendar.helper.parseTimeToMinutes] "${timeValue}" has an out-of-range 24h hour: ${hour}`);
  }

  return (hour * 60) + minute;
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

async function clickPrevVisibleMonth(page) {
  const prevArrow = page.locator(SELECTORS.DATE_PICKER_PREV_MONTH_ARROW).first();
  await prevArrow.waitFor({ state: "visible", timeout: 10000 });
  await prevArrow.scrollIntoViewIfNeeded().catch(() => {});

  try {
    await prevArrow.click({ timeout: 3000 });
  } catch (error) {
    if (!(error instanceof Error) || !/not stable|intercepts pointer events|timeout/i.test(error.message)) {
      throw error;
    }

    await prevArrow.click({ force: true, timeout: 3000 });
  }
}

async function clickPrevVisibleYear(page) {
  const prevYearArrow = page.locator(SELECTORS.DATE_PICKER_PREV_YEAR_ARROW).first();
  await prevYearArrow.waitFor({ state: "visible", timeout: 10000 });
  await prevYearArrow.scrollIntoViewIfNeeded().catch(() => {});

  try {
    await prevYearArrow.click({ timeout: 3000 });
  } catch (error) {
    if (!(error instanceof Error) || !/not stable|intercepts pointer events|timeout/i.test(error.message)) {
      throw error;
    }

    await prevYearArrow.click({ force: true, timeout: 3000 });
  }
}

/**
 * Selects a date of birth (a past date) from an already-open single-month date picker that
 * exposes prev/next YEAR arrows (app-datepicker's showYearArrows prop) in addition to the usual
 * month arrows — required because DOB pickers must jump back potentially decades, which the
 * month-by-month `advanceCalendarUntilMonthVisible` strategy (built for near-future booking
 * dates) cannot do in a reasonable number of steps.
 *
 * Typing the date directly into the input is unreliable for these pickers: the visible
 * placeholder ("DD/MM/YYYY") does not match the format the component actually parses on blur
 * (e.g. "DD MMM YYYY"), so a typed value can silently fail to commit. Clicking through the
 * calendar sidesteps that mismatch entirely.
 *
 * @param {Object} page - Playwright page instance
 * @param {string} dateValue - Date of birth, e.g. "20/12/1995" (parsed via parseDateValue)
 */
async function selectDateOfBirthWithYearArrows(page, dateValue) {
  const targetDate = parseDateValue(dateValue);

  const before = await getVisibleSinglePickerMonthAndYear(page);
  const yearsBack = before.year - targetDate.getFullYear();
  if (yearsBack < 0) {
    throw new Error(
      `[selectDateOfBirthWithYearArrows] Target year ${targetDate.getFullYear()} is after the ` +
      `currently visible year ${before.year} — a date of birth cannot be in the future.`,
    );
  }
  for (let i = 0; i < yearsBack; i++) {
    await clickPrevVisibleYear(page);
  }

  const afterYearNav = await getVisibleSinglePickerMonthAndYear(page);
  if (afterYearNav.year !== targetDate.getFullYear()) {
    throw new Error(
      `[selectDateOfBirthWithYearArrows] After ${yearsBack} prev-year click(s), expected year ` +
      `${targetDate.getFullYear()} but the picker shows ${afterYearNav.year}.`,
    );
  }

  const monthDiff = targetDate.getMonth() - afterYearNav.monthIndex;
  if (monthDiff > 0) {
    for (let i = 0; i < monthDiff; i++) {
      await clickNextVisibleMonth(page);
    }
  } else if (monthDiff < 0) {
    for (let i = 0; i < -monthDiff; i++) {
      await clickPrevVisibleMonth(page);
    }
  }

  await clickDayInVisibleMonth(page, targetDate, 0);
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

/**
 * Reads the visible month/year for a single-month date picker whose header renders the
 * year and month as separate elements (e.g. two `.el-date-picker__header-label` spans,
 * one for year and one for month, rather than one combined "Month Year" label).
 *
 * @param {Object} page - Playwright page instance
 * @returns {Promise<{monthIndex: number, year: number}>}
 */
async function getVisibleSinglePickerMonthAndYear(page) {
  const panel = page.locator(SELECTORS.DATE_PICKER_PANEL).last();
  await panel.waitFor({ state: "visible", timeout: 10000 });

  const headerLabels = panel.locator(SELECTORS.DATE_PICKER_HEADER_LABEL);
  const headerTexts = (await headerLabels.allTextContents())
    .map((text) => text.trim())
    .filter((text) => text.length > 0);

  if (headerTexts.length === 0) {
    throw new Error("Could not read visible single date picker header label");
  }

  const combinedHeaderText = headerTexts.join(" ");
  const yearMatch = combinedHeaderText.match(/\d{4}/);
  if (!yearMatch) {
    throw new Error(`Could not find a 4-digit year in header text: "${combinedHeaderText}"`);
  }

  const monthToken = headerTexts.find((text) => /^[A-Za-z]{3,9}\.?$/.test(text));
  if (!monthToken) {
    throw new Error(`Could not find a month name in header text: "${combinedHeaderText}"`);
  }

  return { monthIndex: getMonthIndex(monthToken), year: Number(yearMatch[0]) };
}

/**
 * Advances a single-month date picker (forward arrow) until the target month/year is visible.
 * Use this instead of advanceCalendarUntilMonthVisible when the picker's header splits the
 * year and month into separate elements.
 *
 * @param {Object} page - Playwright page instance
 * @param {Date} targetDate
 * @param {number} [maxMonthAdvances=24]
 * @returns {Promise<number>} monthTableIndex (always 0 for a single-month picker)
 */
async function advanceSinglePickerCalendarUntilMonthVisible(page, targetDate, maxMonthAdvances = 24) {
  for (let attempt = 0; attempt <= maxMonthAdvances; attempt++) {
    const visible = await getVisibleSinglePickerMonthAndYear(page);
    if (visible.year === targetDate.getFullYear() && visible.monthIndex === targetDate.getMonth()) {
      return 0;
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
 * Computes the next calendar date, starting from a given offset in days from today,
 * that does NOT fall on the excluded weekdays (e.g. avoid Friday/Saturday departures
 * for Sabre GDS fares that spike on weekend travel, or airlines like El Al that do not
 * operate over the Israeli Sabbath).
 *
 * This only computes the target date; it does not touch the DOM.
 *
 * @param {Object} [opts]
 * @param {number} [opts.startOffsetDays=1] - how many days from today to start searching
 * @param {string[]} [opts.excludeDaysOfWeek=["friday","saturday"]] - weekday names to avoid
 * @returns {Date} first matching date
 */
function getNextDateExcludingWeekdays(
  { startOffsetDays = 1, excludeDaysOfWeek = ["friday", "saturday"] } = {},
) {
  const dayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  const excludedDayNumbers = excludeDaysOfWeek.map((dayName) => {
    const dayNumber = dayMap[dayName.toLowerCase()];
    if (dayNumber === undefined) {
      throw new Error(`Invalid weekday name "${dayName}". Use: ${Object.keys(dayMap).join(', ')}`);
    }
    return dayNumber;
  });

  const today = new Date();
  for (let offset = startOffsetDays; offset < startOffsetDays + 14; offset++) {
    const candidate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    if (!excludedDayNumbers.includes(candidate.getDay())) {
      return candidate;
    }
  }

  throw new Error(`Could not find a date outside ${excludeDaysOfWeek.join(', ')} within 14 days of offset ${startOffsetDays}`);
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
  // Element Plus mounts the picker popper before the month table paints, so a bare
  // count() can observe zero tables during that render gap and throw spuriously.
  // Wait (bounded) for the first table to appear before treating an empty set as a failure.
  await monthTables.first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
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
  // The picker popper can mount before its month table paints; wait (bounded) for the
  // first table so a render-gap count of zero does not throw spuriously.
  await monthTables.first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
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

/**
 * Advances the visible calendar by N months (clicks the next-month arrow N times),
 * then picks the Nth available day in the now-visible month.
 * The calendar must already be open.
 *
 * @param {import('playwright').Page} page
 * @param {object} options
 * @param {number} [options.monthsToAdvance=2] - How many times to click the next-month arrow
 * @param {number} [options.dayIndex=0] - Zero-based index of the available day to pick
 * @param {"first"|"last"} [options.pickerPosition="first"] - Which visible picker to use
 */
async function selectDateAfterAdvancingMonths(
  page,
  { monthsToAdvance = 2, dayIndex = 0, pickerPosition = "first" } = {},
) {
  if (!Number.isInteger(monthsToAdvance) || monthsToAdvance < 0) {
    throw new Error(
      `monthsToAdvance must be a non-negative integer, got: ${monthsToAdvance}`,
    );
  }
  if (!Number.isInteger(dayIndex) || dayIndex < 0) {
    throw new Error(`dayIndex must be a non-negative integer, got: ${dayIndex}`);
  }

  for (let i = 0; i < monthsToAdvance; i++) {
    await clickNextVisibleMonth(page);
  }

  await selectDatesByNthAvailable(page, { startIndex: dayIndex, pickerPosition });
}

module.exports = {
  parseDateValue,
  datesMatch,
  dayAndMonthMatch,
  parseTimeToMinutes,
  selectDatesByNthAvailable,
  selectDatesByNthAvailableFromNextVisibleMonth,
  selectDatesByInputValues,
  selectTodayFromVisibleCalendar,
  selectNthWeekdayFromNextMonth,
  selectRoundTripDatesOnNthWeekday,
  clickNextVisibleMonth,
  clickPrevVisibleMonth,
  clickPrevVisibleYear,
  selectDateOfBirthWithYearArrows,
  selectDateAfterAdvancingMonths,
  getNextDateExcludingWeekdays,
  advanceCalendarUntilMonthVisible,
  advanceSinglePickerCalendarUntilMonthVisible,
  clickDayInVisibleMonth,
};
