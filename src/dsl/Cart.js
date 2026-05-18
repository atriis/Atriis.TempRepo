const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const { CartPage, SELECTORS: CART_SELECTORS } = require("@pages/CartPage");
const { CheckoutPage, SELECTORS: CheckoutSelectors } = require("@pages/CheckoutPage");
const { CommonPage, SELECTORS: COMMON_SELECTORS } = require("@pages/CommonPage");
const { ResultsPage } = require("@pages/ResultsPage");
const FlightResultsPage = require("@pages/FlightResultsPage");
const FlightResults = require("./FlightResults");
const tripStatus = require("@data/tripStatus.json");
const config = require("@config/config");
const BookingErrorHandler = require("@utils/BookingErrorHandler");
const { expectNumbersToBeEqualWithTolerance } = require("../assertions/numberAssertions");
const logger = require("@utils/logger").child("Cart-DSL");

/**
 * Cart DSL
 *
 * Describes how users interact with the cart.
 */
const Cart = {
  async ensureCartReadyForStatusCheck(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const resultsPage = getPageObject(page, ResultsPage);
    const handledImmediateConflictQuote = await resultsPage.handleConflictQuoteModalIfAppears(2000);
    const handledConflictQuote = handledImmediateConflictQuote || await resultsPage.handleConflictQuoteModalIfVisible();

    if (handledConflictQuote) {
      await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    }
  },

  async waitForTargetOrHandlePriceChange(page, targetLocator, targetDescription, timeout = process.env.CI ? 120000 : 90000) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!targetLocator) {
      throw new Error('targetLocator is required');
    }

    if (!targetDescription || typeof targetDescription !== 'string') {
      throw new Error('targetDescription must be a non-empty string');
    }

    const cartPage = getPageObject(page, CartPage);
    const proceedWithChangeButton = cartPage.getProceedWithChangeButton();

    try {
      await Promise.race([
        targetLocator.waitFor({ state: 'visible', timeout }),
        proceedWithChangeButton.waitFor({ state: 'visible', timeout }),
      ]);
    } catch (error) {
      throw new Error(
        `Neither ${targetDescription} nor the price change modal appeared within ${timeout}ms. Original error: ${error.message}`,
      );
    }

    if (await targetLocator.isVisible().catch(() => false)) {
      return { clickedModal: false };
    }

    const clickedModal = await cartPage.clickProceedWithChangeIfVisible(1000);

    if (!clickedModal) {
      throw new Error(`Expected ${targetDescription} or a visible price change modal, but neither became actionable.`);
    }

    await targetLocator.waitFor({ state: 'visible', timeout: 60000 });
    return { clickedModal: true };
  },

  /**
   * STRICT cancel flow (returns cancellation status)
   *
   * This flow:
   * - Confirms Trip Overview page is loaded
   * - Opens actions menu
   * - Confirms cancellation
   * - Checks for success message
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{cancelled: boolean, messageVisible: boolean}>}
   */
  async cancelTripStrict(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const cartPage = getPageObject(page, CartPage);

    // Wait for page network activity to settle before attempting the cancellation dropdown.
    // The el-dropdown is disabled while the page is loading; skipping this causes flaky hover failures.
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Confirm correct page state
    await cartPage.waitForTripOverviewTitle();
    // Open actions menu and cancel
    await cartPage.hoverTripActionsDropdownIcon();
    await cartPage.waitForDropdownMenu();
    await cartPage.clickCancelTripOption();

    // Confirm cancellation
    await cartPage.waitForTripCancellationDialogTitle();
    await cartPage.clickConfirmTripCancellationButton();

    // Check if cancellation was successful
    await cartPage.waitForTripCancelledMessage();
    const messageVisible = await page.getByText("Cancellation confirmed!", { exact: true }).isVisible();

    // Allow backend and UI to settle
    await page.waitForLoadState("networkidle");

    return { cancelled: true, messageVisible };
  },

  /**
   * STRICT cancel flow with an explicit pre-cancellation wait.
   *
   * @param {import('playwright').Page} page
   * @param {number} waitMs
   * @returns {Promise<{cancelled: boolean, messageVisible: boolean}>}
   */
  async cancelTripStrictWithWait(page, waitMs) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!Number.isInteger(waitMs) || waitMs < 0) {
      throw new Error(`waitMs must be a non-negative integer, got: ${waitMs}`);
    }

    logger.info('Waiting before strict trip cancellation', { waitMs });
    await page.waitForTimeout(waitMs);

    return this.cancelTripStrict(page);
  },

  /**
   * SAFE cancel flow (never throws, returns status)
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{cancelled: boolean, error?: string}>}
   */
  async cancelTripSafely(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.waitForTripOverviewTitle();
      await cartPage.hoverTripActionsDropdownIcon();
      await cartPage.waitForDropdownMenu();
      await cartPage.clickCancelTripOption();
      await cartPage.waitForTripCancellationDialogTitle();
      await cartPage.clickConfirmTripCancellationButton();
      const wasCancelled = await cartPage.isTripCancelledMessageVisible();
      await page.waitForLoadState("networkidle");
      return { cancelled: wasCancelled };
    } catch (error) {
      return {
        cancelled: false,
        error: error?.message,
      };
    }
  },

  async cancelFirstActiveQuote(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);

    await cartPage.waitForTripOverviewTitle();
    await cartPage.openActiveQuoteActionsDropdown();
    await cartPage.clickActiveQuoteCancelOption();

    const promptType = await cartPage.waitForQuoteCancellationPrompt();
    await cartPage.confirmQuoteCancellation(promptType);

    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await cartPage.waitForTripOverviewTitle();
  },

  async showCancelledItems(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.waitForCancelledQuotesSection({ timeout: 5000 });
      return;
    } catch {
      // Section is not visible yet; open it from the trip actions menu.
    }

    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await cartPage.hoverTripActionsDropdownIcon();
    await cartPage.waitForDropdownMenu();
    await cartPage.clickShowCancelledItemsOption();
    await cartPage.waitForCancelledQuotesSection();
  },

  async clickCheckPriceAndProceedOnFirstCancelledQuote(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);

    await cartPage.clickFirstCancelledQuoteCheckPriceButton();
    const title = await cartPage.getCheckPriceDialogTitle();
    const proceedVisible = await cartPage.isCheckPriceProceedButtonVisible();

    expect(
      proceedVisible,
      `Proceed button should be visible in the check price dialog. Dialog title: "${title}"`,
    ).toBe(true);

    await cartPage.clickCheckPriceProceedButton();
  },

  async clickCheckPriceButtonInCart(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);

    await cartPage.clickFirstCancelledQuoteCheckPriceButton();
    await cartPage.getCheckPriceDialogTitle();
  },

  async verifyFareRulesDisplayedInCheckPriceModal(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);
    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await cartPage.clickCheckPriceFareRulesButton();
    await flightResultsPage.waitForFareRulesMainHeadline();

    const headline = await flightResultsPage.getFareRulesMainHeadlineText();
    expect(headline).toMatch(/Fare Basis/i);

    await flightResultsPage.clickXToClosePricingOptionsModal(1);
  },

  async clickProceedOnCheckPriceDialog(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);
    const resultsPage = getPageObject(page, ResultsPage);

    await cartPage.clickCheckPriceProceedButton();
    const handledConflictQuote = await resultsPage.handleConflictQuoteModalIfAppears(10000);

    if (handledConflictQuote) {
      await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    }

    await cartPage.waitForCheckPriceDialogToDisappear();
  },

  async expectHotelToBeRefundableInCart(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const cartPage = getPageObject(page, CartPage);
    const labelText = await cartPage.getHotelRefundableText();
    expect(labelText).toMatch(/Refundable/i);
    expect(labelText).not.toMatch(/Non\s*Refundable/i);
  },

  /**
   * Gets the cancellation policy label text from the cart.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The cancellation policy text
   */
  async getCancellationPolicyFromCart(page) {
    if (!page) {
      throw new Error('page is required');
    }
    const cartPage = getPageObject(page, CartPage);
    return cartPage.getCancellationPolicyFromCart();
  },

  /**
   * Verifies that terms and conditions (cancellation policy) are visible and non-empty in cart.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The cancellation policy text
   */
  async checkTermsAndConditionsInCart(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const policyText = await cartPage.getCancellationPolicyFromCart();
    expect(policyText.length).toBeGreaterThan(0);
    return policyText;
  },

  /**
   * Extracts the seat price from the seat map drawer footer.
   * Reads raw text from the Page Object, then parses to a numeric value.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<number|null>} The seat price as a float
   */
  async extractSeatPriceFromDrawer(page) {
    if (!page) {
      throw new Error('page is required');
    }
    const cartPage = getPageObject(page, CartPage);
    const text = await cartPage.getSeatPriceTextFromDrawer();
    const cleaned = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || null;
  },


  /**
   * Asserts that the booking status label matches the expected status.
   *
   * @param {string} expectedStatus
   * @param {object} [options]
   * @param {number} [options.timeout=60000] - Timeout in ms
   * @param {import('playwright').Page} options.page - Playwright page instance
   * @returns {Promise<void>}
   */
  async expectBookingStatusToBe(expectedStatus, { timeout = 60000, page, bookingContext = {} } = {}) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedStatus || typeof expectedStatus !== 'string') {
      throw new Error('expectedStatus must be a non-empty string');
    }

    if (typeof timeout !== 'number' || timeout < 0) {
      throw new Error(`timeout must be >= 0, got ${timeout}`);
    }

    const mappedStatus = tripStatus?.label?.[expectedStatus]?.status;
    const expectedText = mappedStatus || expectedStatus;
    const cartPage = getPageObject(page, CartPage);
    const checkoutPage = getPageObject(page, CheckoutPage);

    const resolveBookingErrorResult = async () => {
      const supplier = await checkoutPage.getBookingErrorSupplierName();
      const bookingErrorText = await checkoutPage.getBookingErrorDialogText();
      const knownBySupplier = supplier
        ? BookingErrorHandler.isKnownBookingError(bookingContext.product, bookingContext.subProduct, supplier)
        : false;
      const knownByMessage = bookingErrorText
        ? BookingErrorHandler.isKnownBookingError(bookingContext.product, bookingContext.subProduct, bookingErrorText)
        : false;
      const isKnownError = knownBySupplier || knownByMessage;
      const shouldSkip = isKnownError
        ? BookingErrorHandler.getSkipOnErrorConfig(bookingContext.product, bookingContext.subProduct)
        : false;

      const errorLogValue = supplier || bookingErrorText || 'UNKNOWN';
      BookingErrorHandler.handleBookingError(bookingContext.product, errorLogValue, bookingContext.subProduct);

      return {
        bookingErrorDetected: true,
        knownBookingError: isKnownError,
        shouldSkip,
        supplier: supplier || null,
        bookingErrorText: bookingErrorText || null,
      };
    };

    if (expectedText.toLowerCase() === 'confirmed') {
      // Wait for page to settle after booking finalization
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      await Cart.ensureCartReadyForStatusCheck(page);

      const bookingErrorDialog = page.locator(CheckoutSelectors.BOOKING_ERROR_DIALOG).first();

      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        const bookingErrorVisible = await bookingErrorDialog.isVisible().catch(() => false);
        if (bookingErrorVisible) {
          return resolveBookingErrorResult();
        }

        const remaining = deadline - Date.now();
        if (remaining <= 0) {
          break;
        }

        const chunkTimeout = Math.min(5000, remaining);
        try {
          const actualStatus = await cartPage.getBookingStatus({ timeout: chunkTimeout, page });
          if (actualStatus.toLowerCase().includes(expectedText.toLowerCase())) {
            return {
              bookingErrorDetected: false,
              knownBookingError: false,
              shouldSkip: false,
              supplier: null,
              bookingErrorText: null,
            };
          }
        } catch {
          // Continue polling until timeout to catch delayed status/error transitions.
        }

        await page.waitForTimeout(500);
      }

      const bookingErrorVisible = await bookingErrorDialog.isVisible().catch(() => false);
      if (bookingErrorVisible) {
        return resolveBookingErrorResult();
      }

      throw new Error(`Booking did not reach status "${expectedText}" within ${timeout}ms and no booking error modal was handled.`);
    }

    await Cart.ensureCartReadyForStatusCheck(page);

    const actualStatus = expectedText.toLowerCase() === 'ticketing complete'
      ? await cartPage.getStatusByExpectedText(expectedText, { timeout, page })
      : await cartPage.getBookingStatus({ timeout, page });

    expect(actualStatus.toLowerCase()).toContain(expectedText.toLowerCase());
    return {
      bookingErrorDetected: false,
      knownBookingError: false,
      shouldSkip: false,
      supplier: null,
      bookingErrorText: null,
    };
  },

  /**
   * Verifies the trip-level status badge shown beside the Trip overview title.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedStatus
   * @param {object} [options]
   * @param {number} [options.timeout=60000]
   */
  async verifyTripStatus(page, expectedStatus, { timeout = 60000 } = {}) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedStatus || typeof expectedStatus !== 'string') {
      throw new Error('expectedStatus must be a non-empty string');
    }

    if (typeof timeout !== 'number' || timeout < 0) {
      throw new Error(`timeout must be >= 0, got ${timeout}`);
    }

    const mappedStatus = tripStatus?.label?.[expectedStatus]?.status;
    const expectedText = mappedStatus || expectedStatus;
    const cartPage = getPageObject(page, CartPage);

    await Cart.ensureCartReadyForStatusCheck(page);

    await cartPage.waitForTripOverviewTitle();
    const actualStatus = await cartPage.getTripOverviewStatus({ timeout, page });
    expect(actualStatus.toLowerCase()).toContain(expectedText.toLowerCase());
  },

  async verifyFlightSegmentDetails(page, expectedSegments) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!Array.isArray(expectedSegments) || expectedSegments.length === 0) {
      throw new Error('expectedSegments must be a non-empty array');
    }

    const cartPage = getPageObject(page, CartPage);

    const actualSegments = await cartPage.getVisibleFlightQuoteSegmentSummaries();
    expect(actualSegments, 'Expected displayed flight segment details to match the stored result details').toEqual(expectedSegments);

    return { actualSegments };
  },

  /**
   * Verifies the original-currency text shown for the flight in cart contains the expected symbol.
   *
   * @param {import('playwright').Page} page
   * @param {string} currencySymbol
   * @returns {Promise<{currencySymbol: string, originalPriceText: string}>}
   */
  async verifyOriginalCurrencySymbolVisibleInCart(page, currencySymbol) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!currencySymbol || typeof currencySymbol !== 'string') {
      throw new Error('currencySymbol must be a non-empty string');
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForTripOverviewTitle();

    const originalPriceText = await cartPage.getFirstFlightOriginalPriceText();

    expect(originalPriceText, 'Expected cart flight summary to display original currency text').toContain('Original');
    expect(originalPriceText, 'Expected cart flight summary to display the requested original currency symbol')
      .toContain(currencySymbol);

    return { currencySymbol, originalPriceText };
  },

  async verifyCartFlightPricesMatchStoredPerTravelerPrices(page, expectedPrices, travelerCount) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedPrices || typeof expectedPrices !== 'object') {
      throw new Error('expectedPrices must be an object');
    }

    const { displayPrice, originalPrice } = expectedPrices;

    if (typeof displayPrice !== 'number' || Number.isNaN(displayPrice)) {
      throw new Error(`expectedPrices.displayPrice must be a valid number, got: ${displayPrice}`);
    }

    if (typeof originalPrice !== 'number' || Number.isNaN(originalPrice)) {
      throw new Error(`expectedPrices.originalPrice must be a valid number, got: ${originalPrice}`);
    }

    if (!Number.isInteger(travelerCount) || travelerCount < 1) {
      throw new Error(`travelerCount must be a positive integer, got: ${travelerCount}`);
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForTripOverviewTitle();

    const actualDisplayPrice = await cartPage.getFirstFlightDisplayPriceValue();
    const actualOriginalPrice = await cartPage.getFirstFlightOriginalPriceValue();
    const expectedDisplayTotal = displayPrice * travelerCount;
    const expectedOriginalTotal = originalPrice * travelerCount;

    expectNumbersToBeEqualWithTolerance(
      actualDisplayPrice,
      expectedDisplayTotal,
      1,
      `Cart display price vs stored flight result display price x ${travelerCount}`,
    );

    expectNumbersToBeEqualWithTolerance(
      actualOriginalPrice,
      expectedOriginalTotal,
      1,
      `Cart original price vs stored flight result original price x ${travelerCount}`,
    );

    return {
      actualDisplayPrice,
      actualOriginalPrice,
      expectedDisplayTotal,
      expectedOriginalTotal,
      travelerCount,
    };
  },

  /**
   * Asserts that the payment type label matches the expected value.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedType
   * @param {object} [options]
   * @param {number} [options.timeout=30000] - Timeout in ms
   * @returns {Promise<void>}
   */
  async verifyPaymentType(page, expectedType, { timeout = 30000 } = {}) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedType || typeof expectedType !== 'string') {
      throw new Error(`expectedType must be a non-empty string, got: ${typeof expectedType}`);
    }

    if (typeof timeout !== 'number' || timeout < 0) {
      throw new Error(`timeout must be >= 0, got ${timeout}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const actualType = await cartPage.waitForPaymentTypeText(expectedType, { timeout });

    // Normalize whitespace (handles non-breaking spaces, newlines, etc.)
    const normalizedActual = actualType.toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizedExpected = expectedType.toLowerCase().replace(/\s+/g, ' ').trim();
    
    expect(normalizedActual).toContain(normalizedExpected);
  },

  /**
   * Opens share quote dialog and waits for the subject field to be visible.
   * Does NOT send the email - use isQuoteSent() to complete the flow.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async clickShareQuoteAndWaitForSubjectField(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const cartPage = getPageObject(page, CartPage);
    const commonPage = getPageObject(page, CommonPage);
    await cartPage.hoverShareButton();
    await cartPage.clickShareQuotes();
    await commonPage.waitForSubjectLabelSharePopUp();
  },

  /**
   * Opens share itinerary dialog and waits for the subject field to be visible.
   * Does NOT send the email - use isQuoteSent() to complete the flow.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async clickShareItineraryAndWaitForSubjectField(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const cartPage = getPageObject(page, CartPage);
    const commonPage = getPageObject(page, CommonPage);
    await cartPage.hoverShareButton();
    await cartPage.clickShareItinerary();
    await commonPage.waitForSubjectLabelSharePopUp();
  },

  /**
   * Sends a quote or itinerary email and waits for success notification.
   * Used after opening the share dialog with clickShareQuoteAndWaitForSubjectField.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{sent: boolean}>}
   */
  async sendQuoteAndWaitForSuccess(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const cartPage = getPageObject(page, CartPage);
    const commonPage = getPageObject(page, CommonPage);

    await cartPage.clickSendEmailButton();
    await commonPage.getSuccessNotification().waitFor({ state: "visible" });
  },

  // ===== OUT OF POLICY (OOP) VALIDATION =====

  /**
   * Checks if Out of Policy indicators are visible in cart page.
   * Returns visibility status for validation in step definitions.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<boolean>} True if OOP indicator is visible
   */
  async isOutOfPolicyIndicatorVisibleInCart(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const commonPage = getPageObject(page, CommonPage);
    await commonPage.waitForOOPVisible();
    return await page.locator(COMMON_SELECTORS.OOP_INFO).isVisible();
  },

  /**
   * Checks if Out of Policy indicators are hidden in cart page.
   * Returns visibility status for validation in step definitions.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<boolean>} True if OOP indicator is hidden
   */
  async isOutOfPolicyIndicatorHiddenInCart(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const commonPage = getPageObject(page, CommonPage);
    await commonPage.waitForOOPNotVisible();
    return await page.locator(COMMON_SELECTORS.OOP_INFO).isHidden();
  },

  /**
   * Hovers over the Out of Policy info icon and gets tooltip text.
   * Returns the tooltip text for validation in step definitions.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<string>} The OOP tooltip text
   */
  async hoverAndGetOOPTooltipTextInCart(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const commonPage = getPageObject(page, CommonPage);
    await commonPage.waitForOOPVisible();
    await commonPage.hoverOverOOPInfoIcon();
    return await commonPage.getOOPTooltipTextCart();
  },

  /**
   * Verifies that the OOP free text justification textbox is not visible in cart.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async verifyOOPFreeTextJustificationNotVisibleInCart(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);
    const isVisible = await cartPage.getOOPJustificationTextbox().isVisible();
    expect(isVisible).toBe(false);
  },

  /**
   * Fills in the OOP justification text and saves it immediately.
   * Business-level action combining text input and save.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} justificationText - The justification text to enter
   * @returns {Promise<void>}
   */
  async fillInOOPJustificationTextAndSave(page, justificationText = "abc") {
    if (!page) {
      throw new Error('page is required');
    }
    
    const cartPage = getPageObject(page, CartPage);
    const isVisible = await cartPage.getOOPJustificationTextbox().isVisible();
    if (!isVisible) {
      return;
    }
    await cartPage.fillInOOPJustificationText(justificationText);
    await cartPage.saveOOPJustificationText();
  },

  /**
   * Opens the OOP justification dropdown and selects an option.
   * Business-level action for selecting a justification reason.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} justificationOption - The justification option to select
   * @returns {Promise<void>}
   */
  async selectOOPJustificationDropdownOptionAndSave(page, justificationOption) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!justificationOption || typeof justificationOption !== 'string') {
      throw new Error('justificationOption must be a non-empty string');
    }
    
    const cartPage = getPageObject(page, CartPage);
    await cartPage.openJustificationDropdown();
    await cartPage.waitForJustificationDropdownOption(justificationOption);
    await cartPage.selectJustificationDropdownOption(justificationOption);
    await cartPage.saveOOPJustificationText();
  },

  /**
   * Opens the OOP justification dropdown and verifies the number of available options.
   *
   * @param {import('playwright').Page} page
   * @param {number} expectedCount - Expected number of options in the dropdown
   * @returns {Promise<void>}
   */
  async openJustificationDropdownAndVerifyCount(page, expectedCount) {
    if (!page) throw new Error('page is required');
    if (typeof expectedCount !== 'number') throw new Error(`expectedCount must be a number, got: ${typeof expectedCount}`);

    const cartPage = getPageObject(page, CartPage);

    // Scroll dropdown into view before clicking — it may be below the fold
    const dropdown = cartPage.getJustificationDropdown();
    await dropdown.scrollIntoViewIfNeeded({ timeout: 10000 });
    await dropdown.click();

    // Wait for the popper to render options (el-select opens with animation)
    const options = cartPage.getAllVisibleJustificationOptions();
    await options.first().waitFor({ state: 'visible', timeout: 10000 });

    const count = await options.count();
    expect(count, `Expected ${expectedCount} justification options, got ${count}`).toBe(expectedCount);
  },

  /**
   * Verifies that specific options are present in the open OOP justification dropdown.
   * The dropdown must already be open before calling this method.
   *
   * @param {import('playwright').Page} page
   * @param {string[]} expectedOptions - Array of option labels expected to be visible
   * @returns {Promise<void>}
   */
  async verifyJustificationDropdownContainsOptions(page, expectedOptions) {
    if (!page) throw new Error('page is required');
    if (!Array.isArray(expectedOptions)) throw new Error(`expectedOptions must be an array, got: ${typeof expectedOptions}`);

    const cartPage = getPageObject(page, CartPage);
    for (const optionText of expectedOptions) {
      const option = cartPage.getJustificationOption(optionText);
      const visible = await option.isVisible();
      expect(visible, `Expected justification option "${optionText}" to be visible in dropdown`).toBe(true);
    }
  },

  /**
   * Verifies that the OOP justification dropdown is visible in cart and that selecting
   * and saving one option persists the selected value.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{selectedOption: string, selectedValue: string}>}
   */
  async verifyOOPJustificationDropdownSaveWorksInCart(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);
    const commonPage = getPageObject(page, CommonPage);

    await cartPage.waitForTripOverviewTitle();
    await commonPage.waitForOOPVisible();
    await cartPage.waitForJustificationDropdownVisible();

    const isFreeTextVisible = await cartPage.getOOPJustificationTextbox().isVisible().catch(() => false);
    expect(isFreeTextVisible, 'Expected dropdown justification for this OOP scenario, not a free-text field').toBe(false);

    const justificationDropdown = cartPage.getJustificationDropdown();
    await justificationDropdown.scrollIntoViewIfNeeded({ timeout: 10000 });
    await cartPage.openJustificationDropdown();

    const options = cartPage.getAllVisibleJustificationOptions();
    await options.first().waitFor({ state: 'visible', timeout: 10000 });

    const optionCount = await options.count();
    expect(optionCount, 'Expected at least one OOP justification option to be available').toBeGreaterThan(0);

    const selectedOption = await cartPage.selectFirstVisibleJustificationOption();
    expect(selectedOption, 'Expected the selected OOP justification option to have text').not.toBe('');

    await cartPage.saveOOPJustificationText();
    await cartPage.waitForSaveJustificationButtonHidden();
    await commonPage.waitForOOPVisible();

    const selectedValue = await cartPage.getSelectedJustificationValueText();
    expect(
      selectedValue,
      `Expected the saved OOP justification dropdown value to contain "${selectedOption}"`,
    ).toContain(selectedOption);

    return { selectedOption, selectedValue };
  },

  // ===== PRICE CHANGE MODAL =====


  /**
   * Accepts every visible terms and conditions checkbox in cart.
   * Useful for trips with multiple quotes that each require acceptance.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{acceptedCount: number}>}
   */
  async acceptAllTermsAndConditions(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);
    return cartPage.acceptAllTermsAndConditions();
  },

  /**
   * Accepts terms and proceeds to checkout.
   * Used by Flights, Hotels, and Cars.
   * 
   * After clicking "Proceed to Checkout", one of two things happens:
   * 1. Checkout page loads immediately (checkoutHeading visible)
   * 2. Price change modal appears first (proceedBtn visible)
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{proceeded: boolean, clickedModal: boolean}>}
   */
  async acceptTermsAndConditionsAndProceedToCheckout(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const cartPage = getPageObject(page, CartPage);
    const checkoutHeading = page.locator(CheckoutSelectors.BOOKING_DETAILS_HEADING);
    await cartPage.acceptTermsAndConditions();
    await cartPage.waitForProceedToCheckout();
    await cartPage.clickProceedToCheckout();

    const { clickedModal } = await this.waitForTargetOrHandlePriceChange(
      page,
      checkoutHeading,
      'checkout page',
    );

    return { proceeded: true, clickedModal };
  },

  /**
   * Clicks the proceed-to-checkout button WITHOUT waiting for checkout page navigation.
   * Use this when the platform is expected to block checkout (e.g., missing card details)
   * and show an inline validation warning instead of navigating to checkout.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async clickProceedToCheckoutButton(page) {
    if (!page) {
      throw new Error('page is required');
    }
    const cartPage = getPageObject(page, CartPage);
    await cartPage.acceptTermsAndConditions();
    await cartPage.waitForProceedToCheckout();
    await cartPage.clickProceedToCheckout();
  },

  /**
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Zero-based index of the fare rules button (default: 0)
   * @returns {Promise<void>}
   */
  async clickToOpenFareRulesInCart(page, index = 0) {
    if (!page) {
      throw new Error('page is required');
    }

    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    logger.info('Clicking to open fare rules in cart', { index });

    // A cart "More details" or "Price breakdown" drawer obscures the outer
    // cart fare-rules button, so scope the click inside the open drawer.
    if (await flightResultsPage.isAnyCartFlightDrawerOpen()) {
      await flightResultsPage.waitForDrawerToSettle();
      await flightResultsPage.waitAndClickFareRulesButtonInOpenCartDrawer();
      await flightResultsPage.waitForFareRulesNote();
      return { opened: true, source: 'drawer' };
    }

    await FlightResults.clickToOpenFareRules(page, index);
    return { opened: true, source: 'outer' };
  },

  /**
   * Opens the price breakdown drawer in cart.
   * Waits for button to be visible before clicking.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async clickToOpenPriceBreakdown(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForPriceBreakdownButton();
    await cartPage.clickPriceBreakdownButton();
  },

  /**
   * Verifies the mini-rule disclaimer text inside the cart price breakdown drawer.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText
   * @returns {Promise<{expectedText: string, actualText: string}>}
   */
  async verifyMiniRuleDisclaimerInPriceBreakdown(page, expectedText) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    const normalizeText = (text) => text.replace(/[’]/g, "'").replace(/\s+/g, ' ').trim();

    const cartPage = getPageObject(page, CartPage);
    const actualText = await cartPage.getPriceBreakdownMiniRuleDisclaimerText();

    expect(normalizeText(actualText)).toContain(normalizeText(expectedText));

    return { expectedText, actualText };
  },

  async verifyNonRefundableMiniRulesInPriceBreakdown(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const normalizeText = (text) => text.replace(/[’]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();

    const cartPage = getPageObject(page, CartPage);
    const subtotalLabel = await cartPage.getFlightPriceBreakdownSubtotalLabel();
    const beforeDepartureText = await cartPage.getFlightPriceBreakdownBeforeDepartureCancellationPolicyText();
    const afterDepartureText = await cartPage.getFlightPriceBreakdownAfterDepartureCancellationPolicyText();

    expect(normalizeText(subtotalLabel)).toBe('subtotal');
    expect(normalizeText(beforeDepartureText)).toContain('before departure');
    expect(normalizeText(beforeDepartureText)).toContain('non-refundable');
    expect(normalizeText(afterDepartureText)).toContain('after departure');
    expect(normalizeText(afterDepartureText)).toContain('non-refundable');

    return {
      subtotalLabel,
      beforeDepartureText,
      afterDepartureText,
    };
  },

  async verifyPriceBreakdownRowVisible(page, label) {
    if (!page) throw new Error('page is required');
    if (!label || typeof label !== 'string') throw new Error(`label must be a non-empty string, got: ${typeof label}`);
    logger.info('Verifying row is visible in price breakdown', { label });
    const cartPage = getPageObject(page, CartPage);
    const visible = await cartPage.isPriceBreakdownRowVisible(label);
    expect(visible, `${label} row should be visible in price breakdown`).toBe(true);
    logger.info('Row verified visible in price breakdown', { label });
    return { visible: true, label };
  },

  async verifyPriceBreakdownRowAmountFormat(page, label, pattern) {
    if (!page) throw new Error('page is required');
    if (!label || typeof label !== 'string') throw new Error(`label must be a non-empty string, got: ${typeof label}`);
    if (!pattern || !(pattern instanceof RegExp)) {
      throw new Error(`pattern must be a RegExp, got: ${typeof pattern}`);
    }
    logger.info('Verifying price breakdown row amount matches expected format', { label });
    const cartPage = getPageObject(page, CartPage);
    const amountText = await cartPage.getPriceBreakdownRowAmountText(label);
    expect(amountText, `${label} amount "${amountText}" should match pattern ${pattern}`).toMatch(pattern);
    logger.info('Price breakdown row amount format verified', { label, amountText });
    return { amountText, label, pattern: pattern.toString() };
  },

  /**
   * Puts a trip on hold and returns the new status.
   * 
   * Flow:
   * - Wait for Hold button to be visible
   * - Click the Hold button
   * - Wait for status to update to "on hold" (visible in UI)
   * - Get and return booking status
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{held: boolean, status: string}>} Hold status and booking status
   */
  async holdTrip(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForHoldButton();
    await cartPage.clickHoldButton();

    const { clickedModal } = await this.waitForTargetOrHandlePriceChange(
      page,
      cartPage.getOnHoldStatusLabel(),
      'on hold status',
    );

    const status = await cartPage.getBookingStatus({ page });
    return { held: true, status, clickedModal };
  },

  /**
   * Selects a random preferred seat from the seat map.
   * Targets .plane-seat.preferred elements and clicks a random one via the .is-flex ancestor
   * which carries the Vue handleSeatSelect click handler (same pattern as selectFirstAvailableFlightSeat).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async selectRandomPreferredSeat(page) {
    if (!page) throw new Error('page is required');

    const selected = await page.evaluate(() => {
      const preferredSeats = Array.from(document.querySelectorAll('.deck-wrapper .plane-seat.preferred .seat'));
      if (preferredSeats.length === 0) return false;
      const randomIndex = Math.floor(Math.random() * preferredSeats.length);
      const selectedSeat = preferredSeats[randomIndex];
      selectedSeat.scrollIntoView({ behavior: 'instant' });
      const clickTarget = selectedSeat.closest('.is-flex') || selectedSeat;
      clickTarget.click();
      return true;
    });

    if (!selected) {
      throw new Error('No preferred seats found in the seat map');
    }
  },

  /**
   * Hovers over a green preferred + extra legroom seat in the seat map to trigger its tooltip.
   * These seats have both .preferred and .extra-leg-room classes and a price symbol in the span.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async hoverGreenPreferredExtraLegroomSeat(page) {
    if (!page) throw new Error('page is required');
    logger.info('Hovering over a green preferred + extra legroom seat');

    const cartPage = getPageObject(page, CartPage);
    const hovered = await cartPage.hoverPreferredExtraLegroomSeat();

    if (!hovered) {
      throw new Error('No preferred extra legroom seats with a price found in the seat map');
    }

    logger.debug('Successfully hovered preferred extra legroom seat');
    return { hovered: true };
  },

  /**
   * Verifies the seat tooltip contains both 'Preferred' and 'Extra legroom' labels.
   * Expects the tooltip to be visible after a seat has been clicked/hovered.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{tooltipText: string}>}
   */
  async verifyPreferredExtraLegroomTooltipVisible(page) {
    if (!page) throw new Error('page is required');
    logger.info('Verifying seat tooltip contains preferred + extra legroom labels');

    const cartPage = getPageObject(page, CartPage);
    const tooltipText = await cartPage.getVisibleSeatTooltipText();

    expect(tooltipText.toLowerCase()).toContain('preferred');
    expect(tooltipText.toLowerCase()).toContain('extra legroom');

    logger.debug('Tooltip verified', { tooltipText });
    return { tooltipText };
  },

  /**
   * Selects the first available seat with a price (containing $, €, or £).
   * Clicks the .is-flex ancestor div which carries the Vue handleSeatSelect click handler.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async selectFirstAvailableFlightSeat(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const selected = await page.evaluate((seatSelector) => {
      const seatElements = Array.from(document.querySelectorAll(seatSelector));
      const eligibleSeat = seatElements.find(seat => {
        const span = seat.querySelector('span');
        return span && /[$€£]/.test(span.textContent);
      });
      if (!eligibleSeat) {
        return false;
      }
      const clickTarget = eligibleSeat.closest('.is-flex') || eligibleSeat;
      clickTarget.click();
      return true;
    }, CART_SELECTORS.SEAT_ELEMENT);

    if (!selected) {
      throw new Error('No eligible seats found with a price containing $, €, or £');
    }
  },

  async clickSeatActionButtonForTraveler(page, travelerIndex) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!Number.isInteger(travelerIndex) || travelerIndex < 1) {
      throw new Error(`travelerIndex must be an integer >= 1, got: ${travelerIndex}`);
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickSeatActionButtonForTraveler(travelerIndex);
  },

  /**
   * Validates seating mandatory-for-all-travelers behaviour:
   *   1. Opens the seating extras panel and the seat map drawer for traveler 1
   *   2. Selects a seat for traveler 1 only on the active leg
   *   3. Verifies the "Airline requires seat reservation for all passengers"
   *      error appears (since traveler 2 still has no seat)
   *   4. Selects a seat for traveler 2 to clear the error
   *   5. Saves and closes the seat map drawer
   *
   * @param {import('playwright').Page} page
   * @param {string} [expectedMandatoryMessage] - Expected substring of the error
   * @returns {Promise<{ errorText: string }>}
   */
  async addSeatsAndValidateMandatoryForAllTravelers(
    page,
    expectedMandatoryMessage = 'Airline requires seat reservation for all passengers',
  ) {
    if (!page) throw new Error('page is required');
    if (typeof expectedMandatoryMessage !== 'string' || expectedMandatoryMessage.length === 0) {
      throw new Error('expectedMandatoryMessage must be a non-empty string');
    }

    logger.info('Validating seating is mandatory for all travelers', { expectedMandatoryMessage });

    const cartPage = getPageObject(page, CartPage);

    await cartPage.clickEditSeatingExtrasButton();
    await cartPage.clickSeatActionButtonForTraveler(1);
    await cartPage.waitForSeatMapToLoad();

    await this.selectFirstAvailableFlightSeat(page);

    const errorText = await cartPage.getMandatorySeatErrorText();
    expect(
      errorText.toLowerCase(),
      `Expected mandatory-seat error to contain "${expectedMandatoryMessage}", got "${errorText}"`,
    ).toContain(expectedMandatoryMessage.toLowerCase());

    await this.selectFirstAvailableFlightSeat(page);

    await cartPage.saveAndCloseSeatMapDrawer();

    logger.info('Seating mandatory-for-all-travelers validation passed', { errorText });
    return { errorText };
  },

  /**
   * Verifies seats were saved to the trip after closing the seat map drawer:
   * opens the seating extras panel, opens the seat map drawer, and asserts
   * the seat status text for the configured travelers contains the expected
   * status (default: "Pending confirmation").
   *
   * @param {import('playwright').Page} page
   * @param {object} [options]
   * @param {number} [options.travelerCount=2] - Number of travelers to validate
   * @param {string} [options.expectedStatus='Pending confirmation']
   * @returns {Promise<{ statuses: string[] }>}
   */
  async verifySeatsSavedToTrip(page, options = {}) {
    if (!page) throw new Error('page is required');
    const { travelerCount = 2, expectedStatus = 'Pending confirmation' } = options;
    if (!Number.isInteger(travelerCount) || travelerCount < 1) {
      throw new Error(`travelerCount must be an integer >= 1, got: ${travelerCount}`);
    }
    if (typeof expectedStatus !== 'string' || expectedStatus.length === 0) {
      throw new Error('expectedStatus must be a non-empty string');
    }

    logger.info('Verifying seats saved to trip', { travelerCount, expectedStatus });

    const cartPage = getPageObject(page, CartPage);

    await cartPage.clickEditSeatingExtrasButton();
    await cartPage.clickAddSeatsButton();
    await cartPage.waitForSeatMapToLoad();

    const statuses = [];
    for (let i = 1; i <= travelerCount; i += 1) {
      const status = await cartPage.getSeatStatusForTraveler(i);
      expect(
        status.toLowerCase(),
        `Traveler ${i} seat status should contain "${expectedStatus}", got "${status}"`,
      ).toContain(expectedStatus.toLowerCase());
      statuses.push(status);
    }

    await cartPage.saveAndCloseSeatMapDrawer();

    logger.info('Verified seats saved to trip', { statuses });
    return { statuses };
  },

  /**
   * Verifies the yellow status indicator is visible in the seating extras section
   * after saving seats. The indicator (extras-layout.vue → .success-icon.yellow)
   * appears when the seat selection is awaiting approval / pending payment.
   *
   * @param {import('playwright').Page} page
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<{ visible: boolean }>}
   */
  async verifyYellowSeatIndicatorVisible(page, { timeout = 15000 } = {}) {
    if (!page) throw new Error('page is required');
    if (typeof timeout !== 'number' || timeout < 0) {
      throw new Error(`timeout must be >= 0, got ${timeout}`);
    }

    logger.info('Verifying yellow seat indicator is visible after saving seats', { timeout });

    const cartPage = getPageObject(page, CartPage);
    const visible = await cartPage.isSeatingYellowIndicatorVisible(timeout);

    expect(visible, 'Expected yellow seat indicator to be visible after saving seats').toBe(true);

    logger.info('Yellow seat indicator is visible');
    return { visible };
  },

  /**
   * Gets passport details text from the cart extras section.
   * Returns the passport details for validation in step definitions.
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Index of the passport field to read
   * @returns {Promise<string>} The passport details text
   */
  async getPassportDetailsText(page, index = 0) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }
    
    const cartPage = getPageObject(page, CartPage);
    return await cartPage.getPassportDetailsText(index);
  },

  /**
   * Opens the flight passenger-info panel, validates that the "edit not allowed"
   * warning message is visible, then saves the form. Used pre-booking on Sabre
   * (NDC) quotes where the warning is shown as an informational notice.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedMessage - Substring expected inside the warning text
   * @returns {Promise<{ messageText: string }>}
   */
  async acknowledgePassengerInfoWarning(page, expectedMessage) {
    if (!page) throw new Error('page is required');
    if (typeof expectedMessage !== 'string' || expectedMessage.length === 0) {
      throw new Error('expectedMessage must be a non-empty string');
    }

    logger.info('Opening passenger info panel and validating warning message', { expectedMessage });

    const cartPage = getPageObject(page, CartPage);

    await cartPage.openPassengerInfoPanel();

    const messageText = await cartPage.getPassengerInfoEditNotAllowedMessage();
    expect(
      messageText.toLowerCase(),
      `Expected passenger-info message to contain "${expectedMessage}", got "${messageText}"`,
    ).toContain(expectedMessage.toLowerCase());

    await cartPage.clickSavePassengerInfoButton();
    await cartPage.waitForPassengerInfoSaveSuccess();

    logger.info('Passenger info saved with warning message visible', { messageText });
    return { messageText };
  },

  /**
   * Re-opens the flight passenger-info panel after the trip has been held and
   * verifies (a) the "edit not allowed" warning is still visible and
   * (b) the passport-number input is disabled — the post-booking lock state
   * for Sabre NDC quotes.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedMessage
   * @returns {Promise<{ messageText: string, isPassportInputDisabled: boolean }>}
   */
  async verifyPassengerInfoEditingBlockedAfterBooking(page, expectedMessage) {
    if (!page) throw new Error('page is required');
    if (typeof expectedMessage !== 'string' || expectedMessage.length === 0) {
      throw new Error('expectedMessage must be a non-empty string');
    }

    logger.info('Verifying passenger info editing is blocked after booking', { expectedMessage });

    const cartPage = getPageObject(page, CartPage);

    await cartPage.openPassengerInfoPanel();

    const messageText = await cartPage.getPassengerInfoEditNotAllowedMessage();
    expect(
      messageText.toLowerCase(),
      `Expected post-booking message to contain "${expectedMessage}", got "${messageText}"`,
    ).toContain(expectedMessage.toLowerCase());

    const isPassportInputDisabled = await cartPage.isPassportNumberInputDisabled();
    expect(
      isPassportInputDisabled,
      'Passport number input should be disabled after the trip is held',
    ).toBe(true);

    logger.info('Passenger info editing confirmed blocked', { messageText, isPassportInputDisabled });
    return { messageText, isPassportInputDisabled };
  },

  /**
   * Selects the default (first) delivery method for UK Rail tickets and saves.
   * Waits for the delivery method section to load, clicks the clickable trigger,
   * waits for the title to appear, selects the first radio button option, 
   * and saves the selection.
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   */
  async selectDefaultDeliveryMethod(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForDeliveryMethodSection();
    await cartPage.clickDeliveryMethodClickable();
    await cartPage.waitForDeliveryMethodTitle();
    await cartPage.selectFirstDeliveryMethod();
    await cartPage.clickSaveButton();
    await cartPage.waitForDeliveryMethodGreenIcon();
  },

  /**
   * Asserts that the cart shows a badge indicating 2 rooms for a hotel booking.
   * Waits for the rooms badge text (e.g. "2 Rooms") to be visible in the trip summary.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async verify2RoomsBadge(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForRoomsBadge(2);
  },

  /**
   * Asserts that the cart shows a timed-quote badge on the active quote.
   * Used for NDC quotes with a limited time window (e.g. Iberia NDC).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{ visible: true }>}
   */
  async verifyTimedQuoteBadgeVisible(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForTimedQuoteBadge();
    return { visible: true };
  },

  /**
   * Fills in and saves a special request on the hotel cart card.
   *
   * @param {import('playwright').Page} page
   * @param {string} text - The special request text to submit
   */
  async addSpecialRequest(page, text) {
    if (!page) throw new Error('page is required');
    if (typeof text !== 'string' || !text.trim()) throw new Error('text must be a non-empty string, got: ' + typeof text);
    const cartPage = getPageObject(page, CartPage);
    await cartPage.fillSpecialRequest(text);
  },

  /**
   * Generates a text string of a specific character count and types it into the special request field.
   * Does NOT save — allows inspection of truncation before saving.
   *
   * @param {import('playwright').Page} page
   * @param {number} charCount - Number of characters to generate and type
   */
  async addSpecialRequestTextOfLength(page, charCount) {
    if (!page) throw new Error('page is required');
    if (typeof charCount !== 'number' || charCount < 1) throw new Error('charCount must be a positive number, got: ' + charCount);
    const text = 'A'.repeat(charCount);
    const cartPage = getPageObject(page, CartPage);
    await cartPage.fillSpecialRequestWithoutSaving(text);
  },

  /**
   * Verifies that the special request textarea value has been truncated to the expected character count.
   * Assumes the special request panel is already open with text filled in.
   *
   * @param {import('playwright').Page} page
   * @param {number} maxLength - Expected maximum number of characters
   */
  async verifySpecialRequestTruncatedTo(page, maxLength) {
    if (!page) throw new Error('page is required');
    if (typeof maxLength !== 'number' || maxLength < 1) throw new Error('maxLength must be a positive number, got: ' + maxLength);
    const cartPage = getPageObject(page, CartPage);
    const value = await cartPage.getSpecialRequestValue();
    expect(value.length, `Expected special request to be truncated to ${maxLength} characters, but got ${value.length}`).toBeLessThanOrEqual(maxLength);
  },

  /**
   * Verifies that CO2 emissions data is displayed in the trip overview.
   * Checks that the eco-label is visible and the CO2 value is a non-zero number.
   * @param {import('playwright').Page} page
   * @returns {Promise<{visible: boolean, value: string}>}
   * @throws {Error} If CO2 data is not displayed or value is zero
   */
  async verifyCO2InTripOverview(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);
    const commonPage = getPageObject(page, CommonPage);
    return commonPage.assertCO2Displayed(
      () => cartPage.isCO2LabelVisibleInTripOverview(),
      () => cartPage.getCO2ValueInTripOverview(),
      'trip overview',
    );
  },

  /**
   * Verifies the flight CO2 tooltip is available from both the cart flight card
   * and the flight More Details drawer.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{visible: boolean, cartTooltipText: string, detailsTooltipText: string}>}
   */
  async verifyFlightCO2SquakeTooltipInCart(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const expectedText = 'Emissions are calculated per passenger in the selected class of service.';
    const cartPage = getPageObject(page, CartPage);

    await cartPage.waitForTripOverviewTitle();
    await cartPage.hoverFlightCO2TooltipInCart();
    const cartTooltipText = await cartPage.getFlightCO2TooltipDescription();
    expect(cartTooltipText).toBe(expectedText);

    await cartPage.clickFlightDetailsButton();
    await cartPage.hoverFlightCO2TooltipInMoreDetails();
    const detailsTooltipText = await cartPage.getFlightCO2TooltipDescription();
    expect(detailsTooltipText).toBe(expectedText);
    await cartPage.closeMoreDetailsDrawer();

    return { visible: true, cartTooltipText, detailsTooltipText };
  },

  /**
   * Verifies the flight price breakdown matches the expected traveler count and cart total.
   * Validates the total in TWO places inside the drawer:
   *   1. The aggregated Subtotal (Price Summary section) — sum of segment subtotals
   *   2. The Total price footer
   * Both are compared against the cart total. If expectedCartTotal is omitted, it is
   * fetched live from the cart sidebar at verification time.
   *
   * @param {import('playwright').Page} page
   * @param {number} travelerCount
   * @param {number} [expectedCartTotal] - Optional. When omitted, the cart total is fetched live.
   * @returns {Promise<{travelerCount: number, breakdownTotal: number, calculatedTotal: number, cartTotal: number}>}
   */
  async verifyFlightPriceBreakdownForTravelerCount(page, travelerCount, expectedCartTotal) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!Number.isInteger(travelerCount) || travelerCount < 1) {
      throw new Error(`travelerCount must be a positive integer, got: ${travelerCount}`);
    }

    let cartTotal = expectedCartTotal;
    if (cartTotal === undefined || cartTotal === null) {
      cartTotal = await this.extractCartTotalPrice(page);
    }
    if (typeof cartTotal !== 'number' || Number.isNaN(cartTotal)) {
      throw new Error(`cart total must be a valid number, got: ${cartTotal}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const breakdownSegments = await cartPage.getFlightPriceBreakdownSegments();

    expect(breakdownSegments.length, 'Expected at least one flight price breakdown segment').toBeGreaterThan(0);

    const passengerCount = breakdownSegments.reduce((sum, segment) => sum + segment.passengerCount, 0);
    expect(passengerCount).toBe(travelerCount);

    let calculatedTotal = 0;

    for (const segment of breakdownSegments) {
      const discount = Math.abs(segment.discount);
      const perPassengerAmount =
        segment.price +
        segment.tax +
        segment.handlingFee +
        segment.ccCharge +
        segment.optionalServices +
        segment.other -
        discount;
      const expectedSubtotal = perPassengerAmount * segment.passengerCount;
      const subtotalDelta = Math.abs(segment.subtotal - expectedSubtotal);

      expect(
        subtotalDelta,
        `Expected breakdown subtotal ${segment.subtotal} to match ${expectedSubtotal} for ${segment.passengerCount} travelers`,
      ).toBeLessThanOrEqual(1);

      calculatedTotal += segment.subtotal;
    }

    expect(
      Math.abs(calculatedTotal - cartTotal),
      `Aggregated breakdown subtotal (${calculatedTotal}) should match cart total (${cartTotal})`,
    ).toBeLessThanOrEqual(1);

    const breakdownTotal = await cartPage.getFlightPriceBreakdownTotal();
    expect(
      Math.abs(breakdownTotal - calculatedTotal),
      `Breakdown footer total (${breakdownTotal}) should match aggregated subtotal (${calculatedTotal})`,
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(breakdownTotal - cartTotal),
      `Breakdown footer total (${breakdownTotal}) should match cart total (${cartTotal})`,
    ).toBeLessThanOrEqual(1);

    return { travelerCount: passengerCount, breakdownTotal, calculatedTotal, cartTotal };
  },

  /**
   * Verifies that the "Download Voucher" box is visible in the trip overview.
   * Only present for suppliers that provide their own voucher (e.g. Ratehawk).
   * @param {import('playwright').Page} page
   * @throws {Error} If the voucher download box is not visible
   */
  async verifyVoucherDownloadVisible(page) {
    if (!page) throw new Error('page parameter is required');

    const cartPage = getPageObject(page, CartPage);
    const isVisible = await cartPage.isVoucherDownloadVisible();

    if (!isVisible) {
      throw new Error('Download Voucher box is not visible in the trip overview');
    }
  },

  /**
   * Verifies that the voucher download options (English and French links) are visible.
   * Only present after a confirmed booking for suppliers that provide a voucher.
   * @param {import('playwright').Page} page
   * @throws {Error} If the voucher download links are not visible
   */
  async verifyVoucherDownloadOptionsVisible(page) {
    if (!page) throw new Error('page parameter is required');

    const cartPage = getPageObject(page, CartPage);
    const isVisible = await cartPage.areVoucherDownloadLinksVisible();

    if (!isVisible) {
      throw new Error('Download voucher options (English and French) are not visible in the trip overview');
    }
  },

  /**
   * Verifies that the voucher download options are NOT visible.
   * Expected before a booking is confirmed.
   * @param {import('playwright').Page} page
   * @throws {Error} If the voucher download box is unexpectedly visible
   */
  async verifyVoucherDownloadOptionsNotVisible(page) {
    if (!page) throw new Error('page parameter is required');

    const cartPage = getPageObject(page, CartPage);
    const isHidden = await cartPage.isVoucherBoxHidden();

    if (!isHidden) {
      throw new Error('Download voucher options should not be visible before booking confirmation');
    }
  },

  /**
   * Verifies that a car location at a specific airport index contains the expected airport name.
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Zero-based index of the airport location element
   * @param {string} expectedAirport - Expected airport name to find in the location text
   * @throws {Error} If page, index, or expectedAirport are invalid
   * @returns {Promise<void>}
   */

  async expectAirportLocationOnCartToContain(page, index, expectedAirport) {
    if (!page) {
      throw new Error('page is required');
    }

    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }

    if (!expectedAirport || typeof expectedAirport !== 'string') {
      throw new Error(`expectedAirport must be a non-empty string, got: ${expectedAirport}`);
    }

    const cartPage = getPageObject(page, CartPage);

    const text = await cartPage.getLocationByIndexOnCart(index, 'airport').innerText();
    expect(text.toLowerCase()).toContain(expectedAirport.toLowerCase());
  },

  /**
   * Verifies that a car location at a specific city-center index contains the expected address text.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Zero-based index of the city-center location element
   * @param {string} expectedLocation - Expected location text to find in the cart location value
   * @throws {Error} If page, index, or expectedLocation are invalid
   * @returns {Promise<void>}
   */
  async expectCityCenterLocationOnCartToContain(page, index, expectedLocation) {
    if (!page) {
      throw new Error('page is required');
    }

    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }

    if (!expectedLocation || typeof expectedLocation !== 'string') {
      throw new Error(`expectedLocation must be a non-empty string, got: ${expectedLocation}`);
    }

    const cartPage = getPageObject(page, CartPage);

    const text = await cartPage.getLocationByIndexOnCart(index, 'cityCenter').innerText();
    expect(text.toLowerCase()).toContain(expectedLocation.toLowerCase());
  },

  /**
   * Verifies that a car location label at a specific index contains the expected label text (e.g., "Pick up", "Drop off").
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Zero-based index of the location element
   * @param {string} expectedLabel - Expected label to find in the location text
   * @throws {Error} If page, index, or expectedLabel are invalid
   * @returns {Promise<void>}
   */

  async expectLocationLabelOnCartToContain(page, index, expectedLabel) {
    if (!page) {
      throw new Error('page is required');
    }

    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }

    if (!expectedLabel || typeof expectedLabel !== 'string') {
      throw new Error(`expectedLabel must be a non-empty string, got: ${expectedLabel}`);
    }

    const cartPage = getPageObject(page, CartPage);

    const text = await cartPage.getLocationLabelOnCartByIndex(index).innerText();
    expect(text.toLowerCase()).toContain(expectedLabel.toLowerCase());
  },

  async expectCityCenterAddressOnCartToContain(page, index, expectedAddress) {
    if (!page) {
      throw new Error('page is required');
    }

    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }

    if (!expectedAddress || typeof expectedAddress !== 'string') {
      throw new Error(`expectedAddress must be a non-empty string, got: ${expectedAddress}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const text = await cartPage.getCityCenterAddressOnCartByIndex(index).innerText();
    expect(text.toLowerCase()).toContain(expectedAddress.toLowerCase());
  },

  /**
   * Opens the extras edit panel at the specified index.
   * Used to add optional extras like Premier Inn services or airline baggage.
   * @param {import('playwright').Page} page
   * @param {number} [index=0] - The index of the extras section to edit (0-based)
   * @throws {Error} If page is not provided
   */
  async addPremierInnExtras(page, index = 0) {
    if (!page) throw new Error('page is required');
    if (typeof index !== 'number' || index < 0) throw new Error('index must be a non-negative number');
    
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickEditExtrasButton(index);
    // Wait for the Save button to appear, confirming the extras panel is open
    await cartPage.waitForSaveButton();
  },

  /**
   * Saves the Premier Inn extras panel by clicking the Save button.
   * Should be called after addPremierInnExtras opens the panel.
   * @param {import('playwright').Page} page
   * @throws {Error} If page is not provided
   */
  async savePremierInnExtras(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickSaveButton();
    // Wait for the Save button to disappear, confirming the panel is closed
    await cartPage.getSaveButton().waitFor({ state: 'hidden', timeout: 15000 });
  },

  /**
   * Verifies that the payment method for Premier Inn extras cannot be changed
   * by asserting the payment method dropdown exposes exactly 1 option.
   * @param {import('playwright').Page} page
   */
  async verifyExtrasPaymentNotChangeable(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickPremierInnPaymentMethodDropdown();
    const count = await cartPage.getPremierInnPaymentOptionCount();
    expect(count).toBe(1);
  },

  /**
   * Verifies that the trip title in the cart info bar contains "Trip to <city>".
   *
   * @param {import('playwright').Page} page
   * @param {string} city - Expected city name (e.g. "Ashdod")
   * @returns {Promise<void>}
   */
  async verifyTripTitle(page, city) {
    if (!page) throw new Error('page is required');
    if (!city || typeof city !== 'string') throw new Error(`city must be a non-empty string, got: ${typeof city}`);

    const cartPage = getPageObject(page, CartPage);
    const actualTitle = await cartPage.getTripTitleText();
    expect(actualTitle.toLowerCase()).toContain(city.toLowerCase());
  },

  /**
   * Verifies that the hotel quote card title contains the expected city name.
   *
   * @param {import('playwright').Page} page
   * @param {string} city - Expected city name (e.g. "Ashdod")
   * @returns {Promise<void>}
   */
  async verifyQuoteDestination(page, city) {
    if (!page) throw new Error('page is required');
    if (!city || typeof city !== 'string') throw new Error(`city must be a non-empty string, got: ${typeof city}`);

    const cartPage = getPageObject(page, CartPage);
    const actualTitle = await cartPage.getQuoteTitleText();
    expect(actualTitle.toLowerCase()).toContain(city.toLowerCase());
  },

  /**
   * Extracts the first visible flight number from the cart quote card.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string>}
   */
  async extractFirstFlightNumber(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    return await cartPage.getFirstVisibleFlightNumber();
  },

  /**
   * Extracts all visible flight numbers from the cart quote card.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string[]>}
   */
  async extractVisibleFlightNumbers(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    return await cartPage.getVisibleFlightNumbers();
  },

  /**
   * Extracts all visible PNR codes from flight quote cards in the cart.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string[]>}
   */
  async extractVisibleFlightQuotePnrCodes(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    return await cartPage.getVisibleFlightQuotePnrCodes();
  },

  /**
   * Verifies two stored quote PNR codes match.
   *
   * @param {import('playwright').Page} page
   * @param {string} firstPnrCode
   * @param {string} secondPnrCode
   */
  async verifyQuotePnrCodesMatch(page, firstPnrCode, secondPnrCode) {
    if (!page) throw new Error('page is required');
    if (!firstPnrCode || typeof firstPnrCode !== 'string') {
      throw new Error(`firstPnrCode must be a non-empty string, got: ${typeof firstPnrCode}`);
    }
    if (!secondPnrCode || typeof secondPnrCode !== 'string') {
      throw new Error(`secondPnrCode must be a non-empty string, got: ${typeof secondPnrCode}`);
    }

    expect(firstPnrCode, `Expected both quotes to share the same PNR, got "${firstPnrCode}" and "${secondPnrCode}"`).toBe(secondPnrCode);
  },

  async verifyFirstQuoteDestination(page, city) {
    if (!page) throw new Error('page is required');
    if (!city || typeof city !== 'string') throw new Error(`city must be a non-empty string, got: ${typeof city}`);

    const cartPage = getPageObject(page, CartPage);
    const actualTitle = await cartPage.getFirstQuoteTitleText();
    expect(actualTitle.toLowerCase()).toContain(city.toLowerCase());
  },

  /**
   * Verifies the last quote's booking status matches the expected value.
   * @param {import('playwright').Page} page
   * @param {string} expectedStatus - e.g. "On hold"
   */
  async verifyLastQuoteStatus(page, expectedStatus) {
    if (!page) throw new Error('page is required');
    if (typeof expectedStatus !== 'string') throw new Error('expectedStatus must be a string, got: ' + typeof expectedStatus);
    const cartPage = getPageObject(page, CartPage);
    const actual = await cartPage.getLastQuoteStatus();
    expect(actual.toLowerCase()).toContain(expectedStatus.toLowerCase());
  },

  /**
   * Verifies that all quotes in the cart have visible PNR codes.
   * Expects at least 2 PNR code elements to be visible (one per held quote).
   * @param {import('playwright').Page} page
   */
  async verifyAllQuotesHavePnrCodes(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const count = await cartPage.countVisiblePnrCodes();
    expect(count, `Expected at least 2 PNR codes to be visible, found ${count}`).toBeGreaterThanOrEqual(2);
  },

  async verifyLastQuoteDestination(page, city) {
    if (!page) throw new Error('page is required');
    if (!city || typeof city !== 'string') throw new Error(`city must be a non-empty string, got: ${typeof city}`);

    const cartPage = getPageObject(page, CartPage);
    const actualTitle = await cartPage.getLastQuoteTitleText();
    expect(actualTitle.toLowerCase()).toContain(city.toLowerCase());
  },

  /**
   * Verifies a round-trip cart contains the expected airport/city code on both legs.
   * For a route like LIS -> BCN -> LIS, the connection/turn-point code should appear
   * once as the outbound arrival and once as the return departure.
   *
   * @param {import('playwright').Page} page
   * @param {string} locationCode
   * @returns {Promise<{matches: number, locationCodes: string[]}>}
   */
  async verifyRoundTripSegmentsIncludeLocationCode(page, locationCode) {
    if (!page) throw new Error('page is required');
    if (!locationCode || typeof locationCode !== 'string') {
      throw new Error(`locationCode must be a non-empty string, got: ${typeof locationCode}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const locationCodes = await cartPage.getVisibleFlightQuoteLocationCodes();
    const normalizedCode = locationCode.trim().toUpperCase();
    const matches = locationCodes.filter((code) => code.toUpperCase() === normalizedCode).length;

    expect(
      matches,
      `Expected location code ${normalizedCode} to appear on both round-trip legs, but found ${matches}. Visible codes: ${locationCodes.join(', ')}`,
    ).toBeGreaterThanOrEqual(2);

    return { matches, locationCodes };
  },

  /**
   * Verifies that a round-trip cart contains both legs by checking the outbound
   * arrival code matches the return departure code.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{outboundArrivalCode: string, returnDepartureCode: string, locationCodes: string[]}>}
   */
  async verifyRoundTripSegmentsArePresent(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const segmentCount = await cartPage.getVisibleFlightQuoteSegmentCount();
    const locationCodes = await cartPage.getVisibleFlightQuoteLocationCodes();

    expect(
      segmentCount,
      `Expected both outbound and return segments to be visible in the cart, but found ${segmentCount}. Visible codes: ${locationCodes.join(', ')}`,
    ).toBeGreaterThanOrEqual(2);

    return { segmentCount, locationCodes };
  },

  /**
   * Verifies that the destination text in the cart info bar (top of page) contains the expected city.
   *
   * @param {import('playwright').Page} page
   * @param {string} city - Expected city name (e.g. "Ashdod")
   * @returns {Promise<void>}
   */
  async verifyTripDestinationTopPage(page, city) {
    if (!page) throw new Error('page is required');
    if (!city || typeof city !== 'string') throw new Error(`city must be a non-empty string, got: ${typeof city}`);

    const cartPage = getPageObject(page, CartPage);
    const actualDestination = await cartPage.getTripDestinationInfoText();
    expect(actualDestination.toLowerCase()).toContain(city.toLowerCase());
  },

  /**
   * Clicks the Hotel button from the "Add more services" product carousel in the cart.
   * Navigates to the hotel search form (edit-search drawer).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async clickAddHotelFromCart(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickAddHotelFromCarousel();
  },

  /**
   * Clicks the Flight button from the "Add more services" product carousel in the cart.
   * Navigates to the flight search page.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async clickAddFlightFromCart(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickAddFlightFromCarousel();
  },

  /**
   * Verifies that a push notification is displayed — either a bell badge in the header
   * or a mandatory notification dialog/banner in the cart.
   * @param {import('playwright').Page} page
   * @throws {Error} If no notification indicator is visible
   */
  async verifyPushNotificationDisplayed(page) {
    if (!page) throw new Error('page is required');
    const commonPage = getPageObject(page, CommonPage);
    const reminderVisible = await commonPage.isReminderPopupVisible({ timeout: 10000 });
    if (reminderVisible) {
      await commonPage.dismissReminderPopup();
      return;
    }
    const badgeVisible = await commonPage.isNotificationBadgeVisible({ timeout: 5000 });
    if (badgeVisible) return;
    const mandatoryVisible = await commonPage.isMandatoryNotificationVisible({ timeout: 5000 });
    if (mandatoryVisible) return;
    const panelVisible = await commonPage.isNotificationPanelVisible({ timeout: 5000 });
    if (panelVisible) return;
    throw new Error('No push notification is visible (checked reminder popup, bell badge, mandatory banner, and notification panel)');
  },

  /**
   * Dismisses the mandatory reminder popup if it is currently visible.
   * Does nothing if no popup is present.
   * @param {import('playwright').Page} page
   */
  async dismissReminderPopupIfVisible(page) {
    if (!page) throw new Error('page is required');
    const commonPage = getPageObject(page, CommonPage);
    const visible = await commonPage.isReminderPopupVisible({ timeout: 5000 });
    if (visible) {
      await commonPage.dismissReminderPopup();
    }
  },

  // ========================================
  // Passenger Title (Travelodge extras)
  // ========================================

  /**
   * Verifies the passenger title status text matches expected (e.g. "* Title0/1").
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Expected status text
   */
  async verifyPassengerTitleStatus(page, expectedText) {
    if (!page) throw new Error('page is required');
    if (!expectedText || typeof expectedText !== 'string') throw new Error('expectedText must be a non-empty string');
    // Use auto-retrying assertion — after save + API reload, Vue reactivity may need time to update the DOM
    const statusLocator = page.locator('.passenger-title .extra__description .is-flex');
    await expect(statusLocator).toContainText(expectedText.replace(/\s+/g, ''), { timeout: 15000 });
  },

  /**
   * Verifies the passenger title section has a red error border.
   * @param {import('playwright').Page} page
   */
  async verifyPassengerTitleHasErrorBorder(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const hasError = await cartPage.hasPassengerTitleErrorBorder();
    expect(hasError, 'Expected passenger title section to have red error border').toBe(true);
  },

  /**
   * Verifies the passenger title section does NOT have a red error border.
   * @param {import('playwright').Page} page
   */
  async verifyPassengerTitleNoErrorBorder(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const hasError = await cartPage.hasPassengerTitleErrorBorder();
    expect(hasError, 'Expected passenger title section to NOT have red error border').toBe(false);
  },

  /**
   * Verifies the passenger title has a green success icon.
   * @param {import('playwright').Page} page
   */
  async verifyPassengerTitleHasSuccessIcon(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const hasIcon = await cartPage.hasPassengerTitleSuccessIcon();
    expect(hasIcon, 'Expected passenger title to have green check icon').toBe(true);
  },

  /**
   * Opens the passenger title form, selects the first available title, and saves.
   * @param {import('playwright').Page} page
   */
  async addPassengerTitle(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickPassengerTitleEdit();
    await cartPage.selectFirstTitleOption();
    await cartPage.clickPassengerTitleSave();
    // Wait for success toast and UI to update the title status
    await page.locator('.el-notification__title').filter({ hasText: 'Success' }).waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForLoadState('networkidle');
  },

  // ===== HOTEL ADDRESS VERIFICATION =====

  /**
   * Opens the More Details drawer in the cart.
   * @param {import('playwright').Page} page
   */
  async openMoreDetailsInCart(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickMoreDetailsHotel();
  },

  /**
   * Extracts the total price from the More Details drawer footer.
   * The drawer must already be open.
   * @param {import('playwright').Page} page
   * @returns {Promise<number>} The total price as a numeric value
   */
  async extractPriceFromMoreDetails(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    return cartPage.getMoreDetailsTotalPrice();
  },

  /**
   * Closes the More Details drawer in the cart.
   * @param {import('playwright').Page} page
   */
  async closeMoreDetailsInCart(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.closeMoreDetailsDrawer();
  },

  /**
   * Opens the More Details drawer and verifies the hotel address contains the expected text.
   * Closes the drawer after verification.
   * @param {import('playwright').Page} page
   * @param {string} expectedAddress - The expected address substring
   */
  async verifyHotelAddressInMoreDetails(page, expectedAddress) {
    if (!page) throw new Error('page is required');
    if (typeof expectedAddress !== 'string' || !expectedAddress) {
      throw new Error('expectedAddress must be a non-empty string, got: ' + typeof expectedAddress);
    }
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickMoreDetailsHotel();
    const address = await cartPage.getHotelAddressText();
    expect(address).toContain(expectedAddress);
    await cartPage.closeMoreDetailsDrawer();
  },

  /**
   * Verifies the hotel address in the open share dialog preview contains the expected text.
   * The share dialog must already be open (via clickShareQuoteAndWaitForSubjectField or clickShareItineraryAndWaitForSubjectField).
   * @param {import('playwright').Page} page
   * @param {string} expectedAddress - The expected address substring
   */
  async verifyHotelAddressInSharePreview(page, expectedAddress) {
    if (!page) throw new Error('page is required');
    if (typeof expectedAddress !== 'string' || !expectedAddress) {
      throw new Error('expectedAddress must be a non-empty string, got: ' + typeof expectedAddress);
    }
    const cartPage = getPageObject(page, CartPage);
    const address = await cartPage.getHotelAddressFromSharePreview();
    expect(address, 'Hotel address not found in share preview').not.toBeNull();
    expect(address).toContain(expectedAddress);
  },

  /**
   * Extracts the current hotel quote title from the cart.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>}
   */
  async extractCurrentCartHotelName(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const hotelName = await cartPage.getHotelPreviewNameText();

    if (typeof hotelName !== 'string' || !hotelName.trim()) {
      throw new Error('Failed to extract hotel name from cart preview');
    }

    return hotelName.trim();
  },

  /**
   * Closes the share dialog (quote or itinerary).
   * @param {import('playwright').Page} page
   */
  async closeShareDialog(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.closeShareDialog();
  },

  // ===== SHARE EMAIL PREVIEW VERIFICATION =====

  /**
   * Verifies that the share email preview iframe contains a hotel name (non-empty text).
   * The share dialog must already be open.
   * @param {import('playwright').Page} page
   * @param {string} expectedHotelName - The expected hotel name substring
   */
  async verifyShareEmailContainsHotelName(page, expectedHotelName) {
    if (!page) throw new Error('page is required');
    if (typeof expectedHotelName !== 'string' || !expectedHotelName) {
      throw new Error('expectedHotelName must be a non-empty string, got: ' + typeof expectedHotelName);
    }
    const cartPage = getPageObject(page, CartPage);
    const previewText = await cartPage.getSharePreviewTextContent();
    expect(previewText, 'Share email preview text should not be empty').toBeTruthy();
    expect(previewText.toLowerCase()).toContain(expectedHotelName.toLowerCase());
  },

  /**
   * Verifies that the share email preview iframe contains a hotel image.
   * The share dialog must already be open.
   * @param {import('playwright').Page} page
   */
  async verifyShareEmailContainsHotelImage(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const hasImage = await cartPage.hasHotelImageInSharePreview();
    expect(hasImage, 'Share email preview should contain a hotel image').toBe(true);
  },

  // ===== TRIP NAVIGATION =====

  /**
   * Navigates directly to a trip's cart page by trip ID.
   * @param {import('playwright').Page} page
   * @param {number} tripId - The trip ID to navigate to
   */
  async navigateToTrip(page, tripId) {
    if (!page) throw new Error('page is required');
    if (typeof tripId !== 'number' || tripId <= 0) {
      throw new Error('tripId must be a positive number, got: ' + tripId);
    }
    await page.goto(`${config.baseUrl}/trips/${tripId}/cart`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
  },

  // ===== EXPIRED QUOTE CHECK AVAILABILITY =====

  /**
   * Verifies the Check Availability button is visible on an expired quote.
   * @param {import('playwright').Page} page
   */
  async verifyCheckAvailabilityButtonVisible(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const visible = await cartPage.isCheckAvailabilityButtonVisible();
    expect(visible, 'Check Availability button should be visible').toBe(true);
  },

  /**
   * Verifies the Remove Quote button is visible on an expired quote.
   * @param {import('playwright').Page} page
   */
  async verifyRemoveQuoteButtonVisible(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const visible = await cartPage.isRemoveQuoteButtonVisible();
    expect(visible, 'Remove Quote button should be visible').toBe(true);
  },

  /**
   * Clicks the Check Availability button on an expired quote card.
   * @param {import('playwright').Page} page
   */
  async clickCheckAvailabilityButton(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickCheckAvailabilityButton();
  },

  /**
   * Validates the check availability result dialog.
   * Handles both outcomes:
   * - "Price is still available" → verifies proceed button and "Pending booking" status
   * - "No availability" → verifies expiration message for hotel
   * @param {import('playwright').Page} page
   */
  async verifyCheckAvailabilityResult(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const title = await cartPage.getCheckPriceDialogTitle();

    if (title.includes('Price is still available')) {
      const subtitle = await cartPage.getCheckPriceDialogSubtitle();
      expect(subtitle).toContain('Price for the following item is available');
      const proceedVisible = await cartPage.isCheckPriceProceedButtonVisible();
      expect(proceedVisible, 'Proceed button should be visible when price is available').toBe(true);
    } else if (title.includes('No availability')) {
      const subtitle = await cartPage.getCheckPriceDialogSubtitle();
      expect(subtitle).toContain('Price for the following item is no longer available');
    } else {
      throw new Error(`Unexpected check price dialog title: "${title}". Expected "Price is still available" or "No availability".`);
    }
  },

  /**
   * Changes the language in the share itinerary/quote dialog.
   * The share dialog must already be open.
   * @param {import('playwright').Page} page
   * @param {string} language - The language label to select (e.g. "German", "English")
   */
  async changeShareLanguage(page, language) {
    if (!page) throw new Error('page is required');
    if (!language || typeof language !== 'string') throw new Error(`language must be a non-empty string, got: ${typeof language}`);
    const cartPage = getPageObject(page, CartPage);
    await cartPage.selectShareLanguage(language);
  },

  /**
   * Switches the open share quote preview to Detailed mode.
   * The share dialog must already be open.
   *
   * @param {import('playwright').Page} page
   */
  async switchSharePreviewToDetailedView(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.selectShareDetailedView();
  },

  /**
   * Verifies that the share email preview contains the specified text.
   * The share dialog must already be open.
   * @param {import('playwright').Page} page
   * @param {string} text - Text to verify in the email preview
   * @throws {Error} If the text is not found in the preview
   */
  async verifySharePreviewContainsText(page, text) {
    if (!page) throw new Error('page is required');
    if (!text || typeof text !== 'string') throw new Error(`text must be a non-empty string, got: ${typeof text}`);
    const cartPage = getPageObject(page, CartPage);
    const found = await cartPage.sharePreviewContainsText(text);
    if (!found) {
      const content = await cartPage.getSharePreviewTextContent();
      throw new Error(`Expected share email preview to contain "${text}", but it was not found. Preview content: "${content.slice(0, 500)}"`);
    }
  },

  /**
   * Verifies that the selected shared quote preview contains the specified text.
   * The share dialog must already be open.
   * @param {import('playwright').Page} page
   * @param {string|number} quoteReference
   * @param {string} text
   */
  async verifySharePreviewQuoteContainsText(page, quoteReference, text) {
    if (!page) throw new Error('page is required');
    if (!text || typeof text !== 'string') throw new Error(`text must be a non-empty string, got: ${typeof text}`);

    const quoteIndex = typeof quoteReference === 'number'
      ? quoteReference
      : {
          first: 1,
          second: 2,
        }[String(quoteReference).toLowerCase()];

    if (!Number.isInteger(quoteIndex) || quoteIndex < 1) {
      throw new Error(`quoteReference must be "first", "second", or a positive integer, got: ${quoteReference}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const found = await cartPage.sharePreviewQuoteContainsText(quoteIndex, text);
    if (!found) {
      const content = await cartPage.getSharePreviewQuoteCancellationText(quoteIndex);
      throw new Error(`Expected share email preview quote ${quoteIndex} to contain "${text}", but it was not found. Quote content: "${content.slice(0, 500)}"`);
    }
  },

  /**
   * Verifies that the share email preview does NOT contain the specified text.
   * The share dialog must already be open.
   *
   * @param {import('playwright').Page} page
   * @param {string} text
   */
  async verifySharePreviewDoesNotContainText(page, text) {
    if (!page) throw new Error('page is required');
    if (!text || typeof text !== 'string') throw new Error(`text must be a non-empty string, got: ${typeof text}`);

    const cartPage = getPageObject(page, CartPage);
    const content = await cartPage.getSharePreviewTextContent();
    if (content.includes(text)) {
      throw new Error(`Expected share email preview to NOT contain "${text}", but it was found. Preview content: "${content.slice(0, 500)}"`);
    }
  },

  /**
   * Verifies that the share email preview does NOT contain the hotel price.
   * Extracts the hotel price from the cart and checks it's absent from the preview.
   * The share dialog must already be open.
   * @param {import('playwright').Page} page
   */
  async verifySharePreviewDoesNotContainPrice(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const hotelPrice = await cartPage.getHotelQuotePrice();
    if (!hotelPrice) throw new Error('Could not extract hotel price from cart');
    const content = await cartPage.getSharePreviewTextContent();
    // Format price as it would appear in the email (e.g., "93.41", "93,41")
    const priceStr = hotelPrice.toFixed(2);
    const priceStrComma = priceStr.replace('.', ',');
    if (content.includes(priceStr) || content.includes(priceStrComma)) {
      throw new Error(`Expected share email preview to NOT contain the hotel price "${priceStr}", but it was found. Preview content: "${content.slice(0, 500)}"`);
    }
  },

  /**
   * Verifies the "Provided by" label is visible in the cart hotel preview.
   * @param {import('playwright').Page} page
   * @throws {Error} If the label is not visible
   */
  async verifyProviderLabelInCart(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const isVisible = await cartPage.isProviderLabelVisible();
    if (!isVisible) {
      throw new Error('"Provided by" label is not visible in the cart hotel preview');
    }
  },

  /**
   * Extracts the hotel quote price from the cart (the price displayed on the hotel card).
   * @param {import('playwright').Page} page
   * @returns {Promise<number>} The hotel price in the cart
   */
  async extractHotelQuotePrice(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    return cartPage.getHotelQuotePrice();
  },

  /**
   * Extracts the cart grand total price from the trip summary sidebar.
   * @param {import('playwright').Page} page
   * @returns {Promise<number>} The cart total price
   */
  async extractCartTotalPrice(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    return cartPage.getCartTotalPrice();
  },

  // ===== LOYALTY NUMBER EXTRAS =====

  /**
   * Expands the loyalty number extras section in the cart.
   * @param {import('playwright').Page} page
   * @param {number} [index=0] - The index of the extras edit button to click
   */
  async expandLoyaltyExtras(page, index = 0) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickEditExtrasButton(index);
    await cartPage.waitForSaveButton();
  },

  /**
   * Selects the first hotel chain from the loyalty dropdown and returns its text.
   * Assumes the loyalty panel is already open.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The selected hotel chain text
   */
  async selectFirstLoyaltyChain(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.selectNewLoyaltyRadio();
    return cartPage.selectFirstLoyaltyChain();
  },

  /**
   * Verifies that hotel chain options contain a code pattern like "(XX)".
   * @param {import('playwright').Page} page
   * @param {string} chainText - The hotel chain text to validate
   */
  async verifyHotelChainHasCode(page, chainText) {
    if (!page) throw new Error('page is required');
    if (!chainText || typeof chainText !== 'string') throw new Error('chainText must be a non-empty string');
    const hasCode = /\(/.test(chainText);
    expect(hasCode, `Hotel chain "${chainText}" should contain a code in parentheses`).toBe(true);
  },

  /**
   * Adds a new loyalty number with a specific hotel chain.
   * Full flow: open panel → new radio → select chain → fill number → save → verify green checkmark.
   * @param {import('playwright').Page} page
   * @param {string} chainText - Hotel chain text to select (e.g. "Choic Hotels (EC)")
   * @param {string} loyaltyNumber - Loyalty number to enter (e.g. "131034317J")
   * @param {number} [index=0] - Extras edit button index
   */
  async addNewLoyaltyNumber(page, chainText, loyaltyNumber, index = 0) {
    if (!page) throw new Error('page is required');
    if (!chainText || typeof chainText !== 'string') throw new Error('chainText must be a non-empty string');
    if (!loyaltyNumber || typeof loyaltyNumber !== 'string') throw new Error('loyaltyNumber must be a non-empty string');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickEditExtrasButton(index);
    await cartPage.waitForSaveButton();
    await cartPage.selectNewLoyaltyRadio();
    await cartPage.selectLoyaltyChain(chainText);
    await cartPage.fillLoyaltyNumber(loyaltyNumber);
    await cartPage.clickLoyaltySaveButton();
    await cartPage.waitForLoyaltySuccessIcon();
  },

  /**
   * Adds a loyalty number using the first available hotel chain in the dropdown.
   * Opens extras panel, selects the first chain, fills the number, and saves.
   * @param {import('playwright').Page} page
   * @param {string} loyaltyNumber - Loyalty number to enter
   * @param {number} [index=0] - Extras edit button index
   * @returns {Promise<string>} The selected hotel chain text
   */
  async addLoyaltyNumberWithFirstAvailableChain(page, loyaltyNumber, index = 0) {
    if (!page) throw new Error('page is required');
    if (!loyaltyNumber || typeof loyaltyNumber !== 'string') throw new Error('loyaltyNumber must be a non-empty string');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickEditExtrasButton(index);
    await cartPage.waitForSaveButton();
    await cartPage.selectNewLoyaltyRadio();
    const chainText = await cartPage.selectFirstLoyaltyChain();
    await cartPage.fillLoyaltyNumber(loyaltyNumber);
    await cartPage.clickLoyaltySaveButton();
    await cartPage.waitForLoyaltySuccessIcon();
    return chainText;
  },

  /**
   * Opens the flight frequent flyer extras section in the cart.
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async openFrequentFlyerExtras(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickFqtvClickable();
    await cartPage.waitForFqtvContent();
  },

  /**
   * Clicks the Save button inside the flight frequent flyer panel without filling in
   * the frequent flyer number. Used to trigger client-side required-field validation.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async saveFqtvWithoutEntering(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickFqtvSaveButton();
  },

  /**
   * Verifies that the flight frequent flyer panel displays the "This field is required"
   * validation message after attempting to save an empty FQTV.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  /**
   * Opens the flight hand luggage extras section in the cart.
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async openHandLuggageExtras(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickHandLuggageClickable();
    await cartPage.waitForHandLuggageContent();
  },

  /**
   * Selects the first paid hand luggage option from the hand luggage dropdown.
   * Free options are skipped; the first option whose label contains a price is chosen.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} Text of the selected option
   */
  async selectFirstPaidHandLuggageOption(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const selectedText = await cartPage.selectFirstPaidHandLuggageOption();
    logger.debug('Selected first paid hand luggage option', { selectedText });
    return selectedText;
  },

  /**
   * Verifies the flight hand luggage section shows the green success icon.
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async verifyHandLuggageHasSuccessIcon(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await expect(
      cartPage.getHandLuggageSuccessIconLocator(),
      'Expected hand luggage section to display the green success icon'
    ).toBeVisible({ timeout: 30000 });
  },

  async verifyFqtvRequiredError(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const helpText = cartPage.getFqtvHelpTextLocator();
    await expect(helpText, 'FQTV required-field error message should be visible after saving empty value').toHaveText('This field is required', { timeout: 10000 });
  },

  async openBaggageExtras(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickEditBaggageExtrasButton();
  },

  /**
   * Verifies the carrier name displayed in the first segment of the baggage panel.
   * @param {import('playwright').Page} page
   * @param {string} expectedCarrier - Expected carrier name (e.g. 'Lufthansa')
   */
  async verifyBaggageCarrierName(page, expectedCarrier) {
    if (!page) throw new Error('page is required');
    if (!expectedCarrier || typeof expectedCarrier !== 'string') {
      throw new Error('expectedCarrier must be a non-empty string');
    }

    const cartPage = getPageObject(page, CartPage);
    await expect(cartPage.getBaggageSegmentCarrierNameLocator()).toContainText(expectedCarrier, { timeout: 15000 });
  },

  /**
   * Selects the first available option from the first segment dropdown in the baggage panel.
   * Opens the dropdown and picks the first non-disabled item.
   * @param {import('playwright').Page} page
   */
  async selectFirstBaggageOption(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.selectFirstAvailableBaggageOption();
  },

  /**
   * Selects a baggage option containing the given text for a specific flight
   * direction ("outbound" or "inbound") inside the cart's flight-baggage panel.
   * Idempotent: opens the baggage panel only when it is not already expanded,
   * which lets the same DSL be called once per direction without re-opening.
   *
   * @param {import('playwright').Page} page
   * @param {string} optionText - Substring of the option label (e.g. "Extra 5kg")
   * @param {string} direction - "outbound" or "inbound"
   * @returns {Promise<{ direction: string, optionText: string, segmentIndex: number }>}
   */
  async selectBaggageOptionForFlightDirection(page, optionText, direction) {
    if (!page) throw new Error('page is required');
    if (!optionText || typeof optionText !== 'string') {
      throw new Error('optionText must be a non-empty string');
    }
    if (!direction || typeof direction !== 'string') {
      throw new Error('direction must be a non-empty string');
    }

    const directionMap = { outbound: 0, inbound: 1 };
    const segmentIndex = directionMap[direction.toLowerCase()];
    if (segmentIndex === undefined) {
      throw new Error(`direction must be "outbound" or "inbound", got: "${direction}"`);
    }

    logger.info('Selecting baggage option for flight direction', { direction, optionText });

    const cartPage = getPageObject(page, CartPage);

    if (!(await cartPage.isBaggageExtrasOpen())) {
      await cartPage.clickEditBaggageExtrasButton();
    }

    await cartPage.selectBaggageOptionForSegment(segmentIndex, optionText);

    return { direction, optionText, segmentIndex };
  },

  /**
   * Adds a flight frequent flyer number using the first available airline.
    * Assumes the frequent flyer extras panel is already open.
   * @param {import('playwright').Page} page
   * @param {string} loyaltyNumber - Frequent flyer number to enter
   * @returns {Promise<string>} The selected airline label text
   */
  async addLoyaltyNumberWithFirstAvailableAirline(page, loyaltyNumber) {
    if (!page) throw new Error('page is required');
    if (!loyaltyNumber || typeof loyaltyNumber !== 'string') {
      throw new Error('loyaltyNumber must be a non-empty string');
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForSaveButton();
    await cartPage.selectNewFqtvRadio();
    const airlineText = await cartPage.selectFirstFqtvCarrier();
    await cartPage.fillFqtvNumber(loyaltyNumber);
    await cartPage.clickSaveButton();
    await cartPage.waitForFqtvSuccessIcon();

    return airlineText;
  },

  /**
   * Adds a flight frequent flyer number using a specific airline.
   * Assumes the frequent flyer extras panel is already open.
   * @param {import('playwright').Page} page
   * @param {string} loyaltyNumber - Frequent flyer number to enter
   * @param {string} airlineText - Airline label to select in the FQTV carrier dropdown
   * @returns {Promise<string>} The selected airline label text
   */
  async addLoyaltyNumberWithAirline(page, loyaltyNumber, airlineText) {
    if (!page) throw new Error('page is required');
    if (!loyaltyNumber || typeof loyaltyNumber !== 'string') {
      throw new Error('loyaltyNumber must be a non-empty string');
    }
    if (!airlineText || typeof airlineText !== 'string') {
      throw new Error('airlineText must be a non-empty string');
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForSaveButton();
    await cartPage.selectNewFqtvRadio();
    const selectedAirlineText = await cartPage.selectFqtvCarrier(airlineText);
    await cartPage.fillFqtvNumber(loyaltyNumber);
    await cartPage.clickSaveButton();
    await cartPage.waitForFqtvSuccessIcon();

    return selectedAirlineText;
  },

  /**
   * Adds a flight frequent flyer number for a specific traveler tab using the
   * first available airline.
   * Assumes the frequent flyer extras panel is already open.
   * @param {import('playwright').Page} page
   * @param {string} travelerName - Full traveler name shown in the FQTV tabs
   * @param {string} loyaltyNumber - Frequent flyer number to enter
   * @returns {Promise<string>} The selected airline label text
   */
  async addLoyaltyNumberWithFirstAvailableAirlineForTraveler(page, travelerName, loyaltyNumber) {
    if (!page) throw new Error('page is required');
    if (!travelerName || typeof travelerName !== 'string') {
      throw new Error('travelerName must be a non-empty string');
    }
    if (!loyaltyNumber || typeof loyaltyNumber !== 'string') {
      throw new Error('loyaltyNumber must be a non-empty string');
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickFqtvTravelerTabByName(travelerName);
    await cartPage.waitForSaveButton();
    await cartPage.selectNewFqtvRadio();
    const airlineText = await cartPage.selectFirstFqtvCarrier();
    await cartPage.fillFqtvNumber(loyaltyNumber);
    await cartPage.clickSaveButton();
    await cartPage.getSaveButton().waitFor({ state: 'hidden', timeout: 15000 });

    return airlineText;
  },

  /**
   * Adds a flight frequent flyer number for a specific traveler tab position
   * using the first available airline.
   * Assumes the frequent flyer extras panel is already open.
   * @param {import('playwright').Page} page
   * @param {number} tabNumber - 1-based traveler tab position
   * @param {string} loyaltyNumber - Frequent flyer number to enter
   * @returns {Promise<string>} The selected airline label text
   */
  async addLoyaltyNumberWithFirstAvailableAirlineForTravelerTab(page, tabNumber, loyaltyNumber) {
    if (!page) throw new Error('page is required');
    if (!Number.isInteger(tabNumber) || tabNumber < 1) {
      throw new Error(`tabNumber must be a positive integer, got: ${tabNumber}`);
    }
    if (!loyaltyNumber || typeof loyaltyNumber !== 'string') {
      throw new Error('loyaltyNumber must be a non-empty string');
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickFqtvTravelerTabByIndex(tabNumber);
    await cartPage.waitForSaveButton();
    await cartPage.selectNewFqtvRadio();
    const airlineText = await cartPage.selectFirstFqtvCarrier();
    await cartPage.fillFqtvNumber(loyaltyNumber);
    await cartPage.clickSaveButton();
    await cartPage.getSaveButton().waitFor({ state: 'hidden', timeout: 15000 });

    return airlineText;
  },

  /**
   * Adds flight frequent flyer entries for each visible segment in the cart.
   * Assumes the frequent flyer extras panel is already open.
   * @param {import('playwright').Page} page
   * @param {{ carrier: string, number: string }[]} entries - FQTV entries ordered by segment
   * @returns {Promise<void>}
   */
  async addFqtvEntries(page, entries) {
    if (!page) throw new Error('page is required');
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error('entries must be a non-empty array');
    }

    entries.forEach((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        throw new Error(`entries[${index}] must be an object`);
      }

      if (!entry.carrier || typeof entry.carrier !== 'string') {
        throw new Error(`entries[${index}].carrier must be a non-empty string`);
      }

      if (!entry.number || typeof entry.number !== 'string') {
        throw new Error(`entries[${index}].number must be a non-empty string`);
      }
    });

    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForSaveButton();

    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      await cartPage.selectNewFqtvRadio(index);
      await cartPage.fillFqtvNumber(entry.number, index);
      await cartPage.selectFqtvCarrier(entry.carrier, index);
    }

    await cartPage.clickSaveButton();
    await cartPage.getSaveButton().waitFor({ state: 'hidden', timeout: 15000 });
  },

  /**
   * Verifies that a previously saved loyalty number and hotel chain are visible.
   * Opens the loyalty panel again and checks the field values.
   * @param {import('playwright').Page} page
   * @param {string} expectedChain - Expected hotel chain text (partial match)
   * @param {string} expectedNumber - Expected loyalty number
   * @param {number} [index=0] - Extras edit button index
   */
  async verifyLoyaltyNumberSaved(page, expectedChain, expectedNumber, index = 0) {
    if (!page) throw new Error('page is required');
    if (!expectedChain || typeof expectedChain !== 'string') throw new Error('expectedChain must be a non-empty string');
    if (!expectedNumber || typeof expectedNumber !== 'string') throw new Error('expectedNumber must be a non-empty string');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.expandLoyaltySection();

    // After saving, the panel switches to "Existing" mode with a dropdown
    // showing "ChainName - LoyaltyNumber" (without the chain code in parentheses).
    const existingText = await cartPage.getExistingLoyaltyDropdownText();
    // Strip chain code suffix like " (EC)" from expected chain for comparison
    const chainNameOnly = expectedChain.replace(/\s*\([^)]+\)\s*$/, '').trim();
    expect(existingText).toContain(chainNameOnly);
    expect(existingText).toContain(expectedNumber);
  },

  /**
   * Verifies that car loyalty extras are not prepopulated.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async verifyCarLoyaltyNotPrepopulated(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);

    // Explicitly click the "Add" button on Loyalty ID row and wait for input to appear
    await cartPage.clickLoyaltyAddButton();

    // Validate the input field that opened is empty (not prepopulated)
    const loyaltyInputValue = ((await cartPage.getLoyaltyNumberInputValue().catch(() => '')) || '').trim();
    expect(loyaltyInputValue, `Expected loyalty input to be empty after clicking Add, but got: "${loyaltyInputValue}"`).toBe('');
  },

  // ===== PREMIER INN EXTRAS (BREAKFAST/PAYMENT) =====

  /**
   * Verifies the payment method label is visible in the Premier Inn extras panel.
   * Assumes the panel is already open.
   * @param {import('playwright').Page} page
   */
  async verifyPremierInnPaymentLabelVisible(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const isVisible = await cartPage.isPremierInnPaymentLabelVisible();
    expect(isVisible, 'Payment method label should be visible in Premier Inn extras').toBe(true);
  },

  /**
   * Verifies that the breakfast type option is NOT visible in Premier Inn extras.
   * This is expected when breakfast is disabled in administration.
   * @param {import('playwright').Page} page
   */
  async verifyPremierInnBreakfastNotVisible(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const isVisible = await cartPage.isPremierInnBreakfastOptionVisible();
    expect(isVisible, 'Breakfast type option should not be visible in Premier Inn extras').toBe(false);
  },

  // ===== EHOTEL SUPPLIER DETAILS =====

  /**
   * Verifies the eHotel PIN code is visible in the cart booking confirmation section.
   * @param {import('playwright').Page} page
   * @throws {Error} If the PIN code is not visible
   */
  async verifyPinCodeVisibleInCart(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const isVisible = await cartPage.isPinCodeVisibleInCart();
    if (!isVisible) throw new Error('eHotel PIN code is not visible in the cart booking confirmation section');
  },

  /**
   * Verifies the eHotel Confirmation Number is visible in the cart booking confirmation section.
   * @param {import('playwright').Page} page
   * @throws {Error} If the Confirmation Number is not visible
   */
  async verifyConfirmationNumberVisibleInCart(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const isVisible = await cartPage.isConfirmationNumberVisibleInCart();
    if (!isVisible) throw new Error('eHotel Confirmation Number is not visible in the cart booking confirmation section');
  },

  /**
   * Verifies the eHotel Contact Phone is visible in the cart booking confirmation section.
   * @param {import('playwright').Page} page
   * @throws {Error} If the Contact Phone is not visible
   */
  async verifyContactPhoneVisibleInCart(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const isVisible = await cartPage.isContactPhoneVisibleInCart();
    if (!isVisible) throw new Error('eHotel Contact Phone is not visible in the cart booking confirmation section');
  },

  // ===== FLIGHT DETAILS / BRANDED FARES IN CART =====

  /**
   * Opens the flight details drawer in the cart.
   * @param {import('playwright').Page} page
   */
  async openFlightDetailsInCart(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickFlightDetailsButton();
  },

  /**
   * Verifies that the total price in the open flight details drawer matches the
   * cart total price displayed on the trip overview.
   * The drawer must already be open.
   *
   * @param {import('playwright').Page} page
   * @param {object} options
   * @param {number} options.tolerance - Allowed absolute difference (default: 1)
   * @returns {Promise<{ drawerTotal: number, cartTotal: number }>}
   */
  async verifyFlightDetailsDrawerTotalMatchesCart(page, { tolerance = 1 } = {}) {
    if (!page) throw new Error('page is required');
    if (typeof tolerance !== 'number' || tolerance < 0) {
      throw new Error(`tolerance must be a non-negative number, got: ${tolerance}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const drawerTotal = await cartPage.getFlightCartMoreDetailsTotalPrice();
    const cartTotal = await this.extractCartTotalPrice(page);

    logger.info('Verifying flight details drawer total matches cart total', {
      drawerTotal,
      cartTotal,
      tolerance,
    });

    if (drawerTotal === null || !Number.isFinite(drawerTotal)) {
      throw new Error(`Flight details drawer total could not be parsed, got: ${drawerTotal}`);
    }

    expect(
      Math.abs(drawerTotal - cartTotal),
      `Flight details drawer total (${drawerTotal}) should match cart total (${cartTotal})`,
    ).toBeLessThanOrEqual(tolerance);

    return { drawerTotal, cartTotal };
  },

  /**
   * Scrolls the open flight details drawer to the bottom so the return-leg
   * section becomes visible.
   * @param {import('playwright').Page} page
   */
  async scrollFlightDetailsDrawerInCart(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.scrollFlightDetailsDrawerToBottom();
    return { scrolled: true };
  },

  /**
   * Verifies the cabin/brand text (e.g. "Premium Economy (P)") is visible
   * inside the open flight details drawer for the given leg position.
   *
   * @param {import('playwright').Page} page
   * @param {string} legPosition - "outbound" or "return"
   * @param {string} cabinText - Cabin/brand text (e.g. "Premium Economy (P)")
   */
  async verifyCabinInFlightDetailsDrawer(page, legPosition, cabinText) {
    if (!page) throw new Error('page is required');
    if (typeof legPosition !== 'string' || (legPosition !== 'outbound' && legPosition !== 'return')) {
      throw new Error('legPosition must be "outbound" or "return", got: ' + legPosition);
    }
    if (!cabinText || typeof cabinText !== 'string') {
      throw new Error('cabinText must be a non-empty string, got: ' + cabinText);
    }

    const cartPage = getPageObject(page, CartPage);
    const occurrenceIndex = legPosition === 'outbound' ? 0 : 1;
    await cartPage.waitForCabinTextInFlightDetailsDrawer(cabinText, occurrenceIndex);
    return { verified: true, legPosition, cabinText };
  },

  /**
   * Verifies the carrier name in the cart more details drawer.
   * @param {import('playwright').Page} page
   * @param {string} expectedName
   */
  async verifyCarrierNameInCartDetails(page, expectedName) {
    if (!page) throw new Error('page is required');
    if (typeof expectedName !== 'string') throw new Error('expectedName must be a string, got: ' + typeof expectedName);
    const cartPage = getPageObject(page, CartPage);
    const actual = await cartPage.getCarrierNameInDetails();
    expect(actual).toContain(expectedName);
  },

  /**
   * Verifies the post-ticketing table headers in the cart flight details drawer.
   * @param {import('playwright').Page} page
   * @returns {Promise<string[]>}
   */
  async verifyFlightDetailsTableHeaders(page) {
    if (!page) throw new Error('page is required');

    const expectedHeaders = ['Traveler', 'Ticket number', 'FF', 'Meal', 'Seat'];
    const cartPage = getPageObject(page, CartPage);
    const actualHeaders = await cartPage.getPostTicketingTableHeaders();

    expect(actualHeaders, 'Flight details table headers should match the post-ticketing columns').toEqual(expectedHeaders);
    return actualHeaders;
  },

  /**
   * Verifies the visible post-ticketing ticket numbers all start with the given prefix.
   * @param {import('playwright').Page} page
   * @param {string} prefix
   * @param {number} [expectedTravelerCount=2]
   * @returns {Promise<string[]>}
   */
  async verifyFlightDetailsTicketNumbersStartWith(page, prefix, expectedTravelerCount = 2) {
    if (!page) throw new Error('page is required');
    if (typeof prefix !== 'string' || !prefix.trim()) {
      throw new Error('prefix must be a non-empty string, got: ' + typeof prefix);
    }
    if (!Number.isInteger(expectedTravelerCount) || expectedTravelerCount < 1) {
      throw new Error('expectedTravelerCount must be a positive integer, got: ' + expectedTravelerCount);
    }

    const cartPage = getPageObject(page, CartPage);
    const ticketNumbers = await cartPage.getPostTicketingTicketNumbers();

    expect(
      ticketNumbers.length,
      `Expected ${expectedTravelerCount} visible ticket numbers in flight details, got ${ticketNumbers.length}: ${ticketNumbers.join(', ')}`,
    ).toBe(expectedTravelerCount);

    for (const ticketNumber of ticketNumbers) {
      expect(
        ticketNumber,
        `Expected ticket number to start with "${prefix}", got: ${ticketNumber}`,
      ).toMatch(new RegExp(`^${prefix}`));
    }

    return ticketNumbers;
  },

  /**
   * Verifies that ticket numbers are visible (presence only) in the cart
   * flight-details drawer for the expected number of travelers. Use when the
   * issuing airline prefix is irrelevant — for example, GDS+NDC mixed flows
   * where only ticket presence matters.
   *
   * @param {import('playwright').Page} page
   * @param {number} [expectedTravelerCount=2]
   * @returns {Promise<{verified: true, ticketNumbers: string[]}>}
   */
  async verifyTicketNumbersVisibleInFlightDetails(page, expectedTravelerCount = 2) {
    if (!page) throw new Error('page is required');
    if (!Number.isInteger(expectedTravelerCount) || expectedTravelerCount < 1) {
      throw new Error('expectedTravelerCount must be a positive integer, got: ' + expectedTravelerCount);
    }

    const cartPage = getPageObject(page, CartPage);
    const ticketNumbers = await cartPage.getPostTicketingTicketNumbers();

    expect(
      ticketNumbers.length,
      `Expected ${expectedTravelerCount} visible ticket numbers in flight details, got ${ticketNumbers.length}: ${ticketNumbers.join(', ')}`,
    ).toBe(expectedTravelerCount);

    for (const ticketNumber of ticketNumbers) {
      expect(
        (ticketNumber || '').trim().length,
        `Expected ticket number to be a non-empty string, got: "${ticketNumber}"`,
      ).toBeGreaterThan(0);
    }

    return { verified: true, ticketNumbers };
  },

  /**
   * Verifies seat selection can be opened from the post-ticketing flight details table.
   * Accepts either a rendered seat map or the supplier empty state when the
   * seat map is unavailable.
   * @param {import('playwright').Page} page
   */
  async verifySeatSelectionAvailableFromFlightDetails(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickPostTicketingSeatButton();
    const state = await cartPage.waitForSeatMapOrUnavailableState();

    if (state === 'unavailable') {
      logger.warn('Seat selection drawer opened, but seating map is not available at the moment');
    }

    return state;
  },

  /**
   * Opens branded fares and verifies ancillaries text in the cart flight details drawer.
   * The flight details drawer must already be open.
   * @param {import('playwright').Page} page
   */
  async openBrandedFaresAndVerifyAncillariesInCart(page) {
    if (!page) throw new Error('page is required');
    const FlightResults = require('./FlightResults');
    await FlightResults.openBrandedFaresAndVerifyAncillaries(page);
  },

  /**
   * Closes the branded fares drawer in the cart.
   * @param {import('playwright').Page} page
   */
  async closeBrandedFaresDrawerInCart(page) {
    if (!page) throw new Error('page is required');
    const FlightResults = require('./FlightResults');
    await FlightResults.closeBrandedFaresDrawer(page);
  },

  /**
   * Adds a meal to the flight in the cart.
   * Opens the meal panel, selects a meal from the dropdown, and saves.
   *
   * @param {import('playwright').Page} page
   * @param {string} mealName
   */
  async addMealToFlight(page, mealName) {
    if (!page) throw new Error('page is required');
    if (typeof mealName !== 'string' || !mealName.trim()) {
      throw new Error('mealName must be a non-empty string, got: ' + typeof mealName);
    }

    const cartPage = getPageObject(page, CartPage);

    await cartPage.selectMealFromDropdown(mealName);

    // Save
    await cartPage.clickMealSaveButton();

    // Wait for success toast confirming meal was saved
    await page.locator('.el-notification__title').filter({ hasText: 'Success' }).waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForLoadState('networkidle');
  },

  /**
   * Verifies the selected meal text and status message in the meal panel.
   * Assumes the meal panel is already open (caller used "I click to edit extras at index").
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedMeal - Expected meal text (e.g. "Diabetic Meal (DBML)")
   * @param {string|RegExp} expectedStatus - Expected status message (string or regex)
   * @returns {Promise<{ meal: string, status: string }>}
   */
  async verifyMealSelectionAndStatus(page, expectedMeal, expectedStatus) {
    if (!page) throw new Error('page is required');
    if (typeof expectedMeal !== 'string') throw new Error('expectedMeal must be a string, got: ' + typeof expectedMeal);

    const { expect } = require("@playwright/test");
    const cartPage = getPageObject(page, CartPage);

    // Verify the selected meal text
    const mealText = await cartPage.getMealSelectedText();
    expect(mealText).toContain(expectedMeal);

    // Verify the status help text
    const statusText = await cartPage.getMealStatusHelpText();
    if (expectedStatus instanceof RegExp) {
      expect(statusText).toMatch(expectedStatus);
    } else {
      expect(statusText).toContain(expectedStatus);
    }

    // Close the panel to avoid overlay blocking subsequent actions
    await cartPage.clickMealCancelButton();

    return { meal: mealText, status: statusText };
  },

  /**
   * Verifies the seat icon is visible in the trip overview extras section.
   * @param {import('playwright').Page} page
   */
  async verifySeatIconVisibleInTripOverview(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const visible = await cartPage.isSeatIconVisibleInExtras();
    expect(visible, 'Seat icon should be visible in trip overview').toBe(true);
  },

  /**
   * Verifies the selected baggage option contains the expected text.
   * @param {import('playwright').Page} page
   * @param {string} expectedOption - Expected baggage option text (e.g. "EXCESS BAGGAGE REQUEST")
   */
  async verifyBaggageOptionSaved(page, expectedOption) {
    if (!page) throw new Error('page is required');
    if (typeof expectedOption !== 'string') throw new Error('expectedOption must be a string, got: ' + typeof expectedOption);
    const cartPage = getPageObject(page, CartPage);
    const actualText = await cartPage.getSelectedBaggageOptionText();
    expect(actualText, `Baggage option should contain "${expectedOption}"`).toContain(expectedOption);
  },

  /**
   * Verifies no baggage selection is displayed for the specified traveler tab.
   * @param {import('playwright').Page} page
   * @param {number} tabNumber - 1-based traveler tab position
   */
  async verifyNoBaggageDisplayedForTravelerTab(page, tabNumber) {
    if (!page) throw new Error('page is required');
    if (!Number.isInteger(tabNumber) || tabNumber < 1) {
      throw new Error(`tabNumber must be a positive integer, got: ${tabNumber}`);
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickBaggageTravelerTabByIndex(tabNumber);

    await expect.poll(
      async () => cartPage.getVisibleBaggageSelectedTagCount(),
      {
        message: `Baggage should not be displayed for traveler tab ${tabNumber}`,
        timeout: 10000,
      }
    ).toBe(0);
  },

  /**
   * Verifies specific passenger initials are visible in the trip.
   * @param {import('playwright').Page} page
   * @param {string} initials - e.g. "AO", "PR"
   */
  async verifyPassengerInitialsVisible(page, initials) {
    if (!page) throw new Error('page is required');
    if (typeof initials !== 'string') throw new Error('initials must be a string, got: ' + typeof initials);
    const cartPage = getPageObject(page, CartPage);
    const visible = await cartPage.isTravelerInitialsVisible(initials);
    expect(visible, `Passenger initials "${initials}" should be visible`).toBe(true);
  },

  /**
   * Verifies the hotel autocomplete destination field shows the expected text.
   * @param {import('playwright').Page} page
   * @param {string} expected - Expected destination text (e.g. "London,United Kingdom,(LON)")
   */
  async verifyHotelAutocompleteDestination(page, expected) {
    if (!page) throw new Error('page is required');
    if (typeof expected !== 'string') throw new Error('expected must be a string, got: ' + typeof expected);
    const cartPage = getPageObject(page, CartPage);
    const actual = await cartPage.getHotelSearchDestinationValue();
    expect(actual).toContain(expected);
  },

  /**
   * Verifies hotel search check-in and check-out date fields are filled (not empty).
   * @param {import('playwright').Page} page
   */
  async verifyHotelSearchDatesAreFilled(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const checkInFilled = await cartPage.isHotelCheckInDateFilled();
    expect(checkInFilled, 'Hotel check-in date should be filled').toBe(true);
    const checkOutFilled = await cartPage.isHotelCheckOutDateFilled();
    expect(checkOutFilled, 'Hotel check-out date should be filled').toBe(true);
  },

  /**
   * Validates that seat selection is restricted across all flight segments.
   * Assumes the seating extras panel is already open (inline).
   * Clicks "Add Seats" to open the seat map drawer, iterates over each segment tab,
   * clicks a seat, and verifies the red restriction tooltip appears.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedMessage - Partial text expected in the red tooltip
   */
  async verifySeatSelectionRestricted(page, expectedMessage) {
    if (!page) throw new Error('page is required');
    if (!expectedMessage || typeof expectedMessage !== 'string') {
      throw new Error('expectedMessage must be a non-empty string, got: ' + typeof expectedMessage);
    }

    const cartPage = getPageObject(page, CartPage);

    // Click "Add Seats" in the inline seating panel to open the seat map drawer
    await cartPage.clickAddSeatsButton();
    await cartPage.waitForSeatMapToLoad();

    const tabCount = await cartPage.getSeatMapSegmentTabCount();

    for (let i = 0; i < tabCount; i++) {
      if (i > 0) {
        await cartPage.clickSeatMapSegmentTab(i);
        await cartPage.waitForSeatMapToLoad();
      }

      await cartPage.hoverFirstAvailableSeat();
      const tooltipText = await cartPage.getSeatTooltipRedMessage();
      expect(tooltipText.toLowerCase()).toContain(expectedMessage.toLowerCase());
    }
  },

  /**
   * Verifies that the time limit hour is displayed in flight details after hold.
   * Expects the time limit container to be visible and contain a time in HH:MM format.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<string>} The time limit text
   */
  async verifyTimeLimitHourInFlightDetails(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);
    const text = await cartPage.getTimeLimitText();
    expect(text).toBeTruthy();
    // Verify the text contains a time pattern (HH:MM)
    expect(text).toMatch(/\d{1,2}:\d{2}/);
    return text;
  },

  /**
   * Verifies that the "Booked by" text with date/time is visible in the price breakdown drawer.
   * Expects the text to match pattern: "Booked by {name} on {date}".
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<string>} The booked-by text
   */
  async verifyBookedByTextInPriceBreakdown(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);
    const text = await cartPage.getBookedByText();
    expect(text).toBeTruthy();
    expect(text.toLowerCase()).toContain('booked by');
    return text;
  },

  /**
   * Verifies that the cancel trip button is disabled in the trip actions dropdown.
   * Hovers over the three dots to open the dropdown, then checks the disabled state.
   * @param {import('playwright').Page} page
   */
  async verifyCancelTripButtonIsDisabled(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);

    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await cartPage.hoverTripActionsDropdownIcon();
    await cartPage.waitForDropdownMenu();

    const isDisabled = await cartPage.isCancelTripOptionDisabled();
    expect(isDisabled, 'Cancel trip button should be disabled during Finalizing status').toBe(true);
  },

  /**
   * Verifies that the Hold flight button is disabled (e.g. after clicking Hold without payment).
   * @param {import('playwright').Page} page
   */
  async verifyHoldFlightButtonIsDisabled(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);
    const isDisabled = await cartPage.isHoldButtonDisabled();
    expect(isDisabled, 'Hold flight button should be disabled without payment method').toBe(true);
  },

  /**
   * Verifies the FQTV displayed in the cart extras matches expected text.
   * Clicks the FQTV section to expand it, then checks the selected value.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedText - Expected FQTV text (e.g. "LH - 12321")
   * @returns {Promise<void>}
   */
  async verifyFqtvDisplayed(page, expectedText) {
    if (!page) throw new Error('page is required');
    if (!expectedText || typeof expectedText !== 'string') throw new Error('expectedText must be a non-empty string');

    const cartPage = getPageObject(page, CartPage);

    await expect(async () => {
      const actualTexts = await cartPage.getAllFqtvSelectedTexts();
      const hasMatch = actualTexts.some((text) => text.includes(expectedText));
      expect(hasMatch, `FQTV should show "${expectedText}" but got "${actualTexts.join(', ')}"`).toBe(true);
    }).toPass({ timeout: 30000 });
  },

  /**
   * Selects a traveler tab by name in the cart FQTV extras and verifies the
   * visible FQTV value for that traveler.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedText - Expected FQTV text (e.g. "AA - DCA45299")
   * @param {string} travelerName - Full traveler name shown in the tab
   * @returns {Promise<void>}
   */
  async verifyFqtvDisplayedForTraveler(page, expectedText, travelerName) {
    if (!page) throw new Error('page is required');
    if (!expectedText || typeof expectedText !== 'string') throw new Error('expectedText must be a non-empty string');
    if (!travelerName || typeof travelerName !== 'string') throw new Error('travelerName must be a non-empty string');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickFqtvTravelerTabByName(travelerName);

    const actualTexts = await cartPage.getAllFqtvSelectedTexts();
    const hasMatch = actualTexts.some((text) => text.includes(expectedText));
    expect(hasMatch, `FQTV for traveler "${travelerName}" should show "${expectedText}" but got "${actualTexts.join(', ')}"`).toBe(true);
  },

  /**
   * Selects a traveler tab by 1-based position in the cart FQTV extras and
   * verifies the visible FQTV value for that tab.
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedText - Expected FQTV text fragment
   * @param {number} tabNumber - 1-based traveler tab position
   * @returns {Promise<void>}
   */
  async verifyFqtvDisplayedForTravelerTab(page, expectedText, tabNumber) {
    if (!page) throw new Error('page is required');
    if (!expectedText || typeof expectedText !== 'string') throw new Error('expectedText must be a non-empty string');
    if (!Number.isInteger(tabNumber) || tabNumber < 1) {
      throw new Error(`tabNumber must be a positive integer, got: ${tabNumber}`);
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickFqtvTravelerTabByIndex(tabNumber);

    const actualTexts = await cartPage.getAllFqtvSelectedTexts();
    const hasMatch = actualTexts.some((text) => text.includes(expectedText));
    expect(hasMatch, `FQTV for traveler tab ${tabNumber} should show "${expectedText}" but got "${actualTexts.join(', ')}"`).toBe(true);
  },

  /**
   * Verifies the flight frequent flyer section shows the green success icon.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async verifyFqtvHasSuccessIcon(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForFqtvSuccessIcon();

    const hasIcon = await cartPage.hasFqtvSuccessIcon();
    expect(hasIcon, 'Expected frequent flyer to have green check icon').toBe(true);
  },

  /**
   * Verifies that the flight Frequent Flyer (FQTV) section has no details filled in.
   * Expected when the traveler has no FQTV configured (e.g. Fusion pax without saved FQTVs)
   * — the green success icon is absent because no valid FQTV entry has been submitted.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async verifyFqtvNotFilledIn(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const hasIcon = await cartPage.hasFqtvSuccessIcon();
    expect(hasIcon, 'FQTV section should not have frequent flyer details filled in (no green success icon expected)').toBe(false);
  },

  async verifyGenderIsNotSelected(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const isSelected = await cartPage.isGenderSelected();
    expect(isSelected, 'Expected no gender to be pre-selected in passenger info').toBe(false);
  },

  /**
   * Expands the extras collapse and verifies the Optional Services section title is visible.
   * @param {import('playwright').Page} page
   */
  async verifyOptionalServicesSectionVisible(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickArrowButtonExtras();
    await expect(cartPage.getOptionalServicesTitleLocator()).toContainText('Optional Services', { timeout: 15000 });
  },

  /**
   * Clicks the optional services Edit/Add button in the extras section to expand it.
   * Ensures the extras collapse is expanded first.
   * @param {import('playwright').Page} page
   */
  async clickOptionalServicesInExtras(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);

    // Ensure extras collapse is expanded — if the optional services title not visible, expand first
    const titleVisible = await cartPage.getOptionalServicesTitleLocator().isVisible().catch(() => false);
    if (!titleVisible) {
      await cartPage.clickArrowButtonExtras();
    }

    await cartPage.clickEditOptionalServicesButton();
    logger.info('Clicked optional services in extras');
  },

  /**
   * Verifies the "optional services will be available after booking is complete" message is visible.
   * @param {import('playwright').Page} page
   */
  async verifyOptionalServicesUnavailableMessage(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const messageLocator = cartPage.getOptionalServicesMessageLocator();
    await expect(messageLocator).toContainText('Optional services will be available after booking is complete', { timeout: 15000 });
    logger.info('Optional services unavailable message is visible');
  },

  /**
   * Verifies that an optional service option with the given description is displayed in the expanded
   * optional services panel.
   * @param {import('playwright').Page} page
   * @param {string} optionText - The option description to look for (e.g. "Golf Bag")
   */
  async verifyOptionalServiceOptionDisplayed(page, optionText) {
    if (!page) throw new Error('page is required');
    if (typeof optionText !== 'string' || !optionText.trim()) {
      throw new Error(`optionText must be a non-empty string, got: ${typeof optionText}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const option = cartPage.getOptionalServicesOptionByText(optionText);
    await expect(
      option,
      `Expected optional service "${optionText}" to be displayed in the Optional Services panel`
    ).toBeVisible({ timeout: 20000 });
    logger.info('Optional service option is displayed', { optionText });
  },

  async clickEditAncillaryServices(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);

    // Ensure extras collapse is expanded — if the ancillary services edit button is not visible, expand first
    const btnVisible = await cartPage.getAncillaryServicesEditButtonLocator().isVisible().catch(() => false);
    if (!btnVisible) {
      await cartPage.clickArrowButtonExtras();
    }

    await cartPage.clickEditAncillaryServicesButton();
    logger.info('Clicked edit ancillary services button');
  },

  async verifyAncillaryServicesCarrierName(page, expectedCarrier) {
    if (!page) throw new Error('page is required');
    if (!expectedCarrier || typeof expectedCarrier !== 'string') {
      throw new Error('expectedCarrier must be a non-empty string');
    }

    const cartPage = getPageObject(page, CartPage);
    await expect(cartPage.getAncillaryServicesCarrierNameLocator()).toContainText(expectedCarrier, { timeout: 15000 });
    logger.info('Ancillary services carrier name verified', { expectedCarrier });
  },

  async selectFirstAncillaryServiceAndVerifyHoldBagPattern(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);

    await cartPage.openAncillaryServicesDropdown();
    const optionTexts = await cartPage.getAncillaryServiceOptionTexts();

    // Find the first option that matches hold bag with a price (skip "0 x hold bag")
    const holdBagPattern = /\d+\s*x\s*hold\s*bag.*\d+.*kg.*\d+[\.,]\d{2}\s*GBP/i;
    const matchingOption = optionTexts.find(text => holdBagPattern.test(text));

    if (!matchingOption) {
      throw new Error(`No ancillary service option matches hold bag pattern with GBP price. Available options: ${JSON.stringify(optionTexts)}`);
    }

    logger.info('Found matching ancillary service option', { matchingOption });

    await cartPage.selectAncillaryServiceOptionByText(matchingOption);
    logger.info('Selected ancillary service option from dropdown');

    return { optionText: matchingOption };
  },

  async verifyAncillaryServicesSuccessIcon(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await expect(cartPage.getAncillaryServicesSuccessIcon()).toBeVisible({ timeout: 30000 });
    logger.info('Ancillary services success icon (green checkmark) is visible');
  },

  async selectAncillaryServiceWithPriceBySegment(page, segmentIndex) {
    if (!page) throw new Error('page is required');
    if (typeof segmentIndex !== 'number' || segmentIndex < 0) {
      throw new Error(`segmentIndex must be a non-negative number, got: ${segmentIndex}`);
    }

    const cartPage = getPageObject(page, CartPage);

    await cartPage.openAncillaryServicesDropdownBySegment(segmentIndex);
    const optionTexts = await cartPage.getAncillaryServiceOptionTexts();

    // Find the first option that has a price (e.g. "22GBP", "24.49GBP", "60EUR")
    const pricedOptionPattern = /\d+(?:[\.,]\d{1,2})?\s*[A-Z]{3}/;
    const matchingOption = optionTexts.find(text => pricedOptionPattern.test(text));

    if (!matchingOption) {
      throw new Error(`No ancillary service option with price found for segment ${segmentIndex}. Available options: ${JSON.stringify(optionTexts)}`);
    }

    logger.info('Found priced ancillary service option', { segmentIndex, matchingOption });

    await cartPage.selectAncillaryServiceOptionByText(matchingOption);
    logger.info('Selected ancillary service option for segment', { segmentIndex });

    return { segmentIndex, selectedOption: matchingOption };
  },

  async verifyAncillaryServicesSelectionsRetained(page, expectedSelections) {
    if (!page) throw new Error('page is required');
    if (!Array.isArray(expectedSelections)) {
      throw new Error(`expectedSelections must be an array, got: ${typeof expectedSelections}`);
    }

    const cartPage = getPageObject(page, CartPage);

    for (const { segmentIndex, selectedOption } of expectedSelections) {
      const currentText = await cartPage.getAncillaryServicesSelectedTextBySegment(segmentIndex);
      expect(currentText, `Segment ${segmentIndex} should retain selection "${selectedOption}", got: "${currentText}"`)
        .toContain(selectedOption.split(' - ')[0].trim());
      logger.info('Ancillary service selection retained for segment', { segmentIndex, currentText });
    }

    return { verified: true, selectionsCount: expectedSelections.length };
  },

  /**
   * Switches to the given traveler tab inside the ancillary services panel.
   * Tab numbering is 1-based and matches the order shown to the user.
   *
   * @param {import('playwright').Page} page
   * @param {number} tabNumber - 1-based tab position
   */
  async switchAncillaryServicesToTravelerTab(page, tabNumber) {
    if (!page) throw new Error('page is required');
    if (!Number.isInteger(tabNumber) || tabNumber < 1) {
      throw new Error(`tabNumber must be a positive integer, got: ${tabNumber}`);
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickAncillaryServicesTravelerTabByIndex(tabNumber);
    logger.info('Switched to ancillary services traveler tab', { tabNumber });
  },

  /**
   * Selects the first priced ancillary service option for the given segment of
   * the currently active traveler tab. Returns the selection so the caller can
   * store it per traveler for later verification.
   *
   * @param {import('playwright').Page} page
   * @param {number} segmentIndex - 0-based segment index (0 = outbound)
   * @param {number} tabNumber - 1-based traveler tab number (used for logging/return)
   * @returns {Promise<{ travelerTab: number, segmentIndex: number, selectedOption: string }>}
   */
  async selectAncillaryServiceWithPriceBySegmentForTraveler(page, segmentIndex, tabNumber) {
    if (!page) throw new Error('page is required');
    if (typeof segmentIndex !== 'number' || segmentIndex < 0) {
      throw new Error(`segmentIndex must be a non-negative number, got: ${segmentIndex}`);
    }
    if (!Number.isInteger(tabNumber) || tabNumber < 1) {
      throw new Error(`tabNumber must be a positive integer, got: ${tabNumber}`);
    }

    const cartPage = getPageObject(page, CartPage);

    await cartPage.openAncillaryServicesDropdownBySegmentForActiveTraveler(segmentIndex);
    const optionTexts = await cartPage.getAncillaryServiceOptionTexts();

    const pricedOptionPattern = /\d+(?:[\.,]\d{1,2})?\s*[A-Z]{3}/;
    const matchingOption = optionTexts.find(text => pricedOptionPattern.test(text));

    if (!matchingOption) {
      throw new Error(`No ancillary service option with price found for traveler ${tabNumber}, segment ${segmentIndex}. Available options: ${JSON.stringify(optionTexts)}`);
    }

    logger.info('Found priced ancillary service option', { tabNumber, segmentIndex, matchingOption });

    await cartPage.selectAncillaryServiceOptionByText(matchingOption);
    logger.info('Selected ancillary service option for traveler segment', { tabNumber, segmentIndex });

    return { travelerTab: tabNumber, segmentIndex, selectedOption: matchingOption };
  },

  /**
   * Verifies the ancillary-service selections for a specific traveler tab are
   * still in place. Assumes the caller has already switched to that tab.
   *
   * @param {import('playwright').Page} page
   * @param {Array<{ segmentIndex: number, selectedOption: string }>} expectedSelections
   * @param {number} tabNumber - 1-based traveler tab number (used for error context)
   */
  async verifyAncillaryServicesSelectionsRetainedForTraveler(page, expectedSelections, tabNumber) {
    if (!page) throw new Error('page is required');
    if (!Array.isArray(expectedSelections)) {
      throw new Error(`expectedSelections must be an array, got: ${typeof expectedSelections}`);
    }
    if (!Number.isInteger(tabNumber) || tabNumber < 1) {
      throw new Error(`tabNumber must be a positive integer, got: ${tabNumber}`);
    }

    const cartPage = getPageObject(page, CartPage);

    for (const { segmentIndex, selectedOption } of expectedSelections) {
      const currentText = await cartPage.getAncillaryServicesSelectedTextBySegmentForActiveTraveler(segmentIndex);
      expect(currentText, `Traveler ${tabNumber}, segment ${segmentIndex} should retain selection "${selectedOption}", got: "${currentText}"`)
        .toContain(selectedOption.split(' - ')[0].trim());
      logger.info('Ancillary service selection retained for traveler segment', { tabNumber, segmentIndex, currentText });
    }

    return { verified: true, travelerTab: tabNumber, selectionsCount: expectedSelections.length };
  },

  /**
   * Expands the extras collapse and verifies the passenger info section is NOT visible.
   * Used for non-US flights where APIS is not required.
   * @param {import('playwright').Page} page
   */
  async verifyPassengerInfoNotVisibleInExtras(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickArrowButtonExtras();
    const isVisible = await cartPage.isPassengerInfoSectionVisible();
    expect(isVisible, 'Expected passenger info section to NOT be visible in extras').toBe(false);
    logger.info('Passenger info section is not visible in extras (APIS not required)');
  },

  /**
   * Expands the extras collapse and verifies that a section with the given name is visible.
   * @param {import('playwright').Page} page
   * @param {string} sectionName - Display text of the section title (e.g. "Frequent Flyer", "Seating")
   */
  async verifyExtrasSectionVisibleByName(page, sectionName) {
    if (!page) throw new Error('page is required');
    if (!sectionName || typeof sectionName !== 'string') throw new Error('sectionName must be a non-empty string, got: ' + sectionName);

    const cartPage = getPageObject(page, CartPage);
    const isVisible = await cartPage.isExtrasSectionVisibleByName(sectionName);
    expect(isVisible, `Expected extras section "${sectionName}" to be visible`).toBe(true);
    logger.info('Extras section is visible', { sectionName });
  },

  /**
   * Verifies the count of visible extras sections in the cart extras panel.
   * @param {import('playwright').Page} page
   * @param {number} expectedCount
   */
  async verifyExtrasSectionsCount(page, expectedCount) {
    if (!page) throw new Error('page is required');
    if (typeof expectedCount !== 'number' || expectedCount < 0) throw new Error('expectedCount must be a non-negative number, got: ' + expectedCount);

    const cartPage = getPageObject(page, CartPage);
    const actualCount = await cartPage.getVisibleExtrasSectionsCount();
    expect(actualCount, `Expected ${expectedCount} extras sections visible, got ${actualCount}`).toBe(expectedCount);
    logger.info('Extras sections count matches expected', { expectedCount, actualCount });
  },

  /**
   * Verifies the passenger info section is marked as required (red asterisk visible).
   * @param {import('playwright').Page} page
   */
  async verifyPassengerInfoMarkedAsRequired(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickArrowButtonExtras();
    const isRequired = await cartPage.isPassengerInfoMarkedAsRequired();
    expect(isRequired, 'Expected passenger info section to show required asterisk').toBe(true);
    logger.info('Passenger info section is marked as required (asterisk visible)');
  },

  /**
   * Opens the passenger info panel in extras (expanding collapse if needed).
   * @param {import('playwright').Page} page
   */
  async clickPassengerInfoInExtras(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.openPassengerInfoPanel();
    logger.info('Opened passenger info panel in extras');
  },

  /**
   * Verifies the Date of Birth field is highlighted as required (is-danger) in the passenger info form.
   * @param {import('playwright').Page} page
   */
  async verifyDateOfBirthFieldRequired(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const isRequired = await cartPage.isDateOfBirthFieldRequired();
    expect(isRequired, 'Expected Date of Birth field to be marked as required (is-danger)').toBe(true);
    logger.info('Date of Birth field is marked as required in passenger info');
  },

  /**
   * Verifies the passenger info form shows the expected number of editable fields.
   * @param {import('playwright').Page} page
   * @param {number} expectedCount
   */
  async verifyPassengerInfoEditableFieldsCount(page, expectedCount) {
    if (!page) throw new Error('page is required');
    if (!Number.isInteger(expectedCount) || expectedCount < 0) {
      throw new Error(`expectedCount must be a non-negative integer, got: ${expectedCount}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const actualCount = await cartPage.getEditableFieldsCountInPassengerInfo();
    expect(actualCount, `Expected ${expectedCount} editable fields in passenger info, got ${actualCount}`).toBe(expectedCount);
    logger.info('Passenger info editable fields count verified', { expectedCount, actualCount });
  },

  /**
   * Fills a valid date in the passenger info Date of Birth field.
   * @param {import('playwright').Page} page
   * @param {string} [dateValue='15 Jan 1990'] - Date in "DD MMM YYYY" format
   */
  async fillPassengerInfoDateOfBirth(page, dateValue = '15 Jan 1990') {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.fillPassengerInfoDateOfBirth(dateValue);
    logger.info('Filled passenger info date of birth', { dateValue });
  },

  /**
   * Verifies that mandatory fields are highlighted (is-danger) in the passenger info section
   * after an unsuccessful save attempt.
   * @param {import('playwright').Page} page
   */
  async verifyMandatoryFieldsHighlightedInPassengerInfo(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const count = await cartPage.getHighlightedFieldsCountInPassengerInfo();
    expect(count, 'Expected at least one mandatory field to be highlighted in passenger info').toBeGreaterThan(0);
    logger.info('Mandatory fields highlighted in passenger info', { count });
  },

  /**
   * Verifies the exact count of mandatory fields highlighted (is-danger) in the passenger info section.
   * @param {import('playwright').Page} page
   * @param {number} expectedCount - Expected number of highlighted fields
   */
  async verifyMandatoryFieldsCountInPassengerInfo(page, expectedCount) {
    if (!page) throw new Error('page is required');
    if (typeof expectedCount !== 'number' || expectedCount < 0) {
      throw new Error('expectedCount must be a non-negative number, got: ' + expectedCount);
    }

    const cartPage = getPageObject(page, CartPage);
    const count = await cartPage.getHighlightedFieldsCountInPassengerInfo();
    expect(count, `Expected ${expectedCount} mandatory fields highlighted, got ${count}`).toBe(expectedCount);
    logger.info('Verified mandatory fields highlighted count in passenger info', { expectedCount, actual: count });
  },

  /**
   * Fills the passport number field inside the passenger info APIS form.
   * @param {import('playwright').Page} page
   * @param {string} passportNumber - The passport number to enter
   */
  async fillPassportNumberInPassengerInfo(page, passportNumber) {
    if (!page) throw new Error('page is required');
    if (typeof passportNumber !== 'string' || !passportNumber.trim()) {
      throw new Error('passportNumber must be a non-empty string, got: ' + typeof passportNumber);
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.fillPassportNumber(passportNumber);
    logger.info('Filled passport number in passenger info', { passportNumber });
  },

  /**
   * Selects the applicable country in the passenger info APIS form.
   * @param {import('playwright').Page} page
   * @param {string} country - Country name to search and select
   */
  async fillApplicableCountryInPassengerInfo(page, country) {
    if (!page) throw new Error('page is required');
    if (typeof country !== 'string' || !country.trim()) {
      throw new Error('country must be a non-empty string, got: ' + typeof country);
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.fillApplicableCountry(country);
    logger.info('Filled applicable country in passenger info', { country });
  },

  /**
   * Selects the nationality in the passenger info APIS form.
   * Also auto-fills "Issued at" via the form's built-in handler.
   * @param {import('playwright').Page} page
   * @param {string} nationality - Nationality name to search and select
   */
  async fillNationalityInPassengerInfo(page, nationality) {
    if (!page) throw new Error('page is required');
    if (typeof nationality !== 'string' || !nationality.trim()) {
      throw new Error('nationality must be a non-empty string, got: ' + typeof nationality);
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.fillNationality(nationality);
    logger.info('Filled nationality in passenger info', { nationality });
  },

  /**
   * Fills the passport expiry date in the passenger info APIS form with a future date.
   * @param {import('playwright').Page} page
   * @param {string} [dateValue='15 Jan 2030'] - Date in "DD MMM YYYY" format
   */
  async fillPassportExpiryDateInPassengerInfo(page, dateValue = '15 Jan 2030') {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.fillPassportExpiryDate(dateValue);
    logger.info('Filled passport expiry date in passenger info', { dateValue });
  },

  /**
   * Verifies the passenger info section shows the green success checkmark icon after saving.
   * @param {import('playwright').Page} page
   */
  async verifyPassengerInfoSaveSuccess(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForPassengerInfoSaveSuccess();
    logger.info('Passenger info section shows green success checkmark');
  },

  /**
   * Copies the trip via the three-dots dropdown menu.
   * Hovers over the trip actions icon, clicks "Copy trip", waits for the dialog,
   * then confirms. Handles the new window/tab the app opens for the copied trip.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<import('playwright').Page>} The copied trip page (new tab or same tab).
   */
  async copyTrip(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);

    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await cartPage.hoverTripActionsDropdownIcon();
    await cartPage.clickCopyTripOption();
    await cartPage.waitForCopyTripDialog();

    const context = page.context();
    const newPagePromise = context.waitForEvent('page', { timeout: 15000 }).catch(() => null);
    await cartPage.clickConfirmCopyTripButton();
    const newTripPage = await newPagePromise;

    if (newTripPage) {
      logger.info('Copied trip opened in a new tab');
      await newTripPage.waitForLoadState('networkidle', { timeout: 60000 });
      return newTripPage;
    }

    logger.info('Copied trip opened in current tab (no new tab detected)');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    return page;
  },

  /**
   * Verifies the copied trip page contains the expected flight number.
   *
   * @param {import('playwright').Page} page
   * @param {string} storedFlightNumber - Flight number extracted from the original trip.
   */
  async verifyTripHasSameFlightNumber(page, storedFlightNumber) {
    if (!page) throw new Error('page is required');
    if (!storedFlightNumber || typeof storedFlightNumber !== 'string') {
      throw new Error(`storedFlightNumber must be a non-empty string, got: ${typeof storedFlightNumber}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const flightNumber = await cartPage.getFirstVisibleFlightNumber();
    expect(
      flightNumber,
      `Expected copied trip to contain flight number "${storedFlightNumber}" but got "${flightNumber}"`,
    ).toBe(storedFlightNumber);
  },

  // ========================================
  // PAYMENT & TERMS - CARS SPECIFIC
  // ========================================

  async clickPaymentTermsLink(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    logger.info("Clicking payment terms link in trip overview");
    await cartPage.clickPaymentTermsLink();
    await page.waitForTimeout(500); // Brief pause for modal to appear
  },

  async verifyTermsModalDisplayed(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    logger.info("Verifying rental period terms modal is displayed");
    const isVisible = await cartPage.isTermsModalVisible();
    expect(isVisible, 'Expected rental period terms modal to be visible').toBe(true);
  },

  async closeTermsModal(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    logger.info("Closing terms modal");
    await cartPage.closeTermsModal();
    await page.waitForTimeout(300); // Brief pause after closing
  },

  /**
   * Extracts and logs all content from a specific section in the terms modal.
   * Validates that a section heading exists and logs all text until the next heading.
   * 
   * @param {import('playwright').Page} page
   * @param {string} sectionHeading - The section heading to find (e.g., "Rental period", "Drop Off location")
   * @returns {Promise<{section: string, content: string}>} The section heading and extracted content
   */
  async extractAndVerifyTermsModalSection(page, sectionHeading) {
    if (!page) throw new Error('page is required');
    if (!sectionHeading || typeof sectionHeading !== 'string') {
      throw new Error('sectionHeading must be a non-empty string');
    }

    const cartPage = getPageObject(page, CartPage);
    logger.info(`Extracting terms modal section: ${sectionHeading}`);

    const content = await cartPage.extractTermsModalSectionContent(sectionHeading);

    if (!content) {
      throw new Error(`No content found for section "${sectionHeading}" in terms modal`);
    }

    logger.info(`✓ Terms modal section "${sectionHeading}" content:`, { content });
    return { section: sectionHeading, content };
  },

  async addSunnyFlightNumber(page, flightNumber = 'BA123') {
    if (!page) throw new Error('page is required');
    if (!flightNumber || typeof flightNumber !== 'string') {
      throw new Error('flightNumber must be a non-empty string');
    }

    const cartPage = getPageObject(page, CartPage);
    logger.info('Adding Sunny Cars flight number in cart', { flightNumber });
    await cartPage.openSunnyFlightNumberExtras();
    await cartPage.fillSunnyFlightNumber(flightNumber);
    await cartPage.saveSunnyFlightNumber();
  },
};


// Export Cart DSL for use in tests
module.exports = Cart;
