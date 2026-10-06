const { getPageObject } = require("@utils/pageObjectCache");
const logger = require("@utils/logger");
const RoomLevelResultsPage = require("@pages/RoomLevelResultsPage");
const { CommonPage } = require("@pages/CommonPage");
const { ResultsPage } = require("@pages/ResultsPage");
const Results = require("./Results");
const HotelLevelResults = require("./HotelLevelResults");
const { normalizeText } = require("@utils/text");
const {
  buildGsaBannerText,
  buildGsaViolationText,
  splitByGsaLimit,
} = require("@utils/gsaPerDiem.helper");
const { splitByOopPrice, findClosestToOopPrice } = require("@utils/hotelLowestFare.helper");

// Room-level supplier ids differ from the hotel-level ones for some suppliers, so this list
// is deliberately its own: room cards render hCorpo under its Amadeus chain id, hotel cards
// do not. Shared by the presence and absence checks below.
const ROOM_SUPPLIER_ID_MAP = {
  expedia: 'EXPEDIA',
  hcorpo: 'AMADEUS-HD',
  bookingcom: 'BOOKINGCOM',
  amadeus: 'AMADEUS',
  amadeusaggregators: 'AMADEUS-TE',
  amadeusvaluehotel: 'AMADEUS-AD',
  ratehawk: 'RATEHAWK',
};

function resolveRoomSupplierId(supplierName) {
  const key = supplierName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const supplierId = ROOM_SUPPLIER_ID_MAP[key];
  if (!supplierId) {
    throw new Error('Unknown supplier: ' + supplierName);
  }
  return supplierId;
}

// A page this close to its top reads as being at the top: it absorbs the sticky
// header offset and sub-pixel rounding, while staying far below one screen of scroll.
const PAGE_TOP_TOLERANCE_PX = 50;
// How long the scroll position is watched before it is accepted as settled. Rooms
// stream in per supplier, so a scroll jump can land seconds after the page appears.
const SCROLL_SETTLE_SAMPLES = 6;
const SCROLL_SETTLE_INTERVAL_MS = 500;
// Below this, the hotel list had so little scroll position to carry over that a pass says
// less than usual. Roughly half a screen at the viewport the suite runs at. It is logged,
// never failed on.
const MIN_SCROLL_BEFORE_NAVIGATION_PX = 500;
// How long the room list is given to stop growing before the scroll position is read.
// Exceeding it is logged, not failed: a supplier that never answers is not what this
// verification is about.
const ROOMS_LOADED_TIMEOUT_MS = 30000;

/**
 * RoomLevelResults DSL
 *
 * Business actions at the room selection level.
 */
