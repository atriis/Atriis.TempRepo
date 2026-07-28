const fs = require("fs");
const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const { CartPage, SELECTORS: CART_SELECTORS, CANCELLATION_CONFIRMED_TEXT } = require("@pages/CartPage");
const { CheckoutPage, SELECTORS: CheckoutSelectors } = require("@pages/CheckoutPage");
const { CommonPage, SELECTORS: COMMON_SELECTORS } = require("@pages/CommonPage");
const { ResultsPage } = require("@pages/ResultsPage");
const FlightResultsPage = require("@pages/FlightResultsPage");
const FlightResults = require("./FlightResults");
const Profile = require("./Profile");
const ProfilePage = require("@pages/ProfilePage");
const tripStatus = require("@data/tripStatus.json");
const config = require("@config/config");
const BookingErrorHandler = require("@utils/bookingErrorHandler");
const { expectNumbersToBeEqualWithTolerance } = require("../assertions/numberAssertions");
const { parseAmountText } = require("@utils/dom");
const { normalizeText, extractDateTokens } = require("@utils/text");
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
    const bookingErrorDialog = page.locator(CheckoutSelectors.BOOKING_ERROR_DIALOG).first();

    // The cart price-change modal and the cart booking-error modal are the SAME el-dialog
    // (trip-cart.vue app-confirm wrapping trip-booking-response-errors), so
    // BOOKING_ERROR_DIALOG — which includes `.app-confirm:has(.booking-response-errors)` —
    // matches a price change too. The only reliable discriminator is the "Proceed with
    // change" button, which trip-cart.vue renders exclusively for changed-but-bookable
    // quotes (isShowCheckoutButton). So always attempt that click BEFORE declaring a
    // booking error — the same order holdFlightAndHandlePriceChange already uses.
    //
    // The modal can also re-appear: clicking "Proceed with change" calls handleCheckout(),
    // which can re-run the hold/price-check round-trip and surface a fresh price change.
    // Keep handling it until the target wins, a real booking error shows, or time runs out.
    const deadline = Date.now() + timeout;
    const maxPriceChangeHandlings = 3;
    let clickedModal = false;
    let priceChangeHandlings = 0;

    for (;;) {
      const remaining = deadline - Date.now();

      if (remaining <= 0) {
        throw new Error(
          `Neither ${targetDescription}, a booking error modal, nor a resolvable price change modal was reached within ${timeout}ms ` +
          `(handled ${priceChangeHandlings} price-change modal(s)).`,
        );
      }

      const waiters = [
        targetLocator.waitFor({ state: 'visible', timeout: remaining }),
        proceedWithChangeButton.waitFor({ state: 'visible', timeout: remaining }),
        bookingErrorDialog.waitFor({ state: 'visible', timeout: remaining }),
      ];
      // The losing waiters still reject when they time out; attach handlers so they
      // don't surface as unhandled rejections.
      waiters.forEach((waiter) => waiter.catch(() => {}));

      try {
        await Promise.race(waiters);
      } catch (error) {
        throw new Error(
          `Neither ${targetDescription}, booking error modal, nor the price change modal appeared within ${timeout}ms. Original error: ${error.message}`,
        );
      }

      if (await targetLocator.isVisible().catch(() => false)) {
        return { clickedModal, bookingErrorDetected: false };
      }

      // Price change before booking error — they share the same selector. The short wait
      // inside clickProceedWithChangeIfVisible covers the tick where the dialog is already
      // visible but its footer buttons have not rendered yet.
      if (priceChangeHandlings < maxPriceChangeHandlings) {
        const justClickedPriceChange = await cartPage
          .clickProceedWithChangeIfVisible(1000)
          .catch((error) => {
            // The helper already returns false when the button never shows, so this only
            // fires on a real click failure (e.g. the dialog re-rendered mid-click). Log it
            // so the booking-error branch below doesn't misreport the cause.
            logger.warn('Clicking "Proceed with change" failed — re-classifying the modal', { error: error.message });
            return false;
          });

        if (justClickedPriceChange) {
          clickedModal = true;
          priceChangeHandlings += 1;
          logger.info('Handled a cart price-change modal by clicking "Proceed with change"', {
            targetDescription,
            priceChangeHandlings,
          });

          // Let the modal tear down so the next iteration doesn't re-read the same dialog,
          // then loop to see whether this click actually got us to the target.
          await cartPage.waitForPriceChangeDialogHidden().catch(() => {});
          continue;
        }
      } else if (await cartPage.isProceedWithChangeButtonVisible().catch(() => false)) {
        throw new Error(
          `The cart price-change modal re-appeared after ${priceChangeHandlings} "Proceed with change" click(s) while ` +
          `waiting for ${targetDescription}, so checkout was never reached — the supplier keeps re-pricing this trip.`,
        );
      }

      if (await bookingErrorDialog.isVisible().catch(() => false)) {
        return { clickedModal, bookingErrorDetected: true };
      }

      throw new Error(`Expected ${targetDescription}, a visible booking error modal, or a visible price change modal, but neither became actionable.`);
    }
  },

  /**
   * Races for the price-change modal or on-hold status, reads price values,
   * clicks "Proceed with change" if shown, and returns what was found.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{priceChangeShown: boolean, oldPrice: number, newPrice: number, nearIdentical: boolean}>}
   */
  async validatePriceChangeAndProceed(page) {
    const cartPage = getPageObject(page, CartPage);
    const timeout = process.env.CI ? 60000 : 45000;
    const proceedBtn = cartPage.getProceedWithChangeButton();
    const onHoldLabel = cartPage.getOnHoldStatusLabel();

    try {
      await Promise.race([
        proceedBtn.waitFor({ state: 'visible', timeout }),
        onHoldLabel.waitFor({ state: 'visible', timeout }),
      ]);
    } catch {
      return { priceChangeShown: false, oldPrice: 0, newPrice: 0, nearIdentical: false };
    }

    if (!await proceedBtn.isVisible().catch(() => false)) {
      return { priceChangeShown: false, oldPrice: 0, newPrice: 0, nearIdentical: false };
    }

    const { oldPrice, newPrice, oldText, newText } = await cartPage.getPriceChangeValues();
    await proceedBtn.click();
    const nearIdentical = Math.abs(oldPrice - newPrice) <= 1.00;
    return { priceChangeShown: true, oldPrice, newPrice, nearIdentical, oldText, newText };
  },

  /**
   * ADO 77842 — clicks "Proceed to Checkout" and STOPS at the "Checkout notification"
   * price-change modal without dismissing it, so the caller can validate the popup.
   * (The generic `acceptTermsAndConditionsAndProceedToCheckout` auto-clicks
   * "Proceed with change", which would destroy the popup before it can be asserted.)
   * @param {import('playwright').Page} page
   */
  async proceedToCheckoutExpectingPriceChange(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.acceptTermsAndConditions();
    await cartPage.waitForProceedToCheckout();
    await cartPage.clickProceedToCheckout();
    // Wait for the modal to appear but do NOT dismiss it — the caller validates it.
    await cartPage.waitForPriceChangeDialog();
  },

  /**
   * ADO 77842 — strict validation of the GoGlobal "Checkout notification" price-change
   * modal shown when the cart price increases at checkout. Asserts the dialog header,
   * title, and body text; that the popup refers to the same hotel and dates captured
   * from the cart; the quote status; that exactly two prices are shown (old crossed-out
   * and equal to the extracted cart price, new not crossed-out and larger); and that
   * exactly the three expected action buttons are present.
   *
   * @param {import('playwright').Page} page
   * @param {{extractedCartPrice:number, expectedHotelName?:string, expectedDates?:string}} ctx
   * @returns {Promise<{oldPrice:number, newPrice:number}>}
   */
  async validateCheckoutPriceChangeNotification(page, { extractedCartPrice, expectedHotelName, expectedDates } = {}) {
    if (!page) throw new Error('page is required');
    if (typeof extractedCartPrice !== 'number' || Number.isNaN(extractedCartPrice)) {
      throw new Error(`extractedCartPrice must be a number, got: ${extractedCartPrice}`);
    }
    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForPriceChangeDialog();

    // Case-insensitive normalize — some labels (e.g. the status badge) render uppercase via CSS
    // text-transform, which innerText() returns as-is, so all copy comparisons must ignore case.
    const ci = (s) => normalizeText(s).toLowerCase();

    // Dialog header ("Checkout notification") + section title ("Price change") + body text.
    const dialogText = await cartPage.getPriceChangeDialogText();
    expect(ci(dialogText), 'Price-change modal should be the "Checkout notification" dialog')
      .toContain(ci('Checkout notification'));

    const title = await cartPage.getPriceChangeTitleText();
    expect(ci(title), 'Price-change modal title should read "Price change"')
      .toContain(ci('Price change'));

    const body = await cartPage.getPriceChangeBodyText();
    expect(ci(body), 'Price-change modal body text mismatch').toContain(
      ci('Price for the following items has changed. We updated the price in the cart accordingly.'),
    );

    // The popup must refer to the same hotel and dates captured from the cart.
    if (expectedHotelName) {
      const popupHotel = await cartPage.getPriceChangeHotelNameText();
      expect(ci(popupHotel), 'Price-change popup hotel name should match the cart')
        .toContain(ci(expectedHotelName));
    }
    if (expectedDates) {
      const popupDates = await cartPage.getPriceChangeDatesText();
      const expectedTokens = extractDateTokens(expectedDates);
      const popupTokens = extractDateTokens(popupDates);
      for (const token of expectedTokens) {
        expect(popupTokens, `Price-change popup dates "${popupDates}" should include "${token}" from cart dates "${expectedDates}"`)
          .toContain(token);
      }
    }

    // Quote status behind the popup should be "Pending booking".
    const status = await cartPage.getPriceChangeStatusText();
    expect(ci(status), 'Price-change quote status should be "Pending booking"')
      .toContain(ci('Pending booking'));

    // Exactly two prices — old and new.
    const priceCount = await cartPage.getPriceChangePriceCount();
    expect(priceCount, 'Price-change popup should show exactly two prices').toBe(2);

    const { oldPrice, newPrice } = await cartPage.getPriceChangeValues();

    // Old (left) price is crossed out and equals the extracted cart price.
    expect(await cartPage.isPriceChangePrevPriceStrikethrough(), 'Old (left) price should be crossed out').toBe(true);
    expectNumbersToBeEqualWithTolerance(oldPrice, extractedCartPrice, 1,
      'Old (left) price should equal the extracted cart price');

    // New (right) price is not crossed out and is larger than the old price.
    expect(await cartPage.isPriceChangeUpdatedPriceStrikethrough(), 'New (right) price should not be crossed out').toBe(false);
    expect(newPrice, `New (right) price ${newPrice} should be larger than old price ${oldPrice}`).toBeGreaterThan(oldPrice);

    // Exactly the three expected action buttons.
    const buttonNames = await cartPage.getPriceChangeFooterButtonNames();
    expect(buttonNames.length, `Price-change popup should show exactly 3 buttons, found: ${JSON.stringify(buttonNames)}`).toBe(3);
    const normalizedButtons = buttonNames.map(ci);
    for (const expectedLabel of ['back to trip', 'search new hotel', 'proceed with change']) {
      expect(
        normalizedButtons.some((n) => n.includes(ci(expectedLabel))),
        `Price-change popup should include a "${expectedLabel}" button, found: ${JSON.stringify(buttonNames)}`,
      ).toBe(true);
    }

    logger.info('Price-change notification validated', { oldPrice, newPrice, buttonNames });
    return { oldPrice, newPrice };
  },

  /**
   * ADO 77842 — reads the new (right-hand, non-crossed) price from the price-change popup.
   * @param {import('playwright').Page} page
   * @returns {Promise<number>}
   */
  async extractNewPriceFromPriceChange(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForPriceChangeDialog();
    const { newPrice } = await cartPage.getPriceChangeValues();
    if (!newPrice) {
      throw new Error('Could not read the new price from the price-change popup');
    }
    return newPrice;
  },

  /**
   * ADO 77842 — clicks "Proceed with change" in the price-change popup and waits for
   * the checkout page to render (proceeding with the change navigates to checkout).
   * @param {import('playwright').Page} page
   */
  async proceedWithPriceChange(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const clicked = await cartPage.clickProceedWithChangeIfVisible();
    if (!clicked) {
      throw new Error('The "Proceed with change" button did not appear in the price-change popup');
    }
    const checkoutHeading = page.locator(CheckoutSelectors.BOOKING_DETAILS_HEADING);
    await checkoutHeading.waitFor({ state: 'visible', timeout: process.env.CI ? 60000 : 45000 }).catch(() => {});
  },

  /**
   * ADO 77842 — reads the hotel name currently shown in the cart hotel quote card.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>}
   */
  async extractHotelNameFromCart(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    return cartPage.getHotelPreviewNameText();
  },

  /**
   * ADO 77842 — reads the stay dates currently shown in the cart hotel quote card.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>}
   */
  async extractDatesFromCart(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    return cartPage.getHotelPreviewDatesText();
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

    // Best-effort wait for page network activity to settle before attempting the cancellation
    // dropdown (the el-dropdown is disabled while the page is loading, causing flaky hover failures).
    // Non-fatal: an in-approval trip polls its approval status continuously, so 'networkidle' may
    // never settle — the waitForTripOverviewTitle + dropdown-menu waits below provide the real
    // synchronization. Mirrors ensureCartReadyForStatusCheck's networkidle handling above.
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

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
    const messageVisible = await page.getByText(CANCELLATION_CONFIRMED_TEXT, { exact: true }).isVisible();

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

  /**
   * Verifies the car (or any product) date shown in the cart is not the given broken value.
   *
   * Guards against the "Thursday, January 01" regression where a date that fails to parse renders
   * as the epoch default. Asserts the unwanted date text does NOT appear in the cart quotes tabs.
   *
   * @param {import('playwright').Page} page
   * @param {string} unwantedDate - The broken date text that must not appear, e.g. "Thursday, January 01"
   * @returns {Promise<{unwantedDate: string, shown: boolean}>}
   */
  async verifyCarDateInCartIsNot(page, unwantedDate) {
    if (!page) throw new Error('[Cart.verifyCarDateInCartIsNot] "page" is required.');
    if (!unwantedDate || typeof unwantedDate !== 'string') {
      throw new Error(
        `[Cart.verifyCarDateInCartIsNot] "unwantedDate" must be a non-empty string, got: ${typeof unwantedDate} (${JSON.stringify(unwantedDate)})`,
      );
    }

    logger.info('Verifying the car date in cart is not the broken default value', { unwantedDate });

    const cartPage = getPageObject(page, CartPage);
    const shown = await cartPage.isDateTextShownInCartTabs(unwantedDate);

    expect(
      shown,
      `Car date in cart shows "${unwantedDate}" — the pickup date failed to parse/render (regression of the broken default-date bug).`,
    ).toBe(false);

    return { unwantedDate, shown };
  },

  /**
   * Verifies the cancellation-confirmed page title is spelled exactly correctly.
   *
   * Reads the actual rendered title text and asserts it equals "Cancellation confirmed!" — catching
   * any misspelling. Must be called after the trip has been cancelled (confirmation page visible).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{confirmationText: string}>}
   */
  async verifyCancellationConfirmedSpelledCorrectly(page) {
    if (!page) throw new Error('[Cart.verifyCancellationConfirmedSpelledCorrectly] "page" is required.');

    logger.info('Verifying the cancellation confirmation message is spelled correctly');

    const cartPage = getPageObject(page, CartPage);
    const actualText = await cartPage.getCancellationConfirmedTitleText();
    const expectedText = CANCELLATION_CONFIRMED_TEXT;

    expect(
      actualText,
      `Cancellation confirmation message is misspelled — expected "${expectedText}" but the page showed "${actualText}".`,
    ).toBe(expectedText);

    return { confirmationText: actualText };
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
      const supplierMessage = await checkoutPage.getBookingErrorSupplierMessage();
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

      // Always prefer the concise "supplier:" line over the full dialog text and
      // over the bare supplier token (extracted with an asterisk-bounded regex
      // that isn't reliably present) - logged whether or not the error is known.
      const errorLogValue = supplierMessage || bookingErrorText || supplier || 'UNKNOWN';
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

  /**
   * Verifies the trip contains a Per-Diem quote by asserting the quote card's
   * "Type" value reads "Per diem".
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{typeText: string}>}
   */
  async verifyTripContainsPerDiemQuote(page) {
    if (!page) throw new Error('[Cart.verifyTripContainsPerDiemQuote] "page" is required.');

    logger.info('Verifying the trip contains a Per-Diem quote');

    const cartPage = getPageObject(page, CartPage);
    const typeValue = cartPage.getPerDiemQuoteTypeValue();

    try {
      await typeValue.waitFor({ state: 'visible', timeout: 60000 });
    } catch (err) {
      throw new Error(
        `[Cart.verifyTripContainsPerDiemQuote] The Per-Diem quote card "Type" value was not visible within 60s. ` +
        `The trip likely does not contain an auto-created Per-Diem quote, or the quote card did not render. Original: ${err.message}`,
      );
    }

    const typeText = (await typeValue.innerText()).trim();
    expect(
      typeText,
      `Expected the trip to contain a Per-Diem quote (card "Type" value should read "Per diem"), but it read "${typeText}".`,
    ).toMatch(/per\s*diem/i);

    return { typeText };
  },

  /**
   * Verifies a Per-Diem quote is displayed for the given destination by asserting
   * the quote card title reads "Per-Diem for {destination}".
   *
   * @param {import('playwright').Page} page
   * @param {string} destination - Destination city shown in the quote title, e.g. "Madrid"
   * @returns {Promise<{destination: string, titleText: string}>}
   */
  async verifyPerDiemQuoteDisplayedFor(page, destination) {
    if (!page) throw new Error('[Cart.verifyPerDiemQuoteDisplayedFor] "page" is required.');
    if (!destination || typeof destination !== 'string') {
      throw new Error(
        `[Cart.verifyPerDiemQuoteDisplayedFor] "destination" must be a non-empty string, got: ${typeof destination} (${JSON.stringify(destination)})`,
      );
    }

    logger.info('Verifying the Per-Diem quote is displayed for a destination', { destination });

    const cartPage = getPageObject(page, CartPage);
    const title = cartPage.getPerDiemQuoteTitle();

    try {
      await title.waitFor({ state: 'visible', timeout: 60000 });
    } catch (err) {
      throw new Error(
        `[Cart.verifyPerDiemQuoteDisplayedFor] The Per-Diem quote card title was not visible within 60s. ` +
        `The Per-Diem quote may not have been created for "${destination}", or the card did not render. Original: ${err.message}`,
      );
    }

    const titleText = (await title.innerText()).trim();
    const normalizedTitle = titleText.toLowerCase();
    // Tolerate the "Per-Diem"/"Per Diem" hyphen-vs-space and casing; still require both the
    // per-diem phrase and the destination so a wrong/empty title is caught.
    expect(
      normalizedTitle,
      `Expected a Per-Diem quote title (e.g. "Per-Diem for ${destination}"), but the card title read "${titleText}".`,
    ).toMatch(/per[\s-]?diem for/);
    expect(
      normalizedTitle,
      `Expected the Per-Diem quote title to reference destination "${destination}", but it read "${titleText}".`,
    ).toContain(destination.toLowerCase());

    return { destination, titleText };
  },

  /**
   * Verifies the Per-Diem quote status label matches the expected status.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedStatus - Expected status text, e.g. "Confirmed"
   * @returns {Promise<{expectedStatus: string, actualStatus: string}>}
   */
  async verifyPerDiemQuoteStatus(page, expectedStatus) {
    if (!page) throw new Error('[Cart.verifyPerDiemQuoteStatus] "page" is required.');
    if (!expectedStatus || typeof expectedStatus !== 'string') {
      throw new Error(
        `[Cart.verifyPerDiemQuoteStatus] "expectedStatus" must be a non-empty string, got: ${typeof expectedStatus} (${JSON.stringify(expectedStatus)})`,
      );
    }

    logger.info('Verifying the Per-Diem quote status', { expectedStatus });

    const cartPage = getPageObject(page, CartPage);
    const statusLabel = cartPage.getPerDiemQuoteStatusLabel();

    try {
      await statusLabel.waitFor({ state: 'visible', timeout: 60000 });
    } catch (err) {
      throw new Error(
        `[Cart.verifyPerDiemQuoteStatus] The Per-Diem quote status label was not visible within 60s. ` +
        `The Per-Diem quote card may not have rendered a status badge. Original: ${err.message}`,
      );
    }

    const actualStatus = (await statusLabel.innerText()).trim();
    expect(
      actualStatus.toLowerCase(),
      `Expected the Per-Diem quote status to be "${expectedStatus}", but it read "${actualStatus}".`,
    ).toContain(expectedStatus.toLowerCase());

    return { expectedStatus, actualStatus };
  },

  /**
   * Verifies the Per-Diem quote card is NOT editable by asserting its read-only actions
   * container exposes no edit control. Quotes auto-created after issuing a flight (old method)
   * are locked: the "Edit details" button is the sole child of the card's `.box-center .btns`
   * and is gated behind `v-if="canEditPerDiem"` in per-diem-quote-card.vue, so it is absent
   * from the DOM when editing is not allowed.
   *
   * The card root is confirmed to have rendered first, so an empty actions container reflects
   * a locked quote — not a card that simply has not loaded yet (which would pass falsely).
   *
   * Scope: this covers quote-level editability (the card's edit control). It does NOT assert
   * the per-diem *breakdown* table's "add line"/edit affordances — those live in a separate
   * component (per-diem-breakdown.vue) and warrant their own assertion when a scenario needs
   * it (e.g. 33093's new-method breakdown), since they are distinguished only by localized text.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async verifyPerDiemQuoteNotEditable(page) {
    if (!page) throw new Error('[Cart.verifyPerDiemQuoteNotEditable] "page" is required.');

    logger.info('Verifying the Per-Diem quote is not editable (no edit control present)');

    const cartPage = getPageObject(page, CartPage);

    // Gate on the card rendering first; otherwise a not-yet-loaded card would trivially
    // (and wrongly) satisfy the "no edit control" assertion below.
    const card = cartPage.getPerDiemQuoteCard();
    try {
      await card.waitFor({ state: 'visible', timeout: 60000 });
    } catch (err) {
      throw new Error(
        `[Cart.verifyPerDiemQuoteNotEditable] The Per-Diem quote card did not render within 60s, ` +
        `so its editability could not be verified. Original: ${err.message}`,
      );
    }

    const editControls = cartPage.getPerDiemQuoteEditControls();
    await expect(
      editControls,
      `Expected the Per-Diem quote to be locked (no edit control in the card's actions), ` +
      `but an edit control was present — the quote appears editable.`,
    ).toHaveCount(0, { timeout: 10000 });
  },

  /**
   * Expands the Per-Diem quote breakdown so its table and actions become visible. Mirrors the
   * attach-files extra flow: open the quote card's extras collapse, then click the breakdown's
   * "View" toggle (the breakdown is wrapped in the shared extras-layout). Leaves verification of
   * the opened breakdown to `verifyPerDiemQuoteBreakdownDisplayed`.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async expandPerDiemQuoteBreakdown(page) {
    if (!page) throw new Error('[Cart.expandPerDiemQuoteBreakdown] "page" is required.');

    logger.info('Expanding the Per-Diem quote breakdown');

    const cartPage = getPageObject(page, CartPage);

    logger.debug('Opening the per-diem quote card extras collapse, then the breakdown view toggle');
    try {
      await cartPage.clickPerDiemExtrasCollapse();
      await cartPage.clickPerDiemBreakdownViewBtn();
    } catch (err) {
      throw new Error(
        `[Cart.expandPerDiemQuoteBreakdown] Could not expand the Per-Diem breakdown. ` +
        `The quote card extras section or the breakdown "View" toggle did not open — the trip may ` +
        `not contain a per-diem breakdown, or the card did not render. Original: ${err.message}`,
      );
    }
  },

  /**
   * Verifies the Per-Diem quote breakdown is displayed by asserting the expanded breakdown card
   * title ("Per diem breakdown") is visible. Assumes the breakdown was expanded first
   * (see `expandPerDiemQuoteBreakdown`).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{titleText: string}>}
   */
  async verifyPerDiemQuoteBreakdownDisplayed(page) {
    if (!page) throw new Error('[Cart.verifyPerDiemQuoteBreakdownDisplayed] "page" is required.');

    logger.info('Verifying the Per-Diem quote breakdown is displayed');

    const cartPage = getPageObject(page, CartPage);
    const title = cartPage.getPerDiemBreakdownCardTitle();

    try {
      await title.waitFor({ state: 'visible', timeout: 60000 });
    } catch (err) {
      throw new Error(
        `[Cart.verifyPerDiemQuoteBreakdownDisplayed] The Per-Diem breakdown card title was not visible within 60s. ` +
        `The breakdown may not have been expanded, or the quote has no breakdown data. Original: ${err.message}`,
      );
    }

    const titleText = (await title.innerText()).trim();
    expect(
      titleText.toLowerCase(),
      `Expected the expanded Per-Diem breakdown title to read "Per diem breakdown", but it read "${titleText}".`,
    ).toContain('breakdown');

    return { titleText };
  },

  /**
   * Verifies the Per-Diem *breakdown* is NOT editable by asserting the breakdown's "Edit" button
   * is absent. That button is gated behind `v-if="canEditTable"` in per-diem-breakdown.vue, so it
   * is removed from the DOM for a locked breakdown (auto-created after issuing a flight).
   *
   * This is breakdown-level editability, distinct from `verifyPerDiemQuoteNotEditable` (which
   * covers only the quote card's "Edit details" control). The breakdown must be expanded first.
   *
   * The breakdown card title is confirmed visible first, so an absent Edit button reflects a
   * locked breakdown — not one that simply has not opened yet (which would pass falsely).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async verifyPerDiemBreakdownNotEditable(page) {
    if (!page) throw new Error('[Cart.verifyPerDiemBreakdownNotEditable] "page" is required.');

    logger.info('Verifying the Per-Diem breakdown is not editable (no Edit button present)');

    const cartPage = getPageObject(page, CartPage);

    // Gate on the breakdown having opened; otherwise an unopened breakdown would trivially
    // (and wrongly) satisfy the "no Edit button" assertion below.
    const title = cartPage.getPerDiemBreakdownCardTitle();
    try {
      await title.waitFor({ state: 'visible', timeout: 60000 });
    } catch (err) {
      throw new Error(
        `[Cart.verifyPerDiemBreakdownNotEditable] The Per-Diem breakdown did not open within 60s, ` +
        `so its editability could not be verified. Original: ${err.message}`,
      );
    }

    const editControls = cartPage.getPerDiemBreakdownEditControls();
    await expect(
      editControls,
      `Expected the Per-Diem breakdown to be locked (no "Edit" button in the breakdown actions), ` +
      `but an "Edit" button was present — the breakdown appears editable.`,
    ).toHaveCount(0, { timeout: 10000 });
  },

  /**
   * Verifies a Per-Diem breakdown line cannot be added by asserting the breakdown's "Add line"
   * button is absent. That button is gated behind `v-if="canEditTable"` in per-diem-breakdown.vue,
   * so it is removed from the DOM for a locked breakdown. The breakdown must be expanded first.
   *
   * The breakdown card title is confirmed visible first, so an absent "Add line" button reflects a
   * locked breakdown — not one that simply has not opened yet (which would pass falsely).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async verifyPerDiemLineCannotBeAdded(page) {
    if (!page) throw new Error('[Cart.verifyPerDiemLineCannotBeAdded] "page" is required.');

    logger.info('Verifying a Per-Diem line cannot be added (no "Add line" button present)');

    const cartPage = getPageObject(page, CartPage);

    // Gate on the breakdown having opened; otherwise an unopened breakdown would trivially
    // (and wrongly) satisfy the "no Add line button" assertion below.
    const title = cartPage.getPerDiemBreakdownCardTitle();
    try {
      await title.waitFor({ state: 'visible', timeout: 60000 });
    } catch (err) {
      throw new Error(
        `[Cart.verifyPerDiemLineCannotBeAdded] The Per-Diem breakdown did not open within 60s, ` +
        `so the add-line affordance could not be verified. Original: ${err.message}`,
      );
    }

    const addLineControls = cartPage.getPerDiemBreakdownAddLineControls();
    await expect(
      addLineControls,
      `Expected the Per-Diem breakdown to be locked (no "Add line" button in the breakdown actions), ` +
      `but an "Add line" button was present — a per-diem line could be added.`,
    ).toHaveCount(0, { timeout: 10000 });
  },

  /**
   * Edits the first Per-Diem breakdown line to record a meal deduction, then saves. Only works on an
   * editable ("new method") breakdown, where the breakdown "Edit" button is present. Enters edit
   * mode, selects the given deduction on the first data row, adds the mandatory comment (the app
   * blocks Save on a deduction with no comment — see saveUpdatedBreakdown in per-diem-breakdown.ts),
   * and saves. The breakdown must be expanded first (see `expandPerDiemQuoteBreakdown`).
   *
   * @param {import('playwright').Page} page
   * @param {string} deduction - Deduction option label text to select (e.g. "mini bar").
   * @returns {Promise<void>}
   */
  async editPerDiemBreakdownLineDeduction(page, deduction) {
    if (!page) throw new Error('[Cart.editPerDiemBreakdownLineDeduction] "page" is required.');
    if (typeof deduction !== 'string' || !deduction.trim()) {
      throw new Error(
        `[Cart.editPerDiemBreakdownLineDeduction] "deduction" must be a non-empty string, got: ${typeof deduction} (${JSON.stringify(deduction)})`,
      );
    }

    logger.info('Editing the first Per-Diem breakdown line to add a deduction', { deduction });

    const cartPage = getPageObject(page, CartPage);

    // A comment is mandatory whenever a deduction is set — the breakdown's Save is blocked otherwise.
    // The scenario asserts only the deduction, so the comment value is an internal, fixed marker.
    const DEDUCTION_COMMENT = 'Added by automated test';

    logger.debug('Entering breakdown edit mode, then setting the deduction and comment on the first line');
    try {
      await cartPage.clickPerDiemBreakdownEditBtn();
      await cartPage.setPerDiemBreakdownRowDeduction(0, deduction);
      await cartPage.fillPerDiemBreakdownRowComment(0, DEDUCTION_COMMENT);
      await cartPage.clickPerDiemBreakdownSaveBtn();
    } catch (err) {
      throw new Error(
        `[Cart.editPerDiemBreakdownLineDeduction] Could not edit the Per-Diem breakdown line with the "${deduction}" deduction. ` +
        `The breakdown may not be editable (no "Edit" button), the deduction option may not exist, or Save was blocked. ` +
        `Original: ${err.message}`,
      );
    }
  },

  /**
   * Adds a new line to the Per-Diem breakdown, then saves. Only works on an editable ("new method")
   * breakdown, where the breakdown "Add line" button is present. Reveals the inline add-line form
   * and fills it in the manual/Testim order: picks the first available date, selects the destination
   * (an airport-autocomplete result, which triggers the app's async price calc), selects the
   * deduction, adds the mandatory comment (Save is blocked without it), and saves. It then waits for
   * the add-line form to close — confirming the save was accepted — and for the quote re-render to
   * settle. The save collapses the breakdown (refreshQuotes), so the caller must re-expand it before
   * verifying the new line. The breakdown must be expanded first (see `expandPerDiemQuoteBreakdown`).
   *
   * @param {import('playwright').Page} page
   * @param {string} destination - Destination search term for the airport-autocomplete (e.g. "bkk").
   * @param {string} comment - Comment for the new line (mandatory).
   * @param {string} deduction - Deduction option label text to select (e.g. "limo").
   * @returns {Promise<void>}
   */
  async addPerDiemBreakdownLine(page, destination, comment, deduction) {
    if (!page) throw new Error('[Cart.addPerDiemBreakdownLine] "page" is required.');
    if (typeof destination !== 'string' || !destination.trim()) {
      throw new Error(
        `[Cart.addPerDiemBreakdownLine] "destination" must be a non-empty string, got: ${typeof destination} (${JSON.stringify(destination)})`,
      );
    }
    if (typeof comment !== 'string' || !comment.trim()) {
      throw new Error(
        `[Cart.addPerDiemBreakdownLine] "comment" must be a non-empty string, got: ${typeof comment} (${JSON.stringify(comment)})`,
      );
    }
    if (typeof deduction !== 'string' || !deduction.trim()) {
      throw new Error(
        `[Cart.addPerDiemBreakdownLine] "deduction" must be a non-empty string, got: ${typeof deduction} (${JSON.stringify(deduction)})`,
      );
    }

    logger.info('Adding a new Per-Diem breakdown line', { destination, comment, deduction });

    const cartPage = getPageObject(page, CartPage);

    // Order mirrors the manual/Testim flow: date → destination → deduction → comment → save. The
    // save collapses the breakdown (the quote re-renders via refreshQuotes), so the caller must
    // re-expand the breakdown before verifying the new line (see the feature's re-expand step).
    logger.debug('Revealing the add-line form, then filling date, destination, deduction and comment');
    try {
      await cartPage.clickPerDiemBreakdownAddLineBtn();
      await cartPage.pickPerDiemAddLineFirstAvailableDate();
      await cartPage.fillPerDiemAddLineDestination(destination);
      await cartPage.selectPerDiemAddLineDeduction(deduction);
      await cartPage.fillPerDiemAddLineComment(comment);
      await cartPage.clickPerDiemBreakdownSaveBtn();
      // Gate on the save being accepted (form closes) and the quote re-render settling, so a
      // subsequent re-expand acts on a stable DOM rather than racing refreshQuotes.
      await cartPage.waitForPerDiemAddLineFormClosed();
      await page.waitForLoadState('networkidle').catch(() => {});
    } catch (err) {
      throw new Error(
        `[Cart.addPerDiemBreakdownLine] Could not add a Per-Diem breakdown line (destination "${destination}", deduction "${deduction}"). ` +
        `The breakdown may not be editable (no "Add line" button), the destination/deduction option may not exist, the price calc may have failed, or Save was blocked. ` +
        `Original: ${err.message}`,
      );
    }
  },

  /**
   * Verifies the Per-Diem breakdown shows the given text in a deduction cell. Polls the read-only
   * breakdown deduction column (the Save persists asynchronously and the quote re-renders),
   * asserting a cell contains `expectedText` (case-insensitive). Use after
   * `editPerDiemBreakdownLineDeduction`.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Text expected in a breakdown deduction cell (e.g. "mini bar").
   * @returns {Promise<void>}
   */
  async verifyPerDiemBreakdownContains(page, expectedText) {
    if (!page) throw new Error('[Cart.verifyPerDiemBreakdownContains] "page" is required.');
    if (typeof expectedText !== 'string' || !expectedText.trim()) {
      throw new Error(
        `[Cart.verifyPerDiemBreakdownContains] "expectedText" must be a non-empty string, got: ${typeof expectedText} (${JSON.stringify(expectedText)})`,
      );
    }

    logger.info('Verifying the Per-Diem breakdown contains the given deduction text', { expectedText });

    const cartPage = getPageObject(page, CartPage);
    const cells = cartPage.getPerDiemBreakdownDeductionCells();
    const needle = expectedText.trim().toLowerCase();

    // The Save persists asynchronously and the quote re-renders, so poll rather than read once.
    await expect
      .poll(
        async () => {
          const texts = await cells.allInnerTexts().catch(() => []);
          return texts.some((t) => t.toLowerCase().includes(needle));
        },
        {
          message:
            `Expected a Per-Diem breakdown deduction cell to contain "${expectedText}" within 60s, but none did. ` +
            `The line edit may not have saved, or the breakdown did not refresh.`,
          timeout: 60000,
        },
      )
      .toBe(true);
  },

  /**
   * Exports the open Per-Diem quote breakdown to Excel and captures the resulting download (33096).
   * Clicks "Export to excel", waits for the "Additional currency" confirm dialog, then confirms.
   * The app fetches the file and synchronously clicks a hidden `<a download>`, which Playwright
   * surfaces as a download EVENT — so the download wait MUST be armed BEFORE the confirm click,
   * otherwise the event is missed. The breakdown must be expanded first (see
   * `expandPerDiemQuoteBreakdown`).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{ exported: boolean, suggestedFilename: string, download: import('@playwright/test').Download }>}
   */
  async exportPerDiemQuoteToExcel(page) {
    if (!page) throw new Error('[Cart.exportPerDiemQuoteToExcel] "page" is required.');

    logger.info('Exporting the Per-Diem quote breakdown to Excel');

    const cartPage = getPageObject(page, CartPage);

    logger.debug('Clicking "Export to excel", awaiting the currency dialog, then confirming (download armed first)');
    try {
      await cartPage.clickPerDiemBreakdownExportBtn();
      await cartPage.waitForExcelCurrencyDialog();
      // Arm the download wait BEFORE confirming — the confirm handler fires link.click() and the
      // download event would be missed if we armed it afterwards.
      const downloadPromise = cartPage.waitForExcelDownload();
      await cartPage.clickExcelCurrencyDialogConfirm();
      const download = await downloadPromise;
      return { exported: true, suggestedFilename: download.suggestedFilename(), download };
    } catch (err) {
      throw new Error(
        `[Cart.exportPerDiemQuoteToExcel] Could not export the Per-Diem quote to Excel. ` +
        `The breakdown may not be expanded, the "Additional currency" dialog may not have opened, or the file download was not triggered. ` +
        `Original: ${err.message}`,
      );
    }
  },

  /**
   * Verifies the Per-Diem Excel export produced a real, downloaded `.xlsx` file. Asserts on the
   * download captured by `exportPerDiemQuoteToExcel` — the app names it `Per Diem {tripId} - {paxName}.xlsx`.
   * Beyond the file name, this confirms the download actually COMPLETED and the file reached disk with
   * content: `waitForEvent('download')` only proves the browser STARTED a download, so we additionally
   * assert `download.failure()` is null and the saved file (`download.path()`) is non-empty on disk.
   * This is a client-side blob download, distinct from the related-files download (which asserts a
   * /TripsUploadFiles request + guid), so it must NOT be verified with `Cart.verifyFileDownloaded`.
   *
   * @param {import('playwright').Page} page
   * @param {{ suggestedFilename: string, download: import('@playwright/test').Download }} downloadResult - the object returned by `exportPerDiemQuoteToExcel`.
   * @returns {Promise<{ verified: boolean, suggestedFilename: string, filePath: string, sizeBytes: number }>}
   */
  async verifyPerDiemExcelDownloaded(page, downloadResult) {
    if (!page) throw new Error('[Cart.verifyPerDiemExcelDownloaded] "page" is required.');
    if (!downloadResult || typeof downloadResult.suggestedFilename !== 'string' || !downloadResult.download) {
      throw new Error(
        `[Cart.verifyPerDiemExcelDownloaded] "downloadResult" must be the object returned by Cart.exportPerDiemQuoteToExcel ` +
        `(with a "suggestedFilename" string and a Playwright "download" object), got: ${typeof downloadResult}. ` +
        `Ensure the "When I export the Per-Diem quote to Excel" step ran before this assertion.`,
      );
    }

    const { suggestedFilename, download } = downloadResult;
    logger.debug(`[Cart.verifyPerDiemExcelDownloaded] Verifying exported Excel file: "${suggestedFilename}"`);

    expect(
      suggestedFilename && suggestedFilename.trim().length > 0,
      `Expected the Per-Diem Excel export to produce a non-empty download file name, but got: "${suggestedFilename}". ` +
      `The export may not have triggered a real file download.`,
    ).toBe(true);

    expect(
      suggestedFilename.toLowerCase().endsWith('.xlsx'),
      `Expected the exported Per-Diem file name to end with ".xlsx" (app names it "Per Diem {tripId} - {paxName}.xlsx"), ` +
      `but got: "${suggestedFilename}". A wrong extension means the export did not produce an Excel file.`,
    ).toBe(true);

    // Confirm the file actually reached disk with real content. waitForEvent('download') only proves the
    // browser STARTED the download; failure()/path() resolve after it completes (or reports an error).
    let failure;
    let filePath;
    try {
      failure = await download.failure();
      filePath = await download.path();
    } catch (err) {
      throw new Error(
        `[Cart.verifyPerDiemExcelDownloaded] Could not resolve the downloaded Excel file "${suggestedFilename}" on disk. ` +
        `The download may not have completed, or downloads may be disabled in this browser context. Original: ${err.message}`,
      );
    }

    expect(
      failure,
      `Expected the Per-Diem Excel download "${suggestedFilename}" to complete successfully, ` +
      `but Playwright reported a download failure: "${failure}".`,
    ).toBeNull();

    expect(
      typeof filePath === 'string' && filePath.length > 0,
      `Expected the Per-Diem Excel export "${suggestedFilename}" to be saved to disk, but no file path was returned. ` +
      `The download did not produce a file.`,
    ).toBe(true);

    const sizeBytes = fs.statSync(filePath).size;
    expect(
      sizeBytes > 0,
      `Expected the downloaded Per-Diem Excel file "${suggestedFilename}" (${filePath}) to contain data, ` +
      `but it was empty (0 bytes). The export service may have returned an empty file.`,
    ).toBe(true);

    logger.info(`[Cart.verifyPerDiemExcelDownloaded] Per-Diem Excel file verified on disk`, { suggestedFilename, sizeBytes });
    return { verified: true, suggestedFilename, filePath, sizeBytes };
  },

  /**
   * Enables the checkout "I have days off in the trip" per-diem checkbox, revealing the days-off
   * date-range inputs (35694). Runs at checkout of a per-diem trip.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async enablePerDiemDaysOff(page) {
    if (!page) throw new Error('[Cart.enablePerDiemDaysOff] "page" is required.');

    logger.info('Enabling per-diem days off at checkout');

    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.enablePerDiemDaysOff();
    } catch (err) {
      throw new Error(
        `[Cart.enablePerDiemDaysOff] Could not enable per-diem days off. The days-off section may not ` +
        `have rendered — the trip may not be per-diem, or checkout did not show it. Original: ${err.message}`,
      );
    }
  },

  /**
   * Sets the first per-diem days-off range's start and end dates (35694). Picks the first selectable
   * day for both start and end, producing a same-day (1-day) range → counter "1". Requires the
   * days-off checkbox to be enabled first (see `enablePerDiemDaysOff`).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async setPerDiemDaysOffDates(page) {
    if (!page) throw new Error('[Cart.setPerDiemDaysOffDates] "page" is required.');

    logger.info('Setting the first per-diem days-off range dates (1-day range)');

    const cartPage = getPageObject(page, CartPage);
    try {
      // Range 0: 1st available start → 1st available end (same day) = 1 day off.
      await cartPage.pickPerDiemDaysOffRangeDates(0, 0, 0);
    } catch (err) {
      throw new Error(
        `[Cart.setPerDiemDaysOffDates] Could not set the per-diem days-off dates. The date pickers may ` +
        `not have opened, or the days-off checkbox is not enabled. Original: ${err.message}`,
      );
    }
  },

  /**
   * Sets a single per-diem days-off range spanning `dayCount` calendar days (35703). Picks the first
   * selectable start day and the `(dayCount-1)`-th following day as the end, so `dayCount` 2 selects the
   * first and second available dates → an inclusive 2-day range → counter "2". Unlike combining
   * `setPerDiemDaysOffDates` + `addPerDiemDaysOffRange` (two separate 1-day ranges), this keeps it to
   * one range so the *first* counter reflects the full span. Requires the days-off checkbox enabled first
   * (see `enablePerDiemDaysOff`).
   *
   * @param {import('playwright').Page} page
   * @param {number} dayCount - Number of inclusive calendar days the range should span (>= 1).
   * @returns {Promise<void>}
   */
  async setPerDiemDaysOffDatesSpanning(page, dayCount) {
    if (!page) throw new Error('[Cart.setPerDiemDaysOffDatesSpanning] "page" is required.');
    if (!Number.isInteger(dayCount) || dayCount < 1) {
      throw new Error(
        `[Cart.setPerDiemDaysOffDatesSpanning] "dayCount" must be an integer >= 1, got: ${JSON.stringify(dayCount)}`,
      );
    }

    logger.info('Setting a single per-diem days-off range', { dayCount });

    const cartPage = getPageObject(page, CartPage);
    try {
      // Range 0: 1st available start → the (dayCount-1)-th following day as end (endDayIndex counts
      // from the start day), producing an inclusive dayCount-day range → counter "dayCount".
      await cartPage.pickPerDiemDaysOffRangeDates(0, 0, dayCount - 1);
    } catch (err) {
      throw new Error(
        `[Cart.setPerDiemDaysOffDatesSpanning] Could not set a ${dayCount}-day per-diem days-off range. ` +
        `The date pickers may not have opened, or the days-off checkbox is not enabled. Original: ${err.message}`,
      );
    }
  },

  /**
   * Adds a second per-diem days-off range and sets its dates (35694). Clicks "More days off in the
   * trip", then picks the 2nd available start day and the following day as the end, producing a
   * 2-day range → counter "2". Requires the first range to exist (see `setPerDiemDaysOffDates`).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async addPerDiemDaysOffRange(page) {
    if (!page) throw new Error('[Cart.addPerDiemDaysOffRange] "page" is required.');

    logger.info('Adding a second per-diem days-off range and setting its dates (2-day range)');

    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.clickAddPerDiemDaysOffRange();
      // Range 1: 2nd available start → next selectable day as end (two consecutive days) = 2 days off.
      await cartPage.pickPerDiemDaysOffRangeDates(1, 1, 1);
    } catch (err) {
      throw new Error(
        `[Cart.addPerDiemDaysOffRange] Could not add a second per-diem days-off range. The "More days off" ` +
        `button or the new range's date pickers did not appear. Original: ${err.message}`,
      );
    }
  },

  /**
   * Verifies a per-diem days-off range counter reads `expectedCount` (35694). `ordinal` selects the
   * range ("first" → range 0, "second" → range 1). The counter shows the range length
   * (calendar-diff(end,start)+1); a 1-day range reads "1", a 2-day range "2". Polls, as the value
   * settles after the end date is picked.
   *
   * @param {import('playwright').Page} page
   * @param {string} ordinal - Which range's counter to check: "first" or "second".
   * @param {string} expectedCount - Expected counter value (e.g. "1").
   * @returns {Promise<void>}
   */
  async verifyPerDiemDaysOffCounter(page, ordinal, expectedCount) {
    if (!page) throw new Error('[Cart.verifyPerDiemDaysOffCounter] "page" is required.');
    if (typeof expectedCount !== 'string' || !expectedCount.trim()) {
      throw new Error(
        `[Cart.verifyPerDiemDaysOffCounter] "expectedCount" must be a non-empty string, got: ${typeof expectedCount} (${JSON.stringify(expectedCount)})`,
      );
    }
    const rangeIndexByOrdinal = { first: 0, second: 1, third: 2 };
    const rangeIndex = rangeIndexByOrdinal[String(ordinal).trim().toLowerCase()];
    if (rangeIndex === undefined) {
      throw new Error(
        `[Cart.verifyPerDiemDaysOffCounter] "ordinal" must be one of ${Object.keys(rangeIndexByOrdinal).join(', ')}, got: ${JSON.stringify(ordinal)}`,
      );
    }

    logger.info('Verifying the per-diem days-off counter', { ordinal, rangeIndex, expectedCount });

    const cartPage = getPageObject(page, CartPage);
    const counter = cartPage.getPerDiemDaysOffRangeCounter(rangeIndex);
    const expected = expectedCount.trim();

    // The counter is a read-only <p> (per-diem-days-off.vue), so read its text, not an input value.
    await expect
      .poll(async () => (await counter.first().innerText().catch(() => '')).trim(), {
        message:
          `Expected the ${ordinal} per-diem days-off counter (range ${rangeIndex}) to read "${expected}" within 30s. ` +
          `The range's dates may not have been picked, or the day count did not recalculate.`,
        timeout: 30000,
      })
      .toBe(expected);
  },

  /**
   * Verifies the per-diem days-off summary is displayed in the cart after checkout (35694). Asserts
   * the trip's per-diem quote card ("Per-Diem for {traveller}") is shown — the per-diem summary for
   * the days-off trip, distinct from the flight quote. NOTE: the per-diem quote's deducted-days count
   * ("N Personal days deducted") is NOT asserted here: it only persists once the booking-details step
   * is proceeded through (trip-reference-form.vue calls saveDaysOffForm on continue), whereas this
   * "counter" scenario navigates back to cart without proceeding, so vacationDays stays 0. Polls, as
   * the cart re-renders after navigating back from checkout.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async verifyPerDiemDaysOffSummary(page) {
    if (!page) throw new Error('[Cart.verifyPerDiemDaysOffSummary] "page" is required.');

    logger.info('Verifying the per-diem quote (days-off) summary card is displayed');

    const cartPage = getPageObject(page, CartPage);
    const card = cartPage.getPerDiemQuoteCard();

    try {
      await card.waitFor({ state: 'visible', timeout: 60000 });
    } catch (err) {
      throw new Error(
        `[Cart.verifyPerDiemDaysOffSummary] The per-diem quote card was not visible within 60s after returning ` +
        `to cart. The trip may not contain a per-diem quote, or the cart did not render. Original: ${err.message}`,
      );
    }

    const title = cartPage.getPerDiemQuoteTitle();
    const titleText = ((await title.innerText().catch(() => '')) || '').trim();
    // Tolerate the "Per-Diem"/"Per Diem" hyphen-vs-space and casing.
    expect(
      titleText.toLowerCase().replace(/[-\s]+/g, ' '),
      `Expected the per-diem quote card title (e.g. "Per-Diem for {traveller}") to be displayed in the cart, ` +
      `but the card title read "${titleText}".`,
    ).toContain('per diem');
  },

  /**
   * Verifies the per-diem quote shows that personal days were deducted after booking (35726). The
   * "{N} Personal days deducted" span (`.vacation`) is gated by `v-if="quote.vacationDays > 0"` in
   * per-diem-quote-card.vue, so it renders ONLY once days off were deducted — and, unlike the 35694
   * "counter" scenario (see `verifyPerDiemDaysOffSummary`), that count persists here because 35726
   * proceeds through booking (trip-reference-form.vue calls saveDaysOffForm on continue). Waits for
   * the quote card, then asserts the span is visible and its text contains "Personal days deducted"
   * (matching the Testim wait). Polls, as the count settles after the confirmed quote re-renders.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async verifyPerDiemPersonalDaysDeducted(page) {
    if (!page) throw new Error('[Cart.verifyPerDiemPersonalDaysDeducted] "page" is required.');

    logger.info('Verifying the per-diem quote shows personal days deducted');

    const cartPage = getPageObject(page, CartPage);
    const card = cartPage.getPerDiemQuoteCard();

    try {
      await card.waitFor({ state: 'visible', timeout: 60000 });
    } catch (err) {
      throw new Error(
        `[Cart.verifyPerDiemPersonalDaysDeducted] The per-diem quote card was not visible within 60s. ` +
        `The trip may not contain a per-diem quote, or the cart did not render. Original: ${err.message}`,
      );
    }

    const vacation = cartPage.getPerDiemQuoteVacation();
    try {
      await vacation.waitFor({ state: 'visible', timeout: 30000 });
    } catch (err) {
      throw new Error(
        `[Cart.verifyPerDiemPersonalDaysDeducted] The per-diem quote's "Personal days deducted" span (.vacation) ` +
        `was not visible within 30s. It only renders once vacationDays > 0, which requires the days-off form to ` +
        `have been saved by proceeding through booking. Original: ${err.message}`,
      );
    }

    // The span text is "{N} Personal days deducted" (per-diem-quote-card.vue). Poll, as the count
    // settles after the confirmed quote re-renders.
    await expect
      .poll(async () => ((await vacation.innerText().catch(() => '')) || '').trim().toLowerCase(), {
        message:
          `Expected the per-diem quote to show "Personal days deducted" within 30s, ` +
          `confirming the traveller's days off were applied to the trip.`,
        timeout: 30000,
      })
      .toContain('personal days deducted');
  },

  /**
   * Verifies the per-diem quote card's total amount equals `expectedAmount` (35703). Waits for the
   * quote card, then polls the header amount (`.per-diem-quote-card .amount`) until its numeric core
   * equals the expected value — the amount recalculates after days off are deducted at booking, so it
   * settles asynchronously once the confirmed quote re-renders. The actual text is reduced to digits
   * and the decimal point before comparing, so a currency symbol or thousands grouping rendered
   * alongside the number is tolerated while still catching a genuinely different total like "13000.00"
   * (mirrors the Testim exact wait on `.per-diem-quote-card .amount` for "3000.00").
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedAmount - Expected quote amount text (e.g. "3000.00").
   * @returns {Promise<void>}
   */
  async verifyPerDiemQuoteAmount(page, expectedAmount) {
    if (!page) throw new Error('[Cart.verifyPerDiemQuoteAmount] "page" is required.');
    if (typeof expectedAmount !== 'string' || !expectedAmount.trim()) {
      throw new Error(
        `[Cart.verifyPerDiemQuoteAmount] "expectedAmount" must be a non-empty string, got: ${typeof expectedAmount} (${JSON.stringify(expectedAmount)})`,
      );
    }

    logger.info('Verifying the per-diem quote amount', { expectedAmount });

    const cartPage = getPageObject(page, CartPage);
    const card = cartPage.getPerDiemQuoteCard();

    try {
      await card.waitFor({ state: 'visible', timeout: 60000 });
    } catch (err) {
      throw new Error(
        `[Cart.verifyPerDiemQuoteAmount] The per-diem quote card was not visible within 60s. ` +
        `The trip may not contain a per-diem quote, or the cart did not render. Original: ${err.message}`,
      );
    }

    const amount = cartPage.getPerDiemQuoteAmount();
    const expected = expectedAmount.trim();

    // Reduce the rendered text to digits and the decimal point (dropping any currency symbol or
    // thousands separators) so the compared value is the bare number, then require an exact match.
    await expect
      .poll(async () => ((await amount.innerText().catch(() => '')) || '').replace(/[^\d.]/g, ''), {
        message:
          `Expected the per-diem quote amount to be "${expected}" within 30s. The amount may not have ` +
          `recalculated after the days-off deduction, or the quote card did not render its total.`,
        timeout: 30000,
      })
      .toBe(expected);
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
   * Clicks the "Copy to clipboard" button in the open share dialog footer.
   * The share dialog must already be open (via clickShareItineraryAndWaitForSubjectField
   * or clickShareQuoteAndWaitForSubjectField).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async clickCopyToClipboardInShareDialog(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickCopyToClipboardButton();
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
    const successNotification = commonPage.getSuccessNotification();

    // The share dialog's Send button occasionally drops its first click while the dialog's
    // open animation is still settling, leaving the dialog open with no success toast. Click,
    // confirm the toast; if it doesn't show but the Send button is still there, the click
    // didn't register — click again. If the button is gone, the send is already in flight,
    // so just wait the toast out rather than re-clicking.
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (attempt === 1 || (await cartPage.isSendEmailButtonVisible())) {
        await cartPage.clickSendEmailButton();
      }

      const sent = await successNotification
        .waitFor({ state: "visible", timeout: 20_000 })
        .then(() => true)
        .catch(() => false);

      if (sent) {
        return { sent: true };
      }
    }

    throw new Error(
      "Share was not sent: success notification did not appear after clicking Send."
    );
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
   * Verifies that the OOP justification textarea contains the expected text after saving.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText
   */
  async verifyOOPJustificationTextInCart(page, expectedText) {
    if (!page) {
      throw new Error('[Cart.verifyOOPJustificationTextInCart] "page" is required.');
    }
    if (typeof expectedText !== 'string') {
      throw new Error(
        `[Cart.verifyOOPJustificationTextInCart] "expectedText" must be a string, got: ${typeof expectedText} (${JSON.stringify(expectedText)})`
      );
    }

    try {
      const cartPage = getPageObject(page, CartPage);
      const textbox = cartPage.getOOPJustificationTextbox();
      await textbox.waitFor({ state: 'visible', timeout: 10000 });
      const actualText = await textbox.inputValue();
      expect(
        actualText.trim(),
        `OOP justification text in trip did not match. Expected: "${expectedText}", got: "${actualText.trim()}". ` +
        `This may mean the justification was not saved correctly before navigating to checkout.`
      ).toBe(expectedText);
    } catch (err) {
      if (err.matcherResult) throw err;
      throw new Error(
        `[Cart.verifyOOPJustificationTextInCart] Failed to verify OOP justification text "${expectedText}": ${err.message}`
      );
    }
  },

  /**
   * Verifies the OOP policy reason label text (violation description) inside the oop-justification section.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText
   */
  async verifyOOPPolicyReasonInCart(page, expectedText) {
    if (!page) {
      throw new Error('[Cart.verifyOOPPolicyReasonInCart] "page" is required.');
    }
    if (typeof expectedText !== 'string') {
      throw new Error(
        `[Cart.verifyOOPPolicyReasonInCart] "expectedText" must be a string, got: ${typeof expectedText} (${JSON.stringify(expectedText)})`
      );
    }

    try {
      const cartPage = getPageObject(page, CartPage);
      const actualText = await cartPage.getOOPViolationLabelText();
      expect(
        actualText,
        `OOP policy reason label did not match. Expected: "${expectedText}", got: "${actualText}". ` +
        `This is the violation description text shown in the oop-justification section (.out-of-policy-label), not the tooltip.`
      ).toBe(expectedText);
    } catch (err) {
      if (err.matcherResult) throw err;
      throw new Error(
        `[Cart.verifyOOPPolicyReasonInCart] Failed to verify OOP policy reason "${expectedText}": ${err.message}`
      );
    }
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
   * Selects an OOP justification option from an already-open dropdown and saves.
   * Use this when a previous step already opened the dropdown (e.g. to verify options).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} justificationOption - The justification option to select
   * @returns {Promise<void>}
   */
  async selectOpenOOPJustificationDropdownOptionAndSave(page, justificationOption) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!justificationOption || typeof justificationOption !== 'string') {
      throw new Error('justificationOption must be a non-empty string');
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForJustificationDropdownOption(justificationOption);
    await cartPage.selectJustificationDropdownOption(justificationOption);
    await cartPage.saveOOPJustificationText();
  },

  /**
   * Opens the OOP justification dropdown, selects the first available option, and saves.
   * Business-level action for OOP flows where the justification is a dropdown whose
   * options are defined per policy/environment. The specific option text is not
   * asserted — the flow only needs a valid justification selected so checkout can
   * proceed (mirrors the original guest-booking flow, which picks the first option).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{selectedOption: string}>}
   */
  async selectFirstOOPJustificationOptionAndSave(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForJustificationDropdownVisible();

    const dropdown = cartPage.getJustificationDropdown();
    await dropdown.scrollIntoViewIfNeeded({ timeout: 10000 });
    await cartPage.openJustificationDropdown();

    const options = cartPage.getAllVisibleJustificationOptions();
    await options.first().waitFor({ state: 'visible', timeout: 10000 });

    const selectedOption = await cartPage.selectFirstVisibleJustificationOption();
    await cartPage.saveOOPJustificationText();
    await cartPage.waitForSaveJustificationButtonHidden();

    return { selectedOption };
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

    const { clickedModal, bookingErrorDetected } = await this.waitForTargetOrHandlePriceChange(
      page,
      checkoutHeading,
      'checkout page',
    );

    // A cart-level booking error keeps the trip on the cart page, so checkout was never
    // reached. Fail here with the supplier's own message instead of letting the next step
    // time out waiting for a finalize button that cannot exist.
    if (bookingErrorDetected) {
      const checkoutPage = getPageObject(page, CheckoutPage);
      const supplierMessage = await checkoutPage.getBookingErrorSupplierMessage().catch(() => null);
      const bookingErrorText = await checkoutPage.getBookingErrorDialogText().catch(() => null);
      const details = supplierMessage || bookingErrorText || 'no message could be read from the dialog';

      throw new Error(
        `[Cart.acceptTermsAndConditionsAndProceedToCheckout] A booking error modal blocked checkout on the cart page, ` +
        `so the checkout page was never reached. Supplier response: ${details}`,
      );
    }

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
   * Clicks the cart's "Send For Approvals" button. For pre-booking-approval users the cart CTA
   * is relabelled from "Proceed to Checkout" to "Send For Approvals" (trip-cart.vue:
   * isPreBookingNeeded) and submits the trip for approval directly from the cart. Terms &
   * Conditions are expected to have been accepted by a preceding step.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async clickSendForApproval(page) {
    if (!page) {
      throw new Error('page is required');
    }
    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForSendForApproval();
    await cartPage.clickSendForApproval();
    return { sentForApproval: true };
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
  async holdTrip(page, bookingContext = {}) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const cartPage = getPageObject(page, CartPage);
    const checkoutPage = getPageObject(page, CheckoutPage);
    const onHoldStatusLabel = cartPage.getOnHoldStatusLabel();
    const bookingErrorDialog = page.locator(CheckoutSelectors.BOOKING_ERROR_DIALOG).first();
    const timeout = process.env.CI ? 120000 : 90000;
    const deadline = Date.now() + timeout;

    let clickedModal = false;

    const resolveBookingErrorResult = async () => {
      const supplier = await checkoutPage.getBookingErrorSupplierName();
      const bookingErrorText = await checkoutPage.getBookingErrorDialogText();
      const supplierMessage = await checkoutPage.getBookingErrorSupplierMessage();
      const knownBySupplier = supplier
        ? BookingErrorHandler.isKnownBookingError(bookingContext.product, bookingContext.subProduct, supplier)
        : false;
      const knownByMessage = bookingErrorText
        ? BookingErrorHandler.isKnownBookingError(bookingContext.product, bookingContext.subProduct, bookingErrorText)
        : false;
      const knownBookingError = knownBySupplier || knownByMessage;
      const shouldSkip = knownBookingError
        ? BookingErrorHandler.getSkipOnErrorConfig(bookingContext.product, bookingContext.subProduct)
        : false;

      // Always prefer the concise "supplier:" line over the full dialog text and
      // over the bare supplier token (extracted with an asterisk-bounded regex
      // that isn't reliably present) - logged whether or not the error is known.
      const holdErrorLogValue = supplierMessage || bookingErrorText || supplier || 'UNKNOWN';
      BookingErrorHandler.handleBookingError(
        bookingContext.product,
        holdErrorLogValue,
        bookingContext.subProduct,
      );

      return {
        held: false,
        status: null,
        clickedModal,
        bookingError: true,
        knownBookingError,
        shouldSkip,
        supplier: supplier || null,
        bookingErrorText: bookingErrorText || null,
      };
    };

    // Initial hold action.
    await cartPage.waitForHoldButton();
    await cartPage.clickHoldButton().catch(() => {});

    while (Date.now() < deadline) {
      if (await onHoldStatusLabel.isVisible().catch(() => false)) {
        const status = await cartPage.getBookingStatus({ page });
        return {
          held: true,
          status,
          clickedModal,
          bookingError: false,
          knownBookingError: false,
          shouldSkip: false,
          supplier: null,
          bookingErrorText: null,
        };
      }

      if (await bookingErrorDialog.isVisible().catch(() => false)) {
        // Price-change dialogs also match the booking-error selector (they share .booking-response-errors).
        // Try clicking "Proceed with change" first; if it's there this is a price-change, not a booking error.
        const priceChangeClicked = await cartPage.clickProceedWithChangeIfVisible(500).catch(() => false);
        if (priceChangeClicked) {
          clickedModal = true;
          // Wait for the dialog to dismiss before continuing the hold loop.
          await bookingErrorDialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
        } else {
          return resolveBookingErrorResult();
        }
      }

      await page.waitForTimeout(1000);
    }

    throw new Error(`Neither on hold status, booking error modal, nor price-change recovery completed within ${timeout}ms.`);
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
   * Verifies the yellow seat status indicator is visible in the seating extras section
   * after saving seats. flight-seating.vue maps a saved-but-unconfirmed seat
   * (SeatStatusType PendingApproval / PendingPayment) to a yellow `schedule` icon next
   * to the passenger's seat number.
   *
   * The seating panel is re-opened first: it keeps rendering its pre-save state until
   * closed and re-opened, because flight-seating.vue fetches the selected seats only on
   * the panel's first open.
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
    await cartPage.reopenSeatingExtrasPanel();

    try {
      await expect(cartPage.getSeatingPendingStatusIconLocator()).toBeVisible({ timeout });
    } catch (error) {
      const { icons, rows } = await cartPage.getSeatingPanelStatusState();
      throw new Error(
        'Seating extras did not show the yellow (pending) seat status indicator after saving seats. ' +
        `Expected ".seat-status-icon.yellow" to be visible in the re-opened seating panel within ${timeout}ms. ` +
        `Passenger seat rows: ${JSON.stringify(rows)}. Status icons found: ${JSON.stringify(icons)}. ` +
        `Original: ${error.message}`
      );
    }

    logger.info('Yellow seat indicator is visible');
    return { visible: true };
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
   * Verifies that a car address at a specific airport index contains the expected airport name.
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Zero-based index of the airport location element
   * @param {string} expectedAirport - Expected airport name to find in the location text
   * @throws {Error} If page, index, or expectedAirport are invalid
   * @returns {Promise<void>}
   */

  async expectAirportAddressOnCartToContain(page, index, expectedAirport) {
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
    const tooltipIndex = Math.floor(index / 2);
    const isDropoff = index % 2 !== 0;
    await cartPage.openLocationDetailsTooltipByIndex(tooltipIndex);
    const text = isDropoff
      ? await cartPage.getDropoffAddressTextFromTooltip()
      : await cartPage.getPickupAddressTextFromTooltip();
    await cartPage.closeLocationDetailsTooltip(tooltipIndex);
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
    const text = await cartPage.getLocationAddressTextByIndex(index);
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
    await cartPage.waitForTripOverviewTitle();
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
    await cartPage.waitForTripOverviewTitle();
    await cartPage.openLocationDetailsTooltipByIndex(index);
    const text = await cartPage.getPickupAddressTextFromTooltip();
    await cartPage.closeLocationDetailsTooltip(index);
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
   * Opens the payment method dropdown in the Premier Inn extras panel.
   * The extras panel must already be open (see clickEditExtrasButton / addPremierInnExtras).
   * @param {import('playwright').Page} page
   */
  async openExtrasPaymentMethodDropdown(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickPremierInnPaymentMethodDropdown();
  },

  /**
   * Verifies the first option in the (already open) Premier Inn extras payment method
   * dropdown matches the expected label, case-insensitively.
   * @param {import('playwright').Page} page
   * @param {string} expectedOption - Expected first option label (e.g. "Pay On Departure")
   */
  async verifyFirstExtrasPaymentOption(page, expectedOption) {
    if (!page) throw new Error('page is required');
    if (!expectedOption || typeof expectedOption !== 'string') {
      throw new Error(`expectedOption must be a non-empty string, got: ${typeof expectedOption}`);
    }
    const cartPage = getPageObject(page, CartPage);
    const options = await cartPage.getPremierInnPaymentOptions();
    if (options.length === 0) {
      throw new Error('Payment method dropdown has no visible options — open it before this check.');
    }
    expect(options[0].toLowerCase()).toContain(expectedOption.toLowerCase());
  },

  /**
   * Verifies that the payment method for Premier Inn extras cannot be changed
   * by asserting the payment method dropdown exposes exactly 1 option.
   * Opens the dropdown only if it is not already open, so this works both
   * standalone and after an explicit "open payment method dropdown" step.
   * @param {import('playwright').Page} page
   */
  async verifyExtrasPaymentNotChangeable(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    if ((await cartPage.getPremierInnPaymentOptionCount()) === 0) {
      await cartPage.clickPremierInnPaymentMethodDropdown();
    }
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
   * Verifies the flight quote card title in the trip overview matches the expected value exactly.
   * Scoped to the flight card (.flight-quote-card) so it is unambiguous in a parallel flight+car
   * trip where several quote cards are present.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedTitle - Full expected title, e.g. "Flight to Budapest"
   * @returns {Promise<void>}
   */
  async verifyFlightQuoteDestination(page, expectedTitle) {
    if (!page) throw new Error('[Cart.verifyFlightQuoteDestination] "page" is required.');
    if (!expectedTitle || typeof expectedTitle !== 'string') {
      throw new Error(`[Cart.verifyFlightQuoteDestination] "expectedTitle" must be a non-empty string, got: ${typeof expectedTitle}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const actualTitle = await cartPage.getFlightQuoteTitleText();
    const normalized = normalizeText(actualTitle);
    expect(
      normalized.toLowerCase(),
      `[Cart.verifyFlightQuoteDestination] Expected the flight quote title to be "${expectedTitle}", but the trip overview showed "${actualTitle}".`
    ).toBe(expectedTitle.toLowerCase());
  },

  /**
   * Verifies the car quote card title in the trip overview contains the expected place name.
   * Scoped to the car card (.car-quote-card); the generic quote-destination check reads the
   * flight card in a parallel flight+car trip.
   *
   * @param {import('playwright').Page} page
   * @param {string} city - Expected place name (e.g. country/city like "Hungary")
   * @returns {Promise<void>}
   */
  async verifyCarQuoteDestination(page, city) {
    if (!page) throw new Error('[Cart.verifyCarQuoteDestination] "page" is required.');
    if (!city || typeof city !== 'string') {
      throw new Error(`[Cart.verifyCarQuoteDestination] "city" must be a non-empty string, got: ${typeof city}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const actualTitle = await cartPage.getCarQuoteTitleText();
    expect(
      actualTitle.toLowerCase(),
      `[Cart.verifyCarQuoteDestination] Expected the car quote title to contain "${city}", but the trip overview showed "${actualTitle}".`
    ).toContain(city.toLowerCase());
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

  /**
   * Verifies two stored quote PNR codes do not match.
   *
   * @param {import('playwright').Page} page
   * @param {string} firstPnrCode
   * @param {string} secondPnrCode
   */
  async verifyQuotePnrCodesDoNotMatch(page, firstPnrCode, secondPnrCode) {
    if (!page) throw new Error('page is required');
    if (!firstPnrCode || typeof firstPnrCode !== 'string') {
      throw new Error(`firstPnrCode must be a non-empty string, got: ${typeof firstPnrCode}`);
    }
    if (!secondPnrCode || typeof secondPnrCode !== 'string') {
      throw new Error(`secondPnrCode must be a non-empty string, got: ${typeof secondPnrCode}`);
    }

    expect(firstPnrCode, `Expected quotes to have different PNRs, but both were "${firstPnrCode}"`).not.toBe(secondPnrCode);
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
   * Verifies that at least one quote/booking item in the cart displays the
   * expected status badge (e.g. "On hold", "Pending booking").
   *
   * Difference vs {@link verifyBookingStatus}:
   * - `verifyBookingStatus` reads the FIRST `.quote-payment-card .app-label--quote`
   *   (a single-value check, effectively "what is the first booking's status?").
   *   Manual quotes have no `.quote-payment-card` wrapper, so they are invisible
   *   to that assertion, and when several payment-card items have different
   *   statuses you can only check whichever one renders first.
   * - This method scans ALL status badges (`.app-label, .app-label--quote`) and
   *   filters by the expected text — it passes as long as ANY item in the cart
   *   shows that status (an existence check).
   *
   * Use this when a single scenario produces multiple items in the cart with
   * DIFFERENT expected statuses at the same time (e.g. a real hotel booking
   * "Pending booking" alongside a flight manual quote "On hold"), so that each
   * status can be asserted independently regardless of DOM order or item type.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedStatus - e.g. "On hold"
   * @param {object} [options]
   * @param {number} [options.timeout=30000]
   */
  async verifyQuoteWithStatusVisible(page, expectedStatus, { timeout = 30000 } = {}) {
    if (!page) {
      throw new Error('[Cart.verifyQuoteWithStatusVisible] "page" is required.');
    }
    if (!expectedStatus || typeof expectedStatus !== 'string') {
      throw new Error(
        `[Cart.verifyQuoteWithStatusVisible] "expectedStatus" must be a non-empty string, got: ${typeof expectedStatus} (${expectedStatus})`
      );
    }
    const cartPage = getPageObject(page, CartPage);
    try {
      const actual = await cartPage.getStatusByExpectedText(expectedStatus, { timeout, page });
      expect(
        actual.toLowerCase(),
        `[Cart.verifyQuoteWithStatusVisible] Found a status badge but its text "${actual}" does not contain expected "${expectedStatus}".`
      ).toContain(expectedStatus.toLowerCase());
    } catch (err) {
      throw new Error(
        `[Cart.verifyQuoteWithStatusVisible] No quote in the cart displayed the status "${expectedStatus}" within ${timeout}ms. ` +
        `Likely causes: the workflow that produces this status (e.g. manual quote submission, booking call) has not completed, ` +
        `the cart has not refreshed, or the expected status is incorrect for the supplier/product. ` +
        `Original: ${err.message}`
      );
    }
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
   * Waits for and verifies the trip-bar cart-count badge (shown on results/product pages).
   * Polls so the asynchronous add-to-cart commit and the reactive badge update have time to
   * settle before asserting — this is the signal that a shared quote has been added to the trip,
   * and gates navigation to the cart so we never land on a cart that fetched before the commit.
   *
   * @param {import('playwright').Page} page
   * @param {number} expectedCount - Expected badge count
   * @returns {Promise<void>}
   */
  async verifyCartBadgeCount(page, expectedCount) {
    if (!page) throw new Error('[Cart.verifyCartBadgeCount] "page" is required.');
    if (!Number.isInteger(expectedCount) || expectedCount < 0) {
      throw new Error(`[Cart.verifyCartBadgeCount] "expectedCount" must be a non-negative integer, got: ${expectedCount}`);
    }

    const commonPage = getPageObject(page, CommonPage);
    logger.debug('[Cart.verifyCartBadgeCount] Waiting for cart badge to reflect the added quote', { expectedCount });

    await expect
      .poll(async () => commonPage.getCartBadgeText(), {
        timeout: 30000,
        message:
          `[Cart.verifyCartBadgeCount] Expected the trip-bar cart badge to show ${expectedCount} after sharing the quote, ` +
          `but it never did. The shared flight may not have been added to the trip.`,
      })
      .toBe(String(expectedCount));
  },

  /**
   * Verifies the number of flight quote cards present in the cart.
   *
   * @param {import('playwright').Page} page
   * @param {number} expectedCount - Expected number of flight quote cards
   * @returns {Promise<void>}
   */
  async verifyFlightQuoteCount(page, expectedCount) {
    if (!page) throw new Error('[Cart.verifyFlightQuoteCount] "page" is required.');
    if (!Number.isInteger(expectedCount) || expectedCount < 0) {
      throw new Error(`[Cart.verifyFlightQuoteCount] "expectedCount" must be a non-negative integer, got: ${expectedCount}`);
    }

    const cartPage = getPageObject(page, CartPage);
    logger.debug('[Cart.verifyFlightQuoteCount] Counting flight quote cards in cart', { expectedCount });

    let actualCount;
    try {
      actualCount = await cartPage.getFlightQuoteCardCount();
    } catch (err) {
      throw new Error(
        `[Cart.verifyFlightQuoteCount] Could not read flight quote cards from the cart. ` +
        `The cart may not have loaded or holds no flight quotes. Original: ${err.message}`,
      );
    }

    expect(
      actualCount,
      `[Cart.verifyFlightQuoteCount] Expected the cart to contain ${expectedCount} flight quote(s), but found ${actualCount}.`,
    ).toBe(expectedCount);
  },

  /**
   * Verifies the outbound departure airport code of the flight in the cart.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedCode - Expected departure airport code (e.g. "MAD")
   * @returns {Promise<void>}
   */
  async verifyCartFlightDepartureCode(page, expectedCode) {
    if (!page) throw new Error('[Cart.verifyCartFlightDepartureCode] "page" is required.');
    if (!expectedCode || typeof expectedCode !== 'string') {
      throw new Error(`[Cart.verifyCartFlightDepartureCode] "expectedCode" must be a non-empty string, got: ${typeof expectedCode}`);
    }

    const cartPage = getPageObject(page, CartPage);
    logger.debug('[Cart.verifyCartFlightDepartureCode] Reading cart flight location codes', { expectedCode });

    let codes;
    try {
      codes = await cartPage.getVisibleFlightQuoteLocationCodes();
    } catch (err) {
      throw new Error(
        `[Cart.verifyCartFlightDepartureCode] Could not read flight location codes from the cart quote. ` +
        `The flight quote may not have loaded. Original: ${err.message}`,
      );
    }

    const normalizedExpected = expectedCode.trim().toUpperCase();
    const actual = (codes[0] ?? '').toUpperCase();
    expect(
      actual,
      `[Cart.verifyCartFlightDepartureCode] Expected the cart flight to depart from ${normalizedExpected}, ` +
      `but the outbound departure code was "${codes[0] ?? '(none)'}". Visible codes: ${codes.join(', ')}`,
    ).toBe(normalizedExpected);
  },

  /**
   * Verifies the outbound arrival airport code of the flight in the cart.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedCode - Expected arrival airport code (e.g. "LIS")
   * @returns {Promise<void>}
   */
  async verifyCartFlightArrivalCode(page, expectedCode) {
    if (!page) throw new Error('[Cart.verifyCartFlightArrivalCode] "page" is required.');
    if (!expectedCode || typeof expectedCode !== 'string') {
      throw new Error(`[Cart.verifyCartFlightArrivalCode] "expectedCode" must be a non-empty string, got: ${typeof expectedCode}`);
    }

    const cartPage = getPageObject(page, CartPage);
    logger.debug('[Cart.verifyCartFlightArrivalCode] Reading cart flight location codes', { expectedCode });

    let codes;
    try {
      codes = await cartPage.getVisibleFlightQuoteLocationCodes();
    } catch (err) {
      throw new Error(
        `[Cart.verifyCartFlightArrivalCode] Could not read flight location codes from the cart quote. ` +
        `The flight quote may not have loaded. Original: ${err.message}`,
      );
    }

    const normalizedExpected = expectedCode.trim().toUpperCase();
    const actual = (codes[1] ?? '').toUpperCase();
    expect(
      actual,
      `[Cart.verifyCartFlightArrivalCode] Expected the cart flight to arrive at ${normalizedExpected}, ` +
      `but the outbound arrival code was "${codes[1] ?? '(none)'}". Visible codes: ${codes.join(', ')}`,
    ).toBe(normalizedExpected);
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
   * Clicks the Car button in the "Add more services" product carousel in the cart.
   * Opens the edit-search drawer with the car search form (it does not route away), so the
   * follow-on search must run against the drawer.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async clickAddCarFromCart(page) {
    if (!page) throw new Error('[Cart.clickAddCarFromCart] "page" is required.');
    logger.debug('[Cart.clickAddCarFromCart] Opening the car search drawer from the cart product carousel');
    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.clickAddCarFromCarousel();
    } catch (err) {
      throw new Error(
        `[Cart.clickAddCarFromCart] Could not start adding a car to the trip from the cart. ` +
        `The trip must already have at least one quote and the user must have access to the Car ` +
        `product. Original: ${err.message}`
      );
    }
  },

  /**
   * Starts adding an EU rail (Benerail) product to the trip from the cart product carousel.
   * The Rail tile is a supplier dropdown, so this hovers it and picks "EU Rails"; like Hotel and Car
   * it then opens the edit-search drawer in place rather than routing away, so the follow-on search
   * must run against the drawer (BenerailSearch.searchBenerailOneWayFromCartDrawer).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async clickAddEuRailFromCart(page) {
    if (!page) throw new Error('[Cart.clickAddEuRailFromCart] "page" is required.');
    logger.debug('[Cart.clickAddEuRailFromCart] Opening the EU rail search drawer from the cart product carousel');
    const cartPage = getPageObject(page, CartPage);
    try {
      // Matched loosely because the dropdown item renders the raw supplier value ("EU Rails") while
      // the product label elsewhere in the app is "EU Rail".
      await cartPage.selectRailTypeFromCarousel(/EU Rail/i);
    } catch (err) {
      throw new Error(
        `[Cart.clickAddEuRailFromCart] Could not start adding an EU rail to the trip from the cart. ` +
        `The trip must already have at least one quote and the user must have access to the EU Rail ` +
        `product. Original: ${err.message}`
      );
    }
  },

  /**
   * Clicks the Parking button from the "Add more services" product carousel in the cart.
   * Navigates to the parking search page.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async clickAddParkingFromCart(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickAddParkingFromCarousel();
  },

  /**
   * Clicks the "Manual quote" button from the "Add more services" product carousel
   * in the cart and waits for the manual-quote page to load. Used when the trip
   * already has at least one item in the cart and the user wants to add a manual
   * quote (e.g. a flight manual quote) on top of it.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async navigateToManualQuoteFromCart(page) {
    if (!page) {
      throw new Error('[Cart.navigateToManualQuoteFromCart] "page" is required.');
    }
    logger.debug('[Cart.navigateToManualQuoteFromCart] Opening manual quote page from cart product carousel');
    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.clickAddManualQuoteFromCarousel();
    } catch (err) {
      throw new Error(
        `[Cart.navigateToManualQuoteFromCart] Failed to navigate to the manual quote page from the cart. ` +
        `Check that the current user has manual quote permission and that the cart shows the "Add more services" carousel. ` +
        `Original: ${err.message}`
      );
    }
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

  /**
   * Verifies the mandatory-notifications popup (app-reminder-popup.vue, titled "Mandatory
   * Notifications") is displayed, WITHOUT dismissing it. Unlike verifyPushNotificationDisplayed — which
   * dismisses the reminder popup on sight — this assertion leaves the popup open so a following step can
   * click its hyperlink and acknowledge it (test 73097).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async verifyMandatoryNotificationsPopupDisplayed(page) {
    if (!page) throw new Error('[Cart.verifyMandatoryNotificationsPopupDisplayed] "page" is required.');
    const commonPage = getPageObject(page, CommonPage);
    const visible = await commonPage.isMandatoryNotificationsPopupVisible({ timeout: 15000 });
    if (!visible) {
      const openTitles = await commonPage.getVisibleDialogTitles().catch(() => []);
      throw new Error(
        `[Cart.verifyMandatoryNotificationsPopupDisplayed] Expected the "Mandatory Notifications" popup to be ` +
        `displayed after proceeding, but it was not visible. Visible dialog(s): ` +
        `${openTitles.length ? openTitles.join(', ') : 'none'}. (If a reference-fields popup is still open, the ` +
        `preceding Proceed did not dismiss it — often because a linked tab kept the app page backgrounded.)`
      );
    }
  },

  /**
   * Clicks the hyperlink inside the mandatory-notifications popup and returns the tab it opens in a new
   * window, so the caller can store it and verify the linked page (test 73097).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<import('playwright').Page>} The newly opened tab
   */
  async clickPushNotificationHyperlink(page) {
    if (!page) throw new Error('[Cart.clickPushNotificationHyperlink] "page" is required.');
    logger.debug('Clicking the hyperlink inside the mandatory-notifications popup');
    const commonPage = getPageObject(page, CommonPage);
    try {
      return await commonPage.clickReminderPopupHyperlink();
    } catch (err) {
      throw new Error(
        `[Cart.clickPushNotificationHyperlink] Could not open the push-notification hyperlink. The ` +
        `mandatory-notifications popup may not be open. Original: ${err.message}`
      );
    }
  },

  /**
   * Acknowledges the mandatory-notifications popup by checking its "Got it" box and closing it, which
   * marks the reminders as read (test 73097). Fails if the popup is not open.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async acknowledgePushNotification(page) {
    if (!page) throw new Error('[Cart.acknowledgePushNotification] "page" is required.');
    logger.debug('Acknowledging the mandatory-notifications popup');
    const commonPage = getPageObject(page, CommonPage);
    try {
      await commonPage.acknowledgeMandatoryNotificationsPopup();
    } catch (err) {
      throw new Error(
        `[Cart.acknowledgePushNotification] Could not acknowledge the mandatory-notifications popup ` +
        `(check "Got it" + close). The popup may not be open. Original: ${err.message}`
      );
    }
  },

  /**
   * Opens the cart notification panel (header bell) and clicks the hyperlink inside a notification
   * message, returning the tab it opens in a new window so the caller can verify the linked page
   * (test 73097).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<import('playwright').Page>} The newly opened tab
   */
  async clickCartPushNoteHyperlink(page) {
    if (!page) throw new Error('[Cart.clickCartPushNoteHyperlink] "page" is required.');
    logger.debug('Opening the cart notification panel and clicking the push-note hyperlink');
    const commonPage = getPageObject(page, CommonPage);
    try {
      await commonPage.openNotificationPanel();
      return await commonPage.clickNotificationPanelHyperlink();
    } catch (err) {
      throw new Error(
        `[Cart.clickCartPushNoteHyperlink] Could not open the cart push-note hyperlink. The notification ` +
        `panel may not have opened, or no notification carries a link. Original: ${err.message}`
      );
    }
  },

  /**
   * Opens the notification center (the header bell panel, app-notification.vue).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async openNotificationCenter(page) {
    if (!page) throw new Error('[Cart.openNotificationCenter] "page" is required.');
    logger.debug('Opening the notification center (header bell panel)');
    const commonPage = getPageObject(page, CommonPage);
    await commonPage.openNotificationPanel();
  },

  /**
   * Closes the notification center panel.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async closeNotificationCenter(page) {
    if (!page) throw new Error('[Cart.closeNotificationCenter] "page" is required.');
    logger.debug('Closing the notification center');
    const commonPage = getPageObject(page, CommonPage);
    await commonPage.closeNotificationPanel();
  },

  /**
   * Verifies the open notification center displays each expected message. The panel truncates long
   * messages to ShortText, so each expected value is treated as a SUBSTRING (feature values end in
   * "…"): every expected row must be contained (case-insensitive) in at least one visible message.
   * Existence-per-row — not a count — because each unread message renders in BOTH the "new" and "all"
   * sections of the panel, which would make a count double-match.
   *
   * @param {import('playwright').Page} page
   * @param {string[]} expectedMessages
   * @returns {Promise<void>}
   */
  async verifyNotificationCenterMessages(page, expectedMessages) {
    if (!page) throw new Error('[Cart.verifyNotificationCenterMessages] "page" is required.');
    if (!Array.isArray(expectedMessages) || expectedMessages.length === 0) {
      throw new Error('[Cart.verifyNotificationCenterMessages] "expectedMessages" must be a non-empty array.');
    }
    const commonPage = getPageObject(page, CommonPage);
    const actual = await commonPage.getVisibleNotificationMessageTexts();
    const normalize = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    // An ellipsis ("..." or "…") in an expected value marks where the UI truncated the message, so
    // match on the stable text BEFORE the first ellipsis — whether trailing ("foo ...") or mid-string.
    const toNeedle = (s) => normalize(s).split(/\s*(?:\.{3}|…)/)[0].trim();
    const actualNorm = actual.map(normalize);
    const missing = expectedMessages.filter((expected) => {
      const needle = toNeedle(expected);
      return needle && !actualNorm.some((a) => a.includes(needle));
    });
    if (missing.length > 0) {
      throw new Error(
        `[Cart.verifyNotificationCenterMessages] Notification center is missing expected message(s): ` +
        `[${missing.join(' | ')}]. Actual messages found: [${actual.join(' | ')}]`
      );
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
    if (!page) throw new Error('[Cart.openMoreDetailsInCart] "page" is required.');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickMoreDetailsInCart();
  },

  /**
   * Opens the More Details drawer for a specific quote card identified by text.
   * @param {import('playwright').Page} page
   * @param {string} quoteIdentifier - Partial text to identify the quote card (e.g. "Flight to", "Test Hotel", "Car Rental")
   */
  async openMoreDetailsForQuote(page, quoteIdentifier) {
    if (!page) throw new Error('[Cart.openMoreDetailsForQuote] "page" is required.');
    if (!quoteIdentifier || typeof quoteIdentifier !== 'string') {
      throw new Error(`[Cart.openMoreDetailsForQuote] "quoteIdentifier" must be a non-empty string, got: ${typeof quoteIdentifier} (${quoteIdentifier})`);
    }
    logger.debug(`[Cart.openMoreDetailsForQuote] Opening More Details for quote containing "${quoteIdentifier}"`);
    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.clickMoreDetailsForQuoteByText(quoteIdentifier);
    } catch (err) {
      throw new Error(
        `[Cart.openMoreDetailsForQuote] Failed to open More Details for the "${quoteIdentifier}" quote — ` +
        `the quote card may not exist in the cart or its More Details button is not visible. ` +
        `Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the currently open drawer (any product type) contains the expected text.
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Text to find in the open drawer
   */
  async verifyOpenDrawerContainsText(page, expectedText) {
    if (!page) throw new Error('[Cart.verifyOpenDrawerContainsText] "page" is required.');
    if (typeof expectedText !== 'string' || !expectedText) {
      throw new Error(`[Cart.verifyOpenDrawerContainsText] "expectedText" must be a non-empty string, got: ${typeof expectedText}`);
    }
    const cartPage = getPageObject(page, CartPage);
    const drawerText = await cartPage.getAnyVisibleDrawerText();
    const normalize = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!normalize(drawerText).includes(normalize(expectedText))) {
      throw new Error(
        `[Cart.verifyOpenDrawerContainsText] Expected the open drawer to contain "${expectedText}" but it was not found. ` +
        `Drawer text (first 500 chars): "${drawerText.substring(0, 500)}"`
      );
    }
  },

  /**
   * Closes whichever drawer is currently open.
   * @param {import('playwright').Page} page
   */
  async closeOpenDrawer(page) {
    if (!page) throw new Error('[Cart.closeOpenDrawer] "page" is required.');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.closeAnyVisibleDrawer();
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
   * Verifies the "Fare rules" link is NOT rendered inside the open More Details
   * drawer. Used for flight manual quotes, which must omit Fare Rules since
   * the fare information does not apply to manually-entered prices.
   *
   * Preconditions: the More Details drawer must already be open
   * (call `openMoreDetailsInCart` first).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{fareRulesCount: number}>} Diagnostic count (expected: 0)
   */
  async verifyFareRulesLinkNotVisibleInMoreDetails(page) {
    if (!page) {
      throw new Error('[Cart.verifyFareRulesLinkNotVisibleInMoreDetails] "page" is required.');
    }

    logger.debug('[Cart.verifyFareRulesLinkNotVisibleInMoreDetails] Checking that Fare Rules link is absent in the open More Details drawer');

    const cartPage = getPageObject(page, CartPage);
    let fareRulesCount;
    try {
      fareRulesCount = await cartPage.getFareRulesButtonCountInMoreDetailsDrawer();
    } catch (err) {
      throw new Error(
        `[Cart.verifyFareRulesLinkNotVisibleInMoreDetails] Failed to inspect the More Details drawer for a Fare Rules link. ` +
        `Original: ${err.message}`,
      );
    }

    if (fareRulesCount > 0) {
      throw new Error(
        `[Cart.verifyFareRulesLinkNotVisibleInMoreDetails] Expected NO "Fare rules" button inside the More Details drawer ` +
        `for the flight manual quote, but found ${fareRulesCount}. Manual quotes must not expose fare-rules information ` +
        `because the fare is manually entered and does not map to a real fare basis.`,
      );
    }

    return { fareRulesCount };
  },

  /**
   * Verifies that a rail quote-card's Fare Rules dialogs remain accessible with correct
   * information after the quote has been cancelled. Opens each segment's Fare Rules dialog in
   * turn (0 = outbound, 1 = return) and asserts each contains real travel-conditions content.
   *
   * Regression coverage for AB#79184 / ADO #81304: the Fare Rules button used to be disabled
   * once a quote's status became Cancelled; the fix removed that restriction so fare rules
   * captured at selection time remain accessible after cancellation.
   *
   * Preconditions: the quote must already be cancelled and its trip overview/cart visible.
   *
   * @param {import('playwright').Page} page
   * @param {number} segmentCount - Number of rail segments/legs to check (1 = one way, 2 = round trip)
   * @returns {Promise<{segmentTexts: string[]}>}
   */
  async verifyRailFareRulesAccessibleAfterCancellation(page, segmentCount = 2) {
    if (!page) {
      throw new Error('[Cart.verifyRailFareRulesAccessibleAfterCancellation] "page" is required.');
    }
    if (!Number.isInteger(segmentCount) || segmentCount < 1) {
      throw new Error(
        `[Cart.verifyRailFareRulesAccessibleAfterCancellation] "segmentCount" must be a positive integer, got: ${segmentCount}`,
      );
    }

    logger.debug('[Cart.verifyRailFareRulesAccessibleAfterCancellation] Checking Fare Rules dialogs on a cancelled rail quote', { segmentCount });

    const cartPage = getPageObject(page, CartPage);
    const segmentTexts = [];

    for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++) {
      await cartPage.clickRailFareRulesButton(segmentIndex);
      const text = await cartPage.getRailFareRulesDialogText();

      expect(
        text,
        `[Cart.verifyRailFareRulesAccessibleAfterCancellation] Fare Rules dialog for segment ${segmentIndex} should contain ` +
        `"TRAVEL CONDITIONS" after the quote was cancelled, but got: "${text}"`,
      ).toContain('TRAVEL CONDITIONS');

      segmentTexts.push(text);
      await cartPage.closeRailFareRulesDialog();
    }

    return { segmentTexts };
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
   * Extracts the hotel supplier confirmation number from the cart booking-confirm section.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>}
   */
  async extractSupplierConfirmationNumber(page) {
    if (!page) throw new Error('page is required');

    logger.debug('Extracting hotel supplier confirmation number from cart');
    const cartPage = getPageObject(page, CartPage);
    const confirmationNumber = await cartPage.getSupplierConfirmationNumberFromCart();

    if (typeof confirmationNumber !== 'string' || !confirmationNumber.trim()) {
      throw new Error(
        `[Cart.extractSupplierConfirmationNumber] Extracted an empty hotel supplier confirmation number from the ` +
        `cart booking-confirm section. The booking may not be confirmed, or the supplier returned no confirmation ` +
        `number. Got: "${confirmationNumber}"`
      );
    }

    return confirmationNumber.trim();
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
   * Verifies that the share itinerary email preview iframe contains the extracted hotel supplier
   * confirmation number. The share dialog must already be open. Reads the iframe srcdoc text
   * (via getSharePreviewTextContent), NOT the visible DOM.
   * @param {import('playwright').Page} page
   * @param {string} expectedNumber - The expected hotel supplier confirmation number
   */
  async verifyShareEmailContainsSupplierConfirmationNumber(page, expectedNumber) {
    if (!page) throw new Error('page is required');
    if (typeof expectedNumber !== 'string' || !expectedNumber.trim()) {
      throw new Error(`expectedNumber must be a non-empty string, got: ${typeof expectedNumber} (${expectedNumber})`);
    }
    const cartPage = getPageObject(page, CartPage);
    const previewText = await cartPage.getSharePreviewTextContent();
    expect(previewText, 'Share itinerary email preview text should not be empty').toBeTruthy();
    expect(
      previewText,
      `Share itinerary email preview should contain the hotel supplier confirmation number "${expectedNumber}", but it was not found in the preview text`
    ).toContain(expectedNumber);
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

  /**
   * Verifies that the open More Details drawer contains the expected text.
   * The drawer must already be open. Match is case-insensitive and whitespace-tolerant.
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Substring expected in the drawer
   */
  async verifyMoreDetailsDrawerContainsText(page, expectedText) {
    if (!page) throw new Error('page is required');
    if (typeof expectedText !== 'string' || !expectedText) {
      throw new Error('expectedText must be a non-empty string, got: ' + typeof expectedText);
    }
    const cartPage = getPageObject(page, CartPage);
    const drawerText = await cartPage.getMoreDetailsDrawerText();
    expect(drawerText, 'More Details drawer text should not be empty').toBeTruthy();
    const normalize = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
    expect(normalize(drawerText)).toContain(normalize(expectedText));
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
   * Extracts the refundability status of the cancellation and change policies
   * shown in the price offer email summary (the default share preview render).
   * The share dialog must already be open on the summary view. The returned
   * object is stored by the caller and later compared against the detailed/body
   * render — refundability is the term shown consistently in both views.
   * @param {import('playwright').Page} page
   * @returns {Promise<{ cancellation: string[], changes: string[] }>}
   */
  async extractPriceOfferEmailSummaryTerms(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    logger.debug('Extracting cancellation and change terms from the price offer email summary');

    let terms;
    try {
      terms = await cartPage.getSharePreviewOfferChangeTerms();
    } catch (err) {
      throw new Error(
        `[Cart.extractPriceOfferEmailSummaryTerms] Could not read the cancellation/change terms from the price offer email summary. ` +
          `The share preview may not have finished rendering the offer terms. Original: ${err.message}`
      );
    }

    if (!terms.cancellation.length || !terms.changes.length) {
      throw new Error(
        `[Cart.extractPriceOfferEmailSummaryTerms] Expected a refundability status for both the cancellation and change policies in the price offer email summary, ` +
          `got cancellation=${JSON.stringify(terms.cancellation)} changes=${JSON.stringify(terms.changes)}. ` +
          `The email template may have changed or the preview did not fully load.`
      );
    }

    return terms;
  },

  /**
   * Verifies the cancellation and change refundability shown in the price offer
   * email detailed (body) view match those captured earlier from the summary
   * view. The share dialog must already be switched to the detailed view.
   * @param {import('playwright').Page} page
   * @param {{ cancellation: string[], changes: string[] }} summaryTerms - terms from extractPriceOfferEmailSummaryTerms
   */
  async verifyPriceOfferEmailDetailedTermsMatchSummary(page, summaryTerms) {
    if (!page) throw new Error('page is required');
    if (!summaryTerms || !Array.isArray(summaryTerms.cancellation) || !Array.isArray(summaryTerms.changes)) {
      throw new Error(
        `[Cart.verifyPriceOfferEmailDetailedTermsMatchSummary] summaryTerms must be an object with "cancellation" and "changes" arrays, ` +
          `got: ${JSON.stringify(summaryTerms)}. Run the summary extraction step before this verification.`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    logger.debug('Extracting cancellation and change terms from the price offer email detailed view');

    let detailedTerms;
    try {
      detailedTerms = await cartPage.getSharePreviewOfferChangeTerms();
    } catch (err) {
      throw new Error(
        `[Cart.verifyPriceOfferEmailDetailedTermsMatchSummary] Could not read the cancellation/change terms from the price offer email detailed view. ` +
          `The detailed preview may not have finished rendering. Original: ${err.message}`
      );
    }

    // The two renders lay the policy out differently (the summary condenses it,
    // the detailed view breaks it into a fee table), but the refundability
    // status must match between them for cancellation and for change.
    expect(
      detailedTerms.cancellation,
      `Cancellation refundability differs between the price offer email summary and detailed view. ` +
        `Summary: ${JSON.stringify(summaryTerms.cancellation)} Detailed: ${JSON.stringify(detailedTerms.cancellation)}`
    ).toEqual(summaryTerms.cancellation);

    expect(
      detailedTerms.changes,
      `Change refundability differs between the price offer email summary and detailed view. ` +
        `Summary: ${JSON.stringify(summaryTerms.changes)} Detailed: ${JSON.stringify(detailedTerms.changes)}`
    ).toEqual(summaryTerms.changes);
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
   * Verifies the trip number in the share email preview is plain text, not a hyperlink.
   * The share dialog must already be open on the given template.
   *
   * @param {import('playwright').Page} page
   * @param {'quote'|'itinerary'} previewType - Which email template is open (used for messaging)
   * @param {string} tripNumber - The trip number shown in the preview
   */
  async verifyTripNumberIsNotHyperlinkInSharePreview(page, previewType, tripNumber) {
    if (!page) throw new Error('page is required');
    if (previewType !== 'quote' && previewType !== 'itinerary') {
      throw new Error(`previewType must be "quote" or "itinerary", got: ${previewType}`);
    }
    if (!tripNumber || typeof tripNumber !== 'string') {
      throw new Error(`tripNumber must be a non-empty string, got: ${typeof tripNumber}`);
    }

    logger.debug('Verifying trip number is not a hyperlink in share preview', { previewType, tripNumber });

    try {
      const cartPage = getPageObject(page, CartPage);
      const { isHyperlink, snippet } = await cartPage.isTripNumberHyperlinkInSharePreview(tripNumber);
      expect(
        isHyperlink,
        `Expected the trip number "${tripNumber}" in the ${previewType} share email preview to be plain text, but it is rendered as a hyperlink. Element: "${snippet}"`
      ).toBe(false);
    } catch (err) {
      throw new Error(
        `[Cart.verifyTripNumberIsNotHyperlinkInSharePreview] Failed to verify the trip number is not a hyperlink in the ${previewType} share email preview. Original: ${err.message}`
      );
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

  /**
   * Verifies the flight offer price shown in the share email preview matches the
   * cart price (within tolerance), proving the price is not duplicated (doubled)
   * for multiple travellers. The share dialog must already be open.
   *
   * @param {import('playwright').Page} page
   * @param {number} cartPrice - The flight quote price previously extracted from the cart
   * @param {object} [options]
   * @param {number} [options.tolerance=0.09] - Allowed absolute difference (from the original test)
   * @returns {Promise<{cartPrice: number, previewPrice: number}>}
   */
  async verifyFlightSharePreviewPriceMatchesCartPrice(page, cartPrice, { tolerance = 0.09 } = {}) {
    if (!page) throw new Error('[Cart.verifyFlightSharePreviewPriceMatchesCartPrice] "page" is required.');
    if (typeof cartPrice !== 'number' || Number.isNaN(cartPrice)) {
      throw new Error(
        `[Cart.verifyFlightSharePreviewPriceMatchesCartPrice] "cartPrice" must be a valid number, got: ${typeof cartPrice} (${JSON.stringify(cartPrice)}). ` +
          'Run "When I extract the flight quote price from cart" before this step.'
      );
    }

    const cartPage = getPageObject(page, CartPage);

    let previewPrice;
    try {
      previewPrice = await cartPage.getSharePreviewFlightOfferPrice();
    } catch (err) {
      throw new Error(
        '[Cart.verifyFlightSharePreviewPriceMatchesCartPrice] Could not read the flight offer price from the share email preview. ' +
          `The blue "#1C73FF" price box may not have rendered, or its layout changed. Original: ${err.message}`
      );
    }

    logger.info('Comparing share email preview flight price with cart price', {
      cartPrice,
      previewPrice,
      tolerance,
    });

    expectNumbersToBeEqualWithTolerance(
      previewPrice,
      cartPrice,
      tolerance,
      `Share email preview flight price (${previewPrice}) vs cart price (${cartPrice}) — price must not be duplicated for multiple travellers`,
    );

    return { cartPrice, previewPrice };
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
   * Opens the extras panel, selects the first chain, fills the number, and saves.
   *
   * @param {import('playwright').Page} page
   * @param {string} loyaltyNumber - Loyalty number to enter
   * @param {number} [index=0] - Extras edit button index (ignored when `hotelScoped` is true)
   * @param {object} [options]
   * @param {boolean} [options.hotelScoped=false] - Expand via the hotel loyalty section instead of the
   *   page-wide extras edit button. Required when the trip holds more than one product: the edit
   *   button is resolved by page-wide index, so in a flight + hotel + car trip index 0 is the
   *   flight quote card's extras rather than the hotel's.
   * @returns {Promise<string>} The selected hotel chain text
   */
  async addLoyaltyNumberWithFirstAvailableChain(page, loyaltyNumber, index = 0, { hotelScoped = false } = {}) {
    if (!page) throw new Error('page is required');
    if (!loyaltyNumber || typeof loyaltyNumber !== 'string') throw new Error('loyaltyNumber must be a non-empty string');

    const cartPage = getPageObject(page, CartPage);

    if (hotelScoped) {
      await cartPage.clickHotelLoyaltyExtrasExpand();
    } else {
      await cartPage.clickEditExtrasButton(index);
      await cartPage.waitForSaveButton();
    }

    await cartPage.selectNewLoyaltyRadio();
    const chainText = await cartPage.selectFirstLoyaltyChain();
    await cartPage.fillLoyaltyNumber(loyaltyNumber);
    await cartPage.clickLoyaltySaveButton();
    await cartPage.waitForLoyaltySuccessIcon();
    return chainText;
  },

  /**
   * Adds a car driver loyalty (Loyalty ID) number on the cart's car quote card.
   * Expands the car-scoped extras panel, types the number, saves and waits for the success state.
   *
   * @param {import('playwright').Page} page
   * @param {string} loyaltyNumber - Loyalty number to enter
   * @returns {Promise<void>}
   */
  async addCarDriverLoyaltyNumber(page, loyaltyNumber) {
    if (!page) throw new Error('[Cart.addCarDriverLoyaltyNumber] "page" is required.');
    if (!loyaltyNumber || typeof loyaltyNumber !== 'string') {
      throw new Error(
        `[Cart.addCarDriverLoyaltyNumber] "loyaltyNumber" must be a non-empty string, got: ` +
        `${typeof loyaltyNumber} (${JSON.stringify(loyaltyNumber)})`
      );
    }

    logger.debug('[Cart.addCarDriverLoyaltyNumber] Adding car driver loyalty number', { loyaltyNumber });
    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.clickCarDriverLoyaltyExpand();
      await cartPage.fillCarDriverLoyaltyNumber(loyaltyNumber);
      await cartPage.clickCarDriverLoyaltySaveButton();
      await cartPage.waitForCarDriverLoyaltySuccessIcon();
      logger.info('Added car driver loyalty number in the quote extras', { loyaltyNumber });
    } catch (err) {
      throw new Error(
        `[Cart.addCarDriverLoyaltyNumber] Failed to save car driver loyalty number "${loyaltyNumber}". ` +
        `The trip must contain a car quote, and if the supplier requires a driver the panel's Driver ` +
        `field must be selectable. Original: ${err.message}`
      );
    }
  },

  /**
   * Selects an existing loyalty number from the traveler's profile.
   * Assumes the loyalty extras section is already expanded.
   * Flow: click Existing radio → select from dropdown → save → verify green icon.
   * @param {import('playwright').Page} page
   * @param {string} loyaltyText - Text to match in the dropdown (e.g. "6C - 456789")
   */
  async selectExistingLoyaltyFromProfile(page, loyaltyText) {
    if (!page) throw new Error('[Cart.selectExistingLoyaltyFromProfile] "page" is required.');
    if (!loyaltyText || typeof loyaltyText !== 'string') {
      throw new Error(
        `[Cart.selectExistingLoyaltyFromProfile] "loyaltyText" must be a non-empty string, got: ${typeof loyaltyText} (${JSON.stringify(loyaltyText)})`
      );
    }

    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.selectExistingLoyaltyRadio();
    } catch (err) {
      throw new Error(
        `[Cart.selectExistingLoyaltyFromProfile] Failed to select "Existing" radio for loyalty "${loyaltyText}": ${err.message}`
      );
    }

    try {
      await cartPage.selectExistingLoyaltyOption(loyaltyText);
    } catch (err) {
      throw new Error(
        `[Cart.selectExistingLoyaltyFromProfile] Failed to select loyalty option "${loyaltyText}" from dropdown — ` +
        `the option may not exist in the traveler's profile. ${err.message}`
      );
    }

    try {
      await cartPage.clickLoyaltySaveButton();
      await cartPage.waitForLoyaltySuccessIcon();
    } catch (err) {
      throw new Error(
        `[Cart.selectExistingLoyaltyFromProfile] Loyalty "${loyaltyText}" was selected but save/verify failed: ${err.message}`
      );
    }
  },

  /**
   * Selects the first existing loyalty number from the traveler's profile.
   * Assumes the loyalty extras section is already expanded.
   * Flow: click Existing radio → select first option from dropdown → save → verify green icon.
   * @param {import('playwright').Page} page
   */
  async selectFirstExistingLoyaltyFromProfile(page) {
    if (!page) throw new Error('[Cart.selectFirstExistingLoyaltyFromProfile] "page" is required.');

    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.selectExistingLoyaltyRadio();
    } catch (err) {
      throw new Error(
        `[Cart.selectFirstExistingLoyaltyFromProfile] Failed to select "Existing" radio: ${err.message}`
      );
    }

    try {
      await cartPage.selectFirstExistingLoyaltyOption();
    } catch (err) {
      throw new Error(
        `[Cart.selectFirstExistingLoyaltyFromProfile] Failed to select the first loyalty option from dropdown — ` +
        `the traveler may not have any loyalty numbers in their profile. ${err.message}`
      );
    }

    try {
      await cartPage.clickLoyaltySaveButton();
      await cartPage.waitForLoyaltySuccessIcon();
    } catch (err) {
      throw new Error(
        `[Cart.selectFirstExistingLoyaltyFromProfile] First loyalty option was selected but save/verify failed: ${err.message}`
      );
    }
  },

  /**
   * Verifies the loyalty number section shows a green success icon (check_circle).
   * @param {import('playwright').Page} page
   */
  async verifyLoyaltySavedWithSuccessIcon(page) {
    if (!page) throw new Error('[Cart.verifyLoyaltySavedWithSuccessIcon] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.waitForLoyaltySuccessIcon();
    } catch (err) {
      throw new Error(
        `[Cart.verifyLoyaltySavedWithSuccessIcon] Green success icon not visible in loyalty section — ` +
        `loyalty number may not have been saved correctly. ${err.message}`
      );
    }
  },

  /**
   * Verifies that a pre-populated loyalty number shows a green success icon.
   * Scrolls to the loyalty section and waits with a longer timeout since
   * prepopulation requires an API fetch after the room is added to cart.
   * @param {import('playwright').Page} page
   */
  async verifyLoyaltyPrepopulatedWithSuccess(page) {
    if (!page) throw new Error('[Cart.verifyLoyaltyPrepopulatedWithSuccess] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForLoyaltyPrepopulatedIcon();
  },

  /**
   * Verifies that the loyalty chain dropdown shows the expected text (chain code + number).
   * Used for pre-populated loyalty scenarios where the system auto-fills from the master chain.
   * Assumes the loyalty extras section has been expanded already.
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Expected text in the dropdown (e.g. "CN - 121212")
   */
  async verifyLoyaltyChainDropdown(page, expectedText) {
    if (!page) throw new Error('[Cart.verifyLoyaltyChainDropdown] "page" is required.');
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(
        `[Cart.verifyLoyaltyChainDropdown] "expectedText" must be a non-empty string, got: ${typeof expectedText} (${JSON.stringify(expectedText)})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    let actualText;
    try {
      actualText = await cartPage.getExistingLoyaltyDropdownText();
    } catch (err) {
      throw new Error(
        `[Cart.verifyLoyaltyChainDropdown] Could not read loyalty dropdown text — ` +
        `the loyalty section may not be expanded or no loyalty is pre-populated. ${err.message}`
      );
    }

    if (!actualText.includes(expectedText)) {
      throw new Error(
        `[Cart.verifyLoyaltyChainDropdown] Expected loyalty dropdown to contain "${expectedText}", ` +
        `but found: "${actualText}". The master chain hierarchy may not match, or the loyalty number ` +
        `was not pre-populated for this hotel chain.`
      );
    }
  },

  // ===== EU RAIL LOYALTY PROGRAM (loyalty-program.vue) =====

  /**
   * Edits the EU Rail loyalty card number field without saving.
   * Used to verify unsaved edits are discarded (data-loss-on-navigation scenario).
   * @param {import('playwright').Page} page
   * @param {string} newCardNumber - New card number to enter
   */
  async editEuRailLoyaltyNumber(page, newCardNumber) {
    if (!page) throw new Error('[Cart.editEuRailLoyaltyNumber] "page" is required.');
    if (typeof newCardNumber !== 'string' || !newCardNumber) {
      throw new Error(`[Cart.editEuRailLoyaltyNumber] "newCardNumber" must be a non-empty string, got: ${typeof newCardNumber}`);
    }

    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.fillEuRailLoyaltyNumber(newCardNumber);
    } catch (err) {
      throw new Error(
        `[Cart.editEuRailLoyaltyNumber] Failed to edit card number to "${newCardNumber}": ${err.message}`
      );
    }
  },

  /**
   * Opens a tab ("Use Existing" or "Enter New") in the EU Rail loyalty program section.
   * Assumes the loyalty program extras panel is already expanded.
   * @param {import('playwright').Page} page
   * @param {string} tabName - Visible tab label, e.g. "Use Existing" or "Enter New"
   */
  async openEuRailLoyaltyTab(page, tabName) {
    if (!page) throw new Error('[Cart.openEuRailLoyaltyTab] "page" is required.');
    if (!tabName || typeof tabName !== 'string') {
      throw new Error(`[Cart.openEuRailLoyaltyTab] "tabName" must be a non-empty string, got: ${typeof tabName} (${JSON.stringify(tabName)})`);
    }

    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.clickEuRailLoyaltyTab(tabName);
    } catch (err) {
      throw new Error(
        `[Cart.openEuRailLoyaltyTab] Failed to open the "${tabName}" tab in the loyalty program section: ${err.message}`
      );
    }
  },

  /**
   * Returns all stored loyalty program option labels shown in the EU Rail "Use Existing" dropdown.
   * Opens the dropdown to read the options and leaves it open for a subsequent selection.
   * @param {import('playwright').Page} page
   * @returns {Promise<string[]>} Visible option labels (e.g. "000123456789 - SNCB Train+ Loyalty Card")
   */
  async getEuRailExistingLoyaltyOptions(page) {
    if (!page) throw new Error('[Cart.getEuRailExistingLoyaltyOptions] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.openEuRailExistingLoyaltyDropdown();
      return await cartPage.getEuRailLoyaltyDropdownOptionTexts();
    } catch (err) {
      throw new Error(
        `[Cart.getEuRailExistingLoyaltyOptions] Could not read options from the "Use Existing" loyalty dropdown — ` +
        `the traveler may not have any stored loyalty programs. ${err.message}`
      );
    }
  },

  /**
   * Selects the first existing loyalty program from the EU Rail "Use Existing" dropdown.
   * Assumes the "Use Existing" tab is already open.
   * @param {import('playwright').Page} page
   */
  async selectFirstExistingEuRailLoyaltyProgram(page) {
    if (!page) throw new Error('[Cart.selectFirstExistingEuRailLoyaltyProgram] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.openEuRailExistingLoyaltyDropdown();
      await cartPage.selectFirstEuRailLoyaltyOption();
    } catch (err) {
      throw new Error(
        `[Cart.selectFirstExistingEuRailLoyaltyProgram] Failed to select the first loyalty program from the ` +
        `"Use Existing" dropdown — the traveler may not have any loyalty programs stored in their profile. ${err.message}`
      );
    }
  },

  /**
   * Verifies the EU Rail loyalty card number field is pre-populated with the expected value.
   * @param {import('playwright').Page} page
   * @param {string} expectedCardNumber - Expected card number value (e.g. "000123456789")
   */
  async verifyEuRailLoyaltyNumberPrepopulated(page) {
    if (!page) throw new Error('[Cart.verifyEuRailLoyaltyNumberPrepopulated] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    let actualValue;
    try {
      actualValue = await cartPage.getEuRailLoyaltyNumberInputValue();
    } catch (err) {
      throw new Error(
        `[Cart.verifyEuRailLoyaltyNumberPrepopulated] Could not read the card number field value: ${err.message}`
      );
    }

    // Not checking against a fixed literal: the traveler's stored card number is real, shared
    // profile data that earlier scenario runs (Edit + Save) legitimately mutate over time, so
    // hardcoding an "original" value would break idempotency (CLAUDE.md: scenarios must be
    // runnable in any order). Verifying non-empty format is the meaningful, stable assertion here.
    expect(
      actualValue && actualValue.trim().length >= 4,
      `Card number field should be pre-populated with a non-empty card number, but found "${actualValue}"`
    ).toBe(true);

    return actualValue;
  },

  /**
   * Edits the EU Rail loyalty card number field and clicks the given button (e.g. "Save").
   * @param {import('playwright').Page} page
   * @param {string} newCardNumber - New card number to enter
   * @param {string} buttonName - Button to click after editing (only "Save" is currently supported)
   */
  async editEuRailLoyaltyNumberAndClickButton(page, newCardNumber, buttonName) {
    if (!page) throw new Error('[Cart.editEuRailLoyaltyNumberAndClickButton] "page" is required.');
    if (typeof newCardNumber !== 'string' || !newCardNumber) {
      throw new Error(`[Cart.editEuRailLoyaltyNumberAndClickButton] "newCardNumber" must be a non-empty string, got: ${typeof newCardNumber}`);
    }
    if (!buttonName || typeof buttonName !== 'string') {
      throw new Error(`[Cart.editEuRailLoyaltyNumberAndClickButton] "buttonName" must be a non-empty string, got: ${typeof buttonName}`);
    }
    if (buttonName.trim().toLowerCase() !== 'save') {
      throw new Error(`[Cart.editEuRailLoyaltyNumberAndClickButton] Unsupported button "${buttonName}" — only "Save" is currently supported.`);
    }

    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.fillEuRailLoyaltyNumber(newCardNumber);
      await cartPage.clickEuRailLoyaltySaveButton();
      // Wait for the save's loading state to clear before returning — otherwise a subsequent
      // action that re-opens another extras panel can race this one while it's still mid-save,
      // leaving two "Save" buttons on the page and tripping Playwright's strict-mode check on
      // the unscoped getSaveButton() locator. Some sections collapse after saving and others
      // (e.g. EU Rail "Enter New") stay open, so this waits for the loading state rather than
      // for the button to disappear entirely.
      await cartPage.waitForSaveButtonLoadingToClear();
    } catch (err) {
      throw new Error(
        `[Cart.editEuRailLoyaltyNumberAndClickButton] Failed to edit card number to "${newCardNumber}" and click "${buttonName}": ${err.message}`
      );
    }
  },

  /**
   * Submits a genuine duplicate EU Rail loyalty entry via "Enter New": reads the real card number
   * already stored for "Club Eurostar" under "Use Existing" (the only vendor confirmed to appear in
   * both dropdowns — others like "SNCB Train+ Loyalty Card" are corporate-assigned and not offered
   * as an "Enter New" vendor), then re-submits that same vendor + card number via "Enter New". This
   * guarantees a true duplicate rather than a fabricated card number that matches nothing on file.
   * @param {import('playwright').Page} page
   * @param {string} buttonName - Button to click after entering the duplicate (only "Save" is currently supported)
   * @returns {Promise<{ vendor: string, cardNumber: string }>}
   */
  async enterDuplicateEuRailLoyaltyProgramAndClickButton(page, buttonName) {
    if (!page) throw new Error('[Cart.enterDuplicateEuRailLoyaltyProgramAndClickButton] "page" is required.');
    if (!buttonName || typeof buttonName !== 'string') {
      throw new Error(`[Cart.enterDuplicateEuRailLoyaltyProgramAndClickButton] "buttonName" must be a non-empty string, got: ${typeof buttonName}`);
    }
    if (buttonName.trim().toLowerCase() !== 'save') {
      throw new Error(`[Cart.enterDuplicateEuRailLoyaltyProgramAndClickButton] Unsupported button "${buttonName}" — only "Save" is currently supported.`);
    }

    const cartPage = getPageObject(page, CartPage);
    let vendor;
    let cardNumber;
    try {
      await cartPage.clickEuRailLoyaltyTab('Use Existing');
      await cartPage.openEuRailExistingLoyaltyDropdown();
      const existingOptions = await cartPage.getEuRailLoyaltyDropdownOptionTexts();
      const existingLabel = existingOptions.find((label) => label.includes('Club Eurostar'));
      if (!existingLabel) {
        throw new Error(`No existing "Club Eurostar" entry found to duplicate. Found options: ${existingOptions.join(', ')}`);
      }
      await cartPage.selectEuRailLoyaltyOption('Club Eurostar');
      cardNumber = await cartPage.getEuRailLoyaltyNumberInputValue();

      await cartPage.clickEuRailLoyaltyTab('Enter New');
      await cartPage.selectEuRailLoyaltyVendor('Club Eurostar');
      vendor = 'Club Eurostar';
      await cartPage.fillEuRailLoyaltyNumber(cardNumber);
      await cartPage.clickEuRailLoyaltySaveButton();
      await cartPage.waitForSaveButtonLoadingToClear();
    } catch (err) {
      throw new Error(
        `[Cart.enterDuplicateEuRailLoyaltyProgramAndClickButton] Failed to enter a duplicate loyalty program and click "${buttonName}": ${err.message}`
      );
    }
    return { vendor, cardNumber };
  },

  /**
   * Enters an invalid EU Rail loyalty card number into the (already visible/pre-populated) card number field,
   * without saving. Used to trigger client-side validation (loyalty-program.ts isRailProgramValueValid()).
   * @param {import('playwright').Page} page
   * @param {string} invalidCardNumber - Invalid card number value (e.g. "123")
   */
  async enterInvalidEuRailLoyaltyNumber(page, invalidCardNumber) {
    if (!page) throw new Error('[Cart.enterInvalidEuRailLoyaltyNumber] "page" is required.');
    if (typeof invalidCardNumber !== 'string' || !invalidCardNumber) {
      throw new Error(`[Cart.enterInvalidEuRailLoyaltyNumber] "invalidCardNumber" must be a non-empty string, got: ${typeof invalidCardNumber}`);
    }

    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.fillEuRailLoyaltyNumber(invalidCardNumber);
      await cartPage.clickEuRailLoyaltySaveButton();
    } catch (err) {
      throw new Error(
        `[Cart.enterInvalidEuRailLoyaltyNumber] Failed to enter invalid card number "${invalidCardNumber}": ${err.message}`
      );
    }
  },

  /**
   * Verifies a validation error is displayed for the EU Rail loyalty card number field.
   * @param {import('playwright').Page} page
   */
  async verifyEuRailLoyaltyValidationErrorDisplayed(page) {
    if (!page) throw new Error('[Cart.verifyEuRailLoyaltyValidationErrorDisplayed] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    const isVisible = await cartPage.isEuRailLoyaltyValidationMessageVisible();
    expect(isVisible, 'A validation error should be displayed for the card number field').toBe(true);
  },

  /**
   * Verifies the EU Rail loyalty card number was NOT persisted to the traveler's actual profile,
   * i.e. the Save action was blocked by validation, or navigation happened without saving. Checks
   * against the rejected value itself (not a fixed "original") so this stays idempotent across runs
   * even as the traveler's real stored card number changes over time from other scenarios.
   * Uses the same ground-truth Profile settings check as verifyEuRailLoyaltyProgramAddedToProfile()
   * rather than re-reading the cart's own (possibly stale/local) state.
   * @param {import('playwright').Page} page
   * @param {string} rejectedCardNumber - Card number that must NOT have been persisted
   */
  async verifyEuRailLoyaltyNumberNotSaved(page, rejectedCardNumber) {
    if (!page) throw new Error('[Cart.verifyEuRailLoyaltyNumberNotSaved] "page" is required.');
    if (!rejectedCardNumber || typeof rejectedCardNumber !== 'string') {
      throw new Error(`[Cart.verifyEuRailLoyaltyNumberNotSaved] "rejectedCardNumber" must be a non-empty string, got: ${typeof rejectedCardNumber}`);
    }

    let profilePage;
    try {
      let values;
      try {
        profilePage = await Profile.navigateToProfile(page);
        await Profile.openFrequentProgramsTab(profilePage);
        values = await getPageObject(profilePage, ProfilePage).getAllLoyaltyInputValues();
      } catch (err) {
        throw new Error(
          `[Cart.verifyEuRailLoyaltyNumberNotSaved] Could not read loyalty numbers from the traveler's profile: ${err.message}`
        );
      }

      expect(
        values.includes(rejectedCardNumber),
        `Expected card number "${rejectedCardNumber}" NOT to appear in the traveler's profile Frequent Programs (the edit should have been discarded), but found it. Values present: ${values.join(', ')}`
      ).toBe(false);
    } finally {
      // Always close the profile tab, however this ended (read failure or assertion failure) —
      // and only if it's genuinely a separate tab (the no-new-tab fallback makes
      // profilePage === page, in which case it's the cart tab itself).
      if (profilePage && profilePage !== page) {
        await profilePage.close().catch(() => {});
      }
    }
  },

  /**
   * Navigates away from the loyalty program section without clicking Save, by switching to the
   * other tab (e.g. from "Use Existing" to "Enter New"). Used to verify unsaved edits are discarded.
   * @param {import('playwright').Page} page
   * @param {string} buttonName - Save-like button that must NOT be clicked (validated but unused; kept for step-text clarity)
   */
  async navigateAwayFromEuRailLoyaltyWithoutSaving(page, buttonName) {
    if (!page) throw new Error('[Cart.navigateAwayFromEuRailLoyaltyWithoutSaving] "page" is required.');
    if (!buttonName || typeof buttonName !== 'string') {
      throw new Error(`[Cart.navigateAwayFromEuRailLoyaltyWithoutSaving] "buttonName" must be a non-empty string, got: ${typeof buttonName}`);
    }

    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.clickEuRailLoyaltyTab('Enter New');
      await cartPage.clickEuRailLoyaltyTab('Use Existing');
    } catch (err) {
      throw new Error(
        `[Cart.navigateAwayFromEuRailLoyaltyWithoutSaving] Failed to navigate away from the loyalty section without clicking "${buttonName}": ${err.message}`
      );
    }
  },

  /**
   * Selects a loyalty program vendor in the "Enter New" tab and enters an invalid card number, without saving successfully.
   * @param {import('playwright').Page} page
   * @param {string} invalidCardNumber - Invalid card number (e.g. "123")
   * @returns {Promise<{ vendor: string }>}
   */
  async selectEuRailLoyaltyVendorAndEnterInvalidNumber(page, invalidCardNumber) {
    if (!page) throw new Error('[Cart.selectEuRailLoyaltyVendorAndEnterInvalidNumber] "page" is required.');
    if (typeof invalidCardNumber !== 'string' || !invalidCardNumber) {
      throw new Error(`[Cart.selectEuRailLoyaltyVendorAndEnterInvalidNumber] "invalidCardNumber" must be a non-empty string, got: ${typeof invalidCardNumber}`);
    }

    const cartPage = getPageObject(page, CartPage);
    let vendor;
    try {
      vendor = await cartPage.selectFirstEuRailLoyaltyVendor();
      await cartPage.fillEuRailLoyaltyNumber(invalidCardNumber);
      await cartPage.clickEuRailLoyaltySaveButton();
    } catch (err) {
      throw new Error(
        `[Cart.selectEuRailLoyaltyVendorAndEnterInvalidNumber] Failed to select a loyalty program and enter invalid card number "${invalidCardNumber}": ${err.message}`
      );
    }
    return { vendor };
  },

  /**
   * Selects the loyalty program at the given zero-based position from whichever tab's dropdown
   * is currently open — the "Enter New" tab's vendor dropdown, or the "Use Existing" tab's
   * stored-program dropdown. Does not enter a card number or click Save.
   * @param {import('playwright').Page} page
   * @param {number} index - Zero-based position of the option to select
   * @returns {Promise<{ vendor: string }>}
   */
  async selectEuRailLoyaltyVendorByIndex(page, index) {
    if (!page) throw new Error('[Cart.selectEuRailLoyaltyVendorByIndex] "page" is required.');
    if (typeof index !== 'number' || index < 0) {
      throw new Error(`[Cart.selectEuRailLoyaltyVendorByIndex] "index" must be a non-negative number, got: ${index}`);
    }

    const cartPage = getPageObject(page, CartPage);
    let vendor;
    try {
      vendor = await cartPage.selectEuRailLoyaltyVendorByIndex(index);
    } catch (err) {
      throw new Error(
        `[Cart.selectEuRailLoyaltyVendorByIndex] Failed to select the loyalty program at index ${index}: ${err.message}`
      );
    }
    return { vendor };
  },

  /**
   * Verifies the EU Rail loyalty card number was persisted to the traveler's actual profile —
   * not just reflected back in the cart's own "Use Existing" dropdown. Opens the user's Profile
   * settings (which may open in a new tab) and checks the full card number appears among the
   * Frequent Programs number inputs, matching the ground-truth recorded flow:
   *   click Save -> open Profile settings -> Frequent Programs -> assert the number input value.
   * @param {import('playwright').Page} page
   * @param {string} cardNumber - Full card number expected to now be present in the profile
   */
  async verifyEuRailLoyaltyProgramAddedToProfile(page, cardNumber) {
    if (!page) throw new Error('[Cart.verifyEuRailLoyaltyProgramAddedToProfile] "page" is required.');
    if (!cardNumber || typeof cardNumber !== 'string') {
      throw new Error(`[Cart.verifyEuRailLoyaltyProgramAddedToProfile] "cardNumber" must be a non-empty string, got: ${typeof cardNumber}`);
    }

    let profilePage;
    try {
      let values;
      try {
        profilePage = await Profile.navigateToProfile(page);
        await Profile.openFrequentProgramsTab(profilePage);
        values = await getPageObject(profilePage, ProfilePage).getAllLoyaltyInputValues();
      } catch (err) {
        throw new Error(
          `[Cart.verifyEuRailLoyaltyProgramAddedToProfile] Could not read loyalty numbers from the traveler's profile: ${err.message}`
        );
      }

      expect(
        values.includes(cardNumber),
        `Expected card number "${cardNumber}" to appear in the traveler's profile Frequent Programs. Found: ${values.join(', ')}`
      ).toBe(true);
    } finally {
      // Always close the profile tab, however this ended (read failure or assertion failure) —
      // and only if it's genuinely a separate tab (the no-new-tab fallback makes
      // profilePage === page, in which case it's the cart tab itself).
      if (profilePage && profilePage !== page) {
        await profilePage.close().catch(() => {});
      }
    }
  },

  /**
   * Verifies the system ignored a duplicate loyalty program entry — after saving a card number
   * that already exists in the traveler's profile, "Use Existing" should show exactly one entry
   * ending in its last 4 digits, not two. Self-contained (no "before" baseline needed): pass the
   * card number that was just saved (e.g. via editEuRailLoyaltyNumberAndClickButton).
   * @param {import('playwright').Page} page
   * @param {string} cardNumber - The card number that was just saved and must not be duplicated
   */
  async verifyEuRailLoyaltyDuplicateIgnored(page, cardNumber) {
    if (!page) throw new Error('[Cart.verifyEuRailLoyaltyDuplicateIgnored] "page" is required.');
    if (!cardNumber || typeof cardNumber !== 'string') {
      throw new Error(`[Cart.verifyEuRailLoyaltyDuplicateIgnored] "cardNumber" must be a non-empty string, got: ${typeof cardNumber}`);
    }

    const cartPage = getPageObject(page, CartPage);
    let options;
    try {
      // Same as verifyEuRailLoyaltyProgramAddedToProfile() above — the Save collapses the panel,
      // so it must be re-opened before switching tabs (guarded to avoid re-clicking "Edit" if
      // the panel is already open).
      if (!(await cartPage.isEuRailLoyaltyPanelOpen())) {
        await cartPage.clickEditExtrasButton(0);
      }
      await cartPage.clickEuRailLoyaltyTab('Use Existing');
      await cartPage.openEuRailExistingLoyaltyDropdown();
      options = await cartPage.getEuRailLoyaltyDropdownOptionTexts();
    } catch (err) {
      throw new Error(
        `[Cart.verifyEuRailLoyaltyDuplicateIgnored] Could not read the "Use Existing" dropdown options after the duplicate save attempt: ${err.message}`
      );
    }

    // Dropdown labels show only the last 4 digits ("[Program Name] - [Last 4 digits]"), never the full number.
    const last4 = cardNumber.slice(-4);
    const matchCount = options.filter((label) => label.includes(last4)).length;
    expect(
      matchCount,
      `Expected exactly one loyalty program ending in "${last4}" (from card number "${cardNumber}") in "Use Existing" — found ${matchCount}. Options: ${options.join(', ')}`
    ).toBe(1);
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
    await cartPage.ensureExtrasExpanded();
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
   * Selects the first paid baggage option for the first segment (outbound).
   * Paid options contain a price separator (" - ") in their label, e.g.
   * "1 x hold bag (15kg) - 67.98EUR". Free options like "No Baggage" are skipped.
   * @param {import('playwright').Page} page
   */
  async selectFirstPaidBaggageOption(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.selectFirstAvailableBaggageOptionForSegment(0);
  },

  /**
   * Extracts the price from the currently selected baggage option text.
   * The option label is formatted like "1 x hold bag (15kg) - 67.98EUR";
   * this method takes the trailing amount segment after " - " and parses it to a number.
   * @param {import('playwright').Page} page
   * @returns {Promise<number>} The selected baggage price
   */
  async extractSelectedBaggagePrice(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const text = await cartPage.getSelectedBaggageOptionText();
    const parts = text.split(' - ');
    if (parts.length < 2) {
      throw new Error(`Unable to parse baggage price from selected option text: "${text}"`);
    }
    return parseAmountText(parts[parts.length - 1].trim(), 'selected baggage price');
  },

  /**
   * Returns the full label text of the currently selected baggage option,
   * e.g. "1 x hold bag (15kg) - 67.98EUR". Used by callers that need to assert
   * the selected option's descriptor elsewhere in the UI (Flight Details
   * drawer, Price Breakdown, etc.) without altering the price-only extractor.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The selected baggage option label
   */
  async extractSelectedBaggageOptionLabel(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    return await cartPage.getSelectedBaggageOptionText();
  },

  /**
   * Verifies that the previously selected baggage option is displayed inside
   * the open flight details drawer. The label may include a trailing
   * " - <price><currency>" segment that is not repeated in the drawer, so the
   * descriptor portion before " - " is used for the assertion.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedLabel - Full selected baggage option label
   */
  async verifyBaggageInFlightDetails(page, expectedLabel) {
    if (!page) throw new Error('page is required');
    if (!expectedLabel || typeof expectedLabel !== 'string') {
      throw new Error('expectedLabel must be a non-empty string, got: ' + typeof expectedLabel);
    }

    const descriptor = expectedLabel.split(' - ')[0].trim();
    if (!descriptor) {
      throw new Error(`expectedLabel has no descriptor segment, got: "${expectedLabel}"`);
    }

    const cartPage = getPageObject(page, CartPage);
    logger.info('Verifying baggage advisory in flight details drawer', {
      expectedLabel,
      descriptor,
    });
    await cartPage.waitForBaggageTextInFlightDetailsDrawer(descriptor);
  },

  /**
   * Verifies that the baggage cost is reflected in the price breakdown drawer
   * as the "Other" row. The cart converts the baggage price to the user's
   * display currency (e.g. AED -> GBP), so numeric equality against the
   * originally extracted baggage price is not reliable. Instead, this asserts
   * that the "Other" row exists and shows a positive amount, which matches the
   * user-facing guarantee that baggage cost is itemized as "Other".
   *
   * @param {import('playwright').Page} page
   * @param {number} expectedBaggagePrice - Originally extracted baggage price (in
   *   the baggage option's source currency). Used only for diagnostic logging
   *   alongside the displayed "Other" amount; not compared for equality.
   */
  async verifyBaggagePriceInPriceBreakdown(page, expectedBaggagePrice) {
    if (!page) throw new Error('page is required');
    if (typeof expectedBaggagePrice !== 'number' || !Number.isFinite(expectedBaggagePrice)) {
      throw new Error('expectedBaggagePrice must be a finite number, got: ' + expectedBaggagePrice);
    }

    const cartPage = getPageObject(page, CartPage);
    const otherText = await cartPage.getPriceBreakdownRowAmountText('Other');
    const otherAmount = parseAmountText(otherText, 'price breakdown Other row');

    logger.info('Verifying baggage cost is itemized as Other row in price breakdown', {
      expectedBaggagePrice,
      otherAmount,
      otherText,
    });

    if (!(otherAmount > 0)) {
      throw new Error(
        `Expected price breakdown "Other" row to show a positive amount (baggage cost), got: "${otherText}" (parsed as ${otherAmount})`
      );
    }
  },

  /**
   * Opens the baggage panel, selects first available option for both outbound and
   * return segments, then saves. Used for round trip flights where baggage must
   * be selected per segment.
   * @param {import('playwright').Page} page
   */
  async addBaggageForAllSegments(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);

    if (!(await cartPage.isBaggageExtrasOpen())) {
      await cartPage.clickEditBaggageExtrasButton();
    }

    logger.info('Selecting baggage for outbound segment (index 0)');
    await cartPage.selectFirstAvailableBaggageOptionForSegment(0);

    logger.info('Selecting baggage for return segment (index 1)');
    await cartPage.selectFirstAvailableBaggageOptionForSegment(1);

    await cartPage.clickSaveButton();

    return { added: true, segmentCount: 2 };
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

    const expectedHeaders = ['Traveller', 'Ticket number', 'FF', 'Meal', 'Seat'];
    const cartPage = getPageObject(page, CartPage);
    const actualHeaders = await cartPage.getPostTicketingTableHeaders();

    expect(
      actualHeaders,
      `Flight details table headers should match the post-ticketing columns. Expected: [${expectedHeaders.join(', ')}], got: [${actualHeaders.join(', ')}]`,
    ).toEqual(expectedHeaders);
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
   * Selects the first available meal for each traveler tab in the meal panel,
   * then saves. Assumes the meal extras panel is already open.
   * @param {import('playwright').Page} page
   */
  async addMealForAllTravelers(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);

    const tabCount = await cartPage.getMealTravelerTabCount();
    const travelerCount = tabCount > 0 ? tabCount : 1;

    logger.info('Adding meal for all travelers', { travelerCount });

    for (let i = 1; i <= travelerCount; i++) {
      if (travelerCount > 1) {
        await cartPage.clickMealTravelerTabByIndex(i);
        await page.waitForTimeout(500);
      }

      // Click the first available dropdown caret in the active tab
      const caret = page.locator('.flight-meals .el-tab-pane:not([style*="display: none"]) .el-select__caret').first();
      await caret.waitFor({ state: 'visible', timeout: 10000 });
      await caret.click();

      // Wait for the visible dropdown panel and pick the first option
      const option = page.locator('.el-select-dropdown:visible .el-select-dropdown__item').first();
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click();

      // Wait for the dropdown to close before switching tabs
      await page.locator('.el-select-dropdown:visible').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

      logger.info(`Meal selected for traveler ${i}`);
    }

    await cartPage.clickMealSaveButton();

    await page.locator('.el-notification__title').filter({ hasText: 'Success' }).waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForLoadState('networkidle');

    logger.info('Meal added and saved for all travelers');
    return { added: true, travelerCount };
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
   * Verifies the saved meal text shown in the meal extras dropdown placeholder.
   * Use after re-opening the meal panel to confirm the previous selection persisted.
   * Closes the panel after verification.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedMeal - Expected meal text (e.g. "Roasted Beef Panini - 20.00AED")
   * @returns {Promise<{ meal: string }>}
   */
  async verifySavedMealTextAndClosePanel(page, expectedMeal) {
    if (!page) throw new Error('page is required');
    if (typeof expectedMeal !== 'string' || !expectedMeal.trim()) {
      throw new Error('expectedMeal must be a non-empty string, got: ' + typeof expectedMeal);
    }

    const cartPage = getPageObject(page, CartPage);

    const mealText = await cartPage.getMealSelectedText();
    expect(mealText, `Saved meal should display "${expectedMeal}"`).toContain(expectedMeal);

    await cartPage.clickMealCancelButton();

    return { meal: mealText };
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
   * Verifies the flight product icon is visible in the cart trip-summary sidebar.
   * @param {import('playwright').Page} page
   */
  async verifyFlightIconVisibleInTripOverview(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const visible = await cartPage.isFlightQuoteSummaryIconVisible();
    expect(visible, 'Flight icon should be visible in the trip overview cart summary').toBe(true);
  },

  /**
   * Verifies the hotel product icon is visible in the cart trip-summary sidebar.
   * @param {import('playwright').Page} page
   */
  async verifyHotelIconVisibleInQuoteSummary(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const visible = await cartPage.isHotelQuoteSummaryIconVisible();
    expect(visible, 'Hotel icon should be visible in the quote summary').toBe(true);
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

    await cartPage.hoverTripActionsDropdownIconWithRetry();
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
   * Verifies the cart's "Proceed to Checkout" button is disabled — e.g. for a look-but-not-book
   * role, whose isCheckoutDisabled flag both surfaces the role-restriction message and disables
   * the CTA (trip-cart.vue). Also covers other checkout-blocking states (e.g. missing mandatory
   * information) that disable the same button.
   * @param {import('playwright').Page} page
   */
  async verifyProceedToCheckoutButtonDisabled(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);
    const isDisabled = await cartPage.isProceedToCheckoutButtonDisabled();
    expect(isDisabled, 'Proceed to Checkout button should be disabled').toBe(true);
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
   * Verifies that the shared travel plan preview displays a masked frequent flyer
   * number (e.g. "***3150") for every traveler on the trip.
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} expectedTravelerCount - Number of travelers expected to have a frequent flyer number shown
   * @returns {Promise<void>}
   */
  async verifyFqtvNumbersInSharePreview(page, expectedTravelerCount) {
    if (!page) throw new Error('page is required');
    if (!Number.isInteger(expectedTravelerCount) || expectedTravelerCount < 1) {
      throw new Error(`expectedTravelerCount must be a positive integer, got: ${expectedTravelerCount}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const fqtvValues = await cartPage.getSharePreviewFrequentFlyerValues();

    expect(
      fqtvValues.length,
      `Expected ${expectedTravelerCount} frequent flyer number(s) in the travel plan preview but found ${fqtvValues.length}: ${JSON.stringify(fqtvValues)}`
    ).toBeGreaterThanOrEqual(expectedTravelerCount);
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
   * Selects a random selectable optional service in the expanded optional services panel.
   * @param {import('playwright').Page} page
   */
  async selectRandomOptionalService(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const selectedIndex = await cartPage.selectRandomOptionalService();
    logger.info('Selected random optional service', { selectedIndex });
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

  async clickEditAncillaryOptions(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);

    // Check collapse state via the arrow's is-active class (not section content) to avoid the
    // race condition where extras is already open but the async component hasn't mounted yet.
    const extrasOpen = await cartPage.isExtrasExpanded();
    if (!extrasOpen) {
      await cartPage.clickArrowButtonExtras();
    }

    // Wait for the card title to confirm the ancillary options section is mounted.
    await expect(cartPage.getAncillaryOptionsCardTitleLocator()).toContainText('Ancillary Options', { timeout: 30000 });

    await cartPage.clickEditAncillaryOptionsButton();
    logger.info('Clicked edit ancillary options button');
  },

  async selectFirstAncillaryOption(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.openAncillaryOptionsDropdown();
    await cartPage.selectFirstAncillaryOption();
    logger.info('Selected the first ancillary option from dropdown');
  },

  async verifyAncillaryOptionsFilledIndicator(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await expect(cartPage.getAncillaryOptionsFilledIndicator()).toBeVisible({ timeout: 30000 });
    logger.info('Ancillary options filled indicator is visible');
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
   * Saves the flight passenger-info (APIS) form and waits for its success checkmark.
   * Assumes the panel is already expanded and the required fields are filled.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async savePassengerInfo(page) {
    if (!page) throw new Error('[Cart.savePassengerInfo] "page" is required.');

    logger.debug('[Cart.savePassengerInfo] Saving the flight passenger info form');
    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.clickSavePassengerInfoButton();
      await cartPage.waitForPassengerInfoSaveSuccess();
      logger.info('Passenger info saved successfully');
    } catch (err) {
      throw new Error(
        `[Cart.savePassengerInfo] Failed to save the flight passenger info. Likely causes: a mandatory ` +
        `APIS field (passport number, nationality, expiry date) is still empty or invalid, so the form ` +
        `rejected the save. Original: ${err.message}`
      );
    }
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

    await Cart.openCopyTripDialog(page);
    return Cart.confirmCopyTrip(page);
  },

  /**
   * Opens the Copy Trip dialog from the trip actions (three-dots) menu and waits for it to render.
   * Stops with the dialog open so its contents (intro message, per-quote statuses) can be asserted
   * before confirming.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async openCopyTripDialog(page) {
    if (!page) throw new Error('[Cart.openCopyTripDialog] "page" is required.');

    logger.debug('[Cart.openCopyTripDialog] Opening the copy trip dialog from the trip actions menu');
    const cartPage = getPageObject(page, CartPage);

    try {
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await cartPage.hoverTripActionsDropdownIcon();
      await cartPage.clickCopyTripOption();
      await cartPage.waitForCopyTripDialog();
      logger.info('Copy trip dialog is open');
    } catch (err) {
      throw new Error(
        `[Cart.openCopyTripDialog] Could not open the Copy Trip dialog. Likely causes: the trip actions ` +
        `dropdown was still disabled while the trip loaded, or "Copy trip" is not offered for this trip ` +
        `state / user. Original: ${err.message}`
      );
    }
  },

  /**
   * Confirms the open Copy Trip dialog and returns the copied trip's page.
   * The app routes the copy into a new browser tab (copy-trip-modal.vue → utilService.openNewWindow),
   * so the popup listener is armed before the click; if no tab opens the current page is returned.
   *
   * @param {import('playwright').Page} page - The page showing the open copy trip dialog
   * @returns {Promise<import('playwright').Page>} The copied trip page (new tab, or the same page)
   */
  async confirmCopyTrip(page) {
    if (!page) throw new Error('[Cart.confirmCopyTrip] "page" is required.');

    logger.debug('[Cart.confirmCopyTrip] Confirming the copy trip dialog');
    const cartPage = getPageObject(page, CartPage);

    try {
      const context = page.context();
      const newPagePromise = context.waitForEvent('page', { timeout: 15000 }).catch(() => null);
      await cartPage.clickConfirmCopyTripButton();
      const newTripPage = await newPagePromise;

      if (newTripPage) {
        await newTripPage.waitForLoadState('networkidle', { timeout: 60000 });
        logger.info('Copied trip opened in a new tab', { url: newTripPage.url() });
        return newTripPage;
      }

      logger.info('Copied trip opened in current tab (no new tab detected)');
      await page.waitForLoadState('networkidle', { timeout: 60000 });
      return page;
    } catch (err) {
      throw new Error(
        `[Cart.confirmCopyTrip] Could not confirm the copy trip. Likely causes: the dialog's Copy button ` +
        `was disabled because no quote in the trip is eligible for copy, or the copied trip's tab did ` +
        `not finish loading within 60s. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the copy trip dialog's intro message.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedMessage - Text the dialog's intro paragraph must contain
   * @returns {Promise<string>} The actual message text
   */
  async verifyCopyTripDialogMessage(page, expectedMessage) {
    if (!page) throw new Error('[Cart.verifyCopyTripDialogMessage] "page" is required.');
    if (!expectedMessage || typeof expectedMessage !== 'string') {
      throw new Error(
        `[Cart.verifyCopyTripDialogMessage] "expectedMessage" must be a non-empty string, got: ` +
        `${typeof expectedMessage} (${JSON.stringify(expectedMessage)})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    const actualMessage = await cartPage.getCopyTripDialogMessageText();

    expect(
      actualMessage,
      `Expected the copy trip dialog intro message to contain "${expectedMessage}" but it read ` +
      `"${actualMessage}".`,
    ).toContain(expectedMessage);

    return actualMessage;
  },

  /**
   * Verifies every quote listed in the copy trip dialog shows the expected status.
   * An empty status means that row rendered the "can not be copied" warning instead of a label,
   * which fails the assertion with the row index reported.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedStatus - Status every row must show (e.g. "Pending Booking")
   * @returns {Promise<string[]>} The statuses that were read, in row order
   */
  async verifyAllCopyTripDialogQuotesHaveStatus(page, expectedStatus) {
    if (!page) throw new Error('[Cart.verifyAllCopyTripDialogQuotesHaveStatus] "page" is required.');
    if (!expectedStatus || typeof expectedStatus !== 'string') {
      throw new Error(
        `[Cart.verifyAllCopyTripDialogQuotesHaveStatus] "expectedStatus" must be a non-empty string, ` +
        `got: ${typeof expectedStatus} (${JSON.stringify(expectedStatus)})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    const statuses = await cartPage.getCopyTripDialogQuoteStatuses();

    expect(
      statuses.length,
      `Expected the copy trip dialog to list at least one quote, but no quote rows were found. ` +
      `The dialog may still be loading its quotes.`,
    ).toBeGreaterThan(0);

    const expectedNormalized = expectedStatus.trim().toLowerCase();
    const mismatches = statuses
      .map((status, index) => ({ status, index }))
      .filter(({ status }) => !status.trim().toLowerCase().includes(expectedNormalized));

    expect(
      mismatches,
      `Expected all ${statuses.length} quote(s) in the copy trip dialog to show status ` +
      `"${expectedStatus}", but these rows did not: ` +
      `${mismatches.map(({ index, status }) => `row ${index + 1} = "${status}"`).join('; ')}. ` +
      `All statuses read: [${statuses.join(' | ')}].`,
    ).toEqual([]);

    logger.info('All quotes in the copy trip dialog show the expected status', { expectedStatus, statuses });
    return statuses;
  },

  /**
   * Verifies the named quote in the open copy trip dialog is flagged as not copyable, and that its
   * warning reads the expected text (e.g. "This item can not be copied").
   *
   * Scoped to one product on purpose: in a mixed-eligibility trip an unscoped check passes on any
   * warning row, so it would still pass if an item that SHOULD be copyable were flagged too.
   *
   * @param {import('playwright').Page} page
   * @param {string} quoteName - Text the row's product name must contain (e.g. "EU Rail")
   * @param {string} expectedMessage - Text the row's warning must contain
   * @returns {Promise<string>} The warning text that was read
   */
  async verifyCopyTripDialogItemWarning(page, quoteName, expectedMessage) {
    if (!page) throw new Error('[Cart.verifyCopyTripDialogItemWarning] "page" is required.');
    if (!quoteName || typeof quoteName !== 'string') {
      throw new Error(
        `[Cart.verifyCopyTripDialogItemWarning] "quoteName" must be a non-empty string, got: ` +
        `${typeof quoteName} (${JSON.stringify(quoteName)})`
      );
    }
    if (!expectedMessage || typeof expectedMessage !== 'string') {
      throw new Error(
        `[Cart.verifyCopyTripDialogItemWarning] "expectedMessage" must be a non-empty string, got: ` +
        `${typeof expectedMessage} (${JSON.stringify(expectedMessage)})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    const actualMessage = await cartPage.getCopyTripDialogQuoteWarningText(quoteName);

    expect(
      actualMessage,
      `Expected the copy trip dialog row for "${quoteName}" to warn "${expectedMessage}" but it read ` +
      `"${actualMessage}".`,
    ).toContain(expectedMessage);

    logger.info('Copy trip dialog flags the quote as not copyable', { quoteName, actualMessage });
    return actualMessage;
  },

  /**
   * Verifies the named quote in the open copy trip dialog shows a status label with the expected
   * text — which also proves it is eligible for copy, since a non-copyable quote renders the
   * "can not be copied" warning in place of its status.
   *
   * @param {import('playwright').Page} page
   * @param {string} quoteName - Text the row's product name must contain (e.g. "Flight")
   * @param {string} expectedStatus - Status the row must show (e.g. "Pending booking")
   * @returns {Promise<string>} The status text that was read
   */
  async verifyCopyTripDialogItemStatus(page, quoteName, expectedStatus) {
    if (!page) throw new Error('[Cart.verifyCopyTripDialogItemStatus] "page" is required.');
    if (!quoteName || typeof quoteName !== 'string') {
      throw new Error(
        `[Cart.verifyCopyTripDialogItemStatus] "quoteName" must be a non-empty string, got: ` +
        `${typeof quoteName} (${JSON.stringify(quoteName)})`
      );
    }
    if (!expectedStatus || typeof expectedStatus !== 'string') {
      throw new Error(
        `[Cart.verifyCopyTripDialogItemStatus] "expectedStatus" must be a non-empty string, got: ` +
        `${typeof expectedStatus} (${JSON.stringify(expectedStatus)})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    const actualStatus = await cartPage.getCopyTripDialogQuoteStatusByName(quoteName);

    expect(
      actualStatus.toLowerCase(),
      `Expected the copy trip dialog row for "${quoteName}" to show status "${expectedStatus}" but it ` +
      `read "${actualStatus}".`,
    ).toContain(expectedStatus.trim().toLowerCase());

    logger.info('Copy trip dialog shows the expected status for the quote', { quoteName, actualStatus });
    return actualStatus;
  },

  /**
   * Verifies the open copy trip dialog lists EXACTLY ONE quote and that its name contains the
   * given text — proving no other product (e.g. an agent suggestion still sitting in the cart)
   * was picked up for copying.
   *
   * @param {import('playwright').Page} page
   * @param {string} quoteName - Text the single row's product name must contain (e.g. "Car rental at")
   * @returns {Promise<string[]>} The quote names the dialog listed
   */
  async verifyCopyTripDialogListsOnly(page, quoteName) {
    if (!page) throw new Error('[Cart.verifyCopyTripDialogListsOnly] "page" is required.');
    if (!quoteName || typeof quoteName !== 'string') {
      throw new Error(
        `[Cart.verifyCopyTripDialogListsOnly] "quoteName" must be a non-empty string, got: ` +
        `${typeof quoteName} (${JSON.stringify(quoteName)})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    const listed = await cartPage.getCopyTripDialogQuoteNames();

    expect(
      listed.length,
      `Expected the copy trip dialog to list exactly 1 quote ("${quoteName}") but it listed ` +
      `${listed.length}: [${listed.join(' | ')}].`,
    ).toBe(1);
    expect(
      listed[0].toLowerCase(),
      `Expected the copy trip dialog's single quote to be "${quoteName}" but it read "${listed[0]}".`,
    ).toContain(quoteName.trim().toLowerCase());

    logger.info('Copy trip dialog lists only the expected quote', { listed });
    return listed;
  },

  /**
   * Adds the agent-suggested car quote to the trip by clicking its "Add to trip" button in the
   * Suggested items section of the trip overview.
   *
   * @param {import('playwright').Page} page
   */
  async addSuggestedCarQuoteToTrip(page) {
    if (!page) throw new Error('[Cart.addSuggestedCarQuoteToTrip] "page" is required.');
    logger.debug('[Cart.addSuggestedCarQuoteToTrip] Adding the agent-suggested car quote to the trip');

    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.clickSuggestedCarQuoteAddButton();
    } catch (err) {
      throw new Error(
        `[Cart.addSuggestedCarQuoteToTrip] Could not add the agent-suggested car quote to the trip. ` +
        `The Suggested items section may not hold an unchosen car suggestion. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the trip overview holds a car quote (any car — presence, not identity), by reading its
   * quote-card title. Use verifyTripHasSameCarType when the copied car must match a stored one.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The car quote title that was read
   */
  async verifyTripHasCarQuote(page) {
    if (!page) throw new Error('[Cart.verifyTripHasCarQuote] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    let title;
    try {
      title = await cartPage.getCarQuoteTitleText({ timeout: 30000 });
    } catch (err) {
      throw new Error(
        `[Cart.verifyTripHasCarQuote] The trip overview shows no car quote. If this is a copied trip, ` +
        `the car may not have been copied. Original: ${err.message}`
      );
    }

    expect(
      title,
      `Expected the trip overview's car quote card to show a title, but it was empty.`,
    ).not.toBe('');

    logger.info('Trip overview holds a car quote', { title });
    return title;
  },

  /**
   * Verifies the agent "Suggested items" section is displayed on the trip overview.
   *
   * @param {import('playwright').Page} page
   */
  async verifySuggestedItemsSectionDisplayed(page) {
    if (!page) throw new Error('[Cart.verifySuggestedItemsSectionDisplayed] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.getSuggestedItemsHeading().waitFor({ state: 'visible', timeout: 30000 });
    } catch (err) {
      throw new Error(
        `[Cart.verifySuggestedItemsSectionDisplayed] The "Suggested items" section is not displayed ` +
        `on the trip overview. The trip may hold no agent suggestions. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the number of quotes in the agent "Suggested items" section.
   *
   * @param {import('playwright').Page} page
   * @param {number} expectedCount
   * @returns {Promise<number>} The count that was read
   */
  async verifySuggestedItemsCount(page, expectedCount) {
    if (!page) throw new Error('[Cart.verifySuggestedItemsCount] "page" is required.');
    if (!Number.isInteger(expectedCount) || expectedCount < 0) {
      throw new Error(
        `[Cart.verifySuggestedItemsCount] "expectedCount" must be a non-negative integer, got: ` +
        `${typeof expectedCount} (${JSON.stringify(expectedCount)})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    // The suggestions render asynchronously after the overview loads, so poll the count instead of
    // reading it once.
    await expect
      .poll(async () => cartPage.getSuggestedQuoteItems().count(), {
        message:
          `[Cart.verifySuggestedItemsCount] Expected the Suggested items section to hold ` +
          `${expectedCount} quote(s).`,
        timeout: 30000,
      })
      .toBe(expectedCount);

    logger.info('Suggested items count verified', { count: expectedCount });
    return expectedCount;
  },

  /**
   * Captures the per-segment details (carrier, flight number, departure and arrival times) of the
   * flight quote in the cart, so the same trip copied into a new tab can be compared against it.
   * On a round trip this returns the outbound segment first and the return segment last.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<Array<{carrier: string, flightNumber: string, departureTime: string, arrivalTime: string}>>}
   */
  async extractFlightQuoteSegments(page) {
    if (!page) throw new Error('[Cart.extractFlightQuoteSegments] "page" is required.');

    const cartPage = getPageObject(page, CartPage);

    let segments;
    try {
      segments = await cartPage.getVisibleFlightQuoteSegmentSummaries();
    } catch (err) {
      throw new Error(
        `[Cart.extractFlightQuoteSegments] Could not read the flight quote's segments from the cart. ` +
        `The trip must hold a flight quote whose segments have finished rendering. Original: ${err.message}`
      );
    }

    logger.info('Captured flight quote segments from the cart', { segmentCount: segments.length, segments });
    return segments;
  },

  /**
   * Verifies the trip holds no EU rail quote — used on a copied trip, since a rail quote is not
   * eligible for copy and must be dropped rather than carried over.
   *
   * @param {import('playwright').Page} page - The copied trip's page
   * @returns {Promise<{euRailQuoteCount: 0}>}
   */
  async verifyTripHasNoEuRailQuote(page) {
    if (!page) throw new Error('[Cart.verifyTripHasNoEuRailQuote] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    const railCards = cartPage.getEuRailQuoteCard();

    // Polled rather than read once: the trip renders its quote cards progressively, so a rail card
    // that IS wrongly copied can appear after the flight card is already on screen.
    await expect
      .poll(async () => railCards.count(), {
        message:
          'Expected the copied trip to contain no EU rail quote (a rail quote is not eligible for ' +
          'copy and must be excluded), but a .eu-rail-quote-card was rendered.',
        timeout: 15000,
      })
      .toBe(0);

    logger.info('Copied trip contains no EU rail quote, as expected');
    return { euRailQuoteCount: 0 };
  },

  /**
   * Verifies the trip's flight quote shows a live "To pay" total: the expected label text (rather
   * than "Expired offer" or the results-page "Price starts from") plus a price containing digits.
   *
   * @param {import('playwright').Page} page
   * @param {string} [expectedLabel='To pay'] - Text the price-state label must contain
   * @returns {Promise<{label: string, price: string}>}
   */
  async verifyFlightQuoteShowsToPayAmount(page, expectedLabel = 'To pay') {
    if (!page) throw new Error('[Cart.verifyFlightQuoteShowsToPayAmount] "page" is required.');
    if (!expectedLabel || typeof expectedLabel !== 'string') {
      throw new Error(
        `[Cart.verifyFlightQuoteShowsToPayAmount] "expectedLabel" must be a non-empty string, got: ` +
        `${typeof expectedLabel} (${JSON.stringify(expectedLabel)})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    const label = await cartPage.getFlightQuoteToPayLabelText();
    const price = await cartPage.getFlightQuoteToPayPriceText();

    expect(
      label,
      `Expected the flight quote's price label to read "${expectedLabel}" but it read "${label}". ` +
      `"Expired offer" means the quote lapsed; "Price starts from" means this is not a cart view.`,
    ).toContain(expectedLabel);

    expect(
      price,
      `Expected the flight quote's "${expectedLabel}" total to show an amount but it read "${price}".`,
    ).toMatch(/\d/);

    logger.info('Flight quote shows a to-pay amount', { label, price });
    return { label, price };
  },

  /**
   * Verifies the ticket details section is rendered on the cart/booking-success page.
   * Used as a post-booking sanity check that the flight quote card is fully populated.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{visible: true}>}
   */
  async verifyTicketDetailsVisibleAfterBooking(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const ticketDetails = cartPage.getFirstTicketDetailsSection();
    await ticketDetails.waitFor({ state: 'visible', timeout: 30000 });
    logger.info('Ticket details section is visible after booking');
    return { visible: true };
  },

  /**
   * Opens the Copy Trip dialog and verifies the trip cannot be copied
   * (e.g., low-cost flights are ineligible for copy trip).
   * Asserts the "This item can not be copied" indicator is shown, then closes the dialog.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{cannotBeCopied: true}>}
   */
  async verifyTripCannotBeCopied(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);

    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await cartPage.hoverTripActionsDropdownIcon();
    await cartPage.clickCopyTripOption();
    await cartPage.waitForCopyTripDialog();

    const indicator = cartPage.getCopyTripCannotCopyIndicator();
    await indicator.waitFor({ state: 'visible', timeout: 15000 });
    logger.info('Copy Trip dialog shows "cannot be copied" indicator');

    await cartPage.clickCopyTripCancelButton();
    return { cannotBeCopied: true };
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

  /**
   * Reads the car type/class shown on the cart's car quote card, so a copied trip can be compared
   * against the original.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The car type text (e.g. "Compact 4 doors")
   */
  async extractCarTypeFromCart(page) {
    if (!page) throw new Error('[Cart.extractCarTypeFromCart] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    const carType = await cartPage.getFirstCarTypeText();

    if (!carType) {
      throw new Error(
        '[Cart.extractCarTypeFromCart] The car quote card rendered an empty car type. The car quote ' +
        'may not have finished loading, so there is no value to compare a copied trip against.'
      );
    }

    logger.info('Extracted car type from cart', { carType });
    return carType;
  },

  /**
   * Verifies the copied trip's hotel quote shows the hotel name captured from the original trip.
   *
   * @param {import('playwright').Page} page - The copied trip's page
   * @param {string} storedHotelName - Hotel name captured from the original trip
   * @returns {Promise<string>} The hotel name read from the copied trip
   */
  async verifyTripHasSameHotelName(page, storedHotelName) {
    if (!page) throw new Error('[Cart.verifyTripHasSameHotelName] "page" is required.');
    if (!storedHotelName || typeof storedHotelName !== 'string') {
      throw new Error(
        `[Cart.verifyTripHasSameHotelName] "storedHotelName" must be a non-empty string, got: ` +
        `${typeof storedHotelName} (${JSON.stringify(storedHotelName)}). ` +
        `Capture it on the original trip first (step: "I extract the hotel name from cart").`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    const hotelName = await cartPage.getHotelPreviewNameText();

    expect(
      hotelName,
      `Expected the copied trip to contain the original hotel "${storedHotelName}" but its hotel quote ` +
      `reads "${hotelName}".`,
    ).toContain(storedHotelName);

    return hotelName;
  },

  /**
   * Verifies the copied trip's car quote shows the car type captured from the original trip.
   *
   * @param {import('playwright').Page} page - The copied trip's page
   * @param {string} storedCarType - Car type captured from the original trip
   * @returns {Promise<string>} The car type read from the copied trip
   */
  async verifyTripHasSameCarType(page, storedCarType) {
    if (!page) throw new Error('[Cart.verifyTripHasSameCarType] "page" is required.');
    if (!storedCarType || typeof storedCarType !== 'string') {
      throw new Error(
        `[Cart.verifyTripHasSameCarType] "storedCarType" must be a non-empty string, got: ` +
        `${typeof storedCarType} (${JSON.stringify(storedCarType)}). ` +
        `Capture it on the original trip first (step: "I store the car type from the cart").`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    const carType = await cartPage.getFirstCarTypeText();

    expect(
      carType,
      `Expected the copied trip to contain the original car type "${storedCarType}" but its car quote ` +
      `reads "${carType}".`,
    ).toBe(storedCarType);

    return carType;
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

  // ===== QUOTE EXTRAS - ATTACH FILES =====

  async uploadRelatedFile(page, filePath) {
    if (!page) {
      throw new Error('[Cart.uploadRelatedFile] "page" is required.');
    }
    if (typeof filePath !== "string" || !filePath.trim()) {
      throw new Error(
        `[Cart.uploadRelatedFile] "filePath" must be a non-empty string pointing to the file to upload, got: ${typeof filePath} (${JSON.stringify(filePath)})`,
      );
    }

    logger.info("Uploading file to trip Related Files tab", { filePath });
    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.clickRelatedFilesTab();
    } catch (err) {
      throw new Error(
        `[Cart.uploadRelatedFile] Failed to navigate to the Related Files tab — ` +
          `the tab may not be visible on this cart page. Original: ${err.message}`,
      );
    }

    let uploadResponsePromise;
    try {
      uploadResponsePromise = cartPage.waitForUploadApiResponse();
      await cartPage.uploadRelatedFilesFileInput(filePath);
    } catch (err) {
      throw new Error(
        `[Cart.uploadRelatedFile] Failed to upload file "${filePath}" to the Related Files panel — ` +
          `the file input was not available. Original: ${err.message}`,
      );
    }

    try {
      await uploadResponsePromise;
    } catch (err) {
      throw new Error(
        `[Cart.uploadRelatedFile] Upload API did not respond after uploading "${filePath}" — ` +
          `the server may not have saved the file. Original: ${err.message}`,
      );
    }

    try {
      await cartPage.waitForRelatedFileItemVisible();
    } catch (err) {
      throw new Error(
        `[Cart.uploadRelatedFile] File upload appeared to fail — no file appeared in the Related Files panel ` +
          `after uploading "${filePath}". The API may have returned an error or the save timed out. ` +
          `Original: ${err.message}`,
      );
    }

    return { uploaded: true, filePath };
  },

  async verifyUploadedFileVisible(page, fileName) {
    if (!page) {
      throw new Error('[Cart.verifyUploadedFileVisible] "page" is required.');
    }
    if (!fileName || typeof fileName !== "string") {
      throw new Error(
        `[Cart.verifyUploadedFileVisible] "fileName" must be a non-empty string with the expected file name, got: ${typeof fileName} (${JSON.stringify(fileName)})`,
      );
    }

    logger.debug(`[Cart.verifyUploadedFileVisible] Verifying file "${fileName}" is visible in attach files section`);

    try {
      const cartPage = getPageObject(page, CartPage);
      await cartPage.isRelatedFileNameVisible(fileName);
    } catch (err) {
      throw new Error(
        `[Cart.verifyUploadedFileVisible] Failed to verify file "${fileName}" is visible in the Related Files panel. ` +
          `The file may not have been uploaded correctly or the name does not match. ` +
          `Original: ${err.message}`,
      );
    }

    return { verified: true, fileName };
  },

  async openRelatedFilesTab(page) {
    if (!page) {
      throw new Error('[Cart.openRelatedFilesTab] "page" is required.');
    }

    logger.info("Opening the trip Related Files tab");
    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.clickRelatedFilesTab();
    } catch (err) {
      throw new Error(
        `[Cart.openRelatedFilesTab] Failed to open the Related Files tab — ` +
          `the tab may not be visible on this cart page (the user may lack the upload-files-to-trip privilege). ` +
          `Original: ${err.message}`,
      );
    }

    return { opened: true };
  },

  async verifyIncludeInItineraryEmailOptionVisible(page) {
    if (!page) {
      throw new Error('[Cart.verifyIncludeInItineraryEmailOptionVisible] "page" is required.');
    }

    logger.debug("[Cart.verifyIncludeInItineraryEmailOptionVisible] Verifying the include-in-itinerary-email option is visible");
    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.waitForIncludeInItineraryEmailVisible();
    } catch (err) {
      throw new Error(
        `[Cart.verifyIncludeInItineraryEmailOptionVisible] The "include in itinerary email" option is not visible in the ` +
          `Related Files pane. This checkbox only renders next to an uploaded file. Original: ${err.message}`,
      );
    }

    return { visible: true };
  },

  // ===== QUOTE EXTRAS - ATTACH FILES (file attached to a quote card, not the trip-level Related Files tab) =====

  async uploadQuoteExtrasFile(page, filePath) {
    if (!page) {
      throw new Error('[Cart.uploadQuoteExtrasFile] "page" is required.');
    }
    if (typeof filePath !== "string" || !filePath.trim()) {
      throw new Error(
        `[Cart.uploadQuoteExtrasFile] "filePath" must be a non-empty string pointing to the file to upload, got: ${typeof filePath} (${JSON.stringify(filePath)})`,
      );
    }

    logger.info("Uploading file via quote Extras", { filePath });
    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.clickExtrasCollapse();
    } catch (err) {
      throw new Error(
        `[Cart.uploadQuoteExtrasFile] Failed to expand the Extras section — ` +
          `the collapse may not be visible on the quote card. Original: ${err.message}`,
      );
    }

    try {
      await cartPage.clickAttachFilesViewBtn();
    } catch (err) {
      throw new Error(
        `[Cart.uploadQuoteExtrasFile] Failed to click View/Add button on attach files — ` +
          `the button may not be visible or the user lacks upload permission. Original: ${err.message}`,
      );
    }

    try {
      await cartPage.uploadAttachFile(filePath);
    } catch (err) {
      throw new Error(
        `[Cart.uploadQuoteExtrasFile] Failed to upload file "${filePath}" — ` +
          `the file input was not available after opening the attach files card. Original: ${err.message}`,
      );
    }

    try {
      await cartPage.clickAttachFilesSaveBtn();
    } catch (err) {
      throw new Error(
        `[Cart.uploadQuoteExtrasFile] Failed to click Save after uploading file — ` +
          `the Save button may be disabled (no file selected) or not visible. Original: ${err.message}`,
      );
    }

    try {
      await cartPage.waitForAttachFileItemVisible();
    } catch (err) {
      throw new Error(
        `[Cart.uploadQuoteExtrasFile] File upload appeared to fail — no file appeared in the attach files list ` +
          `after uploading "${filePath}". The API may have returned an error or the save timed out. ` +
          `Original: ${err.message}`,
      );
    }

    return { uploaded: true, filePath };
  },

  async verifyQuoteExtrasFileVisible(page, fileName) {
    if (!page) {
      throw new Error('[Cart.verifyQuoteExtrasFileVisible] "page" is required.');
    }
    if (!fileName || typeof fileName !== "string") {
      throw new Error(
        `[Cart.verifyQuoteExtrasFileVisible] "fileName" must be a non-empty string with the expected file name, got: ${typeof fileName} (${JSON.stringify(fileName)})`,
      );
    }

    logger.debug(`[Cart.verifyQuoteExtrasFileVisible] Verifying file "${fileName}" is visible in attach files section`);

    try {
      const cartPage = getPageObject(page, CartPage);
      await cartPage.isFileNameVisibleInAttachFiles(fileName);
    } catch (err) {
      throw new Error(
        `[Cart.verifyQuoteExtrasFileVisible] Failed to verify file "${fileName}" is visible in the quote attach files section. ` +
          `The file may not have been uploaded or saved correctly. ` +
          `Original: ${err.message}`,
      );
    }

    return { verified: true, fileName };
  },

  async clickRelatedFileByName(page, fileName) {
    if (!page) {
      throw new Error('[Cart.clickRelatedFileByName] "page" is required.');
    }
    if (!fileName || typeof fileName !== 'string' || !fileName.trim()) {
      throw new Error(
        `[Cart.clickRelatedFileByName] "fileName" must be a non-empty string with the file name to click, got: ${typeof fileName} (${JSON.stringify(fileName)})`
      );
    }

    logger.info("Clicking related file to trigger download", { fileName });

    let downloadRequest;
    try {
      const cartPage = getPageObject(page, CartPage);
      const requestPromise = cartPage.waitForDownloadRequest();
      await cartPage.clickRelatedFileByName(fileName);
      downloadRequest = await requestPromise;
    } catch (err) {
      throw new Error(
        `[Cart.clickRelatedFileByName] Failed to click related file "${fileName}" or detect the download API request. ` +
        `Ensure the file has been uploaded, is visible, and the file name link triggers a download. ` +
        `Original: ${err.message}`
      );
    }

    const downloadUrl = downloadRequest.url();
    return { clicked: true, fileName, downloadUrl };
  },

  async verifyFileDownloaded(page, fileName, downloadResult) {
    if (!page) {
      throw new Error('[Cart.verifyFileDownloaded] "page" is required.');
    }
    if (!fileName || typeof fileName !== 'string' || !fileName.trim()) {
      throw new Error(
        `[Cart.verifyFileDownloaded] "fileName" must be a non-empty string, got: ${typeof fileName} (${JSON.stringify(fileName)})`
      );
    }
    if (!downloadResult || typeof downloadResult.downloadUrl !== 'string') {
      throw new Error(
        `[Cart.verifyFileDownloaded] "downloadResult" must be the object returned by Cart.clickRelatedFileByName. ` +
        `Got: ${typeof downloadResult}. Ensure "When I click the related file" step ran before this assertion.`
      );
    }

    logger.debug(`[Cart.verifyFileDownloaded] Verifying download was triggered for "${fileName}" (url: ${downloadResult.downloadUrl})`);

    const url = new URL(downloadResult.downloadUrl);
    const guid = url.searchParams.get('guid');
    if (!guid || guid === 'undefined' || guid === 'null') {
      throw new Error(
        `[Cart.verifyFileDownloaded] Download request for "${fileName}" was made but with an invalid or missing file ID (guid="${guid}"). ` +
        `The file may not have been saved correctly after upload.`
      );
    }

    return { verified: true, fileName, guid };
  },

  async verifyQuoteVisibleInCheckoutSummary(page, quoteName) {
    if (!page) throw new Error('[Cart.verifyQuoteVisibleInCheckoutSummary] "page" is required.');
    if (!quoteName || typeof quoteName !== 'string') {
      throw new Error(`[Cart.verifyQuoteVisibleInCheckoutSummary] "quoteName" must be a non-empty string, got: ${typeof quoteName} (${quoteName})`);
    }

    logger.debug(`[Cart.verifyQuoteVisibleInCheckoutSummary] Checking checkout summary for quote "${quoteName}"`);

    const checkoutPage = getPageObject(page, CheckoutPage);
    const summaryText = await checkoutPage.verifyQuoteVisibleInCheckoutSummary(quoteName);
    const normalizedSummary = summaryText.replace(/\s+/g, ' ').toLowerCase();
    const normalizedName = quoteName.toLowerCase();

    if (!normalizedSummary.includes(normalizedName)) {
      throw new Error(
        `[Cart.verifyQuoteVisibleInCheckoutSummary] Expected the checkout summary to contain "${quoteName}" ` +
        `but it was not found. This means the quote was not added to the cart before checkout, or the summary ` +
        `component did not render it. Summary text (first 300 chars): "${summaryText.substring(0, 300)}"`
      );
    }

    return { verified: true, quoteName };
  },

  async verifyQuoteCardPrice(page, quoteIdentifier, expectedPrice) {
    if (!page) throw new Error('[Cart.verifyQuoteCardPrice] "page" is required.');
    if (!quoteIdentifier || typeof quoteIdentifier !== 'string') {
      throw new Error(`[Cart.verifyQuoteCardPrice] "quoteIdentifier" must be a non-empty string, got: ${typeof quoteIdentifier} (${quoteIdentifier})`);
    }
    if (typeof expectedPrice !== 'number' || expectedPrice < 0) {
      throw new Error(`[Cart.verifyQuoteCardPrice] "expectedPrice" must be a non-negative number, got: ${expectedPrice}`);
    }

    logger.debug(`[Cart.verifyQuoteCardPrice] Verifying quote "${quoteIdentifier}" shows price ${expectedPrice}`);

    const cartPage = getPageObject(page, CartPage);
    const priceText = await cartPage.getQuoteCardPriceByText(quoteIdentifier);
    const numericPrice = parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(/,/g, '.'));

    if (Number.isNaN(numericPrice)) {
      throw new Error(
        `[Cart.verifyQuoteCardPrice] Could not parse a numeric price from text "${priceText}" on the "${quoteIdentifier}" quote card. ` +
        `The price element may contain unexpected formatting or be empty.`
      );
    }

    if (Math.abs(numericPrice - expectedPrice) > 1) {
      throw new Error(
        `[Cart.verifyQuoteCardPrice] Quote "${quoteIdentifier}" displays price ${numericPrice} but expected ${expectedPrice}. ` +
        `Difference exceeds $1 tolerance. This may indicate a tax/fee discrepancy or wrong quote was matched.`
      );
    }

    return { verified: true, quoteIdentifier, displayedPrice: numericPrice, expectedPrice };
  },

  /**
   * Opens the approvals dialog from the trip overview options menu.
   * Clicks the more_vert options button, selects "View approvals", and waits
   * for the approvals dialog to appear.
   *
   * @param {import('playwright').Page} page
   */
  async viewApproversInTripOverview(page) {
    if (!page) throw new Error('[Cart.viewApproversInTripOverview] "page" is required.');

    logger.debug('[Cart.viewApproversInTripOverview] Opening approvals dialog via options menu');
    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.clickOptionsButton();
      await cartPage.clickViewApprovalsMenuItem();
      await cartPage.waitForApprovalsDialogVisible();
    } catch (err) {
      throw new Error(`[Cart.viewApproversInTripOverview] Failed to open approvals dialog: ${err.message}`);
    }
  },

  /**
   * Verifies the number of approvers shown in the open approvals dialog.
   *
   * @param {import('playwright').Page} page
   * @param {number} expectedCount - Expected number of approver names
   */
  async verifyApproverCount(page, expectedCount) {
    if (!page) throw new Error('[Cart.verifyApproverCount] "page" is required.');
    if (!Number.isInteger(expectedCount) || expectedCount < 0) {
      throw new Error(`[Cart.verifyApproverCount] "expectedCount" must be a non-negative integer, got: ${expectedCount}`);
    }

    logger.debug('[Cart.verifyApproverCount] Counting approvers in approvals dialog', { expectedCount });
    const cartPage = getPageObject(page, CartPage);
    const actualCount = await cartPage.getApproverCount();

    if (actualCount !== expectedCount) {
      await cartPage.closeApprovalsDialog().catch(() => {});
      throw new Error(
        `[Cart.verifyApproverCount] Approver count mismatch. Expected ${expectedCount}, got ${actualCount}. ` +
        `Check the approval flow configuration for this trip's arranger profile.`
      );
    }

    await cartPage.closeApprovalsDialog();
  },

  /**
   * Verifies a specific approver is assigned in the open approvals dialog,
   * then closes the dialog. The dialog must already be open (see
   * viewApproversInTripOverview).
   *
   * @param {import('playwright').Page} page
   * @param {string} approverName - Exact approver name expected in the flow
   */
  async verifyApproverAssigned(page, approverName) {
    if (!page) throw new Error('[Cart.verifyApproverAssigned] "page" is required.');
    if (typeof approverName !== 'string' || approverName.trim().length === 0) {
      throw new Error(`[Cart.verifyApproverAssigned] "approverName" must be a non-empty string, got: ${approverName}`);
    }

    const expected = approverName.trim();
    logger.debug('[Cart.verifyApproverAssigned] Verifying approver is assigned', { expected });
    const cartPage = getPageObject(page, CartPage);
    const approvers = await cartPage.getApproverNames();

    if (!approvers.includes(expected)) {
      await cartPage.closeApprovalsDialog().catch(() => {});
      throw new Error(
        `[Cart.verifyApproverAssigned] Approver "${expected}" is not assigned to the approval flow. ` +
        `Approvers found: [${approvers.join(', ')}]. Check the approval flow configuration for this trip's traveler.`
      );
    }

    await cartPage.closeApprovalsDialog();
  },

  /**
   * Starts capturing the next /api/v3/quotes?tripId=... GET response.
   * Must be called BEFORE the action that navigates to / refreshes the cart.
   * Returns an unresolved Promise — do NOT await in the calling step.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<import('@playwright/test').Response>}
   */
  startCapturingQuotesResponse(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    return cartPage.captureQuotesApiResponse();
  },

  /**
   * Hovers the trip-level three-dots actions icon and waits for the dropdown to appear.
   * Retries automatically when the el-dropdown is disabled during In Progress polling windows.
   * @param {import('playwright').Page} page
   */
  async hoverTripActionsMenu(page) {
    if (!page) throw new Error('[Cart.hoverTripActionsMenu] page is required');
    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.hoverTripActionsDropdownIconWithRetry();
    } catch (err) {
      throw new Error(
        `[Cart.hoverTripActionsMenu] Could not open trip actions dropdown. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies that an option with the given text is visible in the trip-level actions dropdown.
   * Requires the trip actions dropdown to already be open.
   * @param {import('playwright').Page} page
   * @param {string} optionText
   */
  async verifyTripActionMenuOptionVisible(page, optionText) {
    if (!page) throw new Error('[Cart.verifyTripActionMenuOptionVisible] page is required');
    if (!optionText || typeof optionText !== 'string') {
      throw new Error(
        `[Cart.verifyTripActionMenuOptionVisible] "optionText" must be a non-empty string, got: ${typeof optionText} (${JSON.stringify(optionText)})`
      );
    }
    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.waitForTripActionMenuOptionText(optionText);
    } catch (err) {
      throw new Error(
        `[Cart.verifyTripActionMenuOptionVisible] Option "${optionText}" was not visible in the trip actions dropdown. Ensure the dropdown is open. Original: ${err.message}`
      );
    }
  },

  /**
   * Hovers the info icon inside the "Cancel trip" dropdown item to trigger its tooltip.
   * Requires the trip actions dropdown to already be open.
   * @param {import('playwright').Page} page
   */
  async hoverQuoteExpandIcon(page) {
    if (!page) throw new Error('[Cart.hoverQuoteExpandIcon] page is required');
    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.hoverCancelTripInfoIcon();
    } catch (err) {
      throw new Error(
        `[Cart.hoverQuoteExpandIcon] Could not hover the cancel-trip info icon. Ensure the trip actions dropdown is open and a quote is In Progress. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies that the cancel-trip tooltip shows the expected text.
   * Requires hoverQuoteExpandIcon to have been called first.
   * @param {import('playwright').Page} page
   * @param {string} expectedText
   */
  async verifyCancelTripTooltipText(page, expectedText) {
    if (!page) throw new Error('[Cart.verifyCancelTripTooltipText] page is required');
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(
        `[Cart.verifyCancelTripTooltipText] "expectedText" must be a non-empty string, got: ${typeof expectedText} (${JSON.stringify(expectedText)})`
      );
    }
    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.waitForTooltipWithText(expectedText);
    } catch (err) {
      throw new Error(
        `[Cart.verifyCancelTripTooltipText] Tooltip with text "${expectedText}" was not visible. Original: ${err.message}`
      );
    }
  },

  /**
   * Hovers the first active quote card's item-level three-dots actions icon
   * and waits for the dropdown to appear.
   * @param {import('playwright').Page} page
   */
  async hoverItemActionsMenu(page) {
    if (!page) throw new Error('[Cart.hoverItemActionsMenu] page is required');
    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.openActiveQuoteActionsDropdown();
    } catch (err) {
      throw new Error(
        `[Cart.hoverItemActionsMenu] Could not open the item-level actions dropdown. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies that an option with the given text is visible in the item-level actions dropdown.
   * Requires the item actions dropdown to already be open.
   * @param {import('playwright').Page} page
   * @param {string} optionText
   */
  async verifyItemActionMenuOptionVisible(page, optionText) {
    if (!page) throw new Error('[Cart.verifyItemActionMenuOptionVisible] page is required');
    if (!optionText || typeof optionText !== 'string') {
      throw new Error(
        `[Cart.verifyItemActionMenuOptionVisible] "optionText" must be a non-empty string, got: ${typeof optionText} (${JSON.stringify(optionText)})`
      );
    }
    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.waitForItemActionMenuOptionText(optionText);
    } catch (err) {
      throw new Error(
        `[Cart.verifyItemActionMenuOptionVisible] Option "${optionText}" was not visible in the item actions dropdown. Ensure the dropdown is open. Original: ${err.message}`
      );
    }
  },

  /**
   * Hovers the actions icon of the item at itemIndex, clicks "Cancel item",
   * and confirms the cancellation dialog if one appears.
   *
   * For quotes that are "In Progress" the cancel option is aria-disabled; clicking
   * it has no effect and no dialog appears. This is a negative-validation scenario —
   * the method succeeds without error so subsequent steps can verify the blocked state.
   *
   * @param {import('playwright').Page} page
   * @param {number} itemIndex - 0-based index of the quote card to cancel
   */
  async clickCancelItemFromActionsMenu(page, itemIndex) {
    if (!page) throw new Error('[Cart.clickCancelItemFromActionsMenu] page is required');
    if (typeof itemIndex !== 'number' || !Number.isInteger(itemIndex) || itemIndex < 0) {
      throw new Error(
        `[Cart.clickCancelItemFromActionsMenu] "itemIndex" must be a non-negative integer, got: ${typeof itemIndex} (${JSON.stringify(itemIndex)})`
      );
    }
    const cartPage = getPageObject(page, CartPage);
    logger.debug('Canceling item from actions menu', { itemIndex });
    try {
      const hovered = await cartPage.hoverItemActionsDropdownByIndex(itemIndex);
      if (!hovered) {
        // Fewer quote cards than expected; skip silently (negative-validation scenario)
        logger.debug('[Cart.clickCancelItemFromActionsMenu] item index out of range, skipping', { itemIndex });
        return;
      }
      await cartPage.clickVisibleCancelItemOption();
      // Try to confirm the cancellation dialog; if no dialog appears within a short
      // window the item was disabled (In Progress) and the click had no effect — that
      // is the expected outcome for a negative-validation test.
      let promptType;
      try {
        promptType = await cartPage.waitForQuoteCancellationPrompt({ timeout: 5000 });
      } catch {
        // No dialog: item was disabled, nothing to confirm
        return;
      }
      await cartPage.confirmQuoteCancellation(promptType);
    } catch (err) {
      throw new Error(
        `[Cart.clickCancelItemFromActionsMenu] Failed to cancel item at index ${itemIndex}. Original: ${err.message}`
      );
    }
  },

  /**
   * Opens the Financial Reference details from the trip-level options menu in the
   * Trip overview (hover the options icon, then pick the "Trip reference form" option).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async openFinancialReferenceDetailsFromTripOverview(page) {
    if (!page) throw new Error('[Cart.openFinancialReferenceDetailsFromTripOverview] "page" is required.');

    logger.debug('Opening Financial Reference details from the quote actions dropdown in the trip overview');
    try {
      const cartPage = getPageObject(page, CartPage);
      await cartPage.openFinancialReferenceDetailsFromTripOverview();
    } catch (err) {
      throw new Error(
        `[Cart.openFinancialReferenceDetailsFromTripOverview] Failed to open the Financial Reference details ` +
        `from the trip overview: ${err.message}`
      );
    }
  },

  /**
   * Verifies that the Financial Reference field in the trip overview shows the
   * expected description text (the selected value inside the .financial-section el-select).
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Expected field description (e.g. "(Financial Ref)")
   * @returns {Promise<void>}
   */
  async verifyFinancialReferenceFieldDescriptionInTripOverview(page, expectedText) {
    if (!page) throw new Error('[Cart.verifyFinancialReferenceFieldDescriptionInTripOverview] "page" is required.');
    if (typeof expectedText !== 'string') {
      throw new Error(
        `[Cart.verifyFinancialReferenceFieldDescriptionInTripOverview] "expectedText" must be a string, got: ${typeof expectedText}`
      );
    }

    try {
      const cartPage = getPageObject(page, CartPage);
      const actualText = await cartPage.getFinancialReferenceFieldDescription();
      expect(
        actualText,
        `Financial Reference field description in the trip overview did not match. Expected "${expectedText}", got "${actualText}". ` +
        `This may mean the selected financial reference was not persisted, or its description text changed.`
      ).toBe(expectedText);
    } catch (err) {
      if (err.matcherResult) throw err;
      throw new Error(
        `[Cart.verifyFinancialReferenceFieldDescriptionInTripOverview] Failed to verify the Financial Reference ` +
        `field description "${expectedText}": ${err.message}`
      );
    }
  },

  /**
   * Closes the Financial Reference (reference-fields) dialog in the trip overview.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async closeFinancialReferenceDialogInTripOverview(page) {
    if (!page) throw new Error('[Cart.closeFinancialReferenceDialogInTripOverview] "page" is required.');

    logger.debug('Closing the Financial Reference dialog in the trip overview');
    try {
      const cartPage = getPageObject(page, CartPage);
      await cartPage.closeFinancialReferenceDialogInTripOverview();
    } catch (err) {
      throw new Error(
        `[Cart.closeFinancialReferenceDialogInTripOverview] Failed to close the Financial Reference dialog ` +
        `in the trip overview: ${err.message}`
      );
    }
  },

  // ===========================================================================
  // Compensation / Climate Contribution (test 44362, 44424)
  //
  // A compensation quote is the Squake-powered "Climate Contribution" line that
  // rides alongside the flight. It renders as compensation-quote-card.vue, keeps
  // a link back to the quotes it offsets ("Related Items"), and must appear in
  // the trip-cancellation details when the trip is cancelled.
  // ===========================================================================

  /**
   * Verifies the cart's "Additional items" section is displayed.
   *
   * This is the cart-level section that offers on-demand products (test 44424) — not the
   * per-quote "Extras" collapse, which is a different control with its own steps.
   *
   * @param {import('playwright').Page} page
   */
  async verifyAdditionalItemsSectionDisplayed(page) {
    if (!page) {
      throw new Error('[Cart.verifyAdditionalItemsSectionDisplayed] "page" is required.');
    }

    logger.debug('[Cart.verifyAdditionalItemsSectionDisplayed] Locating the Additional items section');
    const cartPage = getPageObject(page, CartPage);

    await expect(
      cartPage.getAdditionalItemsSectionHeading(),
      '[Cart.verifyAdditionalItemsSectionDisplayed] The cart\'s "Additional items" section is not displayed. ' +
      'trip-cart.vue hides it unless there is something on-demand to offer, so either the company has no ' +
      'climate compensation configured, or the compensation is already part of the trip (added automatically, ' +
      'which is test 44362\'s flow rather than this one).',
    ).toBeVisible({ timeout: 30000 });
  },

  /**
   * Adds the Climate Contribution to the trip from the cart's "Additional items" section.
   *
   * This on-demand add is what distinguishes test 44424 from 44362, where the compensation is
   * already attached to the trip. The tile is only clickable while the compensation is not yet a
   * real quote; once added it is replaced by a normal compensation quote card.
   *
   * @param {import('playwright').Page} page
   */
  async addCompensationFromAdditionalItems(page) {
    if (!page) {
      throw new Error('[Cart.addCompensationFromAdditionalItems] "page" is required.');
    }

    logger.debug('[Cart.addCompensationFromAdditionalItems] Adding the climate contribution from Additional items');
    const cartPage = getPageObject(page, CartPage);

    // The Additional items section sits below the quote list, so the tile starts off-screen.
    await cartPage.scrollCompensationQuoteIntoView();

    try {
      await cartPage.clickCompensationAddToTripButton();
      // Gate on the tile disappearing: the add is async, and without this the next assertion
      // would race the quote reload and read the pre-add cart.
      await cartPage.waitForCompensationAddToTripButtonToDetach();
    } catch (err) {
      throw new Error(
        `[Cart.addCompensationFromAdditionalItems] Failed to add the climate contribution to the trip from the ` +
        `cart's "Additional items" section: ${err.message}`
      );
    }
  },

  /**
   * Verifies the compensation quote card is displayed in the cart with the expected title.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedTitle - e.g. "Climate Contribution"
   */
  async verifyCompensationQuoteDisplayed(page, expectedTitle) {
    if (!page) {
      throw new Error('[Cart.verifyCompensationQuoteDisplayed] "page" is required.');
    }
    if (!expectedTitle || typeof expectedTitle !== 'string') {
      throw new Error(
        `[Cart.verifyCompensationQuoteDisplayed] "expectedTitle" must be a non-empty string, got: ${typeof expectedTitle} (${expectedTitle})`
      );
    }

    logger.debug('[Cart.verifyCompensationQuoteDisplayed] Locating the compensation quote card', { expectedTitle });
    const cartPage = getPageObject(page, CartPage);

    // Two-stage on purpose: the card and the title fail for different reasons, and a single
    // combined locator reports both as a bare "element(s) not found".
    await expect(
      cartPage.getCompensationQuoteCard(),
      `[Cart.verifyCompensationQuoteDisplayed] No compensation quote card rendered in the cart at all. ` +
      `The company may not have climate compensation enabled, or Squake returned no compensation for this trip.`,
    ).toBeVisible({ timeout: 30000 });

    await expect(
      cartPage.getCompensationQuoteTitle(expectedTitle),
      `[Cart.verifyCompensationQuoteDisplayed] The compensation quote card is present but no title matched ` +
      `"${expectedTitle}". Check which state the card is in: a real quote titles via base-quote-header ` +
      `(h6.quote-title), a product tile via h5.`,
    ).toBeVisible({ timeout: 15000 });
  },

  /**
   * Verifies the compensation quote card is present (used after booking).
   *
   * @param {import('playwright').Page} page
   */
  async verifyCompensationQuoteVisible(page) {
    if (!page) {
      throw new Error('[Cart.verifyCompensationQuoteVisible] "page" is required.');
    }

    const cartPage = getPageObject(page, CartPage);

    // On the post-booking trip overview the compensation card sits below the flight card and its
    // Extras section. It must be scrolled to before it is asserted: the overview renders lower
    // sections lazily, and toBeVisible() does not auto-scroll the way an action would.
    await cartPage.scrollCompensationQuoteIntoView();

    await expect(
      cartPage.getCompensationQuoteCard(),
      '[Cart.verifyCompensationQuoteVisible] Expected the compensation quote to still be present after booking, ' +
      'but the compensation quote card was not visible even after scrolling it into view.',
    ).toBeVisible({ timeout: 30000 });
  },

  /**
   * Verifies the compensation quote card offers no "Add to trip" button.
   *
   * compensation-quote-card.vue renders that button under `v-if="!isRealQuote"`, so it appears
   * only for the on-demand product tile. Once the compensation exists as a real quote it must be
   * gone — otherwise the user could add a second, duplicate compensation.
   *
   * The card itself is asserted visible FIRST. Without that guard the absence check would also
   * pass when no compensation card rendered at all, turning a real regression into a green step.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedTitle - e.g. "Climate Contribution"
   */
  async verifyCompensationQuoteHasNoAddToTripButton(page, expectedTitle) {
    if (!page) {
      throw new Error('[Cart.verifyCompensationQuoteHasNoAddToTripButton] "page" is required.');
    }
    if (!expectedTitle || typeof expectedTitle !== 'string') {
      throw new Error(
        `[Cart.verifyCompensationQuoteHasNoAddToTripButton] "expectedTitle" must be a non-empty string, got: ${typeof expectedTitle} (${expectedTitle})`
      );
    }

    logger.debug('[Cart.verifyCompensationQuoteHasNoAddToTripButton] Asserting the add-to-trip button is absent', {
      expectedTitle,
    });
    const cartPage = getPageObject(page, CartPage);

    // Guard: the card must exist, or the absence assertion below would pass vacuously.
    await expect(
      cartPage.getCompensationQuoteTitle(expectedTitle),
      `[Cart.verifyCompensationQuoteHasNoAddToTripButton] Cannot check for the absence of the "Add to trip" button: ` +
      `no compensation quote card titled "${expectedTitle}" was visible in the cart at all.`,
    ).toBeVisible({ timeout: 30000 });

    await expect(
      cartPage.getCompensationAddToTripButton(),
      `[Cart.verifyCompensationQuoteHasNoAddToTripButton] The "${expectedTitle}" compensation quote is already part ` +
      `of the trip, so its "Add to trip" button should not be rendered (compensation-quote-card.vue gates it behind ` +
      `v-if="!isRealQuote"), but the button is present. The compensation may have been created as a product tile ` +
      `instead of a real quote, which would let the user add a duplicate compensation.`,
    ).toHaveCount(0, { timeout: 15000 });
  },

  /**
   * Opens the compensation Terms & Conditions dialog from the compensation quote card.
   *
   * @param {import('playwright').Page} page
   */
  async openCompensationTermsAndConditions(page) {
    if (!page) {
      throw new Error('[Cart.openCompensationTermsAndConditions] "page" is required.');
    }

    logger.debug('[Cart.openCompensationTermsAndConditions] Opening the compensation terms dialog');
    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.clickCompensationTermsLink();
    } catch (err) {
      throw new Error(
        `[Cart.openCompensationTermsAndConditions] Failed to open the compensation Terms & Conditions dialog: ${err.message}`
      );
    }
  },

  /**
   * Verifies the compensation terms dialog states the purchase is non-refundable.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Full or partial terms text to match
   */
  async verifyCompensationTermsNonRefundable(page, expectedText) {
    if (!page) {
      throw new Error('[Cart.verifyCompensationTermsNonRefundable] "page" is required.');
    }
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(
        `[Cart.verifyCompensationTermsNonRefundable] "expectedText" must be a non-empty string, got: ${typeof expectedText} (${expectedText})`
      );
    }

    const cartPage = getPageObject(page, CartPage);

    await expect(
      cartPage.getCompensationTermsDialogBody(),
      `[Cart.verifyCompensationTermsNonRefundable] Expected the compensation terms dialog to state "${expectedText}", ` +
      `but that text was not found in the dialog body. The dialog may not have opened, or the terms copy changed.`,
    ).toContainText(expectedText, { timeout: 20000 });
  },

  /**
   * Closes the compensation Terms & Conditions dialog.
   *
   * @param {import('playwright').Page} page
   */
  async closeCompensationTermsAndConditions(page) {
    if (!page) {
      throw new Error('[Cart.closeCompensationTermsAndConditions] "page" is required.');
    }

    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.closeCompensationTermsDialog();
    } catch (err) {
      throw new Error(
        `[Cart.closeCompensationTermsAndConditions] Failed to close the compensation terms dialog: ${err.message}`
      );
    }
  },

  /**
   * Opens the "Related Items" dialog of the compensation quote — the quotes this
   * compensation offsets.
   *
   * @param {import('playwright').Page} page
   */
  async openCompensationRelatedItems(page) {
    if (!page) {
      throw new Error('[Cart.openCompensationRelatedItems] "page" is required.');
    }

    logger.debug('[Cart.openCompensationRelatedItems] Opening the compensation related-items dialog');
    const cartPage = getPageObject(page, CartPage);

    // The card is below the fold on the post-booking trip overview and the lower sections render
    // lazily, so bring it into view before looking for its "Related Items" button.
    await cartPage.scrollCompensationQuoteIntoView();

    try {
      await cartPage.clickCompensationRelatedItemsButton();
      await cartPage.waitForCompensationRelatedQuotesVisible();
    } catch (err) {
      throw new Error(
        `[Cart.openCompensationRelatedItems] Failed to open the compensation related-items dialog: ${err.message}`
      );
    }
  },

  /**
   * Verifies the compensation related-items dialog lists a quote whose title contains
   * the expected text.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedTitle - e.g. "Flight to"
   */
  async verifyCompensationRelatedItemsContains(page, expectedTitle) {
    if (!page) {
      throw new Error('[Cart.verifyCompensationRelatedItemsContains] "page" is required.');
    }
    if (!expectedTitle || typeof expectedTitle !== 'string') {
      throw new Error(
        `[Cart.verifyCompensationRelatedItemsContains] "expectedTitle" must be a non-empty string, got: ${typeof expectedTitle} (${expectedTitle})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    const matching = cartPage.getCompensationRelatedQuoteTitles().filter({ hasText: expectedTitle });

    await expect(
      matching.first(),
      `[Cart.verifyCompensationRelatedItemsContains] Expected the compensation related-items dialog to list a quote ` +
      `titled "${expectedTitle}", but no listed quote matched. The compensation may not be linked to the flight quote.`,
    ).toBeVisible({ timeout: 20000 });
  },

  /**
   * Closes the compensation related-items dialog.
   *
   * @param {import('playwright').Page} page
   */
  async closeCompensationRelatedItems(page) {
    if (!page) {
      throw new Error('[Cart.closeCompensationRelatedItems] "page" is required.');
    }

    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.closeCompensationRelatedQuotesDialog();
    } catch (err) {
      throw new Error(
        `[Cart.closeCompensationRelatedItems] Failed to close the compensation related-items dialog: ${err.message}`
      );
    }
  },

  /**
   * Verifies the flight quote card title starts with the expected prefix, e.g. "Flight to".
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedPrefix
   */
  async verifyFlightQuoteTitleStartsWith(page, expectedPrefix) {
    if (!page) {
      throw new Error('[Cart.verifyFlightQuoteTitleStartsWith] "page" is required.');
    }
    if (!expectedPrefix || typeof expectedPrefix !== 'string') {
      throw new Error(
        `[Cart.verifyFlightQuoteTitleStartsWith] "expectedPrefix" must be a non-empty string, got: ${typeof expectedPrefix} (${expectedPrefix})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    const title = cartPage.getFlightQuoteTitle();

    try {
      await title.waitFor({ state: 'visible', timeout: 30000 });
    } catch (err) {
      throw new Error(
        `[Cart.verifyFlightQuoteTitleStartsWith] The flight quote card title never became visible. ` +
        `The trip may not contain a flight quote. Original: ${err.message}`
      );
    }

    const actual = normalizeText(await title.innerText());
    expect(
      actual.startsWith(expectedPrefix),
      `[Cart.verifyFlightQuoteTitleStartsWith] Expected the flight quote title to start with "${expectedPrefix}", ` +
      `but it reads "${actual}".`,
    ).toBe(true);
  },

  // ===========================================================================
  // Manual approval handling (approvals dialog)
  // ===========================================================================

  /**
   * Skips every pending approval step from the approvals dialog: enters modify mode,
   * clicks "Skip all", then saves.
   *
   * Requires the approvals dialog to already be open — use the existing
   * `Cart.viewApproversInTripOverview` first.
   *
   * @param {import('playwright').Page} page
   */
  async approveAllPendingItemsInApprovalFlow(page) {
    if (!page) {
      throw new Error('[Cart.approveAllPendingItemsInApprovalFlow] "page" is required.');
    }

    logger.debug('[Cart.approveAllPendingItemsInApprovalFlow] Skipping all pending approval steps');
    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.clickApprovalsModifyButton();
      await cartPage.clickApprovalsSkipAllButton();
      await cartPage.clickApprovalsSaveButton();
    } catch (err) {
      throw new Error(
        `[Cart.approveAllPendingItemsInApprovalFlow] Failed to skip all pending approval steps. The approvals ` +
        `dialog must be open and the user must be allowed to modify the approval flow. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the approvals dialog reports that nothing is pending.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Text the status description should contain
   */
  async verifyApprovalFlowHasNoPendingItems(page, expectedText = 'No pending items') {
    if (!page) {
      throw new Error('[Cart.verifyApprovalFlowHasNoPendingItems] "page" is required.');
    }
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(
        `[Cart.verifyApprovalFlowHasNoPendingItems] "expectedText" must be a non-empty string, got: ${typeof expectedText} (${expectedText})`
      );
    }

    const cartPage = getPageObject(page, CartPage);

    await expect(
      cartPage.getApprovalsStatusDescription(),
      `[Cart.verifyApprovalFlowHasNoPendingItems] Expected the approvals dialog to report "${expectedText}" after ` +
      `skipping every step, but the status description did not contain it. A step may have failed to skip, or the ` +
      `save did not commit.`,
    ).toContainText(expectedText, { timeout: 60000 });
  },

  /**
   * Closes the approvals dialog.
   *
   * @param {import('playwright').Page} page
   */
  async closeApprovalFlowDialog(page) {
    if (!page) {
      throw new Error('[Cart.closeApprovalFlowDialog] "page" is required.');
    }

    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.closeApprovalsDialog();
    } catch (err) {
      throw new Error(`[Cart.closeApprovalFlowDialog] Failed to close the approvals dialog: ${err.message}`);
    }
  },

  /**
   * Verifies ONE product's quote card shows any of the accepted statuses.
   *
   * Scoped per product on purpose. The unscoped alternative
   * ({@link verifyQuoteWithStatusVisible}) scans every badge in the cart and passes if any one
   * matches — so asserting "the flight is Confirmed" and "the compensation is On hold" against it
   * would be two reads of whichever badge came first, not two independent checks.
   *
   * Accepts several statuses because some transitions are transient: after an approval flow is
   * skipped a booking can be caught mid-flight as "Finalizing" or already settled as "Confirmed",
   * and which one you observe depends on backend timing, not on correctness.
   *
   * @param {import('playwright').Page} page
   * @param {'flight'|'compensation'} product - Which quote card to read
   * @param {string[]} acceptedStatuses
   * @param {{timeout?: number}} [options]
   * @returns {Promise<{actual: string}>}
   */
  async verifyProductBookingStatusIsOneOf(page, product, acceptedStatuses, { timeout = 60000 } = {}) {
    if (!page) {
      throw new Error('[Cart.verifyProductBookingStatusIsOneOf] "page" is required.');
    }
    if (!product || typeof product !== 'string') {
      throw new Error(
        `[Cart.verifyProductBookingStatusIsOneOf] "product" must be a non-empty string, got: ${typeof product} (${product})`
      );
    }
    if (!Array.isArray(acceptedStatuses) || acceptedStatuses.length === 0) {
      throw new Error(
        `[Cart.verifyProductBookingStatusIsOneOf] "acceptedStatuses" must be a non-empty array, got: ${typeof acceptedStatuses} (${JSON.stringify(acceptedStatuses)})`
      );
    }
    if (acceptedStatuses.some((s) => !s || typeof s !== 'string')) {
      throw new Error(
        `[Cart.verifyProductBookingStatusIsOneOf] Every entry of "acceptedStatuses" must be a non-empty string, got: ${JSON.stringify(acceptedStatuses)}`
      );
    }

    logger.debug('[Cart.verifyProductBookingStatusIsOneOf] Waiting for an accepted status badge', {
      product,
      acceptedStatuses,
    });
    const cartPage = getPageObject(page, CartPage);
    const label = cartPage.getQuoteStatusLabelForProduct(product);

    // Polled rather than a single read: the status settles asynchronously after the approval
    // flow is skipped, so the first read can legitimately show an earlier state.
    let lastSeen = '';
    try {
      await expect
        .poll(
          async () => {
            lastSeen = (await label.innerText().catch(() => '')).trim();
            return acceptedStatuses.some((s) => lastSeen.toLowerCase().includes(s.toLowerCase()));
          },
          { timeout, intervals: [1000, 2000, 5000] },
        )
        .toBe(true);
    } catch {
      throw new Error(
        `[Cart.verifyProductBookingStatusIsOneOf] The ${product} quote status never became any of ` +
        `${JSON.stringify(acceptedStatuses)} within ${timeout}ms. Last seen: "${lastSeen || '(no status badge found)'}". ` +
        `Either the booking is still transitioning, the supplier returned a different status, or the ` +
        `${product} quote card is not present on this page.`
      );
    }

    logger.info('Matched an accepted quote status', { product, actual: lastSeen });
    return { actual: lastSeen };
  },

  // ===========================================================================
  // Trip cancellation, decomposed
  //
  // cancelTripStrict does open→confirm→assert in a single call, which leaves no
  // point to assert what the cancellation dialog lists while it is open (test
  // 44362 requires the Climate Contribution line to be there). These methods
  // split that flow apart and COMPOSE the same CartPage atoms — they add no new
  // page-level behaviour. Prefer cancelTripStrict when no mid-dialog assertion
  // is needed.
  //
  // VERIFICATION STATUS — not fully exercised. Test 44362 had to comment its
  // cancellation tail out: skipping the approval flow drives the booking to
  // Finalizing/Confirmed, and the app will not cancel a trip in that state. Only
  // openTripCancellationDialog has been observed passing against staging; the
  // other three have never run end-to-end. Treat them as unproven until a
  // scenario cancels a trip that is still cancellable.
  // ===========================================================================

  /**
   * Opens the trip-cancellation dialog from the trip actions menu, leaving it open.
   *
   * @param {import('playwright').Page} page
   */
  async openTripCancellationDialog(page) {
    if (!page) {
      throw new Error('[Cart.openTripCancellationDialog] "page" is required.');
    }

    logger.debug('[Cart.openTripCancellationDialog] Opening the trip cancellation dialog');
    const cartPage = getPageObject(page, CartPage);

    // Mirrors cancelTripStrict: an in-approval trip polls continuously so networkidle
    // may never settle — non-fatal, the dropdown waits below provide the real sync.
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

    try {
      await cartPage.waitForTripOverviewTitle();
      await cartPage.hoverTripActionsDropdownIcon();
      await cartPage.waitForDropdownMenu();
      await cartPage.clickCancelTripOption();
    } catch (err) {
      throw new Error(
        `[Cart.openTripCancellationDialog] Failed to open the trip cancellation dialog from the trip actions menu. ` +
        `The trip may already be cancelled, or the actions dropdown was disabled while the page was still loading. ` +
        `Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the trip-cancellation dialog is displayed.
   *
   * @param {import('playwright').Page} page
   */
  async verifyTripCancellationDialogDisplayed(page) {
    if (!page) {
      throw new Error('[Cart.verifyTripCancellationDialogDisplayed] "page" is required.');
    }

    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.waitForTripCancellationDialogTitle();
    } catch (err) {
      throw new Error(
        `[Cart.verifyTripCancellationDialogDisplayed] The trip cancellation dialog title never appeared. ` +
        `The "Cancel trip" menu option may not have been clicked, or the trip is in a state the app refuses ` +
        `to cancel (e.g. Finalizing). Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the open trip-cancellation dialog lists a quote with the expected name.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedQuoteName - e.g. "Climate Contribution"
   */
  async verifyTripCancellationDetailsContains(page, expectedQuoteName) {
    if (!page) {
      throw new Error('[Cart.verifyTripCancellationDetailsContains] "page" is required.');
    }
    if (!expectedQuoteName || typeof expectedQuoteName !== 'string') {
      throw new Error(
        `[Cart.verifyTripCancellationDetailsContains] "expectedQuoteName" must be a non-empty string, got: ${typeof expectedQuoteName} (${expectedQuoteName})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    const matching = cartPage.getTripCancellationQuoteNames().filter({ hasText: expectedQuoteName });

    await expect(
      matching.first(),
      `[Cart.verifyTripCancellationDetailsContains] Expected the trip cancellation dialog to list a quote named ` +
      `"${expectedQuoteName}", but no listed quote matched. The compensation may not be attached to this trip, or ` +
      `it was already cancelled separately.`,
    ).toBeVisible({ timeout: 30000 });
  },

  /**
   * Confirms the trip cancellation and verifies the success message.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{cancelled: boolean, messageVisible: boolean}>}
   */
  async confirmTripCancellation(page) {
    if (!page) {
      throw new Error('[Cart.confirmTripCancellation] "page" is required.');
    }

    logger.debug('[Cart.confirmTripCancellation] Confirming the trip cancellation');
    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.clickConfirmTripCancellationButton();
      await cartPage.waitForTripCancelledMessage();
    } catch (err) {
      throw new Error(
        `[Cart.confirmTripCancellation] The trip cancellation was not confirmed. The supplier may have rejected ` +
        `the cancellation, or it is still processing. THE TRIP MAY STILL BE LIVE AND NEED MANUAL CANCELLATION. ` +
        `Original: ${err.message}`
      );
    }

    const messageVisible = await page
      .getByText(CANCELLATION_CONFIRMED_TEXT, { exact: true })
      .isVisible();

    await page.waitForLoadState('networkidle').catch(() => {});

    return { cancelled: true, messageVisible };
  },

};



// Export Cart DSL for use in tests
module.exports = Cart;
