require("module-alias/register");

const { getPageObject } = require("@utils/pageObjectCache");
const { CartPage } = require("@pages/CartPage");
const { HotelChangeDatesPage } = require("@pages/HotelChangeDatesPage");
const { selectDatesByInputValues } = require("@utils/calendar.helper");
const logger = require("@utils/logger").child("HotelChangeDates");

// Days from today for the new check-in. The original booking is ~3 months out,
// so ~120 days lands the new stay comfortably after it and well outside the
// near-term "close" month — which is all the test case requires of the new date
// (it need only differ from the original and not be in the close month).
// Computed from today so there is no dependence on parsing the original date.
const NEW_CHECKIN_OFFSET_DAYS = 120;

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Formats a Date as "d MMM yyyy" (e.g. "15 Sep 2026") — the format the calendar
 * helper's parseDateValue accepts for navigate-and-click date selection.
 * @param {Date} date
 * @returns {string}
 */
function formatDateForPicker(date) {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * DSL for the hotel "Change Dates" post-booking modification flow.
 *
 * Composes CartPage (kebab menu + post-modification status) and
 * HotelChangeDatesPage (the modification page). Assertions live in the step
 * layer; this DSL performs the workflow actions and returns the data the steps
 * assert on.
 */
const HotelChangeDates = {
  /**
   * Opens the hotel quote's 3-dots menu in the cart, clicks "Change Dates", and
   * waits for the change-dates page to render (navigation happens in the same tab).
   * @param {import('playwright').Page} page
   */
  async openChangeDatesModification(page) {
    if (!page) throw new Error("page is required");
    const cartPage = getPageObject(page, CartPage);
    const changeDatesPage = getPageObject(page, HotelChangeDatesPage);

    logger.info("Opening the hotel quote actions menu to change dates");
    await cartPage.openHotelQuoteActionsDropdown();
    await cartPage.clickChangeDatesQuoteOption();
    await changeDatesPage.waitForPage();
    logger.info("Change Dates page rendered", { url: page.url() });
  },

  /**
   * Confirms the change-dates page is showing (URL + title).
   * @param {import('playwright').Page} page
   * @returns {Promise<{onUrl: boolean, title: string}>}
   */
  async getChangeDatesPageState(page) {
    if (!page) throw new Error("page is required");
    const changeDatesPage = getPageObject(page, HotelChangeDatesPage);
    return {
      onUrl: await changeDatesPage.isOnChangeDatesUrl(),
      title: await changeDatesPage.getPageTitleText(),
    };
  },

  /**
   * Selects the new stay on the change-dates picker: `offsetDays` from today for
   * `nights` nights. The default lands the new dates comfortably after the
   * original booking and outside the close month, which is all the test case
   * requires. Computed from today, so it never depends on parsing the original date.
   *
   * @param {import('playwright').Page} page
   * @param {object} [options]
   * @param {number} [options.offsetDays=120] - days from today for the new check-in
   * @param {number} [options.nights=1] - number of nights
   * @returns {Promise<{checkIn: string, checkOut: string}>} the values passed to the picker
   */
  async selectNewDates(page, { offsetDays = NEW_CHECKIN_OFFSET_DAYS, nights = 1 } = {}) {
    if (!page) throw new Error("page is required");
    if (!Number.isInteger(offsetDays) || offsetDays < 1) {
      throw new Error(`offsetDays must be a positive integer, got: ${offsetDays}`);
    }
    if (!Number.isInteger(nights) || nights < 1) {
      throw new Error(`nights must be a positive integer, got: ${nights}`);
    }

    const changeDatesPage = getPageObject(page, HotelChangeDatesPage);

    const today = new Date();
    const checkInDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offsetDays);
    const checkOutDate = new Date(
      checkInDate.getFullYear(),
      checkInDate.getMonth(),
      checkInDate.getDate() + nights,
    );
    const checkIn = formatDateForPicker(checkInDate);
    const checkOut = formatDateForPicker(checkOutDate);

    logger.info("Selecting new hotel dates", { checkIn, checkOut, offsetDays, nights });
    await changeDatesPage.openDateRangePicker();
    await selectDatesByInputValues(page, { startDateValue: checkIn, endDateValue: checkOut });

    return { checkIn, checkOut };
  },

  /**
   * Reads the new dates currently shown in the change-dates range field.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>}
   */
  async extractSelectedNewDates(page) {
    if (!page) throw new Error("page is required");
    const changeDatesPage = getPageObject(page, HotelChangeDatesPage);
    return changeDatesPage.getSelectedDateRangeText();
  },

  /**
   * Clicks "Check Availability" and waits for the availability result (the
   * "Continue" button appearing) — this fires a supplier round-trip.
   * @param {import('playwright').Page} page
   */
  async checkAvailability(page) {
    if (!page) throw new Error("page is required");
    const changeDatesPage = getPageObject(page, HotelChangeDatesPage);
    logger.info("Checking availability for the new dates");
    await changeDatesPage.clickCheckAvailability();
    await changeDatesPage.waitForAvailabilityResult();
    logger.info("Availability result rendered");
  },

  /**
   * Reads the availability summary: heading, chosen new dates, the raw panel text
   * (for label assertions), and the three totals.
   * @param {import('playwright').Page} page
   * @returns {Promise<{heading:string, newDatesText:string, panelText:string, originalTotal:number, updatedTotal:number, difference:number}>}
   */
  async getAvailabilityDetails(page) {
    if (!page) throw new Error("page is required");
    const changeDatesPage = getPageObject(page, HotelChangeDatesPage);
    const heading = await changeDatesPage.getAvailabilityHeadingText();
    const newDatesText = await changeDatesPage.getNewDatesRangeText().catch(() => "");
    const panelText = await changeDatesPage.getResultPanelText();
    const totals = await changeDatesPage.getAvailabilityTotals();
    logger.info("Availability details", { heading, newDatesText, ...totals });
    return { heading, newDatesText, panelText, ...totals };
  },

  /**
   * Clicks "Continue" to apply the modification and waits for the cart to reload.
   * The underlying PUT /HotelModify is a long supplier operation, so the wait is
   * generous.
   * @param {import('playwright').Page} page
   */
  async continueModification(page) {
    if (!page) throw new Error("page is required");
    const changeDatesPage = getPageObject(page, HotelChangeDatesPage);
    const cartPage = getPageObject(page, CartPage);

    logger.info("Continuing the date modification");
    await changeDatesPage.clickContinue();
    await page.waitForURL(/\/cart(\/|$|\?|#)/, { timeout: process.env.CI ? 300000 : 240000 });
    // Confirm the quote header (with its new status) is back on screen.
    await cartPage.getHotelQuoteStatusText().catch(() => {});
    logger.info("Returned to cart after modification", { url: page.url() });
  },
};

module.exports = HotelChangeDates;
module.exports.formatDateForPicker = formatDateForPicker;