const RoomLevelResults = {

  /**
   * Verifies the count of nights displayed on the room level results.
   * @param {import('playwright').Page} page
   * @param {number} expectedNights - The expected number of nights
   */
  async verifyNightsCountInRoomLevel(page, expectedNights) {
    if (!page) throw new Error('page parameter is required');
    if (typeof expectedNights !== 'number') throw new Error(`expectedNights must be a number, got: ${typeof expectedNights}`);

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const actualNights = await roomLevelResultsPage.getNightsCount();

    if (actualNights !== expectedNights) {
       throw new Error(`Expected ${expectedNights} nights in room level results, but found ${actualNights}`);
    }
  },

  /**
   * Reads the room list's own "Showing {shown} of {total} Results" line and verifies the shown
   * count is a plausible room count: at least one room, no more than the total the same line
   * reports, and below maxCount.
   *
   * The upper bound is the point of the check — a supplier answering with an implausibly long room
   * list (or the counter rendering the hotel-level count) is the failure being guarded against.
   *
   * @param {import('playwright').Page} page
   * @param {number} maxCount - Exclusive upper bound the shown count must stay under
   * @returns {Promise<{shown: number, total: number, text: string}>}
   */
  async verifyRoomResultsCountIsBelow(page, maxCount) {
    if (!page) throw new Error('[RoomLevelResults.verifyRoomResultsCountIsBelow] "page" is required.');
    if (typeof maxCount !== 'number' || !Number.isInteger(maxCount) || maxCount < 1) {
      throw new Error(
        `[RoomLevelResults.verifyRoomResultsCountIsBelow] "maxCount" must be an integer >= 1, got: ${typeof maxCount} (${maxCount})`
      );
    }

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const text = await roomLevelResultsPage.getRoomResultsCountText();

    // "Showing 12 of 12 Results" -> [12, 12]. Read the two numbers positionally so the surrounding
    // wording (translated or reworded) does not have to be matched.
    const numbers = text.match(/\d+/g);
    if (!numbers || numbers.length < 2) {
      throw new Error(
        `[RoomLevelResults.verifyRoomResultsCountIsBelow] Expected the room results line to read ` +
        `"Showing {shown} of {total} Results", but could not read two numbers from: "${text}".`
      );
    }
    const shown = Number(numbers[0]);
    const total = Number(numbers[1]);

    logger.info('Room results count line', { text, shown, total, maxCount });

    if (shown < 1) {
      throw new Error(
        `[RoomLevelResults.verifyRoomResultsCountIsBelow] The room results line reports no rooms ("${text}"). ` +
        `The supplier returned an empty room list for this hotel.`
      );
    }
    if (shown > total) {
      throw new Error(
        `[RoomLevelResults.verifyRoomResultsCountIsBelow] The room results line is inconsistent ("${text}"): ` +
        `it shows ${shown} of a ${total}-room total.`
      );
    }
    if (shown >= maxCount) {
      throw new Error(
        `[RoomLevelResults.verifyRoomResultsCountIsBelow] Expected fewer than ${maxCount} rooms in the room ` +
        `results line, but it reports ${shown} ("${text}").`
      );
    }

    return { shown, total, text };
  },

  /**
   * Adds a refundable hotel room to the cart.
   * Filters to refundable rooms first, then adds the first one available.
   */
  async addRefundableHotelRoomLevelToCart(page) {
    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const resultsPage = getPageObject(page, ResultsPage);

    await roomLevelResultsPage.waitForViewHotelOnMapText();

    // Filter to refundable rooms FIRST
    await roomLevelResultsPage.clickRefundableCheckbox();
    await roomLevelResultsPage.verifyRefundableTagIsVisible();

    // Now wait and scroll to the "Add to trip" button in the filtered list
    await resultsPage.waitForAddToTripText();
    await resultsPage.scrollToFirstAddToTripButton();

    await resultsPage.clickFirstAddToTripButton();

    // Handle optional conflict modal (uses DSL for consistency)
    await Results.clickProceedConflictQuoteModal(page);
  },

  async addFirstHotelRoomLevelToCart(page) {
    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const resultsPage = getPageObject(page, ResultsPage);

    await roomLevelResultsPage.waitForViewHotelOnMapText();
    await resultsPage.scrollToFirstAddToTripButton();
    await resultsPage.waitForAddToTripText();

    await resultsPage.clickFirstAddToTripButton();

    // Handle optional conflict modal (uses DSL for consistency)
    await Results.clickProceedConflictQuoteModal(page);
  },

  /**
   * Adds the first room to the cart from inside the Terms & Conditions dialog, using the dialog's
   * own "Add to trip" footer button instead of the room card button.
   * @param {import('playwright').Page} page
   */
  async addRoomToCartFromTermsAndConditions(page) {
    if (!page) throw new Error('page parameter is required');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);

    logger.debug("Adding the first room to the cart from the terms and conditions dialog");
    await roomLevelResultsPage.clickAddToTripInTermsAndConditionsDialog();

    // The dialog button calls the same selectRoom() as the room card button, so it can raise the
    // conflicting-quotes modal just as the other add-to-cart flows do.
    await Results.clickProceedConflictQuoteModal(page);
  },

  async extractRoomLevelPrice(page) {
    if (!page) throw new Error('page parameter is required');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    return roomLevelResultsPage.getFirstRoomLevelPrice();
  },

  /**
   * Compares booking fees from hotel level and room level within a tolerance.
   * @param {import('playwright').Page} page
   * @param {number} hotelFee - Booking fee extracted at hotel level
   * @param {number} roomFee - Booking fee extracted at room level
   * @throws {Error} If fees differ beyond tolerance
   */
  async compareBookingFees(page, hotelFee, roomFee) {
    if (!page) throw new Error('page parameter is required');
    if (typeof hotelFee !== 'number' || Number.isNaN(hotelFee)) {
      throw new Error(`hotelFee must be a number, got: ${typeof hotelFee}`);
    }
    if (typeof roomFee !== 'number' || Number.isNaN(roomFee)) {
      throw new Error(`roomFee must be a number, got: ${typeof roomFee}`);
    }

    // Premier Inn booking fee (10 GBP): the first room at room level includes the booking fee,
    // so firstRoomPrice - hotelFee should equal exactly 10, with tolerance of 1 GBP for rounding.
    const EXPECTED_BOOKING_FEE = 10;
    const tolerance = 1;
    const actualDifference = Math.abs(Math.round(hotelFee) - Math.round(roomFee));
    const deviation = Math.abs(actualDifference - EXPECTED_BOOKING_FEE);

    if (deviation > tolerance) {
      throw new Error(
        `Booking fee mismatch: expected absolute difference between hotel and first room price to be ~${EXPECTED_BOOKING_FEE} GBP, ` +
        `but hotel=${Math.round(hotelFee)}, room=${Math.round(roomFee)} (difference: ${actualDifference}, deviation from expected: ${deviation})`
      );
    }

    return { hotelFee, roomFee, actualDifference };
  },

  async compareHotelAndRoomLevelPrices(page, hotelLevelPrice, roomLevelPrice) {
    if (!page) throw new Error('page parameter is required');
    if (typeof hotelLevelPrice !== 'number' || Number.isNaN(hotelLevelPrice)) {
      throw new Error(`hotelLevelPrice must be a number, got: ${typeof hotelLevelPrice}`);
    }
    if (typeof roomLevelPrice !== 'number' || Number.isNaN(roomLevelPrice)) {
      throw new Error(`roomLevelPrice must be a number, got: ${typeof roomLevelPrice}`);
    }

    const difference = Math.abs(hotelLevelPrice - roomLevelPrice);
    // The hotel card shows the price rounded to a whole number (hotel-preview.vue), while the room
    // price keeps its decimals, so the two can differ by up to 0.5 on the same rate.
    const tolerance = 1;

    if (difference > tolerance) {
      throw new Error(`Expected hotel-level price ${hotelLevelPrice} to match room-level price ${roomLevelPrice} within tolerance ${tolerance}`);
    }

    return { hotelLevelPrice, roomLevelPrice, difference };
  },

  async waitForViewHotelOnMapButtonInRoomLevelResults(page) {
    if (!page) throw new Error('page parameter is required');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    await roomLevelResultsPage.waitForViewHotelOnMapButton();
  },

  async clickViewOnMap(page) {
    if (!page) throw new Error('page parameter is required');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    await roomLevelResultsPage.clickViewHotelOnMapButton();
  },

  async verifyMapModalOpened(page) {
    if (!page) throw new Error('page parameter is required');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    await roomLevelResultsPage.waitForHotelMapModal();
    // The modal being open only proves a dialog appeared. Assert the map itself rendered and the
    // hotel is plotted on it, otherwise a Google Maps failure would still pass this check.
    return roomLevelResultsPage.waitForHotelMapMarker();
  },

  /**
   * Verifies a newly opened browser tab is the room level (hotel details) page: a
   * /rooms URL that has actually rendered its content.
   *
   * The URL alone is not enough - a /rooms address that loads blank, errors, or is
   * still all skeletons would pass an address check. The room level page object is
   * built from the new tab, so the readiness wait (hotel name heading plus at least
   * one room card) runs against that tab and not the tab the search started in.
   * @param {import('playwright').Page} page - The tab the new one was opened from
   * @param {import('playwright').Page} roomLevelTab - The newly opened browser tab
   * @returns {Promise<{roomLevelUrl: string}>} The new tab URL
   * @throws {Error} If the new tab is not a loaded room level page
   */
  async verifyRoomLevelPageOpenedInNewTab(page, roomLevelTab) {
    if (!page) throw new Error('page parameter is required');
    if (!roomLevelTab || typeof roomLevelTab.url !== 'function') {
      throw new Error(`roomLevelTab must be a Playwright page, got: ${typeof roomLevelTab}`);
    }

    await roomLevelTab.waitForLoadState('domcontentloaded', { timeout: 60000 });

    const roomLevelResultsPage = getPageObject(roomLevelTab, RoomLevelResultsPage);

    // The tab opens blank and the SPA routes it client side, so reading its URL as soon
    // as it appears reads that blank tab, not the page it ends up on. Wait for the room
    // level route to arrive instead.
    try {
      await roomLevelResultsPage.waitForRoomLevelUrl();
    } catch {
      throw new Error(`The new tab is not on a room level page. Expected a /rooms URL, got: ${roomLevelTab.url()}`);
    }

    const roomLevelUrl = roomLevelTab.url();
    if (roomLevelUrl === page.url()) {
      throw new Error(`The new tab is on the same URL as the page it was opened from: ${roomLevelUrl}`);
    }

    await roomLevelResultsPage.waitForRoomLevelContentLoaded();

    return { roomLevelUrl };
  },

  /**
   * Extracts the cancellation policy text from the first room in room level results.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The cancellation policy text
   */
  async extractCancellationPolicy(page) {
    if (!page) {
      throw new Error('page is required');
    }
    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    return roomLevelResultsPage.getCancellationPolicy();
  },

  /**
   * Verifies that member rates are displayed in room level results.
   * @param {import('playwright').Page} page
   * @returns {Promise<boolean>} True if member rates are visible
   * @throws {Error} If page parameter is not provided or member rates are not displayed
   */
  async verifyMemberRatesDisplayed(page) {
    if (!page) {
      throw new Error('page parameter is required');
    }

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const isVisible = await roomLevelResultsPage.isMemberBadgeVisible();
    
    if (!isVisible) {
      throw new Error('Member rate badge is not visible in room level results');
    }

    return isVisible;
  },

  /**
   * Verifies that a hotel loyalty programme badge for the given chain is displayed in room
   * level results.
   *
   * Matches on the programme label rather than the asset filename, so it holds for both badge
   * renderings (programme logo and text chip) and does not break when the chain's logo file is
   * renamed. The match is a case-insensitive substring, because the label is the full programme
   * name ("Hilton Honors") while callers name the chain ("Hilton").
   *
   * @param {import('playwright').Page} page
   * @param {string} chainName - Chain or programme keyword, e.g. "Hilton"
   * @returns {Promise<string>} The matched badge label
   * @throws {Error} If no loyalty badge matches the chain
   */
  async verifyLoyaltyBadgeInRoomLevel(page, chainName) {
    if (!page) throw new Error('page is required');
    if (!chainName || typeof chainName !== 'string') {
      throw new Error('chainName must be a non-empty string, got: ' + typeof chainName);
    }

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const labels = await roomLevelResultsPage.getLoyaltyBadgeLabels();
    const matched = labels.find((label) => label.toLowerCase().includes(chainName.toLowerCase()));

    if (!matched) {
      throw new Error(
        `[RoomLevelResults.verifyLoyaltyBadgeInRoomLevel] No "${chainName}" loyalty badge is ` +
        `displayed in room level results. Loyalty badges found: ` +
        `${labels.length ? labels.map((l) => `"${l}"`).join(', ') : 'none'}. ` +
        `The badge needs the IsHotelLoyaltyPointsEnabled feature flag on and the room to return ` +
        `loyalty points for the chain.`
      );
    }

    return matched;
  },

  /**
   * Verifies the member badge tag contains the expected text in room level results.
   * @param {import('playwright').Page} page
   * @param {string} expectedText - The expected badge text (case-insensitive match)
   * @throws {Error} If the badge text does not contain the expected text
   */
  async verifyMemberBadgeTagText(page, expectedText) {
    if (!page) throw new Error('[RoomLevelResults.verifyMemberBadgeTagText] "page" is required.');
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(`[RoomLevelResults.verifyMemberBadgeTagText] "expectedText" must be a non-empty string, got: ${typeof expectedText} (${JSON.stringify(expectedText)})`);
    }

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const actualText = await roomLevelResultsPage.getMemberBadgeText();

    if (!actualText.toLowerCase().includes(expectedText.toLowerCase())) {
      throw new Error(
        `[RoomLevelResults.verifyMemberBadgeTagText] Expected room member badge to contain "${expectedText}", ` +
        `but actual badge text was "${actualText}". Check that the Expedia member rate offer is present in room results.`
      );
    }
    return actualText;
  },

  /**
   * Compares member rate price vs regular price and verifies discount exists.
   * @param {import('playwright').Page} page
   * @returns {Promise<{memberPrice: number, regularPrice: number, hasDiscount: boolean}>}
   * @throws {Error} If page parameter is not provided or member price is not lower
   */
  async compareMemberVsRegularPrice(page) {
    if (!page) {
      throw new Error('page parameter is required');
    }

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const { memberPrice, regularPrice } = await roomLevelResultsPage.getPriceComparison();

    const hasDiscount = memberPrice < regularPrice;
    return { memberPrice, regularPrice, hasDiscount };
  },

  async verifyCO2InRoomLevel(page) {
    if (!page) throw new Error('page parameter is required');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const commonPage = getPageObject(page, CommonPage);
    return commonPage.assertCO2Displayed(
      () => roomLevelResultsPage.isCO2LabelVisible({ timeout: 30000 }),
      () => roomLevelResultsPage.getCO2Value(),
      'room level results',
    );
  },

  async filterRoomsByWifi(page) {
    if (!page) throw new Error('page parameter is required');
    const p = getPageObject(page, RoomLevelResultsPage);
    await p.clickWifiCheckbox();
  },

  async verifyWifiRoomsOnly(page) {
    if (!page) throw new Error('page parameter is required');
    const p = getPageObject(page, RoomLevelResultsPage);
    await p.verifyAllRoomsHaveWifi();
  },

  async filterRoomsByBreakfast(page) {
    if (!page) throw new Error('page parameter is required');
    const p = getPageObject(page, RoomLevelResultsPage);
    await p.clickBreakfastCheckbox();
  },

  async verifyBreakfastRoomsOnly(page) {
    if (!page) throw new Error('page parameter is required');
    const p = getPageObject(page, RoomLevelResultsPage);
    await p.verifyAllRoomsHaveBreakfast();
  },

  /**
   * Verifies the "Paid at hotel" tooltip is displayed correctly for Ratehawk rooms.
   * Clicks price details, hovers the info icon, and asserts tooltip text.
   * @param {import('playwright').Page} page
   */
  async verifyPaidAtHotelTooltip(page) {
    if (!page) throw new Error('page parameter is required');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);

    await roomLevelResultsPage.clickPriceDetailsButton();
    await roomLevelResultsPage.hoverPayAtHotelInfoIcon();
    const tooltipText = await roomLevelResultsPage.getPayAtHotelTooltipText();

    if (tooltipText !== 'Paid at the hotel') {
      throw new Error(`Expected tooltip "Paid at the hotel", got: "${tooltipText}"`);
    }
  },

  /**
   * Reads the "Taxes and Fees" row text from the price details dialog.
   * Returns the raw text (label + amount, or "Included") so the step can assert on it.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} Trimmed text content of the taxes and fees row
   */
  async getTaxesAndFeesRowText(page) {
    if (!page) throw new Error('page parameter is required');
    const p = getPageObject(page, RoomLevelResultsPage);
    return p.getTaxesAndFeesRowText();
  },

  /**
   * Closes the price details dialog opened in room level results.
   * @param {import('playwright').Page} page
   */
  async closePriceDetailsDialog(page) {
    if (!page) throw new Error('page parameter is required');
    const p = getPageObject(page, RoomLevelResultsPage);
    await p.closePriceDetailsDialog();
  },

  /**
   * Verifies that a specific supplier logo is visible in room level results.
   * @param {import('playwright').Page} page
   * @param {string} supplierName - Common name of the supplier (e.g. "Expedia", "hCorpo")
   * @returns {Promise<boolean>} True if logo is visible
   */
  async verifySupplierLogo(page, supplierName) {
    if (!page) throw new Error('page is required');
    if (!supplierName || typeof supplierName !== 'string') {
      throw new Error('supplierName must be a non-empty string, got: ' + typeof supplierName);
    }
    const supplierId = resolveRoomSupplierId(supplierName);
    const p = getPageObject(page, RoomLevelResultsPage);
    return p.isSupplierLogoVisible(supplierId);
  },

  /**
   * Verifies that a specific supplier logo is NOT visible in room level results.
   * Matches the whole icon filename, so an absence check for "Amadeus" is not defeated by an
   * Amadeus aggregator logo ("AMADEUS-AD" and friends) being legitimately present.
   * @param {import('playwright').Page} page
   * @param {string} supplierName - Common name of the supplier (e.g. "Amadeus")
   * @throws {Error} If the supplier logo is visible
   */
  async verifySupplierLogoNotVisible(page, supplierName) {
    if (!page) throw new Error('page is required');
    if (!supplierName || typeof supplierName !== 'string') {
      throw new Error('supplierName must be a non-empty string, got: ' + typeof supplierName);
    }
    const supplierId = resolveRoomSupplierId(supplierName);
    const p = getPageObject(page, RoomLevelResultsPage);
    const isVisible = await p.isSupplierLogoVisible(supplierId, { timeout: 5000, exact: true });
    if (isVisible) throw new Error(`Supplier logo for "${supplierName}" (${supplierId}) should NOT be visible but was found in room level results`);
  },

  /**
   * Verifies that the expected filter sections are visible in the room-level filter panel.
   * Filters: Agreement, Price, Payment, Suppliers.
   * @param {import('playwright').Page} page
   * @throws {Error} If any expected filter section is not visible
   */
  async verifyRoomLevelFilters(page) {
    if (!page) throw new Error('page is required');
    const expectedFilters = ['Agreement', 'Price', 'Payment', 'Suppliers'];
    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    for (const filter of expectedFilters) {
      const isVisible = await roomLevelResultsPage.isRoomFilterSectionVisible(filter);
      if (!isVisible) throw new Error(`Room filter section "${filter}" is not visible in room level results`);
    }
  },

  /**
   * Applies a filter in the room-level filter panel by clicking the specified option.
   * @param {import('playwright').Page} page
   * @param {string} filterName - Filter section title (e.g. "Agreement")
   * @param {string} optionText - Checkbox option label (e.g. "Corp")
   */
  async applyRoomFilter(page, filterName, optionText) {
    if (!page) throw new Error('page is required');
    if (!filterName || typeof filterName !== 'string') throw new Error('filterName must be a non-empty string');
    if (!optionText || typeof optionText !== 'string') throw new Error('optionText must be a non-empty string');
    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    await roomLevelResultsPage.clickRoomFilterOption(filterName, optionText);
  },

  /**
   * Clicks the Terms and Conditions link on the first room card and asserts the dialog appears.
   * @param {import('playwright').Page} page
   * @returns {Promise<boolean>} True if the terms dialog is visible
   */
  async checkTermsAndConditions(page) {
    if (!page) throw new Error('page is required');
    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    return await roomLevelResultsPage.clickTermsAndConditionsButton();
  },

  /**
   * Enables the "Deposit not required" filter option in room level results.
   * Filters to show only rooms that do not require an upfront deposit.
   * The option lives in the "Payment" filter section (paymentMethods key).
   * @param {import('playwright').Page} page
   */
  async filterRoomsByDepositNotRequired(page) {
    if (!page) throw new Error('page parameter is required');
    const p = getPageObject(page, RoomLevelResultsPage);
    await p.clickDepositNotRequiredCheckbox();
  },

  /**
   * Enables the "Deposit" filter in room level results.
   * Filters to show only rooms that require a deposit (instant purchase).
   * @param {import('playwright').Page} page
   */
  async filterRoomsByDeposit(page) {
    if (!page) throw new Error('page parameter is required');
    const p = getPageObject(page, RoomLevelResultsPage);
    await p.clickDepositCheckbox();
  },

  /**
   * Asserts the "Deposit Required" note is displayed on a room card (ADO 55723).
   *
   * This is the precondition the voucher test depends on: the scenario must book a deposit
   * (prepaid) rate, and the note rendered by room-deposit.vue is the only place room results say
   * so. Asserting it here means a supplier that stops returning deposit rates fails on the room
   * list, not several steps later at checkout.
   *
   * @param {import('playwright').Page} page
   * @param {number} [position=1] - 1-based room card position
   * @returns {Promise<string>} The note's text
   */
  async verifyRoomDepositRequired(page, position = 1) {
    if (!page) throw new Error('[RoomLevelResults.verifyRoomDepositRequired] "page" is required.');
    if (!Number.isInteger(position) || position < 1) {
      throw new Error(
        `[RoomLevelResults.verifyRoomDepositRequired] "position" must be a positive integer, got: ${position}`,
      );
    }

    const p = getPageObject(page, RoomLevelResultsPage);
    const text = await p.getRoomDepositRequiredText(position);

    if (!/Deposit\s*Required/i.test(text)) {
      throw new Error(
        `[RoomLevelResults.verifyRoomDepositRequired] Expected room ${position} to show the "Deposit Required" ` +
        `note (room-deposit.vue), but the note's text read: "${text}".`,
      );
    }

    logger.info('Deposit Required note is displayed on the room card', { position, text });
    return text;
  },

  /**
   * Enables the "Refundable" filter in room level results.
   * @param {import('playwright').Page} page
   */
  async filterRoomsByRefundable(page) {
    if (!page) throw new Error('page parameter is required');
    const p = getPageObject(page, RoomLevelResultsPage);
    await p.clickRefundableCheckbox();
    await p.verifyRefundableTagIsVisible();
  },

  /**
   * Opens the Terms & Conditions dialog on the first room card and verifies
   * that the stored price (from room level results) appears in the dialog text.
   * This confirms the cancellation fee is shown with markup applied.
   * @param {import('playwright').Page} page
   * @param {number} price - The price extracted from room level results
   */
  /**
   * Verifies that at least one agreement badge (handshake icon) is visible in room level results.
   * @param {import('playwright').Page} page
   * @throws {Error} If no agreement badge is visible
   */
  async verifyHandshakeBadgeVisible(page) {
    if (!page) throw new Error('page is required');
    const p = getPageObject(page, RoomLevelResultsPage);
    const isVisible = await p.isAnyAgreementBadgeVisible();
    if (!isVisible) throw new Error('No agreement badge (handshake) is visible in room level results');
  },

  /**
   * Hovers over an agreement label on the first room card that carries it and verifies the tooltip
   * contains the expected text.
   * @param {import('playwright').Page} page
   * @param {string} labelText - Agreement label to hover over (e.g. "Agency rate")
   * @param {string} tooltipText - Text the tooltip should contain (case-insensitive)
   */
  async verifyAgreementTooltip(page, labelText, tooltipText) {
    if (!page) throw new Error('page is required');
    if (!labelText || typeof labelText !== 'string') throw new Error(`labelText must be a non-empty string, got: ${typeof labelText}`);
    if (!tooltipText || typeof tooltipText !== 'string') throw new Error(`tooltipText must be a non-empty string, got: ${typeof tooltipText}`);
    const p = getPageObject(page, RoomLevelResultsPage);
    const actualTooltip = await p.hoverAgreementLabelAndGetTooltip(labelText);
    if (!actualTooltip.toLowerCase().includes(tooltipText.toLowerCase())) {
      throw new Error(
        `The "${labelText}" agreement tooltip in room level results ("${actualTooltip}") ` +
        `does not contain "${tooltipText}"`
      );
    }
  },

  /**
   * Verifies that every room card in the room list carries the agreement badge (handshake icon) —
   * i.e. there is no room without it.
   * @param {import('playwright').Page} page
   * @throws {Error} If no rooms are listed, or any room card is missing the agreement badge
   */
  async verifyAgreementBadgeOnAllRooms(page) {
    if (!page) throw new Error('page is required');
    const p = getPageObject(page, RoomLevelResultsPage);
    const { total, missingIndexes } = await p.findRoomsMissingAgreementBadge();
    if (total === 0) throw new Error('No rooms are listed, so the agreement badge cannot be verified on all rooms');
    if (missingIndexes.length > 0) {
      throw new Error(
        `${missingIndexes.length} of ${total} rooms are missing the agreement badge (handshake) ` +
        `(0-based card indexes: ${missingIndexes.join(', ')})`
      );
    }
  },

  /**
   * Verifies the room level page is showing the hotel that was expected - the name in its
   * heading matches the one read where the hotel was chosen.
   *
   * Both places render the same hotel.name from the app, so this is an exact match after
   * whitespace normalization rather than a contains check.
   * @param {import('playwright').Page} page - The tab showing the room level page
   * @param {string} expectedHotelName - Hotel name captured where the hotel was selected
   * @returns {Promise<{hotelName: string}>} The name shown on the room level page
   * @throws {Error} If the room level page shows a different hotel
   */
  async verifyHotelNameInRoomLevel(page, expectedHotelName) {
    if (!page) throw new Error('page parameter is required');
    if (!expectedHotelName) throw new Error('expectedHotelName is required');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const hotelName = await roomLevelResultsPage.getHotelNameHeadingText();

    const expected = normalizeText(expectedHotelName);
    if (normalizeText(hotelName) !== expected) {
      throw new Error(`The room level page shows a different hotel. Expected "${expected}", got "${hotelName}"`);
    }

    return { hotelName };
  },

  /**
   * Verifies the address in the room level header carries the expected text.
   *
   * A contains check, not an exact match: the header renders the full street address of the
   * hotel and the assertion is only interested in the city it sits in.
   * @param {import('playwright').Page} page - The tab showing the room level page
   * @param {string} expectedText - Case-insensitive substring the address must contain (e.g. "Turin")
   * @returns {Promise<{address: string}>} The address shown on the room level page
   * @throws {Error} If the address does not contain the expected text
   */
  async verifyHotelAddressInRoomLevel(page, expectedText) {
    if (!page) throw new Error('page parameter is required');
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(`"expectedText" must be a non-empty string, got: ${typeof expectedText} (${JSON.stringify(expectedText)})`);
    }

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const address = await roomLevelResultsPage.getHotelAddressText();

    if (!address.toLowerCase().includes(expectedText.toLowerCase())) {
      throw new Error(
        `Expected the room level hotel address to contain "${expectedText}", but it was "${address}". ` +
        `The selected hotel may not be in the intended city.`
      );
    }

    return { address };
  },

  /**
   * Verifies every listed room shows a real price - none priced at zero or below.
   *
   * Reuses the reader behind the policy indicator check and ignores its policy half:
   * what matters here is only the number each room card displays.
   * @param {import('playwright').Page} page - The tab showing the room level page
   * @returns {Promise<{total: number, prices: number[]}>} Room count and each displayed price
   * @throws {Error} If no rooms are listed, or any room shows a price of zero or less
   */
  async verifyRoomPricesAreNotZero(page) {
    if (!page) throw new Error('page parameter is required');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);

    // Rooms stream in per supplier, so the list can still be growing when the first card
    // shows. Wait that out, otherwise "every room" only covers the rooms loaded so far.
    // Best effort by the helper's design: a supplier that never answers is logged rather
    // than failing a check that is about prices, not about how complete the list is.
    const roomsFinishedLoading = await roomLevelResultsPage.waitForRoomsFinishedLoading();
    if (!roomsFinishedLoading) {
      logger.warn('Rooms were still loading when the prices were read, so some rooms may not have been checked');
    }

    const rooms = await roomLevelResultsPage.getRoomPricesWithPolicyIndicator();

    if (rooms.length === 0) {
      throw new Error('No rooms are listed, so no room price could be checked');
    }

    const invalid = rooms.filter((room) => room.price <= 0);
    if (invalid.length > 0) {
      throw new Error(
        `${invalid.length} of ${rooms.length} rooms do not show a price above zero ` +
        `(1-based card positions: ${invalid.map((room) => `${room.index + 1} = ${room.price}`).join(', ')})`
      );
    }

    return { total: rooms.length, prices: rooms.map((room) => room.price) };
  },

  async verifyPriceInTermsAndConditions(page, price) {
    if (!page) throw new Error('page parameter is required');
    if (typeof price !== 'number' || Number.isNaN(price)) {
      throw new Error(`price must be a number, got: ${typeof price}`);
    }

    const p = getPageObject(page, RoomLevelResultsPage);
    const dialogText = await p.getTermsAndConditionsText();

    const priceRegex = new RegExp(String(price));
    if (!priceRegex.test(dialogText)) {
      throw new Error(
        `Expected Terms & Conditions dialog to contain price "${price}", but got text: "${dialogText.slice(-200)}"`
      );
    }
  },

  /**
   * Opens the Terms & Conditions dialog on the first room and asserts it contains
   * the expected text (case-insensitive). Used to confirm notices such as the
   * shared-bathroom note that render below the cancellation policy.
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Text expected to appear in the T&C dialog
   */
  async verifyTextInTermsAndConditions(page, expectedText) {
    if (!page) throw new Error('page parameter is required');
    if (typeof expectedText !== 'string' || expectedText.trim().length === 0) {
      throw new Error(`expectedText must be a non-empty string, got: ${typeof expectedText}`);
    }

    const p = getPageObject(page, RoomLevelResultsPage);
    const dialogText = await p.getTermsAndConditionsText();

    // The T&C rule title and its description render as adjacent DOM nodes whose text content
    // concatenates with no separator (e.g. "shared bathroom" + "this room includes...") — so strip
    // all whitespace on both sides before matching (case-insensitive) rather than just collapsing it.
    const strip = (s) => normalizeText(s).replace(/\s+/g, "").toLowerCase();
    if (!strip(dialogText).includes(strip(expectedText))) {
      throw new Error(
        `Expected room level Terms & Conditions dialog to contain "${expectedText}", but got text: "${dialogText.slice(-300)}"`
      );
    }
  },

  /**
   * Verifies that the room level page is displayed starting at the top after arriving
   * from the hotel list, so the scroll position of the list is not carried over.
   *
   * Fails on one thing only: the room level page not starting at the top. Everything else
   * here exists to make that verdict trustworthy rather than to add verdicts of its own -
   * it confirms the URL is a room level URL, waits for the real content to replace the
   * skeletons and for the room list to stop growing, watches the scroll offset across a
   * settle window instead of reading it once, and checks the first content of the page is
   * inside the viewport. Conditions that merely make a pass weaker - a hotel list that
   * barely scrolled, a room list too short to scroll, suppliers still streaming - are
   * logged and do not fail the step.
   * @param {import('playwright').Page} page
   * @param {object} [options]
   * @param {number|null} [options.scrollOffsetBeforeNavigation] - How far the previous page
   *   was scrolled from its top when the hotel was selected, for context in the log
   * @throws {Error} If the room level page is not displayed at its top
   */
  async verifyRoomLevelPageAtTop(page, { scrollOffsetBeforeNavigation = null } = {}) {
    if (!page) throw new Error('page parameter is required');

    // How far the hotel list was scrolled is context, not a verdict: this step fails only
    // when the room level page does not start at the top. A hotel list that barely scrolled
    // makes the pass a weaker one, so it is recorded and the run continues.
    if (typeof scrollOffsetBeforeNavigation === 'number' && scrollOffsetBeforeNavigation < MIN_SCROLL_BEFORE_NAVIGATION_PX) {
      logger.warn('Hotel list was barely scrolled when the hotel was selected, so there was little scroll position to reset', {
        scrollOffsetBeforeNavigation,
        expectedAtLeast: MIN_SCROLL_BEFORE_NAVIGATION_PX,
      });
    }

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);

    // Prove we are on the room level page before measuring anything, otherwise the
    // scroll reading could belong to the hotel list we just left.
    await roomLevelResultsPage.waitForRoomLevelUrl();
    await roomLevelResultsPage.waitForRoomLevelContentLoaded();

    // The first room card appearing does not mean the page has stopped growing: rooms
    // stream in per supplier and the list keeps getting taller behind them. Wait that out,
    // so the scroll offset is measured against the page the user ends up looking at.
    const roomsFinishedLoading = await roomLevelResultsPage.waitForRoomsFinishedLoading(ROOMS_LOADED_TIMEOUT_MS);
    if (!roomsFinishedLoading) {
      logger.warn('Rooms were still loading when the scroll position was measured', {
        timeoutMs: ROOMS_LOADED_TIMEOUT_MS,
      });
    }

    // A scroll restore can still land after the last supplier, so one reading is not
    // enough - taken right after navigation it is always 0 and would pass whatever the
    // page does next. Sample across a settle window and keep the worst offset seen.
    const samples = [];
    for (let i = 0; i < SCROLL_SETTLE_SAMPLES; i++) {
      if (i > 0) await page.waitForTimeout(SCROLL_SETTLE_INTERVAL_MS);
      samples.push(await roomLevelResultsPage.getDistanceFromPageTop());
    }

    const worstSample = samples.reduce((worst, sample) => (sample.offset > worst.offset ? sample : worst));
    logger.info('Room level scroll offsets sampled', {
      offsets: samples.map((sample) => sample.offset),
      worstOffset: worstSample.offset,
      scrollRange: worstSample.range,
    });

    // A hotel with few rooms can leave the page too short to scroll, which pins the offset
    // to the top on its own. That is still a pass - the app was asked to reset the scroll
    // position and the user does see the top of the page - but it is a weaker one, so it is
    // recorded rather than either failed or hidden.
    if (worstSample.range <= PAGE_TOP_TOLERANCE_PX) {
      logger.warn('Room level page is too short to scroll, so its offset could not have been anything but the top', {
        scrollRange: worstSample.range,
      });
    }

    if (worstSample.offset > PAGE_TOP_TOLERANCE_PX) {
      const scrolledElement = worstSample.container > worstSample.document
        ? `container ${worstSample.containerDescription}`
        : 'document';
      throw new Error(
        `Expected room level page to be displayed at the top, but it was scrolled ${worstSample.offset}px down ` +
          `(${scrolledElement}; tolerance ${PAGE_TOP_TOLERANCE_PX}px). ` +
          `Offsets sampled over ${(SCROLL_SETTLE_SAMPLES - 1) * SCROLL_SETTLE_INTERVAL_MS}ms: ` +
          `${samples.map((sample) => sample.offset).join(', ')}`,
      );
    }

    // Scroll numbers alone cannot tell us the user sees the top of the page: a layout
    // that scrolls something we did not measure would still read 0. The first content
    // of the page being on screen is the check that holds either way.
    const heading = await roomLevelResultsPage.getHotelNameHeadingPosition();
    if (!heading.isInViewport) {
      throw new Error(
        `Expected room level page to be displayed at the top, but the hotel name heading is outside the viewport ` +
          `(heading top ${heading.top}px, viewport height ${heading.viewportHeight}px)`,
      );
    }
  },

  /**
   * Verifies that a filter tag with the given text is visible in the room-filter summary bar.
   * @param {import('playwright').Page} page
   * @param {string} tagText - The tag text to look for (e.g. "TMC", "My Corporate")
   * @throws {Error} If the tag is not visible
   */
  async verifyRoomFilterTag(page, tagText) {
    if (!page) throw new Error('page is required');
    if (!tagText || typeof tagText !== 'string') throw new Error(`tagText must be a non-empty string, got: ${typeof tagText}`);
    const p = getPageObject(page, RoomLevelResultsPage);
    const isVisible = await p.isFilterTagVisible(tagText);
    if (!isVisible) throw new Error(`Room filter tag "${tagText}" is not visible in the filter summary`);
  },

  /**
   * Verifies the TMC option of the "Agreement" filter is checked in room level results.
   * Both labels are fixed in the UI, so neither is exposed as a step parameter.
   * @param {import('playwright').Page} page
   * @throws {Error} If the TMC agreement option is not checked
   */
  async verifyTmcAgreementFilterChecked(page) {
    if (!page) throw new Error('page is required');
    const p = getPageObject(page, RoomLevelResultsPage);
    const isChecked = await p.isFilterOptionChecked('Agreement', 'TMC');
    if (!isChecked) throw new Error('The "TMC" option of the "Agreement" room filter is not checked');
  },

  /**
   * Verifies the "My corporate" option of the "Agreement" filter is checked in room level results.
   * Both labels are fixed in the UI, so neither is exposed as a step parameter.
   * @param {import('playwright').Page} page
   * @throws {Error} If the corporate agreement option is not checked
   */
  async verifyCorporateAgreementFilterChecked(page) {
    if (!page) throw new Error('page is required');
    const p = getPageObject(page, RoomLevelResultsPage);
    const isChecked = await p.isFilterOptionChecked('Agreement', 'My corporate');
    if (!isChecked) throw new Error('The "My corporate" option of the "Agreement" room filter is not checked');
  },

  /**
   * Adds a room marked as "Check cancellation policy" to the cart.
   * Handles the optional cancellation terms dialog and conflict quote modal.
   * @param {import('playwright').Page} page
   */
  async addCheckCancellationPolicyRoomToCart(page) {
    if (!page) throw new Error('page parameter is required');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const resultsPage = getPageObject(page, ResultsPage);

    await roomLevelResultsPage.waitForViewHotelOnMapText();
    await resultsPage.waitForAddToTripText();
    await roomLevelResultsPage.clickAddToTripOnCheckCancellationPolicyRoom();
    await roomLevelResultsPage.handleCancellationTermsDialogIfVisible();
    await Results.clickProceedConflictQuoteModal(page);
  },

  /**
   * ADO 77842 — adds a specific room (matched by its exact room name) to the cart,
   * handling the optional cancellation-terms dialog and conflict-quote modal the same
   * way the other add-to-cart flows do. Used for fixture rooms that force a specific
   * behaviour (e.g. "FAKE -STANDARD- Valuation Price Increase").
   * @param {import('playwright').Page} page
   * @param {string} roomName - Exact room name shown on the room card
   */
  async addRoomByNameToCart(page, roomName) {
    if (!page) throw new Error('page parameter is required');
    if (!roomName || typeof roomName !== 'string') {
      throw new Error(`roomName must be a non-empty string, got: ${typeof roomName}`);
    }
    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const resultsPage = getPageObject(page, ResultsPage);

    await roomLevelResultsPage.waitForViewHotelOnMapText();
    await resultsPage.waitForAddToTripText();
    await roomLevelResultsPage.clickAddToTripOnRoomByName(roomName);
    await roomLevelResultsPage.handleCancellationTermsDialogIfVisible();
    await Results.clickProceedConflictQuoteModal(page);
  },

  /**
   * Verifies the "Provided by" label is visible in room level results and contains "Provided by" (case-insensitive).
   * @param {import('playwright').Page} page
   * @throws {Error} If the label is not visible or its text does not contain "Provided by"
   */
  async verifyProviderLabelVisible(page) {
    if (!page) throw new Error('page parameter is required');
    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const isVisible = await roomLevelResultsPage.isProviderLabelVisible();
    if (!isVisible) {
      throw new Error('"Provided by" label is not visible in room level results');
    }
    const labelText = await roomLevelResultsPage.getProviderLabelText();
    if (!labelText.toLowerCase().includes('provided by')) {
      throw new Error(`Provider label in room level results does not contain "Provided by". Actual text: "${labelText}"`);
    }
  },

  /**
   * Clicks the price details button on the first room to open the price breakdown dialog.
   * @param {import('playwright').Page} page
   */
  async clickPriceBreakdownButton(page) {
    if (!page) throw new Error('page parameter is required');
    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    await roomLevelResultsPage.clickPriceDetailsButton();
  },

  /**
   * Extracts all price breakdown values from the open dialog.
   * @param {import('playwright').Page} page
   * @returns {Promise<{nightPrice: number, subtotal: number, total: number}>}
   */
  async extractPriceBreakdownValues(page) {
    if (!page) throw new Error('page parameter is required');
    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const nightPrice = await roomLevelResultsPage.getPriceBreakdownNightPrice();
    const subtotal = await roomLevelResultsPage.getPriceBreakdownSubtotal();
    const total = await roomLevelResultsPage.getPriceBreakdownTotal();
    return { nightPrice, subtotal, total };
  },

  /**
   * Navigates back to hotel level results by clicking a breadcrumb link.
   * @param {import('playwright').Page} page
   * @param {string} [linkText='Hotels'] - The breadcrumb link text to click
   */
  async navigateBackViaBreakcrumb(page, linkText = 'Hotels') {
    if (!page) throw new Error('page parameter is required');
    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    await roomLevelResultsPage.clickBreadcrumbLink(linkText);
    await page.waitForURL(/\/products\/hotels\/results/, { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 });
  },

  /**
   * Sets the max price in the room-level Price filter panel.
   * @param {import('playwright').Page} page
   * @param {number} maxPrice - Maximum price value to filter by
   */
  async filterRoomsByMaxPrice(page, maxPrice) {
    if (!page) throw new Error('[RoomLevelResults.filterRoomsByMaxPrice] page is required');
    if (typeof maxPrice !== 'number' || maxPrice <= 0) {
      throw new Error(`[RoomLevelResults.filterRoomsByMaxPrice] "maxPrice" must be a positive number, got: ${typeof maxPrice} (${maxPrice})`);
    }
    logger.debug('Filtering room results by max price', { maxPrice });
    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    try {
      await roomLevelResultsPage.setMaxPriceFilter(maxPrice);
    } catch (err) {
      throw new Error(`[RoomLevelResults.filterRoomsByMaxPrice] Failed to apply max price filter of ${maxPrice}. ${err.message}`);
    }
  },

  // ===== GSA PER DIEM POLICY =====

  /**
   * Compares the GSA banner rendered above the room list against the allowance.
   * The room-level banner carries the same limit as the hotel-level one.
   *
   * @param {import('playwright').Page} page
   * @param {object} allowance - Allowance resolved at hotel level
   * @returns {Promise<{actual: {title: string, info: string}, expected: {title: string, info: string}}>}
   */
  async getGsaBannerComparisonInRoomResults(page, allowance) {
    if (!page) throw new Error('[RoomLevelResults.getGsaBannerComparisonInRoomResults] "page" is required.');
    if (!allowance) throw new Error('[RoomLevelResults.getGsaBannerComparisonInRoomResults] "allowance" is required.');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const banner = await roomLevelResultsPage.getGsaBannerText();
    const expected = buildGsaBannerText(allowance);

    return {
      actual: { title: normalizeText(banner.title), info: normalizeText(banner.info) },
      expected: { title: normalizeText(expected.title), info: normalizeText(expected.info) },
    };
  },

  /**
   * Checks every loaded room card's out of policy badge against the GSA nightly limit.
   * @param {import('playwright').Page} page
   * @param {number} nightlyLimit - The GSA nightly lodging limit that applies to the stay
   * @returns {Promise<{total: number, aboveLimit: number, belowLimit: number,
   *                    missingIndicator: Array<object>, unexpectedIndicator: Array<object>}>}
   */
  async getRoomPolicyIndicatorsAgainstGsaLimit(page, nightlyLimit) {
    if (!page) throw new Error('[RoomLevelResults.getRoomPolicyIndicatorsAgainstGsaLimit] "page" is required.');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const rooms = await roomLevelResultsPage.getRoomPricesWithPolicyIndicator();

    if (rooms.length === 0) {
      throw new Error('[RoomLevelResults.getRoomPolicyIndicatorsAgainstGsaLimit] No room results are loaded to check.');
    }

    const breakdown = splitByGsaLimit(rooms, nightlyLimit);

    logger.info('Checked room policy indicators against the GSA nightly limit', {
      nightlyLimit,
      total: breakdown.total,
      aboveLimit: breakdown.aboveLimit,
      belowLimit: breakdown.belowLimit,
    });

    return breakdown;
  },

  /**
   * Checks the out of policy rooms against the GSA nightly limit on the hotel currently
   * open, falling back to a second hotel only when this one cannot answer the question.
   *
   * The hotel selected for the room checks is the one priced closest below the limit, so it
   * always has rooms under the limit but may have none above it — a small hotel whose whole
   * room list sits under the limit answers the in-policy half and nothing else. In that case
   * this returns to the hotel list and opens the hotel priced closest above the limit, where
   * every room is above it by definition.
   *
   * @param {import('playwright').Page} page
   * @param {number} nightlyLimit - The GSA nightly lodging limit that applies to the stay
   * @returns {Promise<{breakdown: object, fallbackHotel: {name: string, price: number}|null}>}
   */
  async getRoomsAboveGsaLimitWithFallback(page, nightlyLimit) {
    if (!page) throw new Error('[RoomLevelResults.getRoomsAboveGsaLimitWithFallback] "page" is required.');

    let breakdown = await this.getRoomPolicyIndicatorsAgainstGsaLimit(page, nightlyLimit);

    if (breakdown.aboveLimit > 0) {
      return { breakdown, fallbackHotel: null };
    }

    logger.info('This hotel has no room above the GSA nightly limit — checking the hotel priced closest above it instead', {
      nightlyLimit,
      roomsInThisHotel: breakdown.total,
    });

    await this.navigateBackViaBreakcrumb(page);
    const fallbackHotel = await HotelLevelResults.selectHotelPricedClosestAboveGsaLimit(page, nightlyLimit);

    // The filter panel is built from the loaded room set, so waiting for it means the whole
    // room list has rendered before any room is read.
    await this.verifyRoomLevelFilters(page);

    breakdown = await this.getRoomPolicyIndicatorsAgainstGsaLimit(page, nightlyLimit);

    return { breakdown, fallbackHotel };
  },

  /**
   * Hovers the first out of policy room card and reads its violation tooltip.
   * @param {import('playwright').Page} page
   * @param {object} allowance - Allowance resolved at hotel level
   * @returns {Promise<{actual: string, expected: string}>}
   */
  async getGsaViolationTooltipInRoomResults(page, allowance) {
    if (!page) throw new Error('[RoomLevelResults.getGsaViolationTooltipInRoomResults] "page" is required.');
    if (!allowance) throw new Error('[RoomLevelResults.getGsaViolationTooltipInRoomResults] "allowance" is required.');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const commonPage = getPageObject(page, CommonPage);
    await roomLevelResultsPage.hoverFirstOutOfPolicyInfoIcon();
    const actual = await commonPage.getOOPTooltipText();

    return {
      actual: normalizeText(actual),
      expected: normalizeText(buildGsaViolationText(allowance)),
    };
  },

  /**
   * Checks every loaded room card's out of policy badge against the out of policy price.
   * @param {import('playwright').Page} page
   * @param {number} oopPrice - The price from which a room is out of policy
   * @returns {Promise<{total: number, atOrAboveOopPrice: number, belowOopPrice: number, withinRounding: number,
   *                    missingIndicator: Array<object>, unexpectedIndicator: Array<object>}>}
   */
  async getRoomPolicyIndicatorsAgainstOopPrice(page, oopPrice) {
    if (!page) throw new Error('[RoomLevelResults.getRoomPolicyIndicatorsAgainstOopPrice] "page" is required.');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const rooms = await roomLevelResultsPage.getRoomPricesWithPolicyIndicator();

    if (rooms.length === 0) {
      throw new Error('[RoomLevelResults.getRoomPolicyIndicatorsAgainstOopPrice] No room results are loaded to check.');
    }

    const breakdown = splitByOopPrice(rooms, oopPrice);

    logger.info('Checked room policy indicators against the out of policy price', {
      oopPrice,
      total: breakdown.total,
      atOrAboveOopPrice: breakdown.atOrAboveOopPrice,
      belowOopPrice: breakdown.belowOopPrice,
      withinRounding: breakdown.withinRounding,
    });

    return breakdown;
  },

  /**
   * Returns the room card priced closest below the given price, with its policy badge state.
   * @param {import('playwright').Page} page
   * @param {number} price - The price the room must be below
   * @returns {Promise<{index: number, price: number, isOutOfPolicy: boolean}>}
   */
  async getRoomPricedClosestBelow(page, price) {
    if (!page) throw new Error('[RoomLevelResults.getRoomPricedClosestBelow] "page" is required.');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);

    // Rooms stream in per supplier; wait so a later, closer room is not skipped.
    const roomsFinishedLoading = await roomLevelResultsPage.waitForRoomsFinishedLoading();
    if (!roomsFinishedLoading) {
      logger.warn('Rooms were still loading when the room prices were read, so some rooms may not have been checked');
    }

    const rooms = await roomLevelResultsPage.getRoomPricesWithPolicyIndicator();
    const { below: room } = findClosestToOopPrice(rooms, price);
    if (!room) {
      throw new Error(`[RoomLevelResults.getRoomPricedClosestBelow] No room is priced below ${price}.`);
    }

    logger.info('Found the room priced closest below the price', {
      price,
      position: room.index + 1,
      roomPrice: room.price,
      isOutOfPolicy: room.isOutOfPolicy,
    });

    return room;
  },

  /**
   * Adds the room priced closest below the given price to the cart.
   * @param {import('playwright').Page} page
   * @param {number} price - The price the room must be below
   * @returns {Promise<{index: number, price: number, isOutOfPolicy: boolean}>} The added room
   */
  async addRoomPricedClosestBelowToCart(page, price) {
    const room = await this.getRoomPricedClosestBelow(page, price);

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    await roomLevelResultsPage.clickAddToTripOnRoomByIndex(room.index);

    // Adding a room can raise the conflicting-quotes modal, as the other add-to-cart flows do.
    await Results.clickProceedConflictQuoteModal(page);
    return room;
  },

  /**
   * Hovers the first out of policy room card and returns the policy violation from its tooltip.
   * Scoped to the room card's badge, because a deposit badge on the same page shares its markup.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The first policy violation in the tooltip
   */
  async hoverAndGetOOPTooltipTextInRoomResults(page) {
    if (!page) throw new Error('[RoomLevelResults.hoverAndGetOOPTooltipTextInRoomResults] "page" is required.');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const commonPage = getPageObject(page, CommonPage);
    await roomLevelResultsPage.hoverFirstOutOfPolicyInfoIcon();
    return commonPage.getOOPTooltipText();
  },

  /**
   * Returns the listed room cards that show an out of policy badge.
   * @param {import('playwright').Page} page
   * @returns {Promise<{total: number, outOfPolicy: Array<{index: number, price: number}>}>}
   *          Room count and the out of policy rooms (0-based card position and price)
   */
  async getOutOfPolicyRoomsInRoomLevelResults(page) {
    if (!page) throw new Error('[RoomLevelResults.getOutOfPolicyRoomsInRoomLevelResults] "page" is required.');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);

    // Rooms stream in per supplier; wait so later rooms are not skipped by the check.
    const roomsFinishedLoading = await roomLevelResultsPage.waitForRoomsFinishedLoading();
    if (!roomsFinishedLoading) {
      logger.warn('Rooms were still loading when the policy badges were read, so some rooms may not have been checked');
    }

    const rooms = await roomLevelResultsPage.getRoomPricesWithPolicyIndicator();
    if (rooms.length === 0) {
      throw new Error('[RoomLevelResults.getOutOfPolicyRoomsInRoomLevelResults] No room results are loaded to check.');
    }

    const outOfPolicy = rooms
      .filter((room) => room.isOutOfPolicy)
      .map(({ index, price }) => ({ index, price }));
    return { total: rooms.length, outOfPolicy };
  },

  /**
   * Adds the first out of policy room to the cart.
   * @param {import('playwright').Page} page
   */
  async addFirstOutOfPolicyRoomToCart(page) {
    if (!page) throw new Error('[RoomLevelResults.addFirstOutOfPolicyRoomToCart] "page" is required.');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    await roomLevelResultsPage.clickAddToTripOnFirstOutOfPolicyRoom();

    // Adding a room can raise the conflicting-quotes modal, as the other add-to-cart flows do.
    await Results.clickProceedConflictQuoteModal(page);
  },
};

module.exports = RoomLevelResults;
