const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const { CartPage, SELECTORS: CART_SELECTORS } = require("@pages/CartPage");
const { CommonPage, SELECTORS: COMMON_SELECTORS } = require("@pages/CommonPage");
const { SELECTORS: CheckoutSelectors } = require("@pages/CheckoutPage");
const FlightResultsPage = require("@pages/FlightResultsPage");
const tripStatus = require("@data/tripStatus.json");
const config = require("@config/config");

/**
 * Cart DSL
 *
 * Describes how users interact with the cart.
 */
const Cart = {
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
    await cartPage.waitForDetailsText();
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
      await cartPage.waitForDetailsText();
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
  async expectBookingStatusToBe(expectedStatus, { timeout = 60000, page } = {}) {
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
    const actualStatus = await cartPage.getBookingStatus({ timeout, page });

    expect(actualStatus.toLowerCase()).toContain(expectedText.toLowerCase());
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

  // ===== PRICE CHANGE MODAL =====


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

    // Wait for either checkout heading OR price change modal (whichever appears first)
    const proceedBtn = cartPage.getProceedWithChangeButton();
    
    try {
      await Promise.race([
        checkoutHeading.waitFor({ state: "visible", timeout: 45000 }),
        proceedBtn.waitFor({ state: "visible", timeout: 45000 }),
      ]);
    } catch (error) {
      // If both timeout, provide clear error message
      throw new Error(
        `Neither checkout page nor price change modal appeared within 45s. ` +
        `Either navigation failed or page is stuck. Original error: ${error.message}`
      );
    }

    // If the modal appeared, click it and wait for checkout heading
    let clickedModal = false;
    if (await proceedBtn.isVisible()) {
      await proceedBtn.click();
      clickedModal = true;
      // Wait for checkout page to load after dismissing modal
      await checkoutHeading.waitFor({ state: "visible", timeout: 30000 });
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
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Zero-based index of the fare rules button (default: 1)
   * @returns {Promise<void>}
   */
  async clickToOpenFareRulesInCart(page, index = 1) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForFareRulesButton(index);
    await flightResultsPage.clickFareRulesButton(index);
    await flightResultsPage.waitForFareRulesNote();
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
    await cartPage.waitForOnHoldStatus();

    const status = await cartPage.getBookingStatus({ page });
    return { held: true, status };
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
    expect(previewText).toContain(expectedHotelName);
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
};


// Export Cart DSL for use in tests
module.exports = Cart;
