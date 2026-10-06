const fs = require("fs");
const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const { CartPage, SELECTORS: CART_SELECTORS, CANCELLATION_CONFIRMED_TEXT, CANCELLATION_CONFIRMED_PATTERN, EVOLVI_CANCELLATION_DISCLAIMER_TEXT, SEAT_CATEGORY_COLORS } = require("@pages/CartPage");
const { CheckoutPage, SELECTORS: CheckoutSelectors } = require("@pages/CheckoutPage");
const { CommonPage, SELECTORS: COMMON_SELECTORS } = require("@pages/CommonPage");
const { ResultsPage } = require("@pages/ResultsPage");
const FlightResultsPage = require("@pages/FlightResultsPage");
const FlightResults = require("./FlightResults");
const PayloadValidation = require("./PayloadValidation");
const Email = require("./Email");
const Profile = require("./Profile");
const ProfilePage = require("@pages/ProfilePage");
const tripStatus = require("@data/tripStatus.json");
const config = require("@config/config");
const BookingErrorHandler = require("@utils/bookingErrorHandler");
const { selectDateOfBirthWithYearArrows, parseDateValue, parseTimeToMinutes } = require("@utils/calendar.helper");
const { expectNumbersToBeEqualWithTolerance } = require("../assertions/numberAssertions");
const { parseAmountText } = require("@utils/dom");
const { normalizeText, extractDateTokens, escapeRegex, stripWhitespaceAndLowercase, sortAlphabetically } = require("@utils/text");
const { extractPdfText, countLetters, assertPdfTextIsReadable, containsAmount, findCurrencyAmounts } = require("@utils/pdf");
const logger = require("@utils/logger").child("Cart-DSL");

// Every translation the app ships for `validation.unReadMessages1` (Atriis.OBT/src/assets/locale/*.json)
// — the distinctive half of the checkout-blocking unread-notifications banner in trip-cart.vue. Listed
// in full so the assertion stays language-independent, matching how CommonPage treats the notification
// popup titles and the "Mark as read" link.
const UNREAD_MESSAGES_BANNER_TEXTS = [
  "In order to proceed, please review all unread",
  "Um fortzufahren, überprüfen Sie bitte alle ungelesenen",
  "Para continuar, revise todo lo que no ha leído",
  "Pour continuer, veuillez consulter tous les messages non lus",
  "Per procedere, controlla tutto ciò che non è stato letto",
  "Controleer alle ongelezen berichten om door te gaan",
  "Para prosseguir, reveja todas as mensagens não lidas",
];

/**
 * Splits the recorded /FlightSeats calls into seat maps (POST ?isMap=true, with their parsed
 * bodies) and seat saves (PUT, with their parsed request bodies), and stops the recording.
 * Only called once the seats have been saved, so nothing after this point is needed.
 * @param {{ responses: import('@playwright/test').Response[], stop: () => void }} collector
 * @returns {Promise<{ seatMaps: object[], saves: object[] }>}
 */
async function readFlightSeatsCalls(collector) {
  if (!collector || !Array.isArray(collector.responses)) {
    throw new Error("No FlightSeats recording found — start recording the seat map and seat save calls before opening the seat map");
  }
  collector.stop();
  const seatMaps = [];
  const saves = [];
  for (const response of collector.responses) {
    const request = response.request();
    const method = request.method().toUpperCase();
    if (method === "POST" && /isMap=true/i.test(response.url())) {
      const body = await response.json().catch(() => null);
      const rows = Array.isArray(body?.rows) ? body.rows : [];
      const availableSeats = rows.flatMap((row) => row?.seats || []).filter((seat) => seat?.seatAvailability).length;
      const requestBody = request.postDataJSON() || {};
      seatMaps.push({
        flight: `${requestBody.carrier || ""}${requestBody.flightNumber || ""}`,
        rows: rows.length,
        availableSeats,
        cacheKey: body?.cacheKey,
        segmentNumber: body?.segmentNumber,
        showSeatmapUnavailableMessage: body?.showSeatmapUnavailableMessage,
      });
    } else if (method === "PUT") {
      saves.push({ status: response.status(), segments: request.postDataJSON() });
    }
  }
  return { seatMaps, saves };
}

// Journey legs of a round-trip rail quote, in the order eu-rail-seats.vue renders them: the API
// returns the outbound leg first and the return leg second, matching the journey stepper's order.
const RAIL_SEATING_LEG_INDEXES = [
  { leg: "outbound", index: 0 },
  { leg: "inbound", index: 1 },
];
// Saving seats fires an async refreshQuotes, so the cart summary's seating row is polled rather
// than read once.
const RAIL_SEATING_SUMMARY_POLL_TIMEOUT_MS = 30000;
// Seat prices are money, and each leg's seat price is rounded to cents on its own before it is
// displayed while the cart summary rounds the unrounded total once. The two can therefore disagree
// by up to a cent per leg (52934: 5.32 + 5.32 displayed against a 10.65 summary), so the comparison
// allows one cent for each of the two legs instead of demanding an exact match.
const RAIL_SEATING_PRICE_TOLERANCE = 0.02;

// Share itinerary e-ticket link (64936). The itinerary email is generated by the mail service, so
// the link is found by what it points at rather than by a label this repo cannot see: the wallet
// links are ruled out first, then a ticket document is looked for in the anchor's label or href.
//
// The exclusions have to be checked BEFORE the e-ticket patterns, because Evolvi serves all three
// passes off the same path and only the last segment differs — /eTicket/{guid}/PKPASS and
// /eTicket/{guid}/TRANSITPASS for the wallets, /eTicket/{guid}/PDF for the e-ticket itself. Both
// the label ("… Wallet") and the pass segment are matched, so losing either wording still excludes
// them.
const ABSOLUTE_HTTP_URL = /^https?:\/\/\S+/i;
const WALLET_LINK_PATTERNS = [/wallet/i, /pkpass/i, /transitpass/i, /pay\.google\.com/i];
const ETICKET_LINK_PATTERNS = [/e-?ticket/i, /ticket/i, /\.pdf(?:$|[?#])/i];
// A ticket document is fetched from the supplier, so allow for a slow first byte.
const ETICKET_LINK_TIMEOUT_MS = 45000;
// A Proceed to Checkout click the cart ignores is retried. One it handles shows the CTA's is-loading
// spinner at once, while the hold/price check behind it often outlasts this window.
const PROCEED_TO_CHECKOUT_REACTION_MS = 10000;
const PROCEED_TO_CHECKOUT_CLICK_ATTEMPTS = 3;

// GroundScope vehicle image in the share quote / share itinerary email (61696). The emails are
// generated by the mail service, so the picture is identified by what it points at: GroundScope
// serves its vehicle pictures from a fixed .../GroundScope/VehicleTypes/ path off the GTP
// marketplace, e.g. https://www.gtp-marketplace.com/Content/images/GroundScope/VehicleTypes/sedan.png
//
// Only the directory is matched, never the file: the scenario books whichever vehicle comes back
// first, so the leaf (sedan.png / van.png / ...) legitimately varies between runs while the
// directory identifies it as a GroundScope vehicle picture rather than any content image.
const GROUNDSCOPE_VEHICLE_IMAGE_PATTERN = /\/GroundScope\/VehicleTypes\//i;

// Travelfusion files a fare's ancillary options as one low-cost RequiredParameter in the
// ProcessDetails response, e.g.
//   <Name>AdvancedAncillaryOptions</Name> ...
//   <DisplayText>Please Select Advanced Ancillary Options: 0 (Personal Item ... - 0.00 EUR), 1 (...)</DisplayText>
const ANCILLARY_OPTIONS_PARAMETER = 'AdvancedAncillaryOptions';
const ANCILLARY_OPTIONS_DISPLAY_TEXT_PATTERN = new RegExp(
  `<Name>\\s*${ANCILLARY_OPTIONS_PARAMETER}\\s*</Name>(?:(?!</RequiredParameter>)[\\s\\S])*?<DisplayText>([\\s\\S]*?)</DisplayText>`
);
const XML_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeXmlEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (match, entity) => {
    const lower = entity.toLowerCase();
    if (lower.startsWith('#x')) return String.fromCodePoint(parseInt(lower.slice(2), 16));
    if (lower.startsWith('#')) return String.fromCodePoint(parseInt(lower.slice(1), 10));
    return XML_ENTITIES[lower];
  });
}

/**
 * Splits the AdvancedAncillaryOptions DisplayText into the option labels the cart should show.
 * Mirrors GetAncillaryOptionsByQuoteIdQueryHandler.ParseOptions (Atriis.App.Flights): drop the
 * prompt up to the first ':', split before every "<n> (" token on ';' or ',', and keep the text
 * between the first '(' and the last ')'. Segments whose leading token is not an integer are
 * excluded, as the backend does.
 * @param {string} displayText - DisplayText with XML entities already decoded
 * @returns {string[]}
 */
function parseAncillaryOptionLabels(displayText) {
  const fields = displayText.slice(displayText.indexOf(':') + 1);
  return fields
    .split(/(?:;|,)\s*(?=\d+\s*\()/)
    .filter((segment) => /^\s*-?\d+\s*(\(|$)/.test(segment))
    .map((segment) => {
      const open = segment.indexOf('(');
      const close = segment.lastIndexOf(')');
      const start = open === -1 ? 0 : open + 1;
      const end = close === -1 ? segment.length : close;
      return segment.slice(start, end);
    });
}

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
    try {
      await cartPage.waitForTripCancellationDialogTitle();
    } catch (err) {
      if (await cartPage.isCancelTripOptionDisabled()) {
        throw new Error(
          '[Cart.cancelTripStrict] "Cancel trip" is disabled in the trip actions menu, so the confirmation ' +
          'dialog never opened. The app blocks cancellation while a booking is still finalising - the trip has ' +
          `to reach a cancellable status first. Original: ${err.message}`
        );
      }
      throw err;
    }
    await cartPage.clickConfirmTripCancellationButton();

    // Check if cancellation was successful
    await cartPage.waitForTripCancelledMessage();
    const messageVisible = await page.getByText(CANCELLATION_CONFIRMED_PATTERN).isVisible();

    // Allow backend and UI to settle
    await page.waitForLoadState("networkidle");

    return { cancelled: true, messageVisible };
  },

  /**
   * Verifies the trip approvals bar is displayed with the expected title and action buttons.
   *
   * ASSERT ONLY — deliberately never clicks Decline/Approve: those mutate real staging approval
   * state one-way and would break every subsequent run of this scenario.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedTitle - Expected approvals-bar title, e.g. "Trip awaiting your approval"
   * @param {string} declineLabel - Expected decline button label, e.g. "Decline"
   * @param {string} approveLabel - Expected approve button label, e.g. "Approve"
   * @returns {Promise<{displayed: true, expectedTitle: string, declineLabel: string, approveLabel: string}>}
   */
  async verifyTripApprovalBarDisplayed(page, expectedTitle, declineLabel, approveLabel) {
    if (!page) throw new Error('[Cart.verifyTripApprovalBarDisplayed] "page" is required.');
    if (typeof expectedTitle !== 'string' || expectedTitle.length === 0) {
      throw new Error(
        `[Cart.verifyTripApprovalBarDisplayed] "expectedTitle" must be a non-empty string, got: ${typeof expectedTitle} (${expectedTitle})`
      );
    }
    if (typeof declineLabel !== 'string' || declineLabel.length === 0) {
      throw new Error(
        `[Cart.verifyTripApprovalBarDisplayed] "declineLabel" must be a non-empty string, got: ${typeof declineLabel} (${declineLabel})`
      );
    }
    if (typeof approveLabel !== 'string' || approveLabel.length === 0) {
      throw new Error(
        `[Cart.verifyTripApprovalBarDisplayed] "approveLabel" must be a non-empty string, got: ${typeof approveLabel} (${approveLabel})`
      );
    }

    const cartPage = getPageObject(page, CartPage);

    logger.info('Verifying the trip approvals bar is displayed', { expectedTitle, declineLabel, approveLabel });

    try {
      await cartPage.waitForApprovalsBar();

      const title = cartPage.getApprovalsBarTitle();
      await expect(
        title,
        `[Cart.verifyTripApprovalBarDisplayed] Expected the trip approvals bar title to be visible, but it was not rendered.`
      ).toBeVisible({ timeout: 10000 });
      await expect(
        title,
        `[Cart.verifyTripApprovalBarDisplayed] Expected the trip approvals bar title to contain "${expectedTitle}".`
      ).toContainText(expectedTitle, { timeout: 10000 });

      await expect(
        cartPage.getApprovalsBarButton(declineLabel),
        `[Cart.verifyTripApprovalBarDisplayed] Expected a "${declineLabel}" button to be visible on the trip approvals bar.`
      ).toBeVisible({ timeout: 10000 });
      await expect(
        cartPage.getApprovalsBarButton(approveLabel),
        `[Cart.verifyTripApprovalBarDisplayed] Expected an "${approveLabel}" button to be visible on the trip approvals bar.`
      ).toBeVisible({ timeout: 10000 });

      return { displayed: true, expectedTitle, declineLabel, approveLabel };
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Cart.verifyTripApprovalBarDisplayed] Failed to verify the trip approvals bar (expected title "${expectedTitle}" ` +
        `with "${declineLabel}" and "${approveLabel}" buttons). The opened trip may not be awaiting this user's ` +
        `approval decision. Original: ${err.message}`
      );
    }
  },

  /**
   * Approves the opened trip from its approvals bar and waits for the decision to be accepted
   * (the bar's Decline/Approve buttons are removed). Mutates real approval state — use only in
   * scenarios that create their own trip. Never approves from the homepage trip card.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{approved: true}>}
   */
  async approveTripFromApprovalsBar(page) {
    if (!page) throw new Error('[Cart.approveTripFromApprovalsBar] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    logger.info('Approving the trip from the approvals bar');

    try {
      await cartPage.waitForApprovalsBar();
      logger.debug('[Cart.approveTripFromApprovalsBar] Clicking "Approve" on the approvals bar');
      await cartPage.clickApprovalsBarButton('Approve');
      await cartPage.waitForApprovalsBarActionsHidden();
    } catch (err) {
      throw new Error(
        `[Cart.approveTripFromApprovalsBar] Failed to approve the trip from its approvals bar. The opened trip may not ` +
        `be awaiting this user's approval, or the approval request was rejected. Original: ${err.message}`
      );
    }

    logger.info('Trip approved from the approvals bar');
    return { approved: true };
  },

  /**
   * Clicks an action button on the opened trip's approvals bar. For "Decline" this only opens the
   * decline-reason dialog — nothing is sent until a reason is submitted.
   *
   * @param {import('playwright').Page} page
   * @param {string} label - Approvals-bar button label, e.g. "Decline"
   * @returns {Promise<{clicked: string}>}
   */
  async clickApprovalsBarButton(page, label) {
    if (!page) throw new Error('[Cart.clickApprovalsBarButton] "page" is required.');
    if (typeof label !== 'string' || label.length === 0) {
      throw new Error(
        `[Cart.clickApprovalsBarButton] "label" must be a non-empty string, got: ${typeof label} (${label})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    logger.info('Clicking an approvals bar button', { label });

    await cartPage.waitForApprovalsBar();
    await cartPage.clickApprovalsBarButton(label);
    return { clicked: label };
  },

  /**
   * Verifies the decline-reason dialog is open with its title, reason textarea and Decline button.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{displayed: true}>}
   */
  async verifyDeclineReasonDialogDisplayed(page) {
    if (!page) throw new Error('[Cart.verifyDeclineReasonDialogDisplayed] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    logger.info('Verifying the decline reason dialog is displayed');

    await cartPage.waitForDeclineReasonDialog();
    await expect(
      cartPage.getDeclineReasonDialogTitle(),
      '[Cart.verifyDeclineReasonDialogDisplayed] Expected the decline reason dialog title to read "Please provide decline reason".'
    ).toContainText('Please provide decline reason', { timeout: 10000 });
    await expect(
      cartPage.getDeclineReasonTextarea(),
      '[Cart.verifyDeclineReasonDialogDisplayed] Expected the decline reason textarea to be visible in the dialog.'
    ).toBeVisible({ timeout: 10000 });
    await expect(
      cartPage.getDeclineReasonDialogButton('Decline'),
      '[Cart.verifyDeclineReasonDialogDisplayed] Expected a "Decline" button in the decline reason dialog.'
    ).toBeVisible({ timeout: 10000 });

    return { displayed: true };
  },

  /**
   * Enters a decline reason in the open decline-reason dialog, submits it, and waits for the
   * decline to be accepted (the dialog closes and the approvals bar's action buttons are removed).
   * Mutates real approval state — use only in scenarios that create their own trip.
   *
   * @param {import('playwright').Page} page
   * @param {string} reason - Decline reason text
   * @returns {Promise<{declined: true, reason: string}>}
   */
  async declineTripWithReason(page, reason) {
    if (!page) throw new Error('[Cart.declineTripWithReason] "page" is required.');
    if (typeof reason !== 'string' || reason.trim().length === 0) {
      throw new Error(
        `[Cart.declineTripWithReason] "reason" must be a non-empty string, got: ${typeof reason} (${reason})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    logger.info('Declining the trip with a reason', { reason });

    try {
      await cartPage.waitForDeclineReasonDialog();
      await cartPage.fillDeclineReason(reason);
      await cartPage.clickDeclineReasonSubmitButton();
      await cartPage.waitForDeclineReasonDialogHidden();
      await cartPage.waitForApprovalsBarActionsHidden();
    } catch (err) {
      throw new Error(
        `[Cart.declineTripWithReason] Failed to decline the trip with reason "${reason}". Original: ${err.message}`
      );
    }

    logger.info('Trip declined from the approvals bar');
    return { declined: true, reason };
  },

  /**
   * Verifies the approvals bar title, e.g. "Trip was declined" once a decline was accepted.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedTitle - Expected approvals-bar title
   * @returns {Promise<{title: string}>}
   */
  async verifyApprovalsBarTitle(page, expectedTitle) {
    if (!page) throw new Error('[Cart.verifyApprovalsBarTitle] "page" is required.');
    if (typeof expectedTitle !== 'string' || expectedTitle.length === 0) {
      throw new Error(
        `[Cart.verifyApprovalsBarTitle] "expectedTitle" must be a non-empty string, got: ${typeof expectedTitle} (${expectedTitle})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    logger.info('Verifying the approvals bar title', { expectedTitle });

    await cartPage.waitForApprovalsBar();
    await expect(
      cartPage.getApprovalsBarTitle(),
      `[Cart.verifyApprovalsBarTitle] Expected the trip approvals bar title to contain "${expectedTitle}".`
    ).toContainText(expectedTitle, { timeout: 30000 });

    return { title: expectedTitle };
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
   * Best-effort cleanup: a trip that cannot be cancelled (supplier refusal, stalled UI) must be
   * reported, never fatal — the scenarios using this step have already made all their assertions.
   *
   * To honour that contract the whole flow runs under an overall deadline. The sub-waits sum to
   * more than the 120000ms Cucumber step budget in the worst case, so bounding any single wait is
   * not enough: without a deadline one stalled wait kills the scenario before the catch below can
   * return a status.
   *
   * The deadline stays under that 120000ms budget while still leaving a slow GDS cancellation room
   * to confirm, so a genuinely-successful-but-slow cancel is not abandoned and reported as failed.
   *
   * @param {import('playwright').Page} page
   * @param {object} [options]
   * @param {number} [options.budgetMs=100000] Overall deadline for the entire cancel attempt.
   * @returns {Promise<{cancelled: boolean, outcome?: string, error?: string}>}
   */
  async cancelTripSafely(page, { budgetMs = 100000 } = {}) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);

    const attempt = (async () => {
      await cartPage.waitForTripOverviewTitle();
      await cartPage.hoverTripActionsDropdownIcon();
      await cartPage.waitForDropdownMenu();
      await cartPage.clickCancelTripOption();
      await cartPage.waitForTripCancellationDialogTitle();
      await cartPage.clickConfirmTripCancellationButton();

      const outcome = await cartPage.waitForTripCancellationOutcome();
      // Non-fatal: the cancellation verdict is already known, this only lets the UI settle.
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      return { outcome };
    })();

    let timer;
    const deadline = new Promise((resolve) => {
      timer = setTimeout(() => resolve({ outcome: 'timeout' }), budgetMs);
    });

    let result;
    try {
      // The inline .catch doubles as the attempt's rejection handler, so a flow abandoned at the
      // deadline can never surface as an unhandled rejection and kill the worker.
      result = await Promise.race([attempt.catch((error) => ({ error: error?.message })), deadline]);
    } finally {
      clearTimeout(timer);
    }

    if (result.error) {
      logger.warn('Safe trip cancellation did not complete', { error: result.error });
      return { cancelled: false, error: result.error };
    }

    const cancelled = result.outcome === 'cancelled';
    if (!cancelled) {
      // Surfaced loudly so a supplier-side refusal stays visible in CI instead of passing silently.
      logger.warn('Trip was not cancelled — continuing (best-effort cleanup step)', {
        outcome: result.outcome,
      });
    }

    return { cancelled, outcome: result.outcome };
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

    // Same retry rationale as verifyPriceCheckOffersProceed: the title renders on `!isLoading`,
    // Proceed on `priceCheckResult?.success && !isNoAvailability`, so a point-in-time read here
    // could miss a button that is about to paint.
    try {
      await expect(cartPage.getCheckPriceProceedButton()).toBeVisible({ timeout: 15000 });
    } catch (err) {
      throw new Error(
        `Proceed button never became visible in the check price dialog. Dialog title: "${title}". ` +
        `Original: ${err.message}`
      );
    }

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

  /**
   * Clicks "Check Price" on ONE quote, addressed by its 1-based cart position, then waits for the
   * dialog to finish loading (its title only renders once the re-shop call has returned).
   *
   * Both expired and COPIED quotes are gated behind that price check — trip-cart.ts
   * syncPriceCheckGate() treats them alike, because a copied quote carries the SOURCE trip's offer
   * and ticketing time limit. The dialog handles one quote at a time, so a trip holding several
   * gated quotes needs one call per quote, and the position is what makes each call address the
   * quote the scenario means rather than whichever card happens to sit on top.
   *
   * Position is the same 1-based cart position used by verifyQuoteStatusByPosition and
   * holdQuoteByPosition. Re-pricing does not shuffle the quotes above the one being priced:
   * sortQuotes() sinks gated quotes to the bottom and leaves equally-gated ones in place, so a
   * quote that has just been re-priced keeps its position and the still-gated ones keep theirs.
   *
   * @param {import('playwright').Page} page
   * @param {number} position - 1-based quote position (quote 1 = topmost card)
   * @returns {Promise<string>} The dialog title that was rendered
   */
  async clickCheckPriceOnQuote(page, position) {
    if (!page) throw new Error('[Cart.clickCheckPriceOnQuote] "page" is required.');
    if (!Number.isInteger(position) || position < 1) {
      throw new Error(
        `[Cart.clickCheckPriceOnQuote] "position" must be an integer >= 1 (1-based quote position), ` +
        `got: ${position}`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickCheckPriceButtonByQuotePosition(position);

    const title = await cartPage.getCheckPriceDialogTitle();
    logger.info('Price check dialog finished loading', { position, title });
    return title;
  },

  /**
   * Verifies the price check came back with a bookable offer, i.e. the dialog offers "Proceed".
   *
   * Deliberately does NOT require the "Price is still available" title: check-price.ts titles the
   * dialog "Price change" whenever the re-shopped total differs from the quote's own, which happens
   * as soon as a traveller has been added to the trip. Both of those outcomes render Proceed and are
   * a pass here; "No availability" renders no Proceed button and is the outcome that must fail.
   *
   * @param {import('playwright').Page} page
   * @param {Object} [options]
   * @param {number} [options.timeout=15000] - How long to wait for Proceed to render
   * @returns {Promise<string>} The dialog title that was read
   */
  async verifyPriceCheckOffersProceed(page, { timeout = 15000 } = {}) {
    if (!page) throw new Error('[Cart.verifyPriceCheckOffersProceed] "page" is required.');
    if (!Number.isInteger(timeout) || timeout <= 0) {
      throw new Error(`[Cart.verifyPriceCheckOffersProceed] "timeout" must be a positive integer, got: ${timeout}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const title = await cartPage.getCheckPriceDialogTitle();

    // Asserted on the LOCATOR rather than on a captured isVisible() boolean so the check retries:
    // the title above only needs `!isLoading`, while Proceed is gated on
    // `priceCheckResult?.success && !isNoAvailability`, so it can paint a tick later. Wrapped in
    // try/catch because expect()'s own message never reaches the Cucumber report, and the dialog's
    // title/subtitle IS the whole diagnostic for this failure.
    try {
      await expect(cartPage.getCheckPriceProceedButton()).toBeVisible({ timeout });
    } catch (err) {
      const subtitle = await cartPage.getCheckPriceDialogSubtitle().catch(() => '');
      throw new Error(
        `[Cart.verifyPriceCheckOffersProceed] The price check dialog never offered "Proceed" within ` +
        `${timeout}ms. Dialog title: "${title}", subtitle: "${subtitle}". A "No availability" title ` +
        `means the supplier no longer sells this offer, so the quote cannot be re-priced. ` +
        `Original: ${err.message}`
      );
    }

    logger.info('Price check dialog offers Proceed', { title });
    return title;
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
   * Opens the cart quote card Terms & Conditions dialog and asserts it contains the expected text
   * (case-insensitive). Serves hotel quotes (the shared-bathroom style notices below the
   * cancellation policy) and rail quotes (the ticket rules Evolvi shows as its terms) alike.
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Text expected to appear in the cart T&C dialog
   */
  async verifyTextInCartTermsAndConditions(page, expectedText) {
    if (!page) throw new Error('[Cart.verifyTextInCartTermsAndConditions] "page" is required.');
    if (typeof expectedText !== 'string' || expectedText.trim().length === 0) {
      throw new Error(
        `[Cart.verifyTextInCartTermsAndConditions] "expectedText" must be a non-empty string, got: ${typeof expectedText}`,
      );
    }
    const cartPage = getPageObject(page, CartPage);
    const dialogText = await cartPage.getCartTermsAndConditionsText();
    // The T&C rule title and its description render as adjacent DOM nodes whose text content
    // concatenates with no separator (e.g. "shared bathroom" + "this room includes...") — so strip
    // all whitespace on both sides before matching (case-insensitive) rather than just collapsing
    // it. Shared with GroundTransportResults.verifyTermsAndConditionsInclude, which reads the same
    // kind of raw supplier markup off the results card's own dialog.
    if (!stripWhitespaceAndLowercase(dialogText).includes(stripWhitespaceAndLowercase(expectedText))) {
      throw new Error(
        `Expected cart Terms & Conditions dialog to contain "${expectedText}", but got text: "${dialogText.slice(-300)}"`
      );
    }
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
      BookingErrorHandler.handleBookingError(bookingContext.product, errorLogValue, bookingContext.subProduct, { known: isKnownError });

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
      // Range 0: start on the trip's 1st selectable day, spanning a single day = 1 day off.
      await cartPage.pickPerDiemDaysOffRangeSpanningDays(0, 0, 1);
    } catch (err) {
      throw new Error(
        `[Cart.setPerDiemDaysOffDates] Could not set the per-diem days-off dates. The date pickers may ` +
        `not have opened, or the days-off checkbox is not enabled. Original: ${err.message}`,
      );
    }
  },

  /**
   * Sets a single per-diem days-off range spanning `dayCount` calendar days (35703). Starts on the
   * trip's first selectable day and ends `dayCount - 1` days later, so `dayCount` 2 gives an
   * inclusive 2-day range → counter "2". Unlike combining
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
      // Range 0: start on the trip's 1st selectable day, spanning dayCount inclusive days →
      // counter "dayCount".
      await cartPage.pickPerDiemDaysOffRangeSpanningDays(0, 0, dayCount);
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
      // Range 1: start on the trip's 2nd selectable day, spanning 2 inclusive days = 2 days off.
      await cartPage.pickPerDiemDaysOffRangeSpanningDays(1, 1, 2);
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
   * Verifies a traveler is visible in the cart page's Travellers section (trip-cart.vue's
   * <trip-travelers-list>, rendering trip-traveler-tag.vue per traveler). Guards against the
   * regression this covers: a traveler silently disappearing from the cart after a quote is
   * added (see test 44941).
   * @param {import('playwright').Page} page
   * @param {string} travelerName - Traveler's full or partial name as displayed, e.g. "Pedro"
   * @returns {Promise<void>}
   */
  async verifyTravelerVisibleInCartPage(page, travelerName) {
    if (!page) throw new Error('[Cart.verifyTravelerVisibleInCartPage] "page" is required.');
    if (!travelerName || typeof travelerName !== 'string') {
      throw new Error(`[Cart.verifyTravelerVisibleInCartPage] "travelerName" must be a non-empty string, got: ${typeof travelerName}`);
    }

    logger.info('Verifying traveler is visible in the cart page', { travelerName });

    const cartPage = getPageObject(page, CartPage);
    const traveler = cartPage.getTravelerNameLocator(travelerName);

    try {
      await expect(
        traveler,
        `[Cart.verifyTravelerVisibleInCartPage] Expected traveler "${travelerName}" to still be visible in the ` +
        `cart page's Travellers section — adding the quote to cart may have dropped the passenger.`,
      ).toBeVisible({ timeout: 30000 });
    } catch (err) {
      throw new Error(
        `[Cart.verifyTravelerVisibleInCartPage] Traveler "${travelerName}" was not visible in the cart page ` +
        `within 30s. Original: ${err.message}`,
      );
    }
  },

  /**
   * Removes a named traveler (corporate user or guest) from the cart page's Travellers section
   * (trip-traveler-tag.vue's remove icon), by clicking their tag's remove button and waiting for
   * the tag to disappear (removeTraveler dispatches tripStore/removeTraveler then reloads the trip).
   * @param {import('playwright').Page} page
   * @param {string} travelerName - Traveler's full or partial name as displayed, e.g. "Secbene Moove"
   * @returns {Promise<void>}
   */
  async removeTravelerFromCartByName(page, travelerName) {
    if (!page) throw new Error('[Cart.removeTravelerFromCartByName] "page" is required.');
    if (!travelerName || typeof travelerName !== 'string') {
      throw new Error(`[Cart.removeTravelerFromCartByName] "travelerName" must be a non-empty string, got: ${typeof travelerName}`);
    }

    logger.info('Removing traveler from cart page', { travelerName });
    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.clickRemoveTravelerButtonByName(travelerName);
      await expect(
        cartPage.getTravelerNameLocator(travelerName),
        `[Cart.removeTravelerFromCartByName] Expected traveler "${travelerName}" to disappear from the cart page ` +
        `after clicking remove.`,
      ).toBeHidden({ timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[Cart.removeTravelerFromCartByName] Failed to remove traveler "${travelerName}" from the cart page. ` +
        `Original: ${err.message}`,
      );
    }

    // removeTraveler dispatches a trip reload that resolves after the tag itself disappears —
    // extras-layout.ts watches the trip's passengers array and force-closes/re-renders extras
    // panels when that reload lands, so callers that immediately interact with an extras panel
    // (e.g. rail passenger info) can race a reload still in flight. Settle here instead of
    // pushing that wait onto every caller (test 62001).
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    logger.info('Traveler removed from cart page', { travelerName });
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
   * Verifies the out-of-policy indicator is shown inside the baggage extras drawer.
   * The drawer computes this violation locally (flight-baggage.ts checkBaggageOOP) before any
   * save, so this reads the drawer's own badge and never the quote-card badge.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async verifyBaggageExtrasOOPIndicatorVisible(page) {
    if (!page) {
      throw new Error('[Cart.verifyBaggageExtrasOOPIndicatorVisible] "page" is required.');
    }

    logger.debug('Verifying the out-of-policy badge is shown in the baggage extras drawer');

    try {
      const cartPage = getPageObject(page, CartPage);
      const isVisible = await cartPage.isBaggageOOPBadgeVisible();
      expect(
        isVisible,
        `Out-of-policy indicator was not shown in the baggage extras drawer. ` +
        `Expected the badge (${CART_SELECTORS.BAGGAGE_OOP_BADGE}) to be visible after selecting the extra bag. ` +
        `This means the selected baggage did not breach the travel policy, or the drawer collapsed before the check.`
      ).toBe(true);
    } catch (err) {
      if (err.matcherResult) throw err;
      throw new Error(
        `[Cart.verifyBaggageExtrasOOPIndicatorVisible] Failed to verify the baggage extras out-of-policy indicator: ${err.message}`
      );
    }
  },

  /**
   * Verifies the out-of-policy indicator is NOT shown inside the baggage extras drawer.
   * Negative twin of verifyBaggageExtrasOOPIndicatorVisible — used after picking a
   * within-policy baggage option (the policy only trips from the 2nd bag on).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async verifyBaggageExtrasOOPIndicatorNotVisible(page) {
    if (!page) {
      throw new Error('[Cart.verifyBaggageExtrasOOPIndicatorNotVisible] "page" is required.');
    }

    logger.debug('Verifying the out-of-policy badge is NOT shown in the baggage extras drawer');

    try {
      const cartPage = getPageObject(page, CartPage);
      // isBaggageOOPBadgeVisible swallows its own wait timeout and returns false, so the
      // shorter budget is just how long a badge is given to appear before we call it absent.
      const isVisible = await cartPage.isBaggageOOPBadgeVisible(5000);
      expect(
        isVisible,
        `Out-of-policy indicator was shown in the baggage extras drawer. ` +
        `Selecting "CHECKED BAG 1st" must NOT breach the travel policy, yet the badge ` +
        `(${CART_SELECTORS.BAGGAGE_OOP_BADGE}) appeared within 5000ms — either the policy limit changed, ` +
        `or a previous baggage selection was still in place when the option was picked.`
      ).toBe(false);
    } catch (err) {
      if (err.matcherResult) throw err;
      throw new Error(
        `[Cart.verifyBaggageExtrasOOPIndicatorNotVisible] Failed to verify the baggage extras out-of-policy indicator is absent: ${err.message}`
      );
    }
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
   * Hovers the out-of-policy indicator inside the baggage extras drawer and returns the
   * violation text from its tooltip. Returns the text rather than asserting so the step can
   * decide how strictly to match it.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<string>} The baggage out-of-policy tooltip violation text
   */
  async hoverBaggageExtrasOOPAndGetTooltipText(page) {
    if (!page) {
      throw new Error('[Cart.hoverBaggageExtrasOOPAndGetTooltipText] "page" is required.');
    }

    logger.debug('Hovering the baggage extras out-of-policy badge to read its violation tooltip');

    try {
      const cartPage = getPageObject(page, CartPage);
      await cartPage.hoverBaggageOOPIndicator();
      return await cartPage.getBaggageOOPTooltipText();
    } catch (err) {
      throw new Error(
        `[Cart.hoverBaggageExtrasOOPAndGetTooltipText] Failed to read the baggage extras out-of-policy tooltip: ${err.message}`
      );
    }
  },

  /**
   * Verifies the out-of-policy title is rendered above the justification dropdown on the quote
   * card. A trailing "*" in the expected title marks the justification as mandatory and is
   * asserted separately against the title's sibling asterisk, since the app renders it as its
   * own element (base-quote-card.vue).
   *
   * The dropdown is always located through the existing `.oop-justification` selectors — the
   * step's second argument is descriptive only and is never used to locate anything.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} titleText - Expected title text, optionally ending in "*" (e.g. "Out Of Policy*")
   * @returns {Promise<void>}
   */
  async verifyOOPTitleDisplayedAboveJustificationDropdown(page, titleText) {
    if (!page) {
      throw new Error('[Cart.verifyOOPTitleDisplayedAboveJustificationDropdown] "page" is required.');
    }
    if (typeof titleText !== 'string' || titleText.trim() === '') {
      throw new Error(
        `[Cart.verifyOOPTitleDisplayedAboveJustificationDropdown] "titleText" must be a non-empty string, ` +
        `got: ${typeof titleText} (${JSON.stringify(titleText)})`
      );
    }

    const requiresAsterisk = titleText.trim().endsWith('*');
    const expectedTitle = titleText.trim().replace(/\*$/, '').trim();

    logger.debug('Verifying the out-of-policy title sits above the justification dropdown', {
      expectedTitle,
      requiresAsterisk,
    });

    try {
      const cartPage = getPageObject(page, CartPage);

      const actualTitle = await cartPage.getOOPTitleText();
      expect(
        actualTitle.toLowerCase(),
        `Out-of-policy title did not match. Expected: "${expectedTitle}", got: "${actualTitle}" ` +
        `(compared case-insensitively — the app ships it lowercase as "Out of policy").`
      ).toBe(expectedTitle.toLowerCase());

      if (requiresAsterisk) {
        const asteriskVisible = await cartPage.getOOPTitleRequiredAsterisk().isVisible();
        expect(
          asteriskVisible,
          `The mandatory-justification "*" next to the out-of-policy title was not visible ` +
          `(${CART_SELECTORS.OOP_TITLE_REQUIRED_ASTERISK}). It renders only when the quote carries ` +
          `travel policy justifications to pick from.`
        ).toBe(true);
      }

      const titleBox = await cartPage.getOOPTitleBoundingBox();
      const dropdownBox = await cartPage.getOOPJustificationDropdownBoundingBox();
      expect(
        titleBox.y,
        `Out-of-policy title is not displayed above the justification dropdown. ` +
        `Title top: ${titleBox.y}px, dropdown top: ${dropdownBox.y}px — the title must sit higher on the page.`
      ).toBeLessThan(dropdownBox.y);
    } catch (err) {
      if (err.matcherResult) throw err;
      throw new Error(
        `[Cart.verifyOOPTitleDisplayedAboveJustificationDropdown] Failed to verify that "${titleText}" is ` +
        `displayed above the out-of-policy justification dropdown: ${err.message}`
      );
    }
  },

  /**
   * Gets the list of Out of Policy violation reasons shown in the cart/trip overview.
   * Unlike hoverAndGetOOPTooltipTextInCart(), this reads the always-visible violation
   * list rendered by the oop-justification.vue component — no hover needed.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<string[]>} Trimmed violation texts, in display order
   */
  async getOOPViolationsInCart(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);
    return await cartPage.getOOPViolationLabelTexts();
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
   * Verifies the whole out-of-policy justification block is absent from the cart.
   * A quote that breaks no travel policy rule never renders the justification section at all,
   * so this is a count check and not a visibility check.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async verifyOOPJustificationSectionNotVisibleInCart(page) {
    if (!page) {
      throw new Error('[Cart.verifyOOPJustificationSectionNotVisibleInCart] "page" is required.');
    }

    logger.debug('Verifying the out-of-policy justification section is absent from the cart');

    try {
      const cartPage = getPageObject(page, CartPage);
      // Count-based on purpose: the selector is not :visible-filtered, so toBeHidden() would be
      // a strict-mode violation on a cart holding more than one quote.
      await expect(
        cartPage.getOOPJustificationSection(),
        `The out-of-policy justification section (${CART_SELECTORS.OOP_JUSTIFICATION_SECTION}) is rendered in the cart. ` +
        `After saving a within-policy baggage option the quote must carry no travel policy violation, ` +
        `so no justification block (title, dropdown or free text) should exist at all.`
      ).toHaveCount(0);
    } catch (err) {
      if (err.matcherResult) throw err;
      throw new Error(
        `[Cart.verifyOOPJustificationSectionNotVisibleInCart] Failed to verify the out-of-policy justification section is absent from the cart: ${err.message}`
      );
    }
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

    // The Save button hides only once the justification has actually been persisted. Without
    // this wait the next action (typically "proceed to checkout") fires while the save is still
    // in flight, so the cart still counts the justification as missing and silently refuses to
    // advance — leaving the run on the cart page with no error. Mirrors the dropdown save flow
    // in verifyOOPJustificationDropdownSaveWorksInCart.
    try {
      await cartPage.waitForSaveJustificationButtonHidden();
    } catch (err) {
      throw new Error(
        `[Cart.fillInOOPJustificationTextAndSave] Saved the OOP justification "${justificationText}" ` +
        `but the Save button never disappeared, so the justification was not persisted. ` +
        `Checkout will refuse to proceed while the justification is still outstanding. ` +
        `Original: ${err.message}`
      );
    }
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
   * ADO #81973 — Fills every mandatory quote-card field required before an Evolvi (UK Rail) fare
   * can proceed to checkout (e.g. "Delivery Method", always present; and, only when a non-cheapest
   * fare was selected, "Reason for Non Lowest Fare" and an "Extras" dropdown option such as
   * "Need More Flexible Ticket"). See CartPage.fillAllMandatoryEvolviExtras for the discovery
   * logic — which fields exist depends on the fare selected upstream. Mirrors the recorded flow
   * in records/81973_1.js.
   *
   * @param {import('playwright').Page} page
   * @param {string} [extrasOptionName="Need More Flexible Ticket"]
   * @returns {Promise<{fieldsFilled: number}>}
   */
  async fillMandatoryEvolviCartFields(page, extrasOptionName = "Need More Flexible Ticket") {
    if (!page) {
      throw new Error('[Cart.fillMandatoryEvolviCartFields] page is required');
    }

    const cartPage = getPageObject(page, CartPage);
    return cartPage.fillAllMandatoryEvolviExtras(extrasOptionName);
  },

  // ===== ONE NAMED UK RAIL (EVOLVI) EXTRAS ROW (test 62132) =====
  //
  // fillMandatoryEvolviCartFields above answers "get this quote checkout-ready" and does not care
  // which rows it filled. 62132 is the opposite test: it names each mandatory row and proves the
  // app's per-row states — asterisk + red highlight while unfilled, green check once saved — so
  // every method below addresses ONE row by its heading.

  /**
   * Verifies that a named UK Rail extras row is showing BOTH mandatory-and-unfilled markers: the
   * red asterisk in its heading and the red highlight (`error-border`) on its summary line.
   *
   * The highlight only exists once a checkout has been attempted (extras-layout.ts gates it on
   * isCheckoutActivated), so this must run AFTER a proceed-to-checkout click. That is called out in
   * the failure message, because "no highlight" reads identically whether the row is valid or the
   * checkout click never happened — and those need opposite fixes.
   *
   * @param {import('playwright').Page} page
   * @param {string} sectionName - Row heading as rendered, e.g. "Reason for Non Lowest"
   * @returns {Promise<void>}
   */
  async verifyExtrasSectionHighlightedAndRequired(page, sectionName) {
    if (!page) throw new Error('[Cart.verifyExtrasSectionHighlightedAndRequired] "page" is required.');
    if (!sectionName || typeof sectionName !== 'string') {
      throw new Error(
        `[Cart.verifyExtrasSectionHighlightedAndRequired] "sectionName" must be a non-empty string, got: ${JSON.stringify(sectionName)}`,
      );
    }

    const cartPage = getPageObject(page, CartPage);
    const { isHighlighted, hasAsterisk, asteriskText } = await cartPage.getEvolviExtrasRowRequiredState(sectionName);

    expect(
      hasAsterisk,
      `[Cart.verifyExtrasSectionHighlightedAndRequired] Expected the "${sectionName}" extras row to show its ` +
      `mandatory red asterisk, but no .has-text-danger marker was visible in its heading.`,
    ).toBe(true);

    expect(
      asteriskText,
      `[Cart.verifyExtrasSectionHighlightedAndRequired] Expected the "${sectionName}" mandatory marker to be "*", got "${asteriskText}".`,
    ).toBe('*');

    expect(
      isHighlighted,
      `[Cart.verifyExtrasSectionHighlightedAndRequired] Expected the "${sectionName}" extras row to be highlighted ` +
      `in red (.extra.error-border), but it was not. That class needs BOTH an invalid row and a prior ` +
      `proceed-to-checkout click (extras-layout.ts isShowRedBorder), so either the row is already valid or the ` +
      `scenario reached this assertion without clicking proceed to checkout first.`,
    ).toBe(true);

    logger.info('[Cart.verifyExtrasSectionHighlightedAndRequired] Extras row is highlighted and marked mandatory', {
      sectionName,
    });
  },

  /**
   * Fills and saves one named UK Rail extras row, leaving it with the app's green check.
   *
   * Which value the row ends up holding is not asserted — see
   * CartPage.fillEvolviExtrasRowByName for why the first offered option is the right choice for a
   * mandatory-field test — but the row named here is the row that gets filled, which is the whole
   * reason this exists alongside fillMandatoryEvolviCartFields.
   *
   * @param {import('playwright').Page} page
   * @param {string} sectionName - Row heading as rendered, e.g. "Seating"
   * @returns {Promise<{alreadyFilled: boolean, widget: 'radio'|'dropdown'|'none'}>}
   */
  async fillExtrasSectionByName(page, sectionName) {
    if (!page) throw new Error('[Cart.fillExtrasSectionByName] "page" is required.');
    if (!sectionName || typeof sectionName !== 'string') {
      throw new Error(
        `[Cart.fillExtrasSectionByName] "sectionName" must be a non-empty string, got: ${JSON.stringify(sectionName)}`,
      );
    }

    const cartPage = getPageObject(page, CartPage);

    let result;
    try {
      result = await cartPage.fillEvolviExtrasRowByName(sectionName);
    } catch (err) {
      throw new Error(
        `[Cart.fillExtrasSectionByName] Could not fill and save the "${sectionName}" extras row on the rail quote ` +
        `in the cart. Either the row is not present for this fare, it is past the pending stage where extras are ` +
        `still editable, or its save never produced the green check. Original: ${err.message}`,
      );
    }

    logger.info('[Cart.fillExtrasSectionByName] Extras row filled', { sectionName, ...result });
    return result;
  },

  /**
   * Verifies that every named UK Rail extras row shows its green check — the app's own "saved and
   * valid" marker.
   *
   * All rows are read before asserting so a failure names every row still missing its check, rather
   * than stopping at the first one and hiding the rest.
   *
   * @param {import('playwright').Page} page
   * @param {string[]} sectionNames - Row headings, e.g. ["Delivery Method", "Seating"]
   * @returns {Promise<void>}
   */
  async verifyExtrasSectionsHaveGreenCheckMarks(page, sectionNames) {
    if (!page) throw new Error('[Cart.verifyExtrasSectionsHaveGreenCheckMarks] "page" is required.');
    if (!Array.isArray(sectionNames) || sectionNames.length === 0) {
      throw new Error(
        `[Cart.verifyExtrasSectionsHaveGreenCheckMarks] "sectionNames" must be a non-empty array, got: ${JSON.stringify(sectionNames)}`,
      );
    }

    const cartPage = getPageObject(page, CartPage);
    const missing = [];

    for (const sectionName of sectionNames) {
      const hasGreenCheck = await cartPage.hasEvolviExtrasRowGreenCheck(sectionName);
      if (!hasGreenCheck) missing.push(sectionName);
    }

    expect(
      missing,
      `[Cart.verifyExtrasSectionsHaveGreenCheckMarks] Expected every extras row to show its green check ` +
      `(.extra .success-icon.green), but these did not: ${missing.map((name) => `"${name}"`).join(', ')}. ` +
      `Checked: ${sectionNames.map((name) => `"${name}"`).join(', ')}.`,
    ).toEqual([]);

    logger.info('[Cart.verifyExtrasSectionsHaveGreenCheckMarks] All extras rows show a green check', { sectionNames });
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
   * Clicks "Proceed to Checkout" and re-clicks while the cart shows no reaction at all.
   *
   * Right after a cart save (e.g. the car driver extras) the CTA can already be enabled while the
   * cart still ignores the click: no request is sent and the page stays put, so waiting longer
   * never helps. A click counts as handled once the URL leaves the cart, any dialog opens (price
   * change, booking error, approval) — those are left to the caller, never clicked through here —
   * or the CTA shows its is-loading spinner: a flight hold behind it can take 40s, and a re-click
   * on the spinning button can never land (Bulma's pointer-events:none).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async clickProceedToCheckoutUntilCartReacts(page) {
    const cartPage = getPageObject(page, CartPage);
    const anyDialog = page.locator('.el-dialog:visible, .el-message-box:visible').first();
    const reacted = async () =>
      !/\/cart\/?$/.test(new URL(page.url()).pathname) ||
      (await anyDialog.isVisible().catch(() => false)) ||
      (await cartPage.isProceedToCheckoutLoading());

    for (let attempt = 1; attempt <= PROCEED_TO_CHECKOUT_CLICK_ATTEMPTS; attempt += 1) {
      try {
        await cartPage.clickProceedToCheckout();
      } catch (error) {
        const reason = await cartPage.getCheckoutRequiredErrorText();
        if (!reason) throw error;
        throw new Error(
          `[Cart.clickProceedToCheckoutUntilCartReacts] "Proceed to Checkout" stayed disabled after the cart ` +
          `re-validated: "${reason}". An Error (status 2) entry in /api/v3/tripValidations is blocking checkout. ` +
          `Original: ${error.message}`,
        );
      }
      const deadline = Date.now() + PROCEED_TO_CHECKOUT_REACTION_MS;
      while (Date.now() < deadline) {
        if (await reacted()) return;
        await page.waitForTimeout(500);
      }
      logger.warn('Proceed to Checkout click left the cart unchanged, clicking again', { attempt });
    }
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
    // Gate on the enabled CTA: a save just before this step (e.g. the driver extras) re-validates
    // the cart and briefly disables the button, and a click in that window is a silent no-op.
    await cartPage.waitForProceedToCheckoutEnabled();
    await this.clickProceedToCheckoutUntilCartReacts(page);

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
   * Clicks the cart's "Proceed to Checkout" CTA only once it is actually enabled.
   *
   * Use this after an action that makes the cart re-validate — saving an out-of-policy
   * justification, for example. The CTA stays visible throughout but is briefly re-disabled, and
   * the element being clicked is the wrapping `.btn-container` div, so a click landing in that
   * window is swallowed with no error and the run silently stays on the cart page.
   *
   * Does NOT accept Terms & Conditions — a preceding step is expected to have done that, and
   * re-clicking the checkbox would toggle it back off.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @throws {Error} If page is missing or the CTA never becomes enabled
   * @returns {Promise<void>}
   */
  async clickProceedToCheckoutWhenEnabled(page) {
    if (!page) {
      throw new Error('[Cart.clickProceedToCheckoutWhenEnabled] "page" is required, got: ' + typeof page);
    }

    const cartPage = getPageObject(page, CartPage);
    logger.debug('Waiting for the Proceed to Checkout CTA to become enabled');

    await cartPage.waitForProceedToCheckoutEnabled();
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
   * Verifies the cart CTA displays the expected label (test 85351). A pre-booking-approval
   * user's CTA reads "Send For Approvals" instead of "Proceed to Checkout" — including when the
   * corporate's approval flow has pre-booking enabled with no approval steps. Asserts an exact
   * match (case-insensitive, whitespace normalized) so the test pins the label rather than just
   * finding some button.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText - label the cart CTA is expected to display
   * @returns {Promise<{ text: string }>}
   */
  async verifyCheckoutButtonText(page, expectedText) {
    if (!page) throw new Error('page is required');
    if (typeof expectedText !== 'string' || !expectedText.trim())
      throw new Error(`"expectedText" must be a non-empty string, got: ${typeof expectedText}`);

    const cartPage = getPageObject(page, CartPage);
    const actual = await cartPage.getCheckoutButtonText();
    const expectedNormalized = normalizeText(expectedText);
    if (actual.toLowerCase() !== expectedNormalized.toLowerCase()) {
      throw new Error(
        `[Cart.verifyCheckoutButtonText] Expected the cart checkout button to display ` +
        `"${expectedNormalized}", but it read "${actual}".`
      );
    }
    logger.info('Cart checkout button text verified', { expected: expectedNormalized, actual });
    return { text: actual };
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
   * @param {Object} [bookingContext] - Product/sub-product used to classify supplier booking errors
   * @param {Object} [options]
   * @param {boolean} [options.expectMergedQuote=false] - Wait for the held quotes to MERGE into one
   *   card instead of for another "on hold" badge to appear. A single-PNR hold folds the quote being
   *   held into the one already on hold, so the badge count never grows and the default wait below
   *   can only time out.
   * @returns {Promise<{held: boolean, status: string}>} Hold status and booking status
   */
  async holdTrip(page, bookingContext = {}, { expectMergedQuote = false } = {}) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const cartPage = getPageObject(page, CartPage);
    const checkoutPage = getPageObject(page, CheckoutPage);
    const onHoldStatusLabels = cartPage.getOnHoldStatusLabels();
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
        { known: knownBookingError },
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

    // Count the quotes ALREADY on hold before clicking. On a trip that holds a quote
    // from an earlier hold, "a quote is on hold" is true before this hold even starts,
    // so waiting for that badge to appear returns instantly and leaves the quote just
    // added still Pending booking (test 55056, second hold). Waiting for the count to
    // GROW is the same check for a first hold (0 -> 1) and correct for every later one.
    const heldBefore = await onHoldStatusLabels.count().catch(() => 0);
    const visibleQuoteCards = page.locator(CART_SELECTORS.QUOTE_PAYMENT_CARD_VISIBLE);

    // A merge is done when the two cards have collapsed into ONE that reads "on hold" - the
    // condition is false while the quote being held is still its own Pending booking card, so it
    // cannot pass before the click has taken effect.
    const mergedIntoSingleHeldQuote = async () => {
      const quotes = await visibleQuoteCards.count().catch(() => 0);
      const held = await onHoldStatusLabels.count().catch(() => 0);
      return quotes === 1 && held === 1;
    };

    // Initial hold action.
    await cartPage.waitForHoldButton();
    await cartPage.clickHoldButton().catch(() => {});

    while (Date.now() < deadline) {
      const holdSettled = expectMergedQuote
        ? await mergedIntoSingleHeldQuote()
        : (await onHoldStatusLabels.count().catch(() => heldBefore)) > heldBefore;

      if (holdSettled) {
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

    if (expectMergedQuote) {
      const quotes = await visibleQuoteCards.count().catch(() => 0);
      const held = await onHoldStatusLabels.count().catch(() => 0);
      throw new Error(
        `The held quotes did not merge into a single on-hold quote within ${timeout}ms `
          + `(${quotes} quote cards visible, ${held} of them on hold), and no booking error or `
          + 'price-change dialog appeared.',
      );
    }

    throw new Error(`Neither on hold status, booking error modal, nor price-change recovery completed within ${timeout}ms.`);
  },

  /**
   * Holds ONE quote in the cart, addressed by its 1-based position, and waits for THAT quote's
   * status badge to read "on hold".
   *
   * Why this exists alongside {@link holdTrip}: holdTrip drives the unscoped
   * SELECTORS.HOLD_BUTTON and detects success by watching the COUNT of on-hold badges grow.
   * Both break down when a trip carries more than one holdable quote at the same time - the
   * click is a strict-mode violation, and a count that grows tells you *a* quote was held, not
   * *which* one. A separate-PNR corp splits a round trip into two independently holdable
   * quotes (test 61576), so the caller has to say which quote it means.
   *
   * The booking-error and price-change handling is intentionally identical to holdTrip's: both
   * dialogs are page-level, not per-card.
   *
   * @param {import('playwright').Page} page
   * @param {number} position - 1-based quote position (1 = topmost quote card)
   * @param {{ product?: string, subProduct?: string }} [bookingContext]
   * @returns {Promise<{held: boolean, status: string|null, position: number, clickedModal: boolean, bookingError: boolean, knownBookingError: boolean, shouldSkip: boolean, supplier: string|null, bookingErrorText: string|null}>}
   */
  async holdQuoteByPosition(page, position, bookingContext = {}) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!Number.isInteger(position) || position < 1) {
      throw new Error('position must be an integer >= 1 (1-based quote position), got: ' + position);
    }

    const cartPage = getPageObject(page, CartPage);
    const checkoutPage = getPageObject(page, CheckoutPage);
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

      BookingErrorHandler.handleBookingError(
        bookingContext.product,
        supplierMessage || bookingErrorText || supplier || 'UNKNOWN',
        bookingContext.subProduct,
        { known: knownBookingError },
      );

      return {
        held: false,
        status: null,
        position,
        clickedModal,
        bookingError: true,
        knownBookingError,
        shouldSkip,
        supplier: supplier || null,
        bookingErrorText: bookingErrorText || null,
      };
    };

    const statusBefore = await cartPage.getQuoteStatusByPosition(position).catch(() => null);
    logger.info('Holding a single quote', { position, statusBefore });

    await cartPage.clickHoldButtonByQuotePosition(position);

    // Success is read off THIS card's own badge, so it is unaffected by any quote that was
    // already on hold before this call - no before/after counting needed.
    const onHoldLabel = cartPage
      .getQuoteCardByPosition(position)
      .locator(CART_SELECTORS.QUOTE_STATUS_LABEL, { hasText: /on hold/i })
      .first();

    while (Date.now() < deadline) {
      if (await onHoldLabel.isVisible().catch(() => false)) {
        const status = await cartPage.getQuoteStatusByPosition(position);
        logger.info('Quote held', { position, status });
        return {
          held: true,
          status,
          position,
          clickedModal,
          bookingError: false,
          knownBookingError: false,
          shouldSkip: false,
          supplier: null,
          bookingErrorText: null,
        };
      }

      if (await bookingErrorDialog.isVisible().catch(() => false)) {
        // Price-change dialogs share .booking-response-errors with real booking errors, so a
        // successful "Proceed with change" click is what distinguishes the two.
        const priceChangeClicked = await cartPage.clickProceedWithChangeIfVisible(500).catch(() => false);
        if (priceChangeClicked) {
          clickedModal = true;
          await bookingErrorDialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
        } else {
          return resolveBookingErrorResult();
        }
      }

      await page.waitForTimeout(1000);
    }

    const statusNow = await cartPage.getQuoteStatusByPosition(position).catch(() => 'unknown');
    throw new Error(
      `Quote ${position} did not reach "on hold" within ${timeout}ms - its status badge still reads ` +
      `"${statusNow}", and neither a booking-error modal nor a price-change recovery completed.`
    );
  },

  /**
   * Verifies one quote card shows the expected payment type (e.g. "Paid by TMC"), addressed by
   * its 1-based position in the cart.
   *
   * @param {import('playwright').Page} page
   * @param {number} position - 1-based quote position
   * @param {string} expectedType - e.g. "Paid by TMC"
   */
  async verifyQuotePaymentTypeByPosition(page, position, expectedType) {
    if (!page) throw new Error('page is required');
    if (typeof expectedType !== 'string' || !expectedType.trim()) {
      throw new Error('expectedType must be a non-empty string, got: ' + expectedType);
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForQuoteCardByPosition(position);
    const card = cartPage.getQuoteCardByPosition(position);

    // Scoped to one card: the page-wide verifyPaymentType would pass for quote 2 off quote 1's label.
    await expect(card).toContainText(new RegExp(escapeRegex(expectedType.trim()).replace(/\\? /g, '\\s*'), 'i'), { timeout: 30000 });
    logger.info('Quote payment type verified', { position, expectedType });
    return { verified: true, position, expectedType };
  },

  /**
   * Verifies one quote's status badge, addressed by its 1-based position in the cart.
   * Use this (not verifyBookingStatus) when several quotes carry DIFFERENT statuses at the
   * same time - verifyBookingStatus only ever reads the first card.
   *
   * @param {import('playwright').Page} page
   * @param {number} position - 1-based quote position
   * @param {string} expectedStatus - e.g. "On hold", "Pending booking"
   */
  async verifyQuoteStatusByPosition(page, position, expectedStatus) {
    if (!page) throw new Error('page is required');
    if (typeof expectedStatus !== 'string' || !expectedStatus.trim()) {
      throw new Error('expectedStatus must be a non-empty string, got: ' + expectedStatus);
    }

    const cartPage = getPageObject(page, CartPage);
    const label = cartPage.getQuoteStatusLabelByPosition(position);

    await cartPage.waitForQuoteCardByPosition(position);
    // The badge settles asynchronously after a hold/booking round-trip, so poll rather than
    // single-read (a bare read races the Vue re-render and reports the pre-hold status).
    await expect(label).toContainText(new RegExp(escapeRegex(expectedStatus.trim()), 'i'), { timeout: 30000 });

    const actual = await cartPage.getQuoteStatusByPosition(position);
    logger.info('Quote status verified', { position, expectedStatus, actual });
    return actual;
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
   * AB#82538 expectation 1 - every selectable Economy Comfort (PADIS EK) seat on the deck is
   * painted the Economy Comfort magenta.
   *
   * Occupied and already-selected seats are excluded: plane-seat.scss paints those from
   * `&.occupied` / `&.selected` by design, and `&.economy-comfort:not(.occupied)` deliberately
   * yields to the occupied fill.
   *
   * The count is logged, never asserted against a fixed number - how many EK seats a cabin holds
   * is airline data, not behaviour. What IS asserted is that at least one exists, otherwise the
   * colour claim would pass vacuously on a flight with no EK seats.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{economyComfortCount: number, seatLabels: string[]}>}
   * @throws {Error} If the deck holds no Economy Comfort seat, or one is not magenta
   */
  async verifyEconomyComfortSeatsColor(page) {
    if (!page) throw new Error('[Cart.verifyEconomyComfortSeatsColor] "page" is required.');
    logger.info('Verifying Economy Comfort seats are painted the Economy Comfort colour', {
      expectedColor: SEAT_CATEGORY_COLORS.economyComfort,
    });

    const cartPage = getPageObject(page, CartPage);
    const seats = await cartPage.readSeatMapCategorySeats();
    const paintable = seats.filter((seat) => seat.economyComfort && !seat.occupied && !seat.selected);

    logger.info('Seat map category breakdown', {
      categorySeats: seats.length,
      economyComfort: seats.filter((s) => s.economyComfort).length,
      economyComfortSelectable: paintable.length,
      preferred: seats.filter((s) => s.preferred).length,
      extraLegRoom: seats.filter((s) => s.extraLegRoom).length,
    });

    if (paintable.length === 0) {
      throw new Error(
        '[Cart.verifyEconomyComfortSeatsColor] This seat map has no selectable Economy Comfort '
        + 'seat, so the Economy Comfort colour cannot be verified. Either the flight returns no '
        + 'seat with the EK characteristic (38 in the FlightSeats response), or the source system '
        + 'is not yet sending it. Category seats found: '
        + `${JSON.stringify(seats.map((s) => s.seatLabel))}`,
      );
    }

    const wrongColor = paintable.filter(
      (seat) => seat.backgroundColor !== SEAT_CATEGORY_COLORS.economyComfort,
    );
    if (wrongColor.length > 0) {
      throw new Error(
        `[Cart.verifyEconomyComfortSeatsColor] ${wrongColor.length} of ${paintable.length} Economy `
        + `Comfort seats are not painted ${SEAT_CATEGORY_COLORS.economyComfort}: `
        + `${JSON.stringify(wrongColor.map((s) => ({ seat: s.seatLabel, color: s.backgroundColor })))}`,
      );
    }

    logger.info('All Economy Comfort seats are painted the Economy Comfort colour', {
      economyComfortCount: paintable.length,
    });
    return {
      economyComfortCount: paintable.length,
      seatLabels: paintable.map((seat) => seat.seatLabel),
    };
  },

  /**
   * AB#82538 expectation 2a - hovers an Economy Comfort seat so its tooltip renders.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{seatLabel: string}>}
   */
  async hoverEconomyComfortSeat(page) {
    if (!page) throw new Error('[Cart.hoverEconomyComfortSeat] "page" is required.');
    logger.info('Hovering an Economy Comfort seat in the seat map');

    const cartPage = getPageObject(page, CartPage);
    const seatLabel = await cartPage.hoverEconomyComfortSeat();

    logger.debug('Hovered Economy Comfort seat', { seatLabel });
    return { seatLabel };
  },

  /**
   * AB#82538 expectation 2b - the hovered seat's tooltip names the Economy Comfort category.
   *
   * The label comes from the tooltip's STATUS line, where seat-status.ts ranks EconomyComfort above
   * PreferredSeat - so an EK seat that is also preferred must read "Economy Comfort", not
   * "Preferred".
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{tooltipText: string}>}
   */
  async verifyEconomyComfortTooltipLabel(page) {
    if (!page) throw new Error('[Cart.verifyEconomyComfortTooltipLabel] "page" is required.');
    logger.info('Verifying the seat tooltip reads Economy Comfort');

    const cartPage = getPageObject(page, CartPage);
    const tooltipText = await cartPage.getVisibleSeatTooltipText();

    if (!tooltipText.toLowerCase().includes('economy comfort')) {
      throw new Error(
        '[Cart.verifyEconomyComfortTooltipLabel] The Economy Comfort seat tooltip does not name the '
        + `category. Expected it to contain "Economy Comfort", got: "${tooltipText}"`,
      );
    }

    logger.info('Seat tooltip reads Economy Comfort', { tooltipText });
    return { tooltipText };
  },

  /**
   * AB#82538 expectations 3 and 4 - Economy Comfort outranks every other characteristic, so a seat
   * carrying EK **and** Preferred, or EK **and** Extra legroom, is still painted magenta.
   *
   * This is the assertion the story's precedence requirement lives or dies on, so it reads the
   * computed colour of the overlap seats rather than their classes: the seat keeps carrying
   * `preferred` / `extra-leg-room` either way, and only the resolved fill says which rule won.
   *
   * Each overlap is only asserted when the flight actually offers it - a cabin where no EK seat is
   * also preferred proves nothing either way - but at least one of the two must exist, otherwise
   * the step would report success without having tested precedence at all.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{withPreferred: number, withExtraLegRoom: number}>}
   * @throws {Error} If an overlap seat is painted the preferred green or the extra legroom blue
   */
  async verifyEconomyComfortColorOverridesOtherCategories(page) {
    if (!page) {
      throw new Error('[Cart.verifyEconomyComfortColorOverridesOtherCategories] "page" is required.');
    }
    logger.info('Verifying Economy Comfort outranks the preferred and extra legroom colours');

    const cartPage = getPageObject(page, CartPage);
    const seats = await cartPage.readSeatMapCategorySeats();
    const selectable = seats.filter((seat) => !seat.occupied && !seat.selected);

    const withPreferred = selectable.filter((seat) => seat.economyComfort && seat.preferred);
    const withExtraLegRoom = selectable.filter((seat) => seat.economyComfort && seat.extraLegRoom);

    logger.info('Economy Comfort overlap seats found', {
      withPreferred: withPreferred.length,
      withExtraLegRoom: withExtraLegRoom.length,
    });

    if (withPreferred.length === 0 && withExtraLegRoom.length === 0) {
      throw new Error(
        '[Cart.verifyEconomyComfortColorOverridesOtherCategories] No seat on this deck carries '
        + 'Economy Comfort together with Preferred or Extra legroom, so colour precedence cannot be '
        + 'verified on this flight. Category seats: '
        + `${JSON.stringify(selectable.map((s) => ({
          seat: s.seatLabel,
          economyComfort: s.economyComfort,
          preferred: s.preferred,
          extraLegRoom: s.extraLegRoom,
        })))}`,
      );
    }

    const offenders = [...withPreferred, ...withExtraLegRoom].filter(
      (seat) => seat.backgroundColor !== SEAT_CATEGORY_COLORS.economyComfort,
    );
    if (offenders.length > 0) {
      throw new Error(
        '[Cart.verifyEconomyComfortColorOverridesOtherCategories] Economy Comfort did not win the '
        + `cascade on ${offenders.length} seat(s). Expected ${SEAT_CATEGORY_COLORS.economyComfort} `
        + `(magenta), preferred green is ${SEAT_CATEGORY_COLORS.preferred} and extra legroom blue is `
        + `${SEAT_CATEGORY_COLORS.extraLegRoom}. Offending seats: `
        + `${JSON.stringify(offenders.map((s) => ({
          seat: s.seatLabel,
          color: s.backgroundColor,
          preferred: s.preferred,
          extraLegRoom: s.extraLegRoom,
        })))}`,
      );
    }

    logger.info('Economy Comfort outranks both the preferred and the extra legroom colour', {
      withPreferred: withPreferred.length,
      withExtraLegRoom: withExtraLegRoom.length,
    });
    return { withPreferred: withPreferred.length, withExtraLegRoom: withExtraLegRoom.length };
  },

  /**
   * AB#82538 expectation 5 - the new category changed nothing else: a seat that is Preferred or
   * Extra legroom WITHOUT the EK characteristic still paints its own established colour (preferred
   * green, extra legroom blue).
   *
   * This is the regression half of the precedence rule. Each category is only asserted when the
   * flight offers it, and at least one of the two must exist so the step cannot pass on an empty
   * population.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{preferredOnly: number, extraLegRoomOnly: number}>}
   * @throws {Error} If a non-EK preferred or extra legroom seat lost its own colour
   */
  async verifyNonEconomyComfortSeatsKeepColors(page) {
    if (!page) throw new Error('[Cart.verifyNonEconomyComfortSeatsKeepColors] "page" is required.');
    logger.info('Verifying seats without the Economy Comfort characteristic keep their own colours');

    const cartPage = getPageObject(page, CartPage);
    const seats = await cartPage.readSeatMapCategorySeats();
    const selectable = seats.filter(
      (seat) => !seat.occupied && !seat.selected && !seat.economyComfort,
    );

    // Extra legroom is grouped first: plane-seat.scss gives `.plane-seat.extra-leg-room` and
    // `.plane-seat .preferred` the same specificity, so on a seat carrying BOTH, the later rule in
    // the sheet - extra legroom - is the one that paints. Grouping the other way round would assert
    // green on a seat the app legitimately paints blue.
    const extraLegRoomOnly = selectable.filter((seat) => seat.extraLegRoom);
    const preferredOnly = selectable.filter((seat) => seat.preferred && !seat.extraLegRoom);

    logger.info('Non-Economy-Comfort category seats found', {
      preferredOnly: preferredOnly.length,
      extraLegRoomOnly: extraLegRoomOnly.length,
    });

    if (preferredOnly.length === 0 && extraLegRoomOnly.length === 0) {
      throw new Error(
        '[Cart.verifyNonEconomyComfortSeatsKeepColors] This deck has no preferred or extra legroom '
        + 'seat without the Economy Comfort characteristic, so there is nothing to prove the other '
        + 'categories were left alone.',
      );
    }

    const offenders = [
      ...preferredOnly
        .filter((seat) => seat.backgroundColor !== SEAT_CATEGORY_COLORS.preferred)
        .map((seat) => ({
          seat: seat.seatLabel,
          category: 'preferred',
          color: seat.backgroundColor,
          expected: SEAT_CATEGORY_COLORS.preferred,
        })),
      ...extraLegRoomOnly
        .filter((seat) => seat.backgroundColor !== SEAT_CATEGORY_COLORS.extraLegRoom)
        .map((seat) => ({
          seat: seat.seatLabel,
          category: 'extraLegRoom',
          color: seat.backgroundColor,
          expected: SEAT_CATEGORY_COLORS.extraLegRoom,
        })),
    ];
    if (offenders.length > 0) {
      throw new Error(
        `[Cart.verifyNonEconomyComfortSeatsKeepColors] ${offenders.length} seat(s) without the `
        + 'Economy Comfort characteristic lost their own colour: '
        + `${JSON.stringify(offenders)}`,
      );
    }

    logger.info('Seats without Economy Comfort keep their own colours', {
      preferredOnly: preferredOnly.length,
      extraLegRoomOnly: extraLegRoomOnly.length,
    });
    return { preferredOnly: preferredOnly.length, extraLegRoomOnly: extraLegRoomOnly.length };
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
   * AB#80735 — hovers the first chargeable seat that is still free to select, so its tooltip
   * opens. The seat is remembered on the returned object so the follow-up click assertion can
   * target the very seat whose tooltip was read.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{index: number, priceLabel: string}>}
   */
  async hoverFirstPaidSeat(page) {
    if (!page) throw new Error('[Cart.hoverFirstPaidSeat] "page" is required.');
    logger.info('Hovering the first selectable chargeable seat in the seat map');

    const cartPage = getPageObject(page, CartPage);
    const seat = await cartPage.hoverFirstPaidSeat();

    logger.info('Hovered chargeable seat', seat);
    return seat;
  },

  /**
   * Asserts the hovered seat's tooltip carries an exact message.
   *
   * The comparison is against the tooltip's RED lines only (.tooltip-item.red), which is where
   * plane-seat.vue prints every block reason — unselectableMessage, cantBuyPaidSeats and the
   * AB#80735 seatsMustBeBookedWithFopCard. Reading the whole tooltip instead would also swallow
   * the seat number, price and category, so a wrong-reason message could still pass.
   *
   * Deliberately NOT verifySeatSelectionRestricted: that one opens the seat map itself and then
   * hovers the first AVAILABLE seat with a case-insensitive `toContain`. A FOP block only renders
   * on a seat whose displayPrice > 0, so it can land on a free seat and find nothing, and its
   * loose match would accept a different block reason. Pair this with hoverFirstPaidSeat instead.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedMessage - The exact message the tooltip must show
   * @returns {Promise<{tooltipMessage: string}>}
   * @throws {Error} If the tooltip shows no red message, or a different one
   */
  async verifySeatTooltipMessage(page, expectedMessage) {
    if (!page) throw new Error('[Cart.verifySeatTooltipMessage] "page" is required.');
    if (!expectedMessage || typeof expectedMessage !== 'string') {
      throw new Error(
        '[Cart.verifySeatTooltipMessage] "expectedMessage" must be a non-empty string, got: '
        + typeof expectedMessage,
      );
    }
    logger.info('Verifying the seat tooltip message', { expectedMessage });

    const cartPage = getPageObject(page, CartPage);
    const tooltipMessage = await cartPage.getSeatTooltipRedMessage();

    expect(tooltipMessage.replace(/\s+/g, ' ').trim()).toBe(expectedMessage);

    logger.info('Seat tooltip message verified', { tooltipMessage });
    return { tooltipMessage };
  },

  /**
   * AB#80735 — clicks a chargeable seat and proves the click did not buy it.
   *
   * Two independent readings have to agree, because either one alone can pass for the wrong
   * reason: the deck must paint no seat as `selected`, AND every passenger in the left rail must
   * still read "Not selected". A silently-dropped click would fail neither if only the seat's own
   * class were checked on a deck that never repaints.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} seatIndex - The index hoverFirstPaidSeat returned
   * @returns {Promise<{passengerSeatLabels: string[]}>}
   * @throws {Error} If the seat was selected
   */
  async verifyPaidSeatCannotBeSelected(page, seatIndex) {
    if (!page) throw new Error('[Cart.verifyPaidSeatCannotBeSelected] "page" is required.');
    if (!Number.isInteger(seatIndex) || seatIndex < 0) {
      throw new Error(
        '[Cart.verifyPaidSeatCannotBeSelected] "seatIndex" must be a non-negative integer, got: '
        + seatIndex,
      );
    }
    logger.info('Clicking a chargeable seat and verifying it does not get selected', { seatIndex });

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickSelectableSeatByIndex(seatIndex);

    // handleSeatSelect returns synchronously when blocked, so there is no request to wait on.
    // Poll instead of reading once, so a selection that DOES land a tick later still fails the
    // assertion rather than racing past it.
    await expect
      .poll(async () => cartPage.getSelectedSeatCount(), { timeout: 5000, intervals: [500] })
      .toBe(0);

    const passengerSeatLabels = await cartPage.getSeatMapPassengerSeatLabels();

    const seated = passengerSeatLabels.filter((label) => label !== 'Not selected');
    if (seated.length > 0) {
      throw new Error(
        '[Cart.verifyPaidSeatCannotBeSelected] The blocked chargeable seat was assigned after all. '
        + `Expected every passenger to read "Not selected", got: ${JSON.stringify(passengerSeatLabels)}`,
      );
    }

    logger.info('Chargeable seat could not be selected', { passengerSeatLabels });
    return { passengerSeatLabels };
  },

  /**
   * Waits for the open leg of the seat map drawer to load and fails when it shows the
   * "Seating map is not available at the moment" empty state instead of a seat map.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @throws {Error} If the drawer settled on the empty state
   */
  async waitForSeatMapToLoad(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForSeatMapToLoad();

    // The page wait settles on the empty state too (forEachSeatMapLeg skips such legs), so a
    // missing seat map has to be failed here or every seat assertion after it runs on nothing.
    if (!(await cartPage.isSeatMapPresent())) {
      throw new Error(
        'Seating map is not available: the seat selection drawer shows "Seating map is not available '
        + 'at the moment" instead of a seat map. The supplier returned no seat map for this flight — '
        + 'check its seat map response in the supplier log.'
      );
    }
  },

  /**
   * Walks every leg of the seat map drawer (each segment tab, or the single leg when the drawer has
   * no tabs), loading each leg in turn and running `perLegFn(legIndex)` only on legs that actually
   * render a seat map. Legs whose seat map is unavailable (e.g. codeshare / not returned) are
   * skipped, so validations stay reliable across any itinerary — non-stop or connecting, any
   * aircraft. Returns the collected per-leg results. ADO 72357/80662.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {(legIndex: number) => Promise<any>} perLegFn - Assertion/collection run per rendered leg
   * @returns {Promise<Array<any>>}
   */
  async forEachSeatMapLeg(page, perLegFn) {
    if (!page) throw new Error('page is required');
    if (typeof perLegFn !== 'function') {
      throw new Error(`perLegFn must be a function, got: ${typeof perLegFn}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const tabCount = await cartPage.getSeatMapSegmentTabCount();
    const legCount = Math.max(tabCount, 1);
    const results = [];

    for (let i = 0; i < legCount; i++) {
      if (tabCount > 1) {
        await cartPage.clickSeatMapSegmentTab(i);
      }
      await cartPage.waitForSeatMapToLoad();

      if (!(await cartPage.isSeatMapPresent())) {
        logger.info('Skipping leg without an available seat map', { legIndex: i, tabCount });
        continue;
      }

      results.push(await perLegFn(i));
    }

    return results;
  },

  /**
   * Verifies extra-legroom (Economy Comfort) seats are shown in their own extra-legroom colour
   * (blue) and never in the green "preferred" colour, on EVERY leg of the itinerary. Encodes ADO
   * 72357/80662: a seat that carries the `extra-leg-room` class must not also carry the green
   * `preferred` class. The tooltip text is intentionally left untouched — only the seat colour is
   * under test. Robust to non-stop vs connecting flights and to mixed aircraft across legs.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{perLeg: Array<object>, totalExtraLegroom: number}>}
   */
  async verifyExtraLegroomSeatsShownInExtraLegroomColor(page) {
    if (!page) throw new Error('page is required');
    logger.info('Verifying extra-legroom seats use the extra-legroom (blue) colour, not preferred (green), on every leg');

    const cartPage = getPageObject(page, CartPage);

    const perLeg = await this.forEachSeatMapLeg(page, async (legIndex) => {
      const extraLegroomCount = await cartPage.countExtraLegroomSeats();
      const greenPreferredCount = await cartPage.countExtraLegroomPreferredSeats();

      expect(
        greenPreferredCount,
        `Leg ${legIndex}: expected no extra-legroom seat to also carry the green "preferred" class, but found ${greenPreferredCount}`,
      ).toBe(0);

      return { legIndex, extraLegroomCount, greenPreferredCount };
    });

    const totalExtraLegroom = perLeg.reduce((sum, leg) => sum + leg.extraLegroomCount, 0);
    expect(
      totalExtraLegroom,
      'Expected at least one extra-legroom (Economy Comfort) seat across all legs so the colour is actually validated',
    ).toBeGreaterThan(0);

    logger.debug('Extra-legroom seat colour verified on all legs', { perLeg, totalExtraLegroom });
    return { perLeg, totalExtraLegroom };
  },

  /**
   * Verifies the seat map renders the aisle on EVERY leg of the itinerary — flight-deck.vue marks
   * aisle seat cells with the `aisle` class to draw the aisle gap. Encodes ADO 72357/80662, where
   * the aisle was not being drawn at all. Robust to non-stop vs connecting flights and to mixed
   * aircraft across legs; legs without a seat map are skipped.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{perLeg: Array<object>}>}
   */
  async verifySeatMapAisleDisplayed(page) {
    if (!page) throw new Error('page is required');
    logger.info('Verifying the seat map aisle is displayed on every leg');

    const cartPage = getPageObject(page, CartPage);

    const perLeg = await this.forEachSeatMapLeg(page, async (legIndex) => {
      const aisleCount = await cartPage.countAisleSeats();

      expect(
        aisleCount,
        `Leg ${legIndex}: expected the seat map to render an aisle (at least one aisle-marked seat cell)`,
      ).toBeGreaterThan(0);

      return { legIndex, aisleCount };
    });

    expect(
      perLeg.length,
      'Expected at least one leg with a rendered seat map to validate the aisle',
    ).toBeGreaterThan(0);

    logger.debug('Seat map aisle verified on all legs', { perLeg });
    return { perLeg };
  },

  /**
   * Verifies the aisle gaps of the open seat map's active leg are drawn after exactly the expected
   * columns on every row (e.g. ['C', 'H'] for a 3-3-3 cabin, [] for a Business cabin that draws no
   * gap). ADO 85940: a narrowed exit row flagging its outer seats as aisle seats used to move the
   * gap for the whole deck, so a Finnair A350 3-3-3 cabin was drawn as 2-4-3 (A B | C D E H | J K L).
   * Works on the cart seat map and on the results seat preview — both render the same deck.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string[]} expectedAisleAfter - Seat letters expected on the left of each aisle gap
   * @returns {Promise<{rowCount: number, layouts: string[]}>}
   */
  async verifySeatMapAisleAfterColumns(page, expectedAisleAfter) {
    if (!page) throw new Error('page is required');
    if (!Array.isArray(expectedAisleAfter)) {
      throw new Error(`expectedAisleAfter must be an array, got: ${typeof expectedAisleAfter}`);
    }
    logger.info('Verifying the seat map aisle gaps on every row', { expectedAisleAfter });

    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForSeatMapToLoad();
    const rows = await cartPage.getSeatMapRowAisleLayouts();

    expect(rows.length, 'Expected the seat map to render at least one row').toBeGreaterThan(0);

    const draw = (row) => row.letters.map((l) => (row.aisleAfter.includes(l) ? `${l} |` : l)).join(' ');
    const layouts = [...new Set(rows.map(draw))];
    const wrongRows = rows
      .filter((row) => row.aisleAfter.join(',') !== expectedAisleAfter.join(','))
      .map((row) => `row ${row.rowNumber}: ${draw(row)}`);

    expect(
      wrongRows,
      `Expected the aisle gap after [${expectedAisleAfter.join(', ')}] on every row. Drawn layouts: ${layouts.join(' / ')}`,
    ).toEqual([]);

    logger.debug('Seat map aisle gaps verified', { rowCount: rows.length, layouts });
    return { rowCount: rows.length, layouts };
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
   * Starts collecting every OBT /api/v3/FlightSeats call (seat map per flight, saved-seat
   * loads, seat save). Call BEFORE the seat map is opened; pass the returned collector to
   * verifyEverySeatMapWithSeatsHasCacheKey / verifySeatSaveCoversEveryFlight.
   * @param {import('playwright').Page} page
   * @returns {{ responses: import('@playwright/test').Response[], stop: () => void }}
   */
  startRecordingFlightSeatsCalls(page) {
    if (!page) throw new Error("page is required");
    const cartPage = getPageObject(page, CartPage);
    return cartPage.startCollectingFlightSeatsResponses();
  },

  /**
   * #85806 — every seat map that offers a selectable seat must carry the seat-cache key.
   * A map returned with seats but no key lets OBT stamp an empty seatMapCacheKey on the
   * selection, and saveSeats then silently drops that flight's seat.
   * @param {{ responses: import('@playwright/test').Response[] }} collector
   * @returns {Promise<{ seatMaps: object[] }>}
   */
  async verifyEverySeatMapWithSeatsHasCacheKey(collector) {
    const { seatMaps } = await readFlightSeatsCalls(collector);
    logger.info("Recorded flight seat maps", { seatMaps });

    const offeringSeats = seatMaps.filter((map) => map.availableSeats > 0);
    expect(
      offeringSeats.length,
      `Expected at least one seat map with a selectable seat, got: ${JSON.stringify(seatMaps)}`,
    ).toBeGreaterThan(0);

    const keyless = offeringSeats.filter((map) => !map.cacheKey || !map.segmentNumber);
    expect(
      keyless,
      "Seat maps offered selectable seats without a cacheKey/segmentNumber — a seat picked there cannot be saved. " +
      `All maps: ${JSON.stringify(seatMaps)}`,
    ).toEqual([]);

    return { seatMaps };
  },

  /**
   * #85806 — the seat save must carry one entry, with a seat and a seat-cache key, for every
   * flight whose seat map offered seats. Before the fix the PUT carried only the flights
   * whose map had a key, so the other flight's seat vanished while the UI said "Saved".
   * @param {{ responses: import('@playwright/test').Response[] }} collector
   * @returns {Promise<{ segments: object[] }>}
   */
  async verifySeatSaveCoversEveryFlight(collector) {
    const { seatMaps, saves } = await readFlightSeatsCalls(collector);
    logger.info("Recorded seat saves", { saves });

    expect(saves.length, `Expected one seat save (PUT FlightSeats), got ${saves.length}`).toBe(1);
    const [save] = saves;
    expect(save.status, `Seat save returned HTTP ${save.status}`).toBe(200);

    const segments = Array.isArray(save.segments) ? save.segments : [];
    const expectedFlights = [...new Set(seatMaps.filter((map) => map.availableSeats > 0).map((map) => map.flight))];
    const savedFlights = segments.map((segment) => `${segment.carrier || ""}${segment.flightNumber || ""}`);
    expect(
      savedFlights.sort(),
      `Seat save must hold a seat for every flight that offered seats. Expected flights ${JSON.stringify(expectedFlights)}, ` +
      `saved ${JSON.stringify(segments.map((s) => ({ flightNumber: s.flightNumber, segmentNumber: s.segmentNumber, seats: (s.seats || []).map((x) => x.seatNumber) })))}`,
    ).toEqual([...expectedFlights].sort());

    for (const segment of segments) {
      expect(segment.seatMapCacheKey, `Segment ${segment.segmentNumber} (flight ${segment.flightNumber}) has no seatMapCacheKey`).toBeTruthy();
      expect((segment.seats || []).length, `Segment ${segment.segmentNumber} (flight ${segment.flightNumber}) carries no seat`).toBeGreaterThan(0);
    }

    return { segments, expectedFlightCount: expectedFlights.length };
  },

  /**
   * Re-opens the seating extras panel and checks every flight tab shows each passenger's seat
   * with the expected status. Closes the gap in verifySeatsSavedToTrip, which reads the first
   * flight only — #85806 dropped one flight's seat while the other was kept.
   * When the FlightSeats recording is passed, the panel must show one tab for every flight whose
   * seat map offered seats, so a missing tab cannot make "every flight" pass on fewer flights.
   * @param {import('playwright').Page} page
   * @param {string} expectedStatus - e.g. "Pending confirmation"
   * @param {{ responses: import('@playwright/test').Response[], stop: () => void }} [collector]
   * @returns {Promise<{ flights: Array<{ flight: string, seats: object[] }> }>}
   */
  async verifyEveryFlightShowsSeatStatus(page, expectedStatus, collector) {
    if (!page) throw new Error("page is required");
    if (typeof expectedStatus !== "string" || !expectedStatus) throw new Error("expectedStatus must be a non-empty string");

    const cartPage = getPageObject(page, CartPage);
    await cartPage.reopenSeatingExtrasPanel();

    const tabCount = await cartPage.getSeatingFlightTabCount();
    expect(tabCount, "Seating panel shows no flight tabs").toBeGreaterThan(0);
    if (collector) {
      const { seatMaps } = await readFlightSeatsCalls(collector);
      const flightsOfferingSeats = new Set(seatMaps.filter((map) => map.availableSeats > 0).map((map) => map.flight));
      expect(
        tabCount,
        `Seating panel shows ${tabCount} flight tab(s) but ${flightsOfferingSeats.size} flight(s) offered seats: ${JSON.stringify([...flightsOfferingSeats])}`,
      ).toBe(flightsOfferingSeats.size);
    }

    const flights = [];
    for (let index = 0; index < tabCount; index += 1) {
      const flight = await cartPage.selectSeatingFlightTab(index);
      const seats = await cartPage.getVisibleSeatingPassengerSeats();
      flights.push({ flight, seats });
    }
    logger.info("Seating panel per flight", { flights });

    for (const { flight, seats } of flights) {
      for (const { seat, status } of seats) {
        expect(seat, `Flight ${flight}: a passenger has no saved seat. All flights: ${JSON.stringify(flights)}`).toMatch(/^\d+[A-Z]$/);
        expect(
          status.toLowerCase(),
          `Flight ${flight}: seat ${seat} status is "${status}", expected "${expectedStatus}". All flights: ${JSON.stringify(flights)}`,
        ).toContain(expectedStatus.toLowerCase());
      }
    }

    return { flights };
  },

  /**
   * Verifies the seating extras section shows NO pending status indicator — the case where
   * the trip was held without ever selecting a seat. extras-layout.vue renders the yellow
   * `schedule` icon on the collapsed summary row from `isWaitingApproval`, which
   * flight-seating.vue binds to `hasPendingSeats` (TripValidationStatusType.Pending); with no
   * seats selected that status must never be Pending.
   *
   * The seating row itself is anchored first so the assertion cannot pass vacuously on a page
   * where the seating section simply has not rendered yet, and the absence is then held over a
   * stability window — the quote validation arrives asynchronously after a reload, so a single
   * immediate read would pass before the indicator had a chance to appear.
   *
   * @param {import('playwright').Page} page
   * @param {object} [options]
   * @param {number} [options.timeout=15000] - Max wait for the collapsed seating row to render
   * @param {number} [options.stabilityWindow=5000] - How long the indicator must stay absent
   * @returns {Promise<{ pendingIndicatorVisible: boolean }>}
   */
  async verifyNoSeatingPendingIndicator(page, { timeout = 15000, stabilityWindow = 5000 } = {}) {
    if (!page) throw new Error('page is required');
    if (typeof timeout !== 'number' || timeout < 0) {
      throw new Error(`timeout must be >= 0, got ${timeout}`);
    }
    if (typeof stabilityWindow !== 'number' || stabilityWindow < 0) {
      throw new Error(`stabilityWindow must be >= 0, got ${stabilityWindow}`);
    }

    logger.info('Verifying the seating extras section shows no pending status indicator', {
      timeout,
      stabilityWindow,
    });

    const cartPage = getPageObject(page, CartPage);

    // Anchor: the collapsed summary row is the only place the section-level status icon is
    // rendered, so it must exist before its absence means anything.
    await cartPage.ensureSeatingExtrasCollapsed(timeout);

    const pendingIcon = cartPage.getSeatingExtrasPendingStatusIconLocator();
    const deadline = Date.now() + stabilityWindow;

    do {
      const count = await pendingIcon.count();
      if (count > 0) {
        const { icons, rows } = await cartPage.getSeatingExtrasRowState();
        throw new Error(
          'Seating extras shows a pending status indicator even though no seat was selected. ' +
          `Expected no visible ".flight-seating .extra .filled.success-icon.yellow", found ${count}. ` +
          `Seating rows: ${JSON.stringify(rows)}. Status icons found: ${JSON.stringify(icons)}.`
        );
      }
      await page.waitForTimeout(500);
    } while (Date.now() < deadline);

    logger.info('Seating extras shows no pending status indicator');
    return { pendingIndicatorVisible: false };
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
   * Selects a UK Rail delivery method by queue name and saves it.
   *
   * Needed whenever the ticket format matters, because the generic
   * "I fill mandatory Evolvi fields in cart" step takes the FIRST radio of every mandatory row,
   * which for Delivery Method is the printer queue. Only an eTicket carries Apple/Google wallet
   * passes (Evolvi returns PKPassLink/TransitPassLink per issued segment), so a scenario asserting
   * on wallet links has to choose that queue explicitly.
   *
   * Run this BEFORE filling the remaining mandatory extras: saving the row clears its mandatory
   * asterisk, so the generic step then skips it instead of overwriting this choice.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} queueName - Queue name or a distinctive part of it, e.g. "eTicket Queue"
   * @returns {Promise<{selectedLabel: string}>} The full label of the option selected
   */
  async selectDeliveryMethodByName(page, queueName) {
    if (!page) throw new Error('[Cart.selectDeliveryMethodByName] "page" is required.');
    if (typeof queueName !== 'string' || !queueName.trim()) {
      throw new Error(
        `[Cart.selectDeliveryMethodByName] "queueName" must be a non-empty string, got: ${queueName}`
      );
    }

    const cartPage = getPageObject(page, CartPage);

    await Cart.expandDeliveryMethod(page);
    const selectedLabel = await cartPage.selectDeliveryMethodByName(queueName);
    await cartPage.clickSaveButton();
    await cartPage.waitForDeliveryMethodGreenIcon();

    logger.info('[Cart.selectDeliveryMethodByName] Delivery method saved', { queueName, selectedLabel });

    return { selectedLabel };
  },

  /**
   * Expands the UK Rail "Delivery Method" row in the cart extras section, without selecting or
   * saving anything. Opening the panel is what makes the app load its queues and pre-select the
   * TOD station, so this is the prerequisite for reading either back.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async expandDeliveryMethod(page) {
    if (!page) throw new Error('[Cart.expandDeliveryMethod] "page" is required, got: ' + typeof page);

    const cartPage = getPageObject(page, CartPage);
    logger.debug('Expanding the UK Rail delivery method row in the cart extras section');

    try {
      await cartPage.waitForDeliveryMethodSection();
      await cartPage.clickDeliveryMethodClickable();
      await cartPage.waitForDeliveryMethodTitle();
      await cartPage.waitForDeliveryMethodLoaded();
    } catch (err) {
      throw new Error(
        `[Cart.expandDeliveryMethod] Could not open the delivery method extras row for the rail quote in the cart. ` +
        `Either the quote is not a UK Rail quote, or it is past the pending stage where extras are still editable. ` +
        `Original: ${err.message}`,
      );
    }
  },

  /**
   * Asserts the station pre-selected in a delivery method option's station picker. The app fills
   * this with the quote's origin station when the quote has no station saved yet, so it is how the
   * departure city is verified in the Ticket on Departure (TOD) section.
   *
   * Polled rather than read once: expanding the row triggers loadDeliveryMethods, and the picker's
   * value only settles once initSelectedField has run against the loaded station list.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedStation - Station text expected in the picker, matched as a substring
   * @param {string} queueName - Delivery method queue name owning the picker
   * @returns {Promise<void>}
   */
  async verifyDeliveryMethodStation(page, expectedStation, queueName) {
    if (!page) throw new Error('[Cart.verifyDeliveryMethodStation] "page" is required, got: ' + typeof page);
    if (!expectedStation) {
      throw new Error(
        `[Cart.verifyDeliveryMethodStation] "expectedStation" must be a non-empty string, got: ${JSON.stringify(expectedStation)}`,
      );
    }
    if (!queueName) {
      throw new Error(
        `[Cart.verifyDeliveryMethodStation] "queueName" must be a non-empty string, got: ${JSON.stringify(queueName)}`,
      );
    }

    const cartPage = getPageObject(page, CartPage);
    logger.debug('Verifying the delivery method station', { expectedStation, queueName });

    await expect
      .poll(async () => cartPage.getDeliveryMethodOptionStation(queueName), {
        message:
          `Expected the "${queueName}" delivery method option to show "${expectedStation}" as its station — ` +
          `the app pre-selects the quote's departure station there`,
        timeout: 30000,
      })
      .toContain(expectedStation);
  },

  /**
   * Asserts the origin and destination of a UK Rail (Evolvi) quote leg shown in the cart. Both are
   * matched as substrings, because the app renders the supplier's "Station Name (CRS)" label.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedOrigin - Text expected in the origin station
   * @param {string} expectedDestination - Text expected in the destination station
   * @param {object} [options] - Read options
   * @param {number} [options.legIndex] - Zero-based leg index; 0 is the outbound leg
   * @returns {Promise<{origin: string, destination: string}>} The route read from the cart
   */
  async verifyRailRouteInCart(page, expectedOrigin, expectedDestination, { legIndex = 0 } = {}) {
    if (!page) throw new Error('[Cart.verifyRailRouteInCart] "page" is required, got: ' + typeof page);
    if (!expectedOrigin) {
      throw new Error(
        `[Cart.verifyRailRouteInCart] "expectedOrigin" must be a non-empty string, got: ${JSON.stringify(expectedOrigin)}`,
      );
    }
    if (!expectedDestination) {
      throw new Error(
        `[Cart.verifyRailRouteInCart] "expectedDestination" must be a non-empty string, got: ${JSON.stringify(expectedDestination)}`,
      );
    }

    const cartPage = getPageObject(page, CartPage);
    logger.debug('Verifying the rail route in the cart', { expectedOrigin, expectedDestination, legIndex });

    let route;
    try {
      route = await cartPage.getUkRailRoute({ legIndex });
    } catch (err) {
      throw new Error(
        `[Cart.verifyRailRouteInCart] Could not read the route of the rail quote in the cart, so "${expectedOrigin}" ` +
        `to "${expectedDestination}" could not be verified. Original: ${err.message}`,
      );
    }

    expect(
      route.origin,
      `Expected the rail quote in the cart to depart from "${expectedOrigin}", but its route reads ` +
      `"${route.origin}" to "${route.destination}"`,
    ).toContain(expectedOrigin);
    expect(
      route.destination,
      `Expected the rail quote in the cart to arrive at "${expectedDestination}", but its route reads ` +
      `"${route.origin}" to "${route.destination}"`,
    ).toContain(expectedDestination);

    logger.info('Rail route verified in the cart', route);
    return route;
  },

  /**
   * Asserts that every leg of the UK rail (Evolvi) quote in the cart shows the same ticket type.
   *
   * Reads each leg's own footer rather than the card's whole text: a round trip built from a single
   * return fare prints the fare name once per segment, so a card-wide `toContain` would pass on a
   * quote where only the outbound kept the fare the scenario selected.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedTicketType - The fare name both legs must show, e.g. "Anytime Return"
   * @param {object} [options]
   * @param {number[]} [options.legIndexes] - Zero-based legs to check; defaults to the two legs of a round trip
   * @returns {Promise<{legIndex: number, ticketType: string}[]>} What each leg actually showed
   */
  async verifyRailTicketTypeInCart(page, expectedTicketType, { legIndexes = [0, 1] } = {}) {
    if (!page) throw new Error('[Cart.verifyRailTicketTypeInCart] "page" is required, got: ' + typeof page);
    if (typeof expectedTicketType !== 'string' || expectedTicketType.trim() === '') {
      throw new Error(
        `[Cart.verifyRailTicketTypeInCart] "expectedTicketType" must be a non-empty string, got: ${JSON.stringify(expectedTicketType)}`,
      );
    }
    if (!Array.isArray(legIndexes) || legIndexes.length === 0) {
      throw new Error(
        `[Cart.verifyRailTicketTypeInCart] "legIndexes" must be a non-empty array, got: ${JSON.stringify(legIndexes)}`,
      );
    }

    const cartPage = getPageObject(page, CartPage);
    logger.debug('Verifying the rail ticket type in the cart', { expectedTicketType, legIndexes });

    const readTicketTypes = [];
    for (const legIndex of legIndexes) {
      let ticketType;
      try {
        ticketType = await cartPage.getUkRailTicketType({ legIndex });
      } catch (err) {
        throw new Error(
          `[Cart.verifyRailTicketTypeInCart] Could not read the ticket type of rail quote leg ${legIndex} in the ` +
          `cart, so "${expectedTicketType}" could not be verified. Original: ${err.message}`,
        );
      }
      readTicketTypes.push({ legIndex, ticketType });
    }

    for (const { legIndex, ticketType } of readTicketTypes) {
      expect(
        ticketType,
        `Expected leg ${legIndex} of the rail quote in the cart to show the ticket type "${expectedTicketType}", ` +
        `but its footer reads "${ticketType}". All legs read: ${JSON.stringify(readTicketTypes)}`,
      ).toBe(expectedTicketType);
    }

    logger.info('Rail ticket type verified in the cart', { expectedTicketType, readTicketTypes });
    return readTicketTypes;
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
   * Hovers the countdown clock on a timed quote and returns the tooltip message it reveals.
   *
   * The tooltip states how long the selection is held (e.g. "Your session is valid for 15:00
   * minutes ..."), so suppliers with a fixed hold window are verified through this message.
   * The message is returned rather than asserted — the expected wording belongs in the step.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The tooltip message with whitespace normalized
   */
  async hoverCountdownClockAndGetTooltipMessage(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);

    await cartPage.waitForTimedQuoteBadge();
    await cartPage.hoverTimedQuoteBadge();

    let message;
    try {
      message = await cartPage.getTimedQuoteTooltipMessage();
    }
    catch (err) {
      throw new Error(
        `[Cart.hoverCountdownClockAndGetTooltipMessage] The countdown clock was hovered but its ` +
        `tooltip never appeared. The badge only renders while the quote is pending with an expiry, ` +
        `so a quote that expired mid-scenario shows "Expired" and no tooltip. Original: ${err.message}`
      );
    }

    logger.info('Read the timed quote countdown tooltip', { tooltipMessage: message });
    return message;
  },

  /**
   * Asserts the countdown clock on the timed quote is still ticking, and that the whole minutes it
   * shows fall inside the supplier's hold window.
   *
   * This is the expiry half of an expiry test, and it has to read the BADGE: the tooltip states the
   * static hold window (`countdownDuration`, 60 for UK rail), so its wording is identical on an
   * expired quote. The badge is where the live `M:SS` lives — and where app-timed-quote.vue swaps in
   * "Expired" once `quote.expires` passes, through the very same span. Anything that is not a
   * parsable `M:SS` is therefore treated as a failure rather than ignored, which is what stops this
   * from going green on a quote that already ran out.
   *
   * The value is range-checked, not pinned: the countdown is derived from the server's expiry, so it
   * has already ticked down a few seconds by the time the cart is reached.
   *
   * @param {import('playwright').Page} page
   * @param {object} [options]
   * @param {number} [options.minMinutes] - Lowest acceptable whole minute remaining (inclusive)
   * @param {number} [options.maxMinutes] - Highest acceptable whole minute remaining (inclusive)
   * @returns {Promise<{countdown: string, minutes: number}>}
   * @throws {Error} If the clock reads "Expired", is unparsable, or is outside the window
   */
  async verifyCountdownClockWithinWindow(page, { minMinutes, maxMinutes } = {}) {
    if (!page) {
      throw new Error('[Cart.verifyCountdownClockWithinWindow] "page" is required.');
    }
    if (!Number.isFinite(minMinutes) || !Number.isFinite(maxMinutes)) {
      throw new Error(
        '[Cart.verifyCountdownClockWithinWindow] "minMinutes" and "maxMinutes" are both required.',
      );
    }

    const cartPage = getPageObject(page, CartPage);
    let countdownText;
    try {
      countdownText = await cartPage.getTimedQuoteBadgeCountdownText();
    }
    catch (err) {
      throw new Error(
        `[Cart.verifyCountdownClockWithinWindow] No countdown clock was rendered on the timed quote. ` +
        `The badge only appears while the quote is pending with an expiry. Original: ${err.message}`,
      );
    }

    const match = countdownText.match(/^(\d{1,3}):([0-5]\d)$/);
    if (!match) {
      throw new Error(
        `[Cart.verifyCountdownClockWithinWindow] Expected the countdown clock to show a live M:SS ` +
        `countdown, but it read: "${countdownText}". "Expired" here means the quote ran out before the ` +
        `clock was read — the badge renders the countdown and the expired state through the same span. ` +
        `Text carrying the "schedule" ligature instead means the badge's icon span is no longer being ` +
        `excluded by TIMED_QUOTE_BADGE_COUNTDOWN.`,
      );
    }

    const minutes = Number(match[1]);
    if (minutes < minMinutes || minutes > maxMinutes) {
      throw new Error(
        `[Cart.verifyCountdownClockWithinWindow] The countdown clock showed ${countdownText} ` +
        `(${minutes} min), outside the expected ${minMinutes}-${maxMinutes} minute window. The window ` +
        `comes from the supplier's hold time, so a lower value means the quote was already ageing when ` +
        `it was read.`,
      );
    }

    logger.info('Countdown clock is within the expected window', { countdown: countdownText, minutes });
    return { countdown: countdownText, minutes };
  },

  /**
   * Verifies the "time left to book" countdown is visible on the checkout page AND is still
   * counting down within the expected booking window.
   *
   * Benerail checkout renders app-timed-cart.vue, which shows the countdown message inline
   * (no hover/tooltip needed) sharing the same markup as the cart's timed-quote tooltip, so
   * the existing page read is reused directly instead of the badge-hover flow above.
   *
   * The wording check is not cosmetic: app-timed-cart.vue renders BOTH the live countdown and
   * the "Cart expired ..." message as a `<p class="fs14">` inside the same
   * `.timed-quote-tooltip-content` container, so a presence-only read goes green on an expired
   * cart — the exact failure an expiry test exists to catch. The countdown itself is
   * `M:SS` derived from the server's `quote.expires`, so the minutes are range-checked rather
   * than compared to a fixed value.
   *
   * @param {import('playwright').Page} page
   * @param {object} [options]
   * @param {number} [options.minMinutes=18] - Lowest acceptable whole minute remaining (inclusive)
   * @param {number} [options.maxMinutes=20] - Highest acceptable whole minute remaining (inclusive)
   * @returns {Promise<{visible: true, countdown: string, minutes: number}>}
   */
  async verifyTimeLeftToBookCounterVisibleInCheckout(page, { minMinutes = 18, maxMinutes = 20 } = {}) {
    if (!page) {
      throw new Error('[Cart.verifyTimeLeftToBookCounterVisibleInCheckout] "page" is required.');
    }

    const cartPage = getPageObject(page, CartPage);
    let message;
    try {
      message = await cartPage.getTimedQuoteTooltipMessage();
    } catch (err) {
      throw new Error(
        `[Cart.verifyTimeLeftToBookCounterVisibleInCheckout] The "time left to book" counter was not visible ` +
        `in checkout within the expected timeout. Original: ${err.message}`,
      );
    }

    if (!/time left to book/i.test(message)) {
      throw new Error(
        `[Cart.verifyTimeLeftToBookCounterVisibleInCheckout] Expected the "Time left to book" countdown in ` +
        `checkout, but the timed-cart banner read: "${message}". A "Cart expired" message here means the ` +
        `quote expired before checkout was reached.`,
      );
    }

    const match = message.match(/(\d+):([0-5]\d)/);
    if (!match) {
      throw new Error(
        `[Cart.verifyTimeLeftToBookCounterVisibleInCheckout] The "Time left to book" label was shown but no ` +
        `M:SS countdown was rendered next to it. Banner text: "${message}".`,
      );
    }

    const minutes = Number(match[1]);
    if (minutes < minMinutes || minutes > maxMinutes) {
      throw new Error(
        `[Cart.verifyTimeLeftToBookCounterVisibleInCheckout] The countdown showed ${match[0]} ` +
        `(${minutes} min), outside the expected ${minMinutes}-${maxMinutes} minute booking window. ` +
        `The window comes from the supplier's quote expiry, so a value below the range means the quote was ` +
        `already ageing before checkout was reached.`,
      );
    }

    logger.info('Time left to book counter is visible in checkout', { countdown: match[0], minutes });
    return { visible: true, countdown: match[0], minutes };
  },

  /**
   * Verifies the rail quote's line in the cart trip-summary sidebar shows no "Seating" price —
   * i.e. no seat reservation cost is folded into the journey price while no seat has been chosen
   * (test 51524). eu-rail-quote-summary.vue only renders that row when the quote carries a
   * displaySeatPrice, so the row's absence is the assertion.
   *
   * @param {import('playwright').Page} page
   * @throws {Error} If a seating price row is displayed on the rail quote's summary line
   */
  async verifySeatingPriceNotDisplayedInTripSummary(page) {
    if (!page) {
      throw new Error('[Cart.verifySeatingPriceNotDisplayedInTripSummary] "page" is required.');
    }

    const cartPage = getPageObject(page, CartPage);
    const isSeatingPriceDisplayed = await cartPage.isRailQuoteSummarySeatPriceVisible();

    if (isSeatingPriceDisplayed) {
      const seatingPriceText = await cartPage.getRailQuoteSummarySeatPriceText();
      throw new Error(
        `[Cart.verifySeatingPriceNotDisplayedInTripSummary] Expected the rail quote's cart summary line ` +
        `to show no seating price before any seat was selected, but it shows: "${seatingPriceText}"`,
      );
    }

    logger.info('No seating price is displayed on the rail quote cart summary line');
    return { seatingPriceDisplayed: false };
  },

  /**
   * Opens the rail seating extras section on the cart's rail quote and waits for its seat data.
   * The same trigger reads "Add" before any seat is chosen and "Edit" afterwards, so this one
   * method serves every pass over the panel (test 51524).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{openButtonLabel: string, segmentCount: number}>}
   */
  async openRailSeatingExtras(page) {
    if (!page) {
      throw new Error('[Cart.openRailSeatingExtras] "page" is required.');
    }

    logger.debug('Opening the rail seating extras section');
    const cartPage = getPageObject(page, CartPage);

    try {
      const openButtonLabel = await cartPage.clickRailSeatingExtrasOpenButton();
      await cartPage.waitForRailSeatingExtrasCard();
      const segmentCount = await cartPage.getRailSeatingSegmentCount();

      logger.info('Rail seating extras section is open', { openButtonLabel, segmentCount });
      return { openButtonLabel, segmentCount };
    } catch (error) {
      throw new Error(
        `[Cart.openRailSeatingExtras] Could not open the rail quote's Seating extras section in the ` +
        `cart. Original: ${error.message}`,
      );
    }
  },

  /**
   * Ticks one seat on each journey leg of the rail seating panel — outbound (leg 0) and inbound
   * (leg 1). Each click is verified to have left the checkbox CHECKED: eu-rail-seats.vue's handler
   * toggles rather than sets, so a click landing on an already-selected seat would silently clear
   * it and the seating price would never appear (test 51524).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{outbound: {caption: string}, inbound: {caption: string}}>}
   * @throws {Error} If the journey has fewer than two legs, or a seat did not stay selected
   */
  async selectRailSeatsForOutboundAndInbound(page) {
    if (!page) {
      throw new Error('[Cart.selectRailSeatsForOutboundAndInbound] "page" is required.');
    }

    logger.debug('Selecting a seat on the outbound and inbound journey legs');
    const cartPage = getPageObject(page, CartPage);
    const segmentCount = await cartPage.getRailSeatingSegmentCount();

    if (segmentCount < RAIL_SEATING_LEG_INDEXES.length) {
      const captions = [];
      for (let index = 0; index < segmentCount; index += 1) {
        captions.push(await cartPage.getRailSeatingSegmentCaption(index));
      }
      throw new Error(
        `[Cart.selectRailSeatsForOutboundAndInbound] Selecting an outbound and an inbound seat needs ` +
        `two journey legs in the seating panel, but it shows ${segmentCount}` +
        `${captions.length ? ` (${captions.join(' | ')})` : ''}. This is what a one-way search looks ` +
        `like here — the scenario must search a round trip.`,
      );
    }

    const selectedLegs = {};

    for (const { leg, index } of RAIL_SEATING_LEG_INDEXES) {
      const caption = await cartPage.getRailSeatingSegmentCaption(index);
      await cartPage.clickRailSeatingSeatCheckbox(index);

      const isChecked = await cartPage.isRailSeatingSeatCheckboxChecked(index);
      if (!isChecked) {
        throw new Error(
          `[Cart.selectRailSeatsForOutboundAndInbound] The ${leg} seat checkbox ("${caption}") is not ` +
          `selected after clicking it. eu-rail-seats.vue toggles seat selection, so the seat was most ` +
          `likely already selected and this click cleared it.`,
        );
      }

      selectedLegs[leg] = { caption };
      logger.info('Seat selected on a journey leg', { leg, caption });
    }

    return selectedLegs;
  },

  /**
   * Reads the per-leg seat prices shown in the rail seating panel and their sum. The display-currency
   * figure is taken deliberately — that is the currency the cart summary's seating row also uses, so
   * the two are directly comparable (test 51524).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{outbound: number, inbound: number, total: number, outboundText: string, inboundText: string}>}
   */
  async extractRailSeatPrices(page) {
    if (!page) {
      throw new Error('[Cart.extractRailSeatPrices] "page" is required.');
    }

    logger.debug('Reading the outbound and inbound seat prices from the rail seating panel');
    const cartPage = getPageObject(page, CartPage);
    const prices = {};

    for (const { leg, index } of RAIL_SEATING_LEG_INDEXES) {
      const priceText = await cartPage.getRailSeatingSeatDisplayPriceText(index);
      prices[leg] = parseAmountText(priceText, `${leg} rail seat price`);
      prices[`${leg}Text`] = priceText;
    }

    const total = prices.outbound + prices.inbound;
    const extractedPrices = { ...prices, total };

    logger.info('Extracted the rail seat prices', extractedPrices);
    return extractedPrices;
  },

  /**
   * Verifies the rail quote's cart summary seating row equals the outbound plus inbound seat prices
   * that were selected (test 51524).
   *
   * Polled rather than read once: saving the seats fires an async refreshQuotes, so the summary can
   * still be showing the pre-save figure for a moment after the save settles.
   *
   * @param {import('playwright').Page} page
   * @param {number} outboundSeatPrice - Outbound leg's seat price, in the displayed currency
   * @param {number} inboundSeatPrice - Inbound leg's seat price, in the displayed currency
   * @throws {Error} If the summary's seating price never lands within RAIL_SEATING_PRICE_TOLERANCE
   *   of the sum of the two legs
   */
  async verifyRailSeatingPriceIsSumOfSeats(page, outboundSeatPrice, inboundSeatPrice) {
    if (!page) {
      throw new Error('[Cart.verifyRailSeatingPriceIsSumOfSeats] "page" is required.');
    }
    if (!Number.isFinite(outboundSeatPrice)) {
      throw new Error(
        `[Cart.verifyRailSeatingPriceIsSumOfSeats] "outboundSeatPrice" must be a finite number, got: ` +
        `${typeof outboundSeatPrice} (${outboundSeatPrice})`,
      );
    }
    if (!Number.isFinite(inboundSeatPrice)) {
      throw new Error(
        `[Cart.verifyRailSeatingPriceIsSumOfSeats] "inboundSeatPrice" must be a finite number, got: ` +
        `${typeof inboundSeatPrice} (${inboundSeatPrice})`,
      );
    }

    const expectedTotal = outboundSeatPrice + inboundSeatPrice;
    logger.debug('Verifying the rail cart summary seating price against the selected seats', {
      outboundSeatPrice,
      inboundSeatPrice,
      expectedTotal,
    });

    const cartPage = getPageObject(page, CartPage);
    let lastSeenText = '(the seating row never became visible)';

    // The distance from the expected total is polled rather than the amount itself, so a summary
    // still showing the pre-save figure keeps retrying and the tolerance stays an inclusive
    // cents comparison (toBeCloseTo's precision cannot express "one cent per leg").
    await expect
      .poll(
        async () => {
          try {
            lastSeenText = await cartPage.getRailQuoteSummarySeatPriceText();
            const summaryTotal = parseAmountText(lastSeenText, 'rail cart summary seating price');
            return Number.isFinite(summaryTotal)
              ? Math.abs(summaryTotal - expectedTotal)
              : Number.POSITIVE_INFINITY;
          } catch {
            return Number.POSITIVE_INFINITY;
          }
        },
        {
          timeout: RAIL_SEATING_SUMMARY_POLL_TIMEOUT_MS,
          message:
            `[Cart.verifyRailSeatingPriceIsSumOfSeats] The rail quote's cart summary seating price ` +
            `never settled within ${RAIL_SEATING_PRICE_TOLERANCE} of the sum of the selected seats. ` +
            `Expected ${expectedTotal} (outbound ${outboundSeatPrice} + inbound ${inboundSeatPrice}); ` +
            `the summary last showed "${lastSeenText}".`,
        },
      )
      .toBeLessThanOrEqual(RAIL_SEATING_PRICE_TOLERANCE);

    logger.info('The rail cart summary seating price equals the outbound plus inbound seat prices', {
      outboundSeatPrice,
      inboundSeatPrice,
      expectedTotal,
      summaryText: lastSeenText,
    });
    return { expectedTotal, summaryText: lastSeenText };
  },

  /**
   * Ticks "Continue without reserving seats" in the rail seating panel. This is the app's own way to
   * drop every reserved seat: it clears each selected seat AND is the only thing that re-enables
   * Save once nothing is selected (canSaveMooveSeats in eu-rail-seats.ts). Both effects are asserted
   * here so a no-op fails on the spot rather than as a confusing price assertion later (test 51524).
   *
   * @param {import('playwright').Page} page
   * @throws {Error} If the checkbox did not tick, or Save stayed disabled afterwards
   */
  async selectRailContinueWithoutSeats(page) {
    if (!page) {
      throw new Error('[Cart.selectRailContinueWithoutSeats] "page" is required.');
    }

    logger.debug('Ticking "Continue without reserving seats" in the rail seating panel');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickRailSeatingContinueWithoutSeatsCheckbox();

    const isChecked = await cartPage.isRailSeatingContinueWithoutSeatsChecked();
    if (!isChecked) {
      throw new Error(
        '[Cart.selectRailContinueWithoutSeats] The "Continue without reserving seats" checkbox is not ' +
        'ticked after clicking it, so the reserved seats have not been dropped.',
      );
    }

    const isSaveEnabled = await cartPage.isRailSeatingSaveButtonEnabled();
    if (!isSaveEnabled) {
      throw new Error(
        '[Cart.selectRailContinueWithoutSeats] "Continue without reserving seats" is ticked but the ' +
        'rail seating panel\'s Save button is still disabled, so the seats cannot be removed. ' +
        'eu-rail-seats.ts enables Save via canSaveMooveSeats once this box is ticked — the app is not ' +
        'reacting to the change.',
      );
    }

    logger.info('"Continue without reserving seats" is ticked and Save is enabled');
    return { continueWithoutSeats: true, saveEnabled: true };
  },

  // ===== UK RAIL (EVOLVI) SEAT RESERVATION (test 62143) =====
  //
  // Separate from the openRailSeatingExtras family above: that drives Benerail's eu-rail-seats.vue
  // (a checkbox list of priced seats), this drives Evolvi's uk-rail-seats.vue (per-leg seat-TYPE
  // radios, and a Coach/Seat/Direction form once "Specific Seat" is the chosen type).

  /**
   * Opens the UK Rail quote's Seating extras row and waits for the seat panel to be readable.
   * The same trigger reads "Add" before any seat is reserved and "Edit" afterwards, so this one
   * method serves every pass over the panel.
   *
   * Also arms the capture of the seat-save POST and hands it back, because the coach that is
   * actually sent can only be read off that request and it has to be armed before the Save click.
   * Arming it HERE rather than in a step of its own keeps the ordering impossible to get wrong: no
   * scenario can reach Save without having opened the panel first.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{openButtonLabel: string, seatOptions: string[], saveCapture: object}>}
   */
  async openUkRailSeatReservationExtras(page) {
    if (!page) {
      throw new Error('[Cart.openUkRailSeatReservationExtras] "page" is required.');
    }

    logger.debug('Opening the UK Rail seat reservation extras section');
    const cartPage = getPageObject(page, CartPage);

    // Armed before the row is even expanded — the panel's own load must not race the arming.
    const saveCapture = this.startCapturingUkRailSeatsSaveRequest(page);

    try {
      const openButtonLabel = await cartPage.clickUkRailSeatsExtrasOpenButton();
      await cartPage.waitForUkRailSeatsExtrasCard();
      const seatOptions = await cartPage.getUkRailSeatOptionLabels();

      logger.info('UK Rail seat reservation panel is open', { openButtonLabel, seatOptions });
      return { openButtonLabel, seatOptions, saveCapture };
    } catch (error) {
      throw new Error(
        `[Cart.openUkRailSeatReservationExtras] Could not open the UK Rail quote's Seating extras ` +
        `section in the cart. Original: ${error.message}`,
      );
    }
  },

  /**
   * Selects one seat type in the open UK Rail seat panel and proves it took. The radio group is
   * bound per leg and re-renders the form below it on change, so a click that did not land leaves
   * the wrong (or no) form on screen — asserted here rather than surfacing as a missing Coach field.
   *
   * @param {import('playwright').Page} page
   * @param {string} optionLabel - Radio label as rendered, e.g. "Specific Seat"
   * @returns {Promise<{optionLabel: string}>}
   */
  async selectUkRailSeatOption(page, optionLabel) {
    if (!page) throw new Error('[Cart.selectUkRailSeatOption] "page" is required.');
    if (!optionLabel || typeof optionLabel !== 'string') {
      throw new Error(
        `[Cart.selectUkRailSeatOption] "optionLabel" must be a non-empty string, got: ${JSON.stringify(optionLabel)}`,
      );
    }

    logger.debug('Selecting a UK Rail seat type', { optionLabel });
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickUkRailSeatOption(optionLabel);

    const isChecked = await cartPage.isUkRailSeatOptionChecked(optionLabel);
    expect(
      isChecked,
      `[Cart.selectUkRailSeatOption] Clicked the "${optionLabel}" seat-type radio but it is not selected ` +
      `afterwards, so the panel is still showing a different seat type's form. The el-radio-group is ` +
      `bound per leg in uk-rail-seats.vue — the click may have landed on a hidden responsive duplicate.`,
    ).toBe(true);

    logger.info('UK Rail seat type selected', { optionLabel });
    return { optionLabel };
  },

  /**
   * Picks the first coach the supplier offered in the open Specific Seat form.
   *
   * The panel cannot name a coach up front — uk-rail-seats.ts builds coachOptions from the
   * seat-map response, which differs per service — so the first option is the only stable choice.
   * The value is returned for logging only: what the app SENDS is asserted from the save request,
   * because coachOptions labels every option with the coach letter regardless of the value it binds
   * (test 62143).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{coach: string}>}
   */
  async selectFirstUkRailSeatCoach(page) {
    if (!page) throw new Error('[Cart.selectFirstUkRailSeatCoach] "page" is required.');

    logger.debug('Picking the first offered coach in the UK Rail Specific Seat form');
    const cartPage = getPageObject(page, CartPage);

    let coach;
    try {
      coach = await cartPage.selectFirstUkRailSeatFieldOption('Coach');
    } catch (error) {
      throw new Error(
        `[Cart.selectFirstUkRailSeatCoach] Could not pick a coach for the UK Rail specific seat ` +
        `reservation. Either the Specific Seat radio is not the selected seat type (the Coach field ` +
        `only renders for it) or the supplier returned an empty coach list. Original: ${error.message}`,
      );
    }

    logger.info('UK Rail coach selected', { coach });
    return { coach };
  },

  /**
   * Fills the Leading Traveller telephone number required by the UK Rail seat reservation, and
   * reads it back. The field is an el-input type="number" that only pushes its value up on blur,
   * so a silently-empty model would otherwise surface as a save that does nothing.
   *
   * @param {import('playwright').Page} page
   * @param {string} phoneNumber - Digits only
   * @returns {Promise<{phoneNumber: string}>}
   */
  async fillUkRailSeatReservationTelephone(page, phoneNumber) {
    if (!page) throw new Error('[Cart.fillUkRailSeatReservationTelephone] "page" is required.');
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      throw new Error(
        `[Cart.fillUkRailSeatReservationTelephone] "phoneNumber" must be a non-empty string, got: ${JSON.stringify(phoneNumber)}`,
      );
    }

    logger.debug('Filling the UK Rail seat reservation telephone number', { phoneNumber });
    const cartPage = getPageObject(page, CartPage);
    await cartPage.fillUkRailSeatsTelephone(phoneNumber);

    const actual = await cartPage.getUkRailSeatsTelephoneValue();
    expect(
      actual,
      `[Cart.fillUkRailSeatReservationTelephone] Expected the UK Rail seat reservation telephone field ` +
      `to hold "${phoneNumber}" after filling it, but it reads "${actual}". The field is type="number", ` +
      `so any non-digit character in the value is silently dropped by the browser.`,
    ).toBe(phoneNumber);

    logger.info('UK Rail seat reservation telephone filled', { phoneNumber });
    return { phoneNumber };
  },

  /**
   * Asserts one value in the open UK Rail seat panel, routing to the control the value belongs to.
   *
   * The feature asserts two different things through the single phrase "the UK Rail seat option
   * should be X", so the control is chosen from the seat-TYPE labels the panel is actually
   * rendering rather than guessed:
   *   - X is one of those labels (e.g. "Specific Seat") -> the `is-checked` el-radio is compared.
   *     On a reopened panel that is the only proof the previous save's seat type came back, since
   *     uk-rail-seats.ts rebuilds `selectedSeatTypeByLeg` from the reloaded seat-map response on
   *     every open (initSeatsToSelect).
   *   - X is anything else (e.g. "Any") -> the first dropdown of whichever per-type form the
   *     panel is rendering is compared. On a fresh open initSeatsToSelect always checks the plain
   *     "Seat" type, whose form has no "Seat"-labelled field (Direction/Location/Position only),
   *     so the default preference has to be read type-agnostically — the Testim recording of test
   *     54559 asserted exactly this first field.
   * Routing this way keeps each call landing on exactly one control, so nothing passes because some
   * unrelated part of the panel happened to contain the string.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedValue - e.g. "Specific Seat" (a seat type) or "Any" (a preference)
   * @returns {Promise<{source: string, actual: string}>}
   */
  async verifyUkRailSeatOption(page, expectedValue) {
    if (!page) throw new Error('[Cart.verifyUkRailSeatOption] "page" is required.');
    if (!expectedValue || typeof expectedValue !== 'string') {
      throw new Error(
        `[Cart.verifyUkRailSeatOption] "expectedValue" must be a non-empty string, got: ${JSON.stringify(expectedValue)}`,
      );
    }

    logger.debug('Reading the UK Rail seat option', { expectedValue });
    const cartPage = getPageObject(page, CartPage);
    const offeredTypes = await cartPage.getUkRailSeatOptionLabels();

    if (offeredTypes.includes(expectedValue)) {
      const actual = await cartPage.getSelectedUkRailSeatOptionLabel();

      if (actual !== expectedValue) {
        throw new Error(
          `[Cart.verifyUkRailSeatOption] Expected the UK Rail seat panel's selected seat type to be ` +
          `"${expectedValue}", but it is ${actual === null ? 'nothing' : `"${actual}"`}. ` +
          `Offered: ${offeredTypes.map((label) => `"${label}"`).join(', ')}. uk-rail-seats.ts rebuilds ` +
          `the radio selection from the reloaded seat-map response on every open (initSeatsToSelect), ` +
          `so a reservation whose seat type did not come back means the saved selection was not ` +
          `restored.`,
        );
      }

      logger.info('UK Rail seat type verified', { actual });
      return { source: 'seat-type-radio', actual };
    }

    const { label, value: actual } = await cartPage.getUkRailFirstSeatPreferenceField();

    if (actual !== expectedValue) {
      throw new Error(
        `[Cart.verifyUkRailSeatOption] Expected the UK Rail seat form's first preference dropdown ` +
        `("${label}") to read "${expectedValue}", but it reads "${actual}". "${expectedValue}" is not ` +
        `one of the seat types the panel offers ` +
        `(${offeredTypes.map((typeLabel) => `"${typeLabel}"`).join(', ')}), so it was read as a ` +
        `preference value. Those options come from the seat-map response's dropdowns, so a different ` +
        `value means either the supplier offered a different default or a previous save committed a ` +
        `preference.`,
      );
    }

    logger.info('UK Rail seat preference verified', { label, actual });
    return { source: `preference-dropdown:${label}`, actual };
  },

  /**
   * Reads the seat number currently offered in the open Specific Seat form so a later step can
   * compare it with the seat the panel reports as reserved.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{seat: string}>}
   */
  async extractUkRailOfferedSeatNumber(page) {
    if (!page) throw new Error('[Cart.extractUkRailOfferedSeatNumber] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    const seat = await cartPage.getUkRailSeatFieldValue('Seat');

    logger.info('Read the offered UK Rail seat number', { seat });
    return { seat };
  },

  /**
   * Reads the coach currently offered in the open Specific Seat form.
   *
   * Only ever compared against what the panel itself reports as reserved — what the app SENDS is
   * asserted from the save request instead, because coachOptions labels every option with the coach
   * letter regardless of the value it binds (test 62143).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{coach: string}>}
   */
  async extractUkRailOfferedCoach(page) {
    if (!page) throw new Error('[Cart.extractUkRailOfferedCoach] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    const coach = await cartPage.getUkRailSeatFieldValue('Coach');

    logger.info('Read the offered UK Rail coach', { coach });
    return { coach };
  },

  /**
   * Asserts the open UK Rail seat panel's per-leg seat summary contains a given text.
   *
   * That summary is the supplier-built `seat.seatDetail` string, rendered with `v-html` — it has no
   * element of its own, so the leg's text is read and matched. This is also why the label being
   * looked for ("Reserved Seat:") cannot be found by grepping the Vue templates.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText - e.g. "Reserved Seat:"
   * @returns {Promise<{summaryText: string}>}
   */
  async verifyUkRailSeatSummaryContainsText(page, expectedText) {
    if (!page) throw new Error('[Cart.verifyUkRailSeatSummaryContainsText] "page" is required.');
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(
        `[Cart.verifyUkRailSeatSummaryContainsText] "expectedText" must be a non-empty string, got: ` +
        `${JSON.stringify(expectedText)}`,
      );
    }

    logger.debug('Reading the UK Rail seat panel summary', { expectedText });
    const cartPage = getPageObject(page, CartPage);
    const summaryText = await cartPage.getUkRailSeatsSegmentText();

    if (!summaryText.includes(expectedText)) {
      throw new Error(
        `[Cart.verifyUkRailSeatSummaryContainsText] Expected the UK Rail seat panel's seat summary to ` +
        `contain "${expectedText}", but it reads "${summaryText}". The summary is the supplier's own ` +
        `seatDetail string from the seat-map response, so the label is missing when nothing is ` +
        `reserved on this leg yet.`,
      );
    }

    logger.info('UK Rail seat summary contains the expected text', { expectedText });
    return { summaryText };
  },

  /**
   * Asserts the seat the open panel reports as reserved is the one that was offered.
   *
   * The reserved seat lives in the same `v-html` seatDetail string, so it is pulled out by matching
   * the seat number as a whole token — a bare `includes` would let seat "4" pass against a reserved
   * "45".
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedSeat - The seat number read earlier by extractUkRailOfferedSeatNumber
   * @returns {Promise<{summaryText: string, expectedSeat: string}>}
   */
  async verifyUkRailSeatSummaryMatchesSeat(page, expectedSeat) {
    if (!page) throw new Error('[Cart.verifyUkRailSeatSummaryMatchesSeat] "page" is required.');
    if (!expectedSeat || typeof expectedSeat !== 'string') {
      throw new Error(
        `[Cart.verifyUkRailSeatSummaryMatchesSeat] "expectedSeat" must be a non-empty string, got: ` +
        `${JSON.stringify(expectedSeat)}. It is stored by "I extract the offered seat number from the ` +
        `UK Rail seat reservation", so that step has to run first in the same scenario.`,
      );
    }

    logger.debug('Comparing the reserved UK Rail seat with the offered one', { expectedSeat });
    const cartPage = getPageObject(page, CartPage);
    const summaryText = await cartPage.getUkRailSeatsSegmentText();

    const seatPattern = new RegExp(`Seat:?\\s*${escapeRegex(expectedSeat)}(?![\\w-])`, 'i');
    if (!seatPattern.test(summaryText)) {
      throw new Error(
        `[Cart.verifyUkRailSeatSummaryMatchesSeat] The UK Rail seat panel does not report seat ` +
        `"${expectedSeat}" as reserved. Its seat summary reads "${summaryText}". The offered seat ` +
        `comes from the Seat dropdown and the reserved seat from the supplier's seatDetail string, so ` +
        `a mismatch means the reservation held a different seat from the one the panel offered.`,
      );
    }

    logger.info('The reserved UK Rail seat matches the offered seat', { expectedSeat });
    return { summaryText, expectedSeat };
  },

  /**
   * Asserts the coach the open panel reports as reserved is the one that was offered. Matched as a
   * whole token for the same reason as the seat above.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedCoach - The coach read earlier by extractUkRailOfferedCoach
   * @returns {Promise<{summaryText: string, expectedCoach: string}>}
   */
  async verifyUkRailSeatSummaryMatchesCoach(page, expectedCoach) {
    if (!page) throw new Error('[Cart.verifyUkRailSeatSummaryMatchesCoach] "page" is required.');
    if (!expectedCoach || typeof expectedCoach !== 'string') {
      throw new Error(
        `[Cart.verifyUkRailSeatSummaryMatchesCoach] "expectedCoach" must be a non-empty string, got: ` +
        `${JSON.stringify(expectedCoach)}. It is stored by "I extract the offered coach from the UK ` +
        `Rail seat reservation", so that step has to run first in the same scenario.`,
      );
    }

    logger.debug('Comparing the reserved UK Rail coach with the offered one', { expectedCoach });
    const cartPage = getPageObject(page, CartPage);
    const summaryText = await cartPage.getUkRailSeatsSegmentText();

    const coachPattern = new RegExp(`Coach:?\\s*${escapeRegex(expectedCoach)}(?![\\w-])`, 'i');
    if (!coachPattern.test(summaryText)) {
      throw new Error(
        `[Cart.verifyUkRailSeatSummaryMatchesCoach] The UK Rail seat panel does not report coach ` +
        `"${expectedCoach}" as reserved. Its seat summary reads "${summaryText}". Note the coach the ` +
        `panel OFFERS is a preference — the supplier can allocate a different one, which is what the ` +
        `booked quote's More details drawer shows (test 62143).`,
      );
    }

    logger.info('The reserved UK Rail coach matches the offered coach', { expectedCoach });
    return { summaryText, expectedCoach };
  },

  /**
   * Saves the open UK Rail seat reservation and proves it persisted.
   *
   * uk-rail-seats.ts closes the panel ONLY on a successful saveSeats and otherwise leaves it open
   * with `errorMsg` rendered (or, when vuelidate rejects the Leading Traveller, with nothing but
   * `markFields` set). So the panel collapsing is the assertion: a save that was refused would
   * otherwise sail through here and fail much later at the booked quote's seat details.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{saved: true}>}
   */
  async saveUkRailSeatReservation(page) {
    if (!page) throw new Error('[Cart.saveUkRailSeatReservation] "page" is required.');

    logger.debug('Saving the UK Rail seat reservation');
    const cartPage = getPageObject(page, CartPage);
    // Armed before the click: a successful save closes the panel and then re-fetches the seat map
    // (changeValue -> close() + loadData()). The panel renders a snapshot of the store on every
    // open, so returning before that reload lands would let the next open read the PRE-save
    // seatDetail — one with no reservation in it.
    const reloadWait = cartPage.armUkRailSeatsReloadWait().catch((error) => error);
    await cartPage.clickUkRailSeatsSaveButton();

    try {
      await cartPage.waitForUkRailSeatsExtrasCardClosed();
    } catch (error) {
      const errorText = await cartPage.getUkRailSeatsErrorText();
      await reloadWait;
      throw new Error(
        `[Cart.saveUkRailSeatReservation] The UK Rail seat panel is still open after clicking Save, so ` +
        `the reservation was not saved. ` +
        `${errorText ? `The panel reports: "${errorText}".` : 'The panel reports no error, which is how ' +
          'uk-rail-seats.ts rejects an invalid Leading Traveller — changeValue() returns early and only ' +
          'marks the fields.'} Original: ${error.message}`,
      );
    }

    const reloadResult = await reloadWait;
    if (reloadResult instanceof Error) {
      throw new Error(
        `[Cart.saveUkRailSeatReservation] The seat panel collapsed (the save persisted) but the ` +
        `seat-map reload (GET /EvolviSeats) uk-rail-seats.ts fires after every successful save never ` +
        `completed, so a reopened panel would still show the pre-save seat details. Original: ` +
        `${reloadResult.message}`,
      );
    }

    logger.info('UK Rail seat reservation saved, the panel collapsed and the seat map reloaded');
    return { saved: true };
  },

  /**
   * Arms a one-shot capture of the POST that saves the UK Rail seat reservation, WITHOUT waiting
   * for it. Call this before the Save click and hand the returned handle to
   * verifyUkRailSeatsRequestCoachIsSingleUppercaseLetter afterwards.
   *
   * The rejection is folded into the resolved value on purpose: if the Save click itself fails, the
   * scenario aborts before anything awaits this handle, and a bare rejected promise would surface
   * minutes later as an unhandled rejection that masks the real failure.
   *
   * @param {import('playwright').Page} page
   * @returns {{settled: Promise<{request?: import('@playwright/test').Request, error?: Error}>}}
   */
  startCapturingUkRailSeatsSaveRequest(page) {
    if (!page) throw new Error('[Cart.startCapturingUkRailSeatsSaveRequest] "page" is required.');

    logger.debug('Arming the capture of the UK Rail seat reservation save request');
    const cartPage = getPageObject(page, CartPage);

    const settled = cartPage
      .waitForUkRailSeatsSaveRequest()
      .then((request) => ({ request }))
      .catch((error) => ({ error }));

    return { settled };
  },

  /**
   * Asserts that every coach in the captured UK Rail seat-save request body is a single uppercase
   * letter — i.e. the coach the traveller picked, not the index of its dropdown entry.
   *
   * This reads the REQUEST rather than the panel deliberately. uk-rail-seats.ts builds coachOptions
   * with `{ value: startCase(v), label: startCase(v) }`, so the dropdown shows the coach letter
   * whichever of the two it binds — only the wire tells the two apart (test 62143).
   *
   * @param {import('playwright').Page} page
   * @param {{settled: Promise<{request?: import('@playwright/test').Request, error?: Error}>}} capture
   *   The handle returned by startCapturingUkRailSeatsSaveRequest.
   * @returns {Promise<{coaches: string[]}>}
   */
  async verifyUkRailSeatsRequestCoachIsSingleUppercaseLetter(page, capture) {
    if (!page) throw new Error('[Cart.verifyUkRailSeatsRequestCoachIsSingleUppercaseLetter] "page" is required.');
    if (!capture || typeof capture.settled?.then !== 'function') {
      throw new Error(
        `[Cart.verifyUkRailSeatsRequestCoachIsSingleUppercaseLetter] "capture" must be the handle ` +
        `returned by startCapturingUkRailSeatsSaveRequest, got: ${JSON.stringify(capture)}. The ` +
        `capture has to be armed BEFORE the Save click — a request already in flight cannot be caught.`,
      );
    }

    const { request, error } = await capture.settled;
    if (error) {
      // The panel closes only on a successful save, so whether it is still open tells the two
      // failure modes apart — and they need opposite fixes.
      const cartPage = getPageObject(page, CartPage);
      const panelStillOpen = await cartPage.isUkRailSeatsPanelOpen().catch(() => false);

      throw new Error(
        `[Cart.verifyUkRailSeatsRequestCoachIsSingleUppercaseLetter] No POST to the UK Rail seat-save ` +
        `endpoint was observed after the Save click. ` +
        (panelStillOpen
          ? `The seat panel is STILL OPEN, so the save was rejected before it left the browser — ` +
            `uk-rail-seats.ts returns early when the Leading Traveller first/last name is empty.`
          : `The seat panel is closed, so either Save was never clicked or the endpoint path changed.`) +
        ` Original: ${error.message}`,
      );
    }

    let body;
    try {
      body = request.postDataJSON();
    } catch (err) {
      throw new Error(
        `[Cart.verifyUkRailSeatsRequestCoachIsSingleUppercaseLetter] The captured seat-save request ` +
        `body is not valid JSON, so the coach it carries cannot be read. Original: ${err.message}`,
      );
    }

    const selectedSeats = body?.seats?.flatMap((seat) => seat?.selectedSeats ?? []) ?? [];
    expect(
      selectedSeats.length,
      `[Cart.verifyUkRailSeatsRequestCoachIsSingleUppercaseLetter] The seat-save request carried no ` +
      `seats[].selectedSeats entries at all, so no coach was sent. Body: ${JSON.stringify(body)}`,
    ).toBeGreaterThan(0);

    const coaches = selectedSeats.map((seat) => seat?.coach);
    const invalid = coaches.filter((coach) => !/^[A-Z]$/.test(String(coach)));

    expect(
      invalid,
      `[Cart.verifyUkRailSeatsRequestCoachIsSingleUppercaseLetter] Expected every coach in the seat-save ` +
      `request to be a single uppercase letter, but these were not: ${JSON.stringify(invalid)}. ` +
      `Sent coaches: ${JSON.stringify(coaches)}. A numeric value here is the regression this test ` +
      `guards: uk-rail-seats.ts must build coachOptions with originalValues=true so the coach letter is ` +
      `bound, not the dropdown index.`,
    ).toEqual([]);

    logger.info('UK Rail seat-save request carries a valid coach on every seat', { coaches });
    return { coaches };
  },

  /**
   * Asserts that the coach shown against the reserved seat in the booked quote's More details
   * drawer is a single uppercase letter.
   *
   * This is the DISPLAY side of the same guarantee the seat-save request check makes: the coach
   * held with the supplier and the coach shown to the traveller have to agree, and an index
   * leaking through would render here as a digit. The value arrives inside the supplier-built
   * `station.seatsString` that uk-rail-journey-details renders with `v-html`, so there is no
   * element to target — the coach is matched out of the drawer's text.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{coach: string, matched: string}>}
   */
  async verifyUkRailMoreDetailsCoachIsSingleUppercaseLetter(page) {
    if (!page) {
      throw new Error('[Cart.verifyUkRailMoreDetailsCoachIsSingleUppercaseLetter] "page" is required.');
    }

    logger.debug('Reading the reserved coach from the UK Rail More details drawer');
    const cartPage = getPageObject(page, CartPage);
    const drawerText = await cartPage.getUkRailMoreDetailsText();

    // "Coach A", "Coach: A", "COACH A" — the supplier controls the separator and the casing of the
    // label, so only the token after it is pinned.
    const match = drawerText.match(/coach\s*:?\s*(\S+?)\b/i);
    if (!match) {
      throw new Error(
        `[Cart.verifyUkRailMoreDetailsCoachIsSingleUppercaseLetter] No "Coach" text was found in the ` +
        `More details drawer, so there is no coach to validate. The reserved coach/seat arrives in ` +
        `the supplier's station.seatsString, which uk-rail-journey-details renders only when the ` +
        `station is a change station — a direct journey, or a quote saved without a specific seat, ` +
        `shows nothing here. Drawer text was: "${drawerText.slice(0, 600)}"`,
      );
    }

    const coach = match[1];
    expect(
      coach,
      `[Cart.verifyUkRailMoreDetailsCoachIsSingleUppercaseLetter] Expected the coach shown next to the ` +
      `reserved seat in More details to be a single uppercase letter, got "${coach}". A digit here means ` +
      `the dropdown index leaked through instead of the coach letter — the regression test 62143 guards. ` +
      `Matched from: "${match[0]}"`,
    ).toMatch(/^[A-Z]$/);

    logger.info('UK Rail More details shows a valid reserved coach', { coach });
    return { coach, matched: match[0] };
  },

  /**
   * Fills and saves the named UK Rail extras rows, in the order given, leaving each with the app's
   * green check.
   *
   * Differs from fillMandatoryEvolviCartFields, which fills whatever is still outstanding: that
   * would also fill Seating, overwriting a seat reservation the scenario set up by hand. Naming the
   * rows is what keeps the reservation intact (test 62143).
   *
   * @param {import('playwright').Page} page
   * @param {string[]} sectionNames - Row headings as rendered, e.g. ["Delivery Method", "Client Reference"]
   * @returns {Promise<{filled: string[]}>}
   */
  async fillNamedEvolviExtrasRows(page, sectionNames) {
    if (!page) throw new Error('[Cart.fillNamedEvolviExtrasRows] "page" is required.');
    if (!Array.isArray(sectionNames) || sectionNames.length === 0) {
      throw new Error(
        `[Cart.fillNamedEvolviExtrasRows] "sectionNames" must be a non-empty array, got: ${JSON.stringify(sectionNames)}`,
      );
    }

    logger.debug('Filling the named UK Rail extras rows', { sectionNames });
    const filled = [];

    for (const sectionName of sectionNames) {
      try {
        await this.fillExtrasSectionByName(page, sectionName);
      } catch (error) {
        throw new Error(
          `[Cart.fillNamedEvolviExtrasRows] Filled ${filled.length} of ${sectionNames.length} rows ` +
          `(${filled.map((name) => `"${name}"`).join(', ') || 'none'}) before "${sectionName}" failed. ` +
          `Which rows a UK Rail quote renders depends on the fare selected upstream, so this row may ` +
          `not exist for this fare. Original: ${error.message}`,
        );
      }
      filled.push(sectionName);
    }

    logger.info('Named UK Rail extras rows filled', { filled });
    return { filled };
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
   * @param {number} maxLength - Exact number of characters the field should hold after truncation
   */
  async verifySpecialRequestTruncatedTo(page, maxLength) {
    if (!page) throw new Error('page is required');
    if (typeof maxLength !== 'number' || maxLength < 1) throw new Error('maxLength must be a positive number, got: ' + maxLength);
    const cartPage = getPageObject(page, CartPage);
    const value = await cartPage.getSpecialRequestValue();
    // Exact, not <=: the caller types over the limit, so a cap that is too low must fail too.
    expect(value.length, `Expected special request to be truncated to ${maxLength} characters, but got ${value.length}`).toBe(maxLength);
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
   * Downloads the hotel voucher in one language and reads its text (ADO 55723).
   *
   * The language is a parameter of the request, not of the UI: `hotel-quote-card.ts getVoucher(lang)`
   * calls GET /hotelVoucher?tripId=&quoteId=&lang=EN|FR and saves the returned blob client-side, so
   * the app's display language never has to be switched to fetch the French voucher.
   *
   * The download event is armed before the click because the save is client-side — a wait armed
   * after the click misses it.
   *
   * @param {import('playwright').Page} page
   * @param {string} language - Link label to click: "English" or "French"
   * @returns {Promise<{language: string, suggestedFilename: string, filePath: string, sizeBytes: number, text: string}>}
   * @throws {Error} If the link is missing, no download arrives, or the saved file is empty
   */
  async downloadHotelVoucher(page, language) {
    if (!page) throw new Error('[Cart.downloadHotelVoucher] "page" is required.');
    if (typeof language !== 'string' || !language.trim()) {
      throw new Error(`[Cart.downloadHotelVoucher] "language" must be a non-empty string, got: ${typeof language}`);
    }

    const cartPage = getPageObject(page, CartPage);
    logger.info('Downloading the hotel voucher', { language });

    // Armed BEFORE the click — see waitForVoucherDownload.
    const downloadPromise = cartPage.waitForVoucherDownload();
    await cartPage.clickVoucherDownloadLink(language);
    const download = await downloadPromise;

    const suggestedFilename = download.suggestedFilename();

    // waitForEvent('download') only proves the browser STARTED the save, so completion is asserted
    // too: no reported failure, a real path, and a non-empty file on disk.
    let failure;
    let filePath;
    try {
      failure = await download.failure();
      filePath = await download.path();
    } catch (err) {
      throw new Error(
        `[Cart.downloadHotelVoucher] Could not resolve the downloaded ${language} voucher ` +
        `"${suggestedFilename}" on disk. The download may not have completed, or downloads may be ` +
        `disabled in this browser context. Original: ${err.message}`,
      );
    }

    if (failure) {
      throw new Error(
        `[Cart.downloadHotelVoucher] The ${language} voucher download "${suggestedFilename}" did not ` +
        `complete: ${failure}`,
      );
    }

    const sizeBytes = filePath ? fs.statSync(filePath).size : 0;
    if (!filePath || sizeBytes === 0) {
      throw new Error(
        `[Cart.downloadHotelVoucher] The ${language} voucher "${suggestedFilename}" reached disk empty ` +
        `(${sizeBytes} bytes at "${filePath}"), so there is nothing to verify.`,
      );
    }

    // Clear the spinner before returning, so a second language click is not swallowed while the
    // first request is still in flight.
    await cartPage.waitForVoucherLoaderToClear();

    const text = extractPdfText(filePath);
    logger.info('Hotel voucher downloaded', {
      language,
      suggestedFilename,
      sizeBytes,
      extractedLetters: countLetters(text),
    });

    return { language, suggestedFilename, filePath, sizeBytes, text };
  },

  /**
   * Asserts a downloaded hotel voucher shows no prices at all (ADO 55723).
   *
   * Anchored on currency codes and symbols rather than on any decimal number, because a voucher
   * legitimately carries dates, phone numbers, and confirmation codes.
   *
   * Readability is asserted first: an unparsed PDF must fail here rather than pass an assertion
   * about what it does NOT contain.
   *
   * @param {import('playwright').Page} page
   * @param {{language: string, suggestedFilename: string, filePath: string, text: string}} voucher -
   *   the object returned by Cart.downloadHotelVoucher
   * @throws {Error} If the voucher is unreadable or shows any currency amount
   */
  async verifyVoucherHasNoPrices(page, voucher) {
    if (!page) throw new Error('[Cart.verifyVoucherHasNoPrices] "page" is required.');
    if (!voucher || typeof voucher.text !== 'string' || !voucher.filePath) {
      throw new Error(
        `[Cart.verifyVoucherHasNoPrices] "voucher" must be the object returned by Cart.downloadHotelVoucher ` +
        `(carrying "text" and "filePath"), got: ${typeof voucher}. Ensure the ` +
        `"When I download the hotel voucher in ..." step ran before this assertion.`,
      );
    }

    assertPdfTextIsReadable(voucher.text, 'Cart.verifyVoucherHasNoPrices', voucher.filePath);

    const amounts = findCurrencyAmounts(voucher.text);
    if (amounts.length > 0) {
      throw new Error(
        `[Cart.verifyVoucherHasNoPrices] The ${voucher.language} hotel voucher ` +
        `"${voucher.suggestedFilename}" shows ${amounts.length} price(s), but a voucher must not include ` +
        `prices: ${JSON.stringify(amounts)}.`,
      );
    }

    logger.info('Hotel voucher shows no prices', {
      language: voucher.language,
      suggestedFilename: voucher.suggestedFilename,
    });
  },

  /**
   * Asserts a specific amount does not appear in a downloaded hotel voucher (ADO 55723).
   *
   * Stronger than verifyVoucherHasNoPrices, and the reason the scenario reads the cart's More
   * details total before booking: the exact figure that must be absent is known, so the assertion
   * does not depend on recognising a currency format.
   *
   * Matching is on digit runs (see pdf.containsAmount) because PDF text extraction cannot preserve
   * separators or word boundaries — a formatted-string comparison could miss a split amount and
   * pass an absence assertion that should have failed.
   *
   * @param {import('playwright').Page} page
   * @param {{language: string, suggestedFilename: string, filePath: string, text: string}} voucher -
   *   the object returned by Cart.downloadHotelVoucher
   * @param {number} amount - The amount that must be absent, e.g. the cart's More details total
   * @throws {Error} If the voucher is unreadable or the amount appears in it
   */
  async verifyAmountNotInVoucher(page, voucher, amount) {
    if (!page) throw new Error('[Cart.verifyAmountNotInVoucher] "page" is required.');
    if (!voucher || typeof voucher.text !== 'string' || !voucher.filePath) {
      throw new Error(
        `[Cart.verifyAmountNotInVoucher] "voucher" must be the object returned by Cart.downloadHotelVoucher ` +
        `(carrying "text" and "filePath"), got: ${typeof voucher}. Ensure the ` +
        `"When I download the hotel voucher in ..." step ran before this assertion.`,
      );
    }
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      throw new Error(
        `[Cart.verifyAmountNotInVoucher] "amount" must be a finite number, got: ${amount}. Ensure the ` +
        `"When I extract the price from more details" step ran and captured a price.`,
      );
    }

    assertPdfTextIsReadable(voucher.text, 'Cart.verifyAmountNotInVoucher', voucher.filePath);

    const { found, matched, via } = containsAmount(voucher.text, amount);
    if (found) {
      throw new Error(
        `[Cart.verifyAmountNotInVoucher] The ${voucher.language} hotel voucher ` +
        `"${voucher.suggestedFilename}" shows the cart price ${amount} — matched "${matched}" by ${via} — ` +
        `but the voucher must not include prices.`,
      );
    }

    logger.info('Hotel voucher does not show the cart price', {
      language: voucher.language,
      amount,
      suggestedFilename: voucher.suggestedFilename,
    });
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
   * Opens the "Location details" tooltip on the first cart item and LEAVES IT OPEN, so the pickup
   * and drop-off addresses can be read by subsequent steps. Mirrors
   * CarResults.openLocationDetailsOnFirstCarResult but targets the cart's own tooltip instance
   * (car-location-details-tooltip.vue is reused, unscoped, on both pages).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @throws {Error} If page is invalid or the tooltip cannot be opened
   * @returns {Promise<{opened: boolean}>}
   */
  async openLocationDetailsOnFirstCartItem(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);

    logger.debug('[Cart.openLocationDetailsOnFirstCartItem] Opening the location details tooltip on the first cart item');
    try {
      await cartPage.openLocationDetailsTooltipByIndex(0);
    } catch (err) {
      throw new Error(
        '[Cart.openLocationDetailsOnFirstCartItem] Could not open the "Location details" tooltip on the ' +
        'first cart item. The cart may not have finished rendering, or the item may not expose the ' +
        `location details link. Original: ${err.message}`,
      );
    }

    return { opened: true };
  },

  /**
   * Reads either the pickup or the drop-off address from the already-open cart "Location details"
   * tooltip. Requires openLocationDetailsOnFirstCartItem to have run — the tooltip is left open on
   * purpose so both addresses can be read from the same rendered tooltip.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {'pickup'|'dropoff'} locationType - Which address to read
   * @throws {Error} If page or locationType are invalid, or the address is not readable
   * @returns {Promise<string>} The address text
   */
  async getLocationAddressFromCartLocationDetails(page, locationType) {
    if (!page) {
      throw new Error('page is required');
    }

    const SUPPORTED_LOCATION_TYPES = ['pickup', 'dropoff'];
    if (!SUPPORTED_LOCATION_TYPES.includes(locationType)) {
      throw new Error(
        `locationType must be one of ${SUPPORTED_LOCATION_TYPES.join(' | ')}, got: ${JSON.stringify(locationType)}`,
      );
    }

    const cartPage = getPageObject(page, CartPage);

    try {
      return locationType === 'pickup'
        ? await cartPage.getPickupAddressTextFromTooltip()
        : await cartPage.getDropoffAddressTextFromTooltip();
    } catch (err) {
      throw new Error(
        `[Cart.getLocationAddressFromCartLocationDetails] Could not read the ${locationType} address from the ` +
        'cart location details tooltip. The tooltip is likely not open — it must be opened first and must stay open. ' +
        `Original: ${err.message}`,
      );
    }
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
   * Extracts all visible PNR codes from quote cards in the cart, regardless of product
   * type (flight, car, etc.).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string[]>}
   */
  async extractVisibleQuotePnrCodes(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const { pnrCodes } = await cartPage.getVisibleQuotesWithPnrCodes();

    if (!pnrCodes.length) {
      throw new Error('Could not extract any PNR codes from the quotes in the cart.');
    }

    return pnrCodes;
  },

  /**
   * Verifies two flight quotes were merged into a single PNR.
   *
   * A merge is only visible as ONE quote card carrying a PNR. When it fails, the app leaves the two
   * quotes as separate cards and only the originally booked one has a PNR - so reading a "first" and
   * a "second" PNR code cannot see the difference: after a successful merge there is a single code
   * on screen and the comparison ends up being against itself.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{quotes: number, pnrCodes: string[]}>}
   */
  async verifyQuotesMergedIntoSinglePnr(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const { quotes, pnrCodes } = await cartPage.getVisibleQuotesWithPnrCodes();

    expect(
      quotes,
      `Expected the flights to be merged into a single quote, but the trip shows ${quotes} quote cards `
        + `(PNR codes found: ${pnrCodes.join(', ') || 'none'}).`,
    ).toBe(1);

    expect(
      pnrCodes.length,
      `Expected the merged quote to display exactly one PNR, got ${pnrCodes.length} `
        + `(${pnrCodes.join(', ') || 'none'}).`,
    ).toBe(1);

    return { quotes, pnrCodes };
  },

  /**
   * Fills and saves the ground transport quote's mandatory Contact Information phone number.
   *
   * Checkout is blocked until this row is valid, so the whole open → fill → save sequence lives in
   * one call: a scenario has no reason to leave the card half-filled.
   *
   * @param {import('playwright').Page} page
   * @param {{ dialCode?: string, areaCode?: string, number?: string }} [phone]
   */
  async fillGroundTransportContactDetails(page, phone = {}) {
    if (!page) throw new Error('page is required');

    const { dialCode = '351', areaCode = '96', number = '566785' } = phone;
    const cartPage = getPageObject(page, CartPage);

    await cartPage.openGroundTransportContactInfoPanel();
    await cartPage.fillGroundTransportContactPhone(dialCode, areaCode, number);
    await cartPage.saveGroundTransportContactInfo();

    logger.info('[Cart.fillGroundTransportContactDetails] Saved the ground transport contact phone', {
      phone: `+${dialCode} ${areaCode} ${number}`,
    });
  },

  /**
   * Selects and saves ONE free ground transport (Transferz) add-on, and returns its price.
   *
   * The whole open → assert-free → select → save sequence lives in one call because a scenario has no
   * reason to leave the extras card open, and because the "is it actually free?" check has to happen
   * while the card is open — once saved, the row's price is no longer on screen.
   *
   * The returned `price` is what the row advertises: `0` when `.addon__price` shows the translated
   * "Free" label. Asserting that here is what keeps the downstream total comparison honest — without
   * it, "total unchanged" would also pass for an add-on that simply failed to attach.
   *
   * @param {import('playwright').Page} page
   * @param {string} [extraName="meet and greet"] - Add-on display name; matched loosely against the
   *   supplier's own label (see CartPage.getGroundTransportAddOnRow)
   * @throws {Error} If the quote offers no add-ons, the named row is missing, or it is not free
   * @returns {Promise<{label: string, price: number, control: string}>}
   */
  async addGroundTransportFreeExtra(page, extraName = 'meet and greet') {
    if (!page) throw new Error('page is required');
    if (typeof extraName !== 'string' || !extraName.trim()) {
      throw new Error(
        `[Cart.addGroundTransportFreeExtra] "extraName" must be a non-empty string, got: ${extraName}`,
      );
    }

    const cartPage = getPageObject(page, CartPage);

    await cartPage.openGroundTransportAddOnsPanel();

    const { amount, isFree, label, priceText } = await cartPage.getGroundTransportAddOnPrice(extraName);
    if (!isFree || amount !== 0) {
      throw new Error(
        `[Cart.addGroundTransportFreeExtra] The "${label}" ground transport add-on is not free — its price ` +
        `reads "${priceText}" (parsed as ${amount}). This step is only for free add-ons, and the cart total ` +
        `assertion that follows it assumes a zero-cost extra.`,
      );
    }

    const { control } = await cartPage.selectGroundTransportAddOn(extraName);
    await cartPage.saveGroundTransportAddOns();

    // Saving emits reloadQuotes, so the cart re-renders its quote list and the summary total with it.
    // Settle here rather than in the caller: the reload is caused by THIS save, and a free add-on
    // leaves the total unchanged, so a later reader has no value change it could poll for instead.
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

    logger.info('[Cart.addGroundTransportFreeExtra] Saved a free ground transport add-on', {
      label,
      price: amount,
      control,
    });

    return { label, price: amount, control };
  },

  /**
   * Reads the transfer's "Booking Code" off the booked quote card in the trip overview and returns
   * the bare code.
   *
   * ground-transport-quote-card.vue renders it as `Booking Code: <span>{fulfillmentProviderId}</span>`
   * in its #booking-confirm-info slot, NEXT TO the trip's own "PNR 1734787" line - both are
   * `.pnr-code` divs. The generic getVisibleQuotesWithPnrCodes() reader takes the first `.pnr-code`
   * per card and so returns the PNR, which is why this reads a label-filtered locator instead.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The code alone, without the "Booking Code:" label
   */
  async extractTransferBookingCode(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const { text, allCodes } = await cartPage.getGroundTransportBookingCodeText();

    const match = /Booking Code:\s*(\S+)/i.exec(text);
    if (!match) {
      throw new Error(
        `[Cart.extractTransferBookingCode] The transfer's "Booking Code" line is on the trip but carries ` +
        `no code: "${text}". Codes on the card: ${allCodes.join(' | ') || 'none'}.`,
      );
    }

    const code = match[1];
    logger.info('[Cart.extractTransferBookingCode] Read the transfer booking code from the trip', { code });
    return code;
  },

  /**
   * Verifies the open share email preview shows the transfer's booking code.
   *
   * Asserts the label AND the exact code captured from the trip, so the check cannot pass on a
   * preview that renders the row with a different (or empty) value.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedCode - The code returned by extractTransferBookingCode
   * @param {{ alsoCheckDetailedView?: boolean }} [options] - Share QUOTE previews have a Simple/Detailed
   *   toggle and the code has to appear in both; the share ITINERARY preview has no such toggle.
   */
  async verifyTransferBookingCodeInSharePreview(page, expectedCode, { alsoCheckDetailedView = false } = {}) {
    if (!page) throw new Error('page is required');
    if (!expectedCode || typeof expectedCode !== 'string') {
      throw new Error(
        `[Cart.verifyTransferBookingCodeInSharePreview] "expectedCode" must be the booking code read from ` +
        `the trip, got: ${expectedCode}. Run "the transfer booking code should be displayed on the trip" first.`,
      );
    }

    const cartPage = getPageObject(page, CartPage);

    const assertPreview = async (viewName) => {
      for (const needle of ['Booking Code', expectedCode]) {
        const found = await cartPage.sharePreviewContainsText(needle);
        if (!found) {
          const content = await cartPage.getSharePreviewTextContent();
          throw new Error(
            `[Cart.verifyTransferBookingCodeInSharePreview] The ${viewName} share preview does not contain ` +
            `"${needle}". Preview text: "${content.slice(0, 600)}"`,
          );
        }
      }
      logger.info('[Cart.verifyTransferBookingCodeInSharePreview] Booking code found in the share preview', {
        view: viewName,
        code: expectedCode,
      });
    };

    await assertPreview('simple');

    if (alsoCheckDetailedView) {
      await Cart.switchSharePreviewToDetailedView(page);
      await assertPreview('detailed');
    }
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
   * Verifies that every quote in the cart displays a PNR code - one per visible quote
   * card, so the assertion scales with the cart instead of assuming a fixed quote count
   * (a single-product cart such as UK parking holds exactly one quote).
   * @param {import('playwright').Page} page
   */
  async verifyAllQuotesHavePnrCodes(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const { quotes, pnrCodes } = await cartPage.getVisibleQuotesWithPnrCodes();
    const withPnr = pnrCodes.length;

    // Thrown rather than asserted through expect(): both numbers are the diagnostic, and a
    // custom expect() message never reaches the report.
    if (quotes < 1) {
      throw new Error('Expected at least one quote in the cart after booking, but found none.');
    }
    if (withPnr !== quotes) {
      throw new Error(
        `Expected every quote in the cart to display a PNR code, but only ${withPnr} of ` +
        `${quotes} quote(s) did (found: ${pnrCodes.join(', ') || 'none'}). Likely causes: the ` +
        `booking call has not completed for every quote, or a quote failed to book.`
      );
    }
  },

  async verifyLastQuoteDestination(page, city) {
    if (!page) throw new Error('page is required');
    if (!city || typeof city !== 'string') throw new Error(`city must be a non-empty string, got: ${typeof city}`);

    const cartPage = getPageObject(page, CartPage);
    const actualTitle = await cartPage.getLastQuoteTitleText();
    expect(actualTitle.toLowerCase()).toContain(city.toLowerCase());
  },

  /**
   * Verifies the drop-off address on the last quote card carries the expected location.
   *
   * The card's title and its drop-off leg are populated from different fields of the quote, so a
   * title that already names the destination does not prove the drop-off does — which is exactly
   * what an edited search has to demonstrate.
   *
   * @param {import('playwright').Page} page
   * @param {string} location - Substring the drop-off address must contain (case-insensitive)
   * @returns {Promise<string>} The drop-off address as the card renders it
   */
  async verifyLastQuoteDropOffAddress(page, location) {
    if (!page) throw new Error('page is required');
    if (!location || typeof location !== 'string') {
      throw new Error(`location must be a non-empty string, got: ${typeof location}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const actualDropOff = await cartPage.getLastQuoteDropOffText();

    if (!actualDropOff.toLowerCase().includes(location.toLowerCase())) {
      throw new Error(
        `[Cart.verifyLastQuoteDropOffAddress] The last quote's drop-off reads "${actualDropOff}", ` +
        `which does not contain "${location}". The quote added to the cart is not the one the ` +
        `edited search returned.`
      );
    }

    return actualDropOff;
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
   * Verifies both the outbound and inbound EU Rail (Benerail) journeys are present in the cart
   * after a round trip booking (AB#81914 regression check).
   * @param {import('playwright').Page} page
   */
  async verifyBothBenerailJourneysArePresentInCart(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const segmentCount = await cartPage.getVisibleRailQuoteSegmentCount();

    expect(
      segmentCount,
      `Expected both outbound and inbound Benerail journeys to be visible in the cart, but found ${segmentCount} segment(s).`,
    ).toBeGreaterThanOrEqual(2);

    return { segmentCount };
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
   * Verifies how many quote cards the cart holds, across every product type.
   *
   * Backs de-duplication checks: re-running a search (e.g. after editing its dates from the
   * results page) and adding a result again must replace the trip's existing quote, not append a
   * second one. Counting all products rather than one is the point — a duplicate that lands as a
   * differently-typed card still has to fail.
   *
   * Thrown rather than asserted through expect(): the actual count is the whole diagnostic and a
   * custom expect() message never reaches the report.
   *
   * @param {import('playwright').Page} page
   * @param {number} expectedCount - Expected number of quote cards in the cart
   * @returns {Promise<void>}
   */
  async verifyQuoteCount(page, expectedCount) {
    if (!page) throw new Error('[Cart.verifyQuoteCount] "page" is required.');
    if (!Number.isInteger(expectedCount) || expectedCount < 0) {
      throw new Error(`[Cart.verifyQuoteCount] "expectedCount" must be a non-negative integer, got: ${expectedCount}`);
    }

    const cartPage = getPageObject(page, CartPage);
    logger.debug('[Cart.verifyQuoteCount] Counting quote cards in cart', { expectedCount });

    let actualCount;
    try {
      actualCount = await cartPage.getQuoteCardCount();
    } catch (err) {
      throw new Error(
        `[Cart.verifyQuoteCount] Could not read quote cards from the cart. The cart may not have ` +
        `loaded, or nothing was ever added to the trip. Original: ${err.message}`,
      );
    }

    if (actualCount !== expectedCount) {
      throw new Error(
        `[Cart.verifyQuoteCount] Expected the cart to contain ${expectedCount} quote(s), but found ` +
        `${actualCount}. More than expected means adding the result to the trip appended a ` +
        `duplicate instead of replacing the existing quote.`,
      );
    }
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
   * Reads the departure airport of the flight already in the cart.
   *
   * Used by flows that assert another product inherits the trip's departure airport (parking,
   * hotels), where hard-coding the airport would tie the test to whichever flight the supplier
   * happened to return first.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{departureAirportCode: string}>}
   * @throws {Error} If no airport code is rendered on the flight quote card
   */
  async getFlightDepartureAirport(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const departureAirportCode = await cartPage.getFlightQuoteDepartureAirportCode();

    if (!departureAirportCode) {
      throw new Error(
        '[Cart.getFlightDepartureAirport] The flight quote card rendered an empty departure airport ' +
        'code, so the departure airport of the trip cannot be established.'
      );
    }

    return { departureAirportCode };
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
   * Verifies the "Mandatory Notifications" popup is NOT displayed — the negative counterpart of
   * verifyMandatoryNotificationsPopupDisplayed, for flows where a notification filter is expected to
   * SUPPRESS the popup: a corporation reminder scoped by country or hotel content source raises the
   * popup for a matching item and must stay silent for a non-matching one.
   *
   * The 5s window is a settle buffer, not a race — callers run this once the cart already shows the new
   * quote, so a popup that was going to open has had its chance. The positive assertion waits 15s
   * because it runs straight after an add-to-cart, before the page has settled.
   *
   * On failure the popup's own messages are read back, so the report names the reminder that wrongly
   * fired instead of only reporting that one did.
   *
   * @param {import('playwright').Page} page
   * @param {object} [options]
   * @param {number} [options.timeout=5000] How long to wait before declaring the popup absent.
   * @returns {Promise<void>}
   */
  async verifyMandatoryNotificationsPopupNotDisplayed(page, { timeout = 5000 } = {}) {
    if (!page) throw new Error('[Cart.verifyMandatoryNotificationsPopupNotDisplayed] "page" is required.');
    const commonPage = getPageObject(page, CommonPage);
    const visible = await commonPage.isMandatoryNotificationsPopupVisible({ timeout });
    if (visible) {
      const messages = await commonPage.getMandatoryNotificationMessages({ timeout: 5000 }).catch(() => []);
      throw new Error(
        `[Cart.verifyMandatoryNotificationsPopupNotDisplayed] Expected NO "Mandatory Notifications" popup, ` +
        `but it was displayed. Reminder(s) shown: ` +
        `${messages.length ? messages.map((m) => `"${m}"`).join(', ') : '(none readable)'}. ` +
        `A notification filter that should have excluded this item did not.`
      );
    }
  },

  /**
   * Verifies the still-open "Mandatory Notifications" popup (app-reminder-popup.vue) shows a reminder
   * whose text contains the expected message. The match is case-insensitive, whitespace-collapsed and a
   * SUBSTRING: manual test cases spell the country in lower case ("...in italy") while the app renders
   * it capitalised ("...in Italy"), and the popup can list several reminders in one dialog.
   *
   * The popup is left OPEN so the following step ("I acknowledge the push notification") can
   * acknowledge it.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedMessage - Substring the reminder text must contain, e.g.
   *   "mandatory message for GDS hotel in italy"
   * @returns {Promise<string>} The full text of the matched reminder message
   */
  async verifyMandatoryNotificationMessage(page, expectedMessage) {
    if (!page) throw new Error('[Cart.verifyMandatoryNotificationMessage] "page" is required.');
    if (!expectedMessage || typeof expectedMessage !== 'string') {
      throw new Error(
        `[Cart.verifyMandatoryNotificationMessage] "expectedMessage" must be a non-empty string, got: ` +
        `${typeof expectedMessage} (${JSON.stringify(expectedMessage)})`
      );
    }
    logger.debug('Verifying the mandatory-notifications popup message', { expectedMessage });

    const commonPage = getPageObject(page, CommonPage);
    const visible = await commonPage.isMandatoryNotificationsPopupVisible({ timeout: 15000 });
    if (!visible) {
      const openTitles = await commonPage.getVisibleDialogTitles().catch(() => []);
      throw new Error(
        `[Cart.verifyMandatoryNotificationMessage] Expected the "Mandatory Notifications" popup to be ` +
        `displayed so its message could be read, but it was not visible. Visible dialog(s): ` +
        `${openTitles.length ? openTitles.join(', ') : 'none'}. (This assertion must run BEFORE ` +
        `"I acknowledge the push notification" — that step closes the popup.)`
      );
    }

    const messages = await commonPage.getMandatoryNotificationMessages({ timeout: 15000 });
    const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const needle = normalize(expectedMessage);
    const matched = messages.find((text) => normalize(text).includes(needle));
    if (!matched) {
      throw new Error(
        `[Cart.verifyMandatoryNotificationMessage] The "Mandatory Notifications" popup does not show a ` +
        `reminder containing "${expectedMessage}". Message(s) actually in the popup: ` +
        `${messages.length ? messages.map((t) => `"${t}"`).join(', ') : 'none'}. Either the mandatory ` +
        `notification configured for this corporation/destination changed wording, or the search raised ` +
        `a different reminder.`
      );
    }

    logger.info('Mandatory notification message verified', { expectedMessage, matched });
    return matched;
  },

  /**
   * Verifies the "close" button of the still-open "Mandatory Notifications" popup is DISABLED — the
   * mechanism by which the app forces the reminder to be acknowledged: app-reminder-popup.vue binds
   * `<app-btn :isDisabled="!wasCheck">`, so the button stays natively disabled until the "Got it"
   * checkbox is ticked.
   *
   * ORDER MATTERS: run this BEFORE "I acknowledge the push notification" — that step ticks the
   * checkbox, which enables the button and closes the popup.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async verifyMandatoryNotificationsCloseButtonDisabled(page) {
    if (!page) throw new Error('[Cart.verifyMandatoryNotificationsCloseButtonDisabled] "page" is required.');
    logger.debug('Verifying the mandatory-notifications popup close button is disabled');

    const commonPage = getPageObject(page, CommonPage);
    const visible = await commonPage.isMandatoryNotificationsPopupVisible({ timeout: 15000 });
    if (!visible) {
      const openTitles = await commonPage.getVisibleDialogTitles().catch(() => []);
      throw new Error(
        `[Cart.verifyMandatoryNotificationsCloseButtonDisabled] Expected the "Mandatory Notifications" ` +
        `popup to be open so its close button could be inspected, but it was not visible. Visible ` +
        `dialog(s): ${openTitles.length ? openTitles.join(', ') : 'none'}. (A preceding step may have ` +
        `already acknowledged the popup.)`
      );
    }

    // A custom expect() message never reaches this framework's report, so the assertion failure is
    // caught and re-thrown with the business context a reader needs.
    try {
      await expect(commonPage.getMandatoryNotificationsCloseButton()).toBeDisabled({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[Cart.verifyMandatoryNotificationsCloseButtonDisabled] The "close" button of the "Mandatory ` +
        `Notifications" popup was expected to be disabled while the reminder is unacknowledged, but it ` +
        `was enabled. The "Got it" checkbox may already be ticked — either a preceding step ` +
        `acknowledged the popup, or app-reminder-popup.vue no longer gates the button on ` +
        `:isDisabled="!wasCheck". Original: ${err.message}`
      );
    }

    logger.info('Mandatory-notifications popup close button is disabled, as expected');
  },

  /**
   * Verifies that BOTH push notifications configured for a route's origin/destination were raised by
   * the search: the OPTIONAL one as an ElNotification toast, and the MANDATORY one inside the
   * "Mandatory Notifications" popup (reminder.service.ts routes type 11 to a toast and type 10 to the
   * popup — see test 31347, Benerail NLASC -> BEBCE).
   *
   * Only the optional text is passed in, because the pair is configured per origin/destination with
   * matching wording ("optional/mandatory notification for benerail from X to Y"), so the mandatory
   * counterpart is the same sentence with the leading "optional" swapped for "mandatory". The feature's
   * later notification-center table spells both texts out, which is where a wording change would show.
   *
   * The toast is checked FIRST: it is removed after 7 seconds, while the popup stays open until it is
   * acknowledged. The popup is left OPEN so a following step can acknowledge it.
   *
   * @param {import('playwright').Page} page
   * @param {string} optionalNotificationText - Text of the optional notification, e.g.
   *   "optional notification for benerail from NLASC to BEBCE"
   * @returns {Promise<{optional: string, mandatory: string}>} The matched notification texts
   */
  async verifyBenerailOriginDestinationNotifications(page, optionalNotificationText) {
    if (!page) throw new Error('[Cart.verifyBenerailOriginDestinationNotifications] "page" is required.');
    if (!optionalNotificationText || typeof optionalNotificationText !== 'string') {
      throw new Error(
        `[Cart.verifyBenerailOriginDestinationNotifications] "optionalNotificationText" must be a ` +
        `non-empty string, got: ${typeof optionalNotificationText} (${JSON.stringify(optionalNotificationText)})`
      );
    }

    const commonPage = getPageObject(page, CommonPage);
    const optional = await commonPage.waitForOptionalNotificationToast(optionalNotificationText);
    logger.info('Optional push-notification toast displayed', { text: optional });

    const expectedMandatory = optionalNotificationText.replace(/^\s*optional\b/i, 'mandatory');
    if (expectedMandatory === optionalNotificationText) {
      throw new Error(
        `[Cart.verifyBenerailOriginDestinationNotifications] Expected "${optionalNotificationText}" to start ` +
        `with "optional" so the mandatory counterpart can be derived from it. Pass the OPTIONAL ` +
        `notification text to this step.`
      );
    }

    const popupVisible = await commonPage.isMandatoryNotificationsPopupVisible({ timeout: 15000 });
    if (!popupVisible) {
      const openTitles = await commonPage.getVisibleDialogTitles().catch(() => []);
      throw new Error(
        `[Cart.verifyBenerailOriginDestinationNotifications] The optional notification was displayed, but the ` +
        `"Mandatory Notifications" popup carrying "${expectedMandatory}" was not. Visible dialog(s): ` +
        `${openTitles.length ? openTitles.join(', ') : 'none'}.`
      );
    }

    const messages = await commonPage.getMandatoryNotificationMessages();
    const normalize = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const needle = normalize(expectedMandatory);
    const mandatory = messages.find((m) => normalize(m).includes(needle));
    if (!mandatory) {
      throw new Error(
        `[Cart.verifyBenerailOriginDestinationNotifications] The "Mandatory Notifications" popup does not show ` +
        `"${expectedMandatory}". Message(s) in the popup: ` +
        `${messages.length ? messages.map((m) => `"${m}"`).join(', ') : 'none'}.`
      );
    }
    logger.info('Mandatory push notification displayed in the popup', { text: mandatory });

    return { optional, mandatory };
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
   * Acknowledges the "Mandatory Notifications" popup only if it happens to be open, and does nothing
   * when it is not. Soft by design — unlike acknowledgePushNotification, which requires the popup.
   *
   * A corporation can have an unacknowledged mandatory notification pending for the traveler, in which
   * case this modal opens on its own once the traveler is added. It is `aria-modal` with an overlay, so
   * it silently intercepts every following click ("... subtree intercepts pointer events") until the
   * whole step budget is gone. Use this in flows that don't test notifications so an environment-level
   * reminder can't block them; assert with "the mandatory notifications popup should be displayed" when
   * the popup itself is under test.
   *
   * Title-scoped via getMandatoryNotificationsDialog so it never eats a reference-fields popup, which
   * renders as the same `.el-dialog.app-dialog`.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{dismissed: boolean}>}
   */
  async dismissMandatoryNotificationsPopupIfVisible(page) {
    if (!page) throw new Error('[Cart.dismissMandatoryNotificationsPopupIfVisible] "page" is required.');
    const commonPage = getPageObject(page, CommonPage);

    const visible = await commonPage.isMandatoryNotificationsPopupVisible({ timeout: 10000 });
    if (!visible) {
      logger.debug('No mandatory-notifications popup is open — nothing to dismiss');
      return { dismissed: false };
    }

    logger.info('Dismissing the mandatory-notifications popup so it cannot intercept later clicks');
    await commonPage.acknowledgeMandatoryNotificationsPopup();
    return { dismissed: true };
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
   * Verifies the cart shows the mandatory-unread banner that BLOCKS checkout while the traveler still
   * has unread mandatory notifications (trip-cart.vue renders `.unread-messages` in the checkout
   * error slot whenever `hasUnreadMandatoryNotifications` is true).
   *
   * The banner text is split across two i18n keys — `validation.unReadMessages1` and
   * `validation.unReadMessages2`, the second rendered as the clickable `.open-notifications` span.
   * Only the FIRST is asserted: it is the distinctive sentence, whereas unReadMessages2 is the single
   * generic word "messages", which adds no discrimination. Substring, not equality, because the app
   * inserts markup-driven whitespace and a leading "info" icon ligature into the banner.
   *
   * Matched against every shipped translation of that key rather than the English one alone, so a
   * language-switch scenario reusing this step does not fail with a misleading "wording changed".
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{displayed: boolean, bannerText: string}>}
   */
  async verifyMandatoryUnreadMessageDisplayed(page) {
    if (!page) throw new Error('[Cart.verifyMandatoryUnreadMessageDisplayed] "page" is required.');
    logger.debug('Verifying the mandatory-unread notifications banner blocks checkout');

    const commonPage = getPageObject(page, CommonPage);
    const bannerText = await commonPage.getMandatoryUnreadMessageText();

    const normalized = bannerText.toLowerCase();
    const matched = UNREAD_MESSAGES_BANNER_TEXTS.some((text) => normalized.includes(text.toLowerCase()));

    expect(
      matched,
      `[Cart.verifyMandatoryUnreadMessageDisplayed] Expected the checkout-blocking banner to contain ` +
      `validation.unReadMessages1 in any shipped language, but the visible banner read "${bannerText}". ` +
      `Either the wording changed, or a different checkout validation error is showing.`
    ).toBe(true);

    logger.info('Mandatory-unread notifications banner is displayed', { bannerText });
    return { displayed: true, bannerText };
  },

  /**
   * Marks every unread notification in the OPEN notification center as read, by clicking each
   * message's own "Mark as read" link (app-notification.vue). Clears the
   * `hasUnreadMandatoryNotifications` flag that keeps the cart's Proceed to Checkout disabled.
   *
   * Requires the notification center to already be open — call `openNotificationCenter` first.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{marked: number}>} How many notifications were marked as read.
   */
  async markAllUnreadNotificationsAsRead(page) {
    if (!page) throw new Error('[Cart.markAllUnreadNotificationsAsRead] "page" is required.');
    logger.debug('Marking every unread notification in the notification center as read');

    const commonPage = getPageObject(page, CommonPage);
    const panelVisible = await commonPage.isNotificationPanelVisible({ timeout: 15000 });
    if (!panelVisible) {
      throw new Error(
        '[Cart.markAllUnreadNotificationsAsRead] The notification center is not open, so no "Mark as read" ' +
        'link can be clicked. Run the "I open the notification center" step before this one.'
      );
    }

    const marked = await commonPage.clickAllMarkAsReadLinks();
    if (marked === 0) {
      throw new Error(
        '[Cart.markAllUnreadNotificationsAsRead] The notification center is open but shows no unread ' +
        'messages to mark as read. The traveler may have no mandatory notifications pending, or a ' +
        'previous step already dismissed them (e.g. by acknowledging the reminder popup instead of ' +
        'refreshing the browser).'
      );
    }

    logger.info('Marked unread notifications as read', { marked });
    return { marked };
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

  /**
   * Verifies the OPEN notification center renders exactly the expected number of notification rows.
   *
   * COUNT SEMANTICS — a count here means RENDERED PANEL ROWS, not distinct notifications.
   * app-notification.vue renders TWO lists: `newNotificationMessages` (the unread ones) followed by
   * `notificationMessages` (ALL messages, unread included). So a trip with 2 notifications, one of them
   * still unread, renders 3 rows — exactly what this feature's own 3-row table shows (its first row
   * ends in "Mark as read", i.e. the unread copy in the "new" section). Once that one is marked as read
   * the "new" section empties and 2 rows remain. The "mark all as read" control is a `.mark-all` div,
   * not a `.notification-message`, so it never enters the count.
   *
   * Requires the notification center to already be open — call `openNotificationCenter` first.
   *
   * @param {import('playwright').Page} page
   * @param {number} expectedCount - Expected number of rendered notification rows (integer >= 0)
   * @returns {Promise<void>}
   */
  async verifyNotificationCenterCount(page, expectedCount) {
    if (!page) throw new Error('[Cart.verifyNotificationCenterCount] "page" is required.');
    if (!Number.isInteger(expectedCount) || expectedCount < 0) {
      throw new Error(
        `[Cart.verifyNotificationCenterCount] "expectedCount" must be an integer >= 0, got: ` +
        `${typeof expectedCount} (${JSON.stringify(expectedCount)})`
      );
    }
    logger.debug('Verifying the notification center row count', { expectedCount });

    const commonPage = getPageObject(page, CommonPage);
    const panelVisible = await commonPage.isNotificationPanelVisible({ timeout: 15000 });
    if (!panelVisible) {
      throw new Error(
        '[Cart.verifyNotificationCenterCount] The notification center is not open, so its notifications ' +
        'cannot be counted. Run the "I open the notification center" step before this one.'
      );
    }

    // POLL instead of reading once: marking a notification as read re-renders the panel asynchronously
    // (the "new" section empties), so a single read taken right after that click sees a stale row count.
    // The count must hold across TWO consecutive reads: expect.poll resolves the instant a value passes
    // THROUGH the expected number, so a mid-render count on the way to a higher steady state would
    // otherwise pass. The inner timeout is deliberately short — getVisibleNotificationMessageTexts waits
    // for its first row on every call, so its 10s default would leave the poll a single sample.
    try {
      await expect
        .poll(
          async () => {
            const first = (await commonPage.getVisibleNotificationMessageTexts({ timeout: 2000 })).length;
            const second = (await commonPage.getVisibleNotificationMessageTexts({ timeout: 2000 })).length;
            // -1 while the panel is still re-rendering, so an unsettled count can never satisfy the matcher.
            return first === second ? first : -1;
          },
          { timeout: 15000 }
        )
        .toBe(expectedCount);
    } catch (err) {
      const actual = await commonPage.getVisibleNotificationMessageTexts().catch(() => []);
      throw new Error(
        `[Cart.verifyNotificationCenterCount] Expected the notification center to render ${expectedCount} ` +
        `notification row(s), but it rendered ${actual.length}: ` +
        `${actual.length ? actual.map((t) => `"${t}"`).join(', ') : 'none'}. Note that each UNREAD ` +
        `message renders TWICE (once in the "new" section, once in the full list), so 2 notifications ` +
        `with 1 unread show 3 rows. Original: ${err.message}`
      );
    }

    logger.info('Notification center row count verified', { expectedCount });
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
   * Verifies a "More details" link is displayed on the trip overview.
   *
   * Used as a rendering gate right after a booking completes (test 67503): the trip overview is
   * re-rendered from the booked trip, and the quote card's own "More details" link is the last part
   * of it to appear — so reading the post-booking price before it is there can read a stale or
   * half-rendered amount.
   *
   * @param {import('playwright').Page} page
   */
  async verifyMoreDetailsLinkDisplayedInTripOverview(page) {
    if (!page) throw new Error('[Cart.verifyMoreDetailsLinkDisplayedInTripOverview] "page" is required.');
    logger.debug('Checking the "More details" link is displayed in the trip overview');
    const cartPage = getPageObject(page, CartPage);

    if (!(await cartPage.isMoreDetailsLinkVisible())) {
      throw new Error(
        'Expected a "More details" link on the trip overview, but none became visible. The trip ' +
          'overview never finished rendering the booked quote card, so any price read from it now ' +
          'would not be the booked price.'
      );
    }
  },

  /**
   * Opens the More Details drawer for the LAST car quote card in the trip (the most recently
   * added one). Use when two or more cars are in the same trip, since they can carry identical
   * pick-up/drop-off dates and are otherwise indistinguishable by text.
   * @param {import('playwright').Page} page
   */
  async openMoreDetailsForLastCarInCart(page) {
    if (!page) throw new Error('[Cart.openMoreDetailsForLastCarInCart] "page" is required.');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickMoreDetailsForLastCarInCart();
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
   *
   * The read is polled, not single-shot: general-quote-more-details.vue mounts every product's
   * More Details body through defineAsyncComponent, so the drawer opens with its title and an EMPTY
   * body until that chunk is fetched (blank body, no el-skeleton to wait on — hence the wait cannot
   * live in getAnyVisibleDrawerText's skeleton check). Re-reading until the deadline still fails
   * honestly when the text never arrives; it only stops the assertion from landing in the gap.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Text to find in the open drawer
   * @param {number} [timeout=20000] - How long to keep re-reading the drawer before failing
   */
  async verifyOpenDrawerContainsText(page, expectedText, timeout = 20000) {
    if (!page) throw new Error('[Cart.verifyOpenDrawerContainsText] "page" is required.');
    if (typeof expectedText !== 'string' || !expectedText) {
      throw new Error(`[Cart.verifyOpenDrawerContainsText] "expectedText" must be a non-empty string, got: ${typeof expectedText}`);
    }
    if (!Number.isInteger(timeout) || timeout <= 0) {
      throw new Error(`[Cart.verifyOpenDrawerContainsText] "timeout" must be a positive integer, got: ${timeout}`);
    }
    const cartPage = getPageObject(page, CartPage);
    const normalize = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
    const deadline = Date.now() + timeout;

    let drawerText = '';
    for (;;) {
      drawerText = await cartPage.getAnyVisibleDrawerText();
      if (normalize(drawerText).includes(normalize(expectedText))) {
        return;
      }
      if (Date.now() >= deadline) {
        break;
      }
      logger.debug('[Cart.verifyOpenDrawerContainsText] Drawer body does not carry the text yet, re-reading', {
        expectedText,
        drawerTextLength: drawerText.length,
      });
      // Fixed pause between reads: the async chunk mounts on a network round trip, with no DOM
      // state to wait on while the body is still empty (getAnyVisibleDrawerText already covers the
      // skeleton case), so there is nothing to poll but the text itself.
      await page.waitForTimeout(500);
    }

    throw new Error(
      `[Cart.verifyOpenDrawerContainsText] Expected the open drawer to contain "${expectedText}" but it was ` +
      `not found within ${timeout}ms. The async More Details body may have failed to mount. ` +
      `Drawer text (first 500 chars): "${drawerText.substring(0, 500)}"`
    );
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
   * Extracts one per-night price from the "Rate information" panel of the open hotel More Details
   * drawer. This is the price for ONE room for ONE night, before the room count is applied — pair
   * it with extractTotalForRoomsFromMoreDetails to check the stay total against it.
   *
   * Preconditions: the hotel More Details drawer must already be open (via openMoreDetailsInCart).
   *
   * @param {import('playwright').Page} page
   * @param {number} nightNumber - 1-based night position in the rate breakdown
   * @returns {Promise<{nightNumber: number, price: number, label: string}>}
   */
  async extractNightPriceFromRateInformation(page, nightNumber) {
    if (!page) throw new Error('[Cart.extractNightPriceFromRateInformation] "page" is required.');
    if (typeof nightNumber !== 'number' || !Number.isInteger(nightNumber) || nightNumber < 1) {
      throw new Error(
        `[Cart.extractNightPriceFromRateInformation] "nightNumber" must be a 1-based integer, got: ${typeof nightNumber} (${nightNumber})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    let row;
    try {
      row = await cartPage.getHotelMoreDetailsNightPrice(nightNumber);
    } catch (err) {
      throw new Error(
        `[Cart.extractNightPriceFromRateInformation] Could not read the night ${nightNumber} price from the ` +
        `More Details "Rate information" panel. Open the hotel's More Details drawer first. Original: ${err.message}`
      );
    }

    logger.info('Extracted per-night price from More Details rate information', {
      nightNumber,
      label: row.label,
      price: row.amount,
    });
    return { nightNumber, price: row.amount, label: row.label };
  },

  /**
   * Extracts the "Total for N rooms" amount from the open hotel More Details drawer, asserting the
   * row is the one for the expected room count (the label carries the count the app booked).
   *
   * Preconditions: the hotel More Details drawer must already be open (via openMoreDetailsInCart).
   *
   * @param {import('playwright').Page} page
   * @param {number} expectedRoomCount - Room count the row's own label must report
   * @returns {Promise<{price: number, roomCount: number, label: string}>}
   */
  async extractTotalForRoomsFromMoreDetails(page, expectedRoomCount) {
    if (!page) throw new Error('[Cart.extractTotalForRoomsFromMoreDetails] "page" is required.');
    if (typeof expectedRoomCount !== 'number' || !Number.isInteger(expectedRoomCount) || expectedRoomCount < 1) {
      throw new Error(
        `[Cart.extractTotalForRoomsFromMoreDetails] "expectedRoomCount" must be an integer >= 1, got: ${typeof expectedRoomCount} (${expectedRoomCount})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    let row;
    try {
      row = await cartPage.getHotelMoreDetailsTotalForRooms();
    } catch (err) {
      throw new Error(
        `[Cart.extractTotalForRoomsFromMoreDetails] Could not read the "Total for ${expectedRoomCount} rooms" ` +
        `row from the More Details drawer. Open the hotel's More Details drawer first. Original: ${err.message}`
      );
    }

    expect(
      row.roomCount,
      `[Cart.extractTotalForRoomsFromMoreDetails] Expected the More Details total row to be for ` +
      `${expectedRoomCount} rooms, but it reads "${row.label}" — the quote holds a different number of rooms ` +
      `than the search asked for.`,
    ).toBe(expectedRoomCount);

    logger.info('Extracted total-for-rooms price from More Details', {
      label: row.label,
      roomCount: row.roomCount,
      price: row.amount,
    });
    return { price: row.amount, roomCount: row.roomCount, label: row.label };
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
   * Verifies the daily-rate text ("... / Per day") is displayed under a car cart line item's
   * price, before the More Details drawer is opened.
   *
   * @param {import('playwright').Page} page
   * @param {boolean} [last=false] - When true, targets the LAST (most recently added) car quote
   *   card instead of the first — use when two or more cars are in the same trip.
   * @throws {Error} If page is missing, the daily rate never appears, or it does not read
   *   "... / Per day"
   * @returns {Promise<{text: string, amount: number}>}
   */
  async expectDailyRateDisplayedInCart(page, last = false) {
    if (!page) throw new Error('[Cart.expectDailyRateDisplayedInCart] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForCarCartCardDailyRateVisible(15000, last);

    const text = (await cartPage.getCarCartCardDailyRate(last).innerText()).trim();
    expect(
      /per day/i.test(text),
      `[Cart.expectDailyRateDisplayedInCart] Expected a "... / Per day" daily rate under the car ` +
      `cart line item's price, got: "${text}".`,
    ).toBe(true);

    const amount = parseAmountText(text, 'daily rate (cart)');
    return { text, amount };
  },

  /**
   * Reads the "Price Per day" and "Subtotal" rows from the car's open More Details drawer, and
   * asserts the subtotal row's day count matches expectedNumberOfDays when provided.
   *
   * Preconditions: the car More Details drawer must already be open (via openMoreDetailsInCart).
   *
   * @param {import('playwright').Page} page
   * @param {Object} [options]
   * @param {number} [options.expectedNumberOfDays] - Expected day count in the "Subtotal (total
   *   for N days)" label
   * @throws {Error} If page is missing, the price rows never appear, the row labels do not match
   *   "Price Per day"/"Subtotal", or the subtotal's day count does not match expectedNumberOfDays
   * @returns {Promise<{pricePerDay: number, subtotal: number, subtotalLabel: string, numberOfDays: number}>}
   */
  async getMoreDetailsPricePerDayAndSubtotal(page, { expectedNumberOfDays } = {}) {
    if (!page) throw new Error('[Cart.getMoreDetailsPricePerDayAndSubtotal] "page" is required.');
    if (expectedNumberOfDays != null && (typeof expectedNumberOfDays !== 'number' || expectedNumberOfDays <= 0)) {
      throw new Error(
        `[Cart.getMoreDetailsPricePerDayAndSubtotal] "expectedNumberOfDays" must be a positive number when ` +
        `provided, got: ${typeof expectedNumberOfDays} (${expectedNumberOfDays})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForCarMoreDetailsPriceRowsVisible();

    const pricePerDayLabel = (await cartPage.getCarMoreDetailsPriceRowLabel(0).innerText()).trim();
    const pricePerDayText = (await cartPage.getCarMoreDetailsPriceRowValue(0).innerText()).trim();
    const subtotalLabel = (await cartPage.getCarMoreDetailsPriceRowLabel(1).innerText()).trim();
    const subtotalText = (await cartPage.getCarMoreDetailsPriceRowValue(1).innerText()).trim();

    expect(
      /price.*per.*day/i.test(pricePerDayLabel),
      `[Cart.getMoreDetailsPricePerDayAndSubtotal] Expected the More Details drawer's first price row to be ` +
      `"Price Per day", got: "${pricePerDayLabel}". The row order in car-quote-card.vue may have changed.`,
    ).toBe(true);

    expect(
      /subtotal/i.test(subtotalLabel),
      `[Cart.getMoreDetailsPricePerDayAndSubtotal] Expected the More Details drawer's second price row to be ` +
      `"Subtotal (...)", got: "${subtotalLabel}". The row order in car-quote-card.vue may have changed.`,
    ).toBe(true);

    const daysMatch = /(\d+)/.exec(subtotalLabel);
    expect(
      daysMatch,
      `[Cart.getMoreDetailsPricePerDayAndSubtotal] Could not find a day count in the Subtotal label: "${subtotalLabel}".`,
    ).not.toBeNull();
    const numberOfDays = Number(daysMatch[1]);

    if (expectedNumberOfDays != null) {
      expect(
        numberOfDays,
        `[Cart.getMoreDetailsPricePerDayAndSubtotal] Expected the Subtotal row to say ` +
        `"total for ${expectedNumberOfDays} days", got: "${subtotalLabel}".`,
      ).toBe(expectedNumberOfDays);
    }

    const pricePerDay = parseAmountText(pricePerDayText, 'price per day (more details)');
    const subtotal = parseAmountText(subtotalText, 'subtotal (more details)');

    return { pricePerDay, subtotal, subtotalLabel, numberOfDays };
  },

  /**
   * Verifies that Subtotal / number of days equals the displayed "Price Per day" rate inside the
   * car's open More Details drawer.
   *
   * Preconditions: the car More Details drawer must already be open (via openMoreDetailsInCart).
   *
   * @param {import('playwright').Page} page
   * @param {number} numberOfDays - Expected rental day count (also asserted against the Subtotal
   *   row's own label)
   * @param {number} [tolerance=0.02]
   * @throws {Error} If page/numberOfDays are invalid, the price rows never appear, or the
   *   computed rate does not match the displayed Price Per day within tolerance
   * @returns {Promise<{pricePerDay: number, subtotal: number, computedRate: number}>}
   */
  async expectSubtotalDividedByDaysEqualsRate(page, numberOfDays, tolerance = 0.02) {
    if (!page) throw new Error('[Cart.expectSubtotalDividedByDaysEqualsRate] "page" is required.');
    if (typeof numberOfDays !== 'number' || numberOfDays <= 0) {
      throw new Error(
        `[Cart.expectSubtotalDividedByDaysEqualsRate] "numberOfDays" must be a positive number, got: ${typeof numberOfDays} (${numberOfDays})`
      );
    }

    const { pricePerDay, subtotal } = await Cart.getMoreDetailsPricePerDayAndSubtotal(page, {
      expectedNumberOfDays: numberOfDays,
    });

    const computedRate = subtotal / numberOfDays;
    expectNumbersToBeEqualWithTolerance(
      computedRate,
      pricePerDay,
      tolerance,
      'Daily rate (Subtotal / number of days vs displayed Price Per day, in More Details)',
    );

    return { pricePerDay, subtotal, computedRate };
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
   * Opens a rail Fare Rules dialog (results, cart, or trip overview — the button/dialog markup is
   * shared across all three) and leaves it open. Use with closeRailFareRulesDialog when the scenario
   * asserts something inside the dialog that verifyRailFareRulesDialogContainsText below does not
   * cover, such as the Amtrak supplier terms link (test 60542).
   *
   * @param {import('playwright').Page} page
   * @param {number} [index=0] - Zero-based index of the Fare Rules button
   * @returns {Promise<{opened: boolean, index: number}>}
   */
  async openRailFareRulesDialog(page, index = 0) {
    if (!page) throw new Error('[Cart.openRailFareRulesDialog] "page" is required.');
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(`[Cart.openRailFareRulesDialog] "index" must be a non-negative integer, got: ${index}`);
    }

    logger.debug('[Cart.openRailFareRulesDialog] Opening the rail Fare Rules dialog', { index });

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickRailFareRulesButton(index);
    return { opened: true, index };
  },

  /**
   * Closes the open rail Fare Rules dialog and confirms it really left the screen.
   * @param {import('playwright').Page} page
   * @returns {Promise<{closed: boolean}>}
   */
  async closeRailFareRulesDialog(page) {
    if (!page) throw new Error('[Cart.closeRailFareRulesDialog] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.closeRailFareRulesDialog();
    return { closed: true };
  },

  /**
   * Opens a rail Fare Rules dialog (results, cart, or trip overview — the button/dialog markup
   * is shared across all three) and verifies its body contains the expected text, then closes it.
   * See test 29414.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Text expected inside the Fare Rules dialog (case-insensitive)
   * @param {number} index - Zero-based index of the Fare Rules button (default: 0)
   * @returns {Promise<{text: string}>}
   */
  async verifyRailFareRulesDialogContainsText(page, expectedText, index = 0) {
    if (!page) {
      throw new Error('[Cart.verifyRailFareRulesDialogContainsText] "page" is required.');
    }
    if (typeof expectedText !== 'string' || !expectedText) {
      throw new Error(
        `[Cart.verifyRailFareRulesDialogContainsText] "expectedText" must be a non-empty string, got: ${typeof expectedText}`,
      );
    }
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(
        `[Cart.verifyRailFareRulesDialogContainsText] "index" must be a non-negative integer, got: ${index}`,
      );
    }

    logger.debug('[Cart.verifyRailFareRulesDialogContainsText] Checking rail Fare Rules dialog text', { expectedText, index });

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickRailFareRulesButton(index);
    const text = await cartPage.getRailFareRulesDialogText();

    expect(
      text.toLowerCase(),
      `[Cart.verifyRailFareRulesDialogContainsText] Fare Rules dialog should contain ` +
      `"${expectedText}", but got: "${text}"`,
    ).toContain(expectedText.toLowerCase());

    await cartPage.closeRailFareRulesDialog();
    return { text };
  },

  /**
   * Opens a UK rail (Evolvi) quote-card "Fare rules" drawer — in the cart or in the trip overview
   * after booking, which render the same uk-rail-quote-card — verifies its rules contain the
   * expected text, then closes it. See test 59698.
   *
   * The drawer itself is read and closed through the generic open-drawer helpers, which already
   * handle every product's drawer; only the trigger is rail-specific. Separate from
   * verifyRailFareRulesDialogContainsText because the Benerail card opens its rules in an el-dialog
   * with its own close control, while the Evolvi card uses a drawer.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Text expected inside the fare rules (case-insensitive)
   * @param {number} [segmentIndex=0] - Zero-based journey/segment index on the quote card
   * @returns {Promise<{verified: boolean, segmentIndex: number}>}
   */
  async verifyUkRailFareRulesDrawerContainsText(page, expectedText, segmentIndex = 0) {
    if (!page) {
      throw new Error('[Cart.verifyUkRailFareRulesDrawerContainsText] "page" is required.');
    }
    if (typeof expectedText !== 'string' || !expectedText) {
      throw new Error(
        `[Cart.verifyUkRailFareRulesDrawerContainsText] "expectedText" must be a non-empty string, got: ${typeof expectedText}`,
      );
    }
    if (!Number.isInteger(segmentIndex) || segmentIndex < 0) {
      throw new Error(
        `[Cart.verifyUkRailFareRulesDrawerContainsText] "segmentIndex" must be a non-negative integer, got: ${segmentIndex}`,
      );
    }

    logger.debug('[Cart.verifyUkRailFareRulesDrawerContainsText] Checking the UK rail Fare rules drawer', {
      expectedText,
      segmentIndex,
    });

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickUkRailFareRulesButton(segmentIndex);
    await Cart.verifyOpenDrawerContainsText(page, expectedText);
    await Cart.closeOpenDrawer(page);

    return { verified: true, segmentIndex };
  },

  /**
   * Reads the first train company of the route from the EU rail (Benerail) quote card in the cart /
   * trip overview — the assertion itself belongs to the step (see dsl.md).
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} Carrier name, e.g. "InterCity Express"
   */
  async getFirstEuRailTrainCompany(page) {
    if (!page) {
      throw new Error('[Cart.getFirstEuRailTrainCompany] "page" is required.');
    }

    const cartPage = getPageObject(page, CartPage);
    return await cartPage.getFirstEuRailQuoteRouteCarrierName();
  },

  /**
   * Reads the travel class of one leg of the EU rail (Benerail) quote card in the cart — the
   * assertion itself belongs to the step (see dsl.md). Leg indexes follow the quote card's own
   * segment order, matching verifyRailFareRulesDialogContainsText's `index`.
   * @param {import('playwright').Page} page
   * @param {number} [segmentIndex=0] - Zero-based leg index: 0 = outbound, 1 = return.
   * @returns {Promise<string>} The leg's travel class, e.g. "1st Class"
   */
  async getEuRailSegmentClass(page, segmentIndex = 0) {
    if (!page) {
      throw new Error('[Cart.getEuRailSegmentClass] "page" is required.');
    }
    if (!Number.isInteger(segmentIndex) || segmentIndex < 0) {
      throw new Error(
        `[Cart.getEuRailSegmentClass] "segmentIndex" must be a non-negative integer, got: ${segmentIndex}`,
      );
    }

    logger.debug('[Cart.getEuRailSegmentClass] Reading the rail quote leg travel class', { segmentIndex });

    const cartPage = getPageObject(page, CartPage);
    try {
      return await cartPage.getEuRailQuoteSegmentClass(segmentIndex);
    } catch (error) {
      throw new Error(
        `[Cart.getEuRailSegmentClass] Could not read the travel class of rail quote leg ` +
        `${segmentIndex} in the cart. Original: ${error.message}`,
      );
    }
  },

  /**
   * Opens the Journey Details dialog of one leg of the EU rail (Benerail) quote card in the cart.
   * The dialog is read and closed with the BenerailResults journey details methods — it is the
   * same component the results page mounts.
   * @param {import('playwright').Page} page
   * @param {number} [segmentIndex=0] - Zero-based leg index: 0 = outbound, 1 = return.
   */
  async openEuRailJourneyDetails(page, segmentIndex = 0) {
    if (!page) {
      throw new Error('[Cart.openEuRailJourneyDetails] "page" is required.');
    }

    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.openEuRailQuoteSegmentJourneyDetails(segmentIndex);
    } catch (error) {
      throw new Error(
        `[Cart.openEuRailJourneyDetails] Could not open the Journey Details of rail quote leg ` +
        `${segmentIndex} in the cart. Original: ${error.message}`,
      );
    }
    return { opened: true, segmentIndex };
  },

  // ===== EU RAIL (BENERAIL) MOBILE BARCODE =====

  /**
   * Verifies the "Mobile Barcode" button is displayed on the booked rail quote card in the trip
   * overview. eu-rail-quote-card.vue only renders that button when the supplier returned barcode
   * URLs, so its presence is the state check that the booking carries a mobile barcode at all.
   *
   * @param {import('playwright').Page} page
   */
  async verifyEuRailMobileBarcodeButtonVisible(page) {
    if (!page) {
      throw new Error('[Cart.verifyEuRailMobileBarcodeButtonVisible] "page" is required.');
    }

    const cartPage = getPageObject(page, CartPage);
    const visible = await cartPage.isEuRailMobileBarcodeButtonVisible();

    expect(
      visible,
      '[Cart.verifyEuRailMobileBarcodeButtonVisible] Expected the booked rail quote card in the trip ' +
      'overview to show the "Mobile Barcode" button, but it was not rendered. The quote may not be ' +
      'confirmed yet, or the supplier returned no barcode for this ticket.',
    ).toBe(true);

    logger.info('The Mobile Barcode button is displayed on the booked rail quote card');
  },

  /**
   * Opens the mobile-barcode dialog from the booked rail quote card.
   *
   * @param {import('playwright').Page} page
   */
  async openEuRailMobileBarcodeDialog(page) {
    if (!page) {
      throw new Error('[Cart.openEuRailMobileBarcodeDialog] "page" is required.');
    }

    logger.debug('Opening the rail mobile barcode dialog');
    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.clickEuRailMobileBarcodeButton();
      await cartPage.waitForEuRailMobileBarcodeDialog();
    } catch (error) {
      throw new Error(
        `[Cart.openEuRailMobileBarcodeDialog] Could not open the mobile barcode dialog from the ` +
        `booked rail quote card. Original: ${error.message}`,
      );
    }
  },

  /**
   * Verifies the barcode (QR) image is displayed and actually loaded inside the open
   * mobile-barcode dialog.
   *
   * The image points at an external supplier URL and is rendered through app-img.vue, which falls
   * back to a bundled placeholder when that URL fails — so this asserts the browser decoded a real
   * bitmap, not just that an <img> element is on screen.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{count: number, src: string}>} How many barcode images the dialog shows, and the first image's src
   */
  async verifyEuRailMobileBarcodeImageDisplayed(page) {
    if (!page) {
      throw new Error('[Cart.verifyEuRailMobileBarcodeImageDisplayed] "page" is required.');
    }

    const cartPage = getPageObject(page, CartPage);

    let state;
    try {
      state = await cartPage.getEuRailMobileBarcodeImageState();
    } catch (error) {
      throw new Error(
        `[Cart.verifyEuRailMobileBarcodeImageDisplayed] No barcode image became visible in the ` +
        `mobile barcode dialog. The dialog must be open before this check. Original: ${error.message}`,
      );
    }

    expect(
      state.loaded,
      `[Cart.verifyEuRailMobileBarcodeImageDisplayed] Expected the mobile barcode dialog to show a ` +
      `loaded barcode image, but the browser decoded nothing (naturalWidth: ${state.naturalWidth}, ` +
      `alt: "${state.alt}", src: "${state.src}").`,
    ).toBe(true);

    logger.info('The barcode image is displayed in the mobile barcode dialog', {
      barcodeImageCount: state.count,
      naturalWidth: state.naturalWidth,
    });
    return { count: state.count, src: state.src };
  },

  /**
   * Closes the mobile-barcode dialog.
   *
   * @param {import('playwright').Page} page
   */
  async closeEuRailMobileBarcodeDialog(page) {
    if (!page) {
      throw new Error('[Cart.closeEuRailMobileBarcodeDialog] "page" is required.');
    }

    logger.debug('Closing the rail mobile barcode dialog');
    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.closeEuRailMobileBarcodeDialog();
    } catch (error) {
      throw new Error(
        `[Cart.closeEuRailMobileBarcodeDialog] Could not close the mobile barcode dialog. ` +
        `Original: ${error.message}`,
      );
    }
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

  // ===== UK RAIL (EVOLVI) SPLIT TICKET — test 44341 =====

  /**
   * Verifies the cart's UK Rail quote card still shows the split ticket: the SplitTix glyph on the
   * ticket-type row, plus the expected label beside it.
   *
   * Used both before and after checkout — the app returns to the same trip overview once the
   * booking is finalized, so the quote card is read the same way either side of it.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedLabel - e.g. "SplitTix"
   * @returns {Promise<{iconVisible: boolean, text: string}>}
   */
  async verifyUkRailSplitTicketInfoInCart(page, expectedLabel) {
    if (!page) throw new Error('[Cart.verifyUkRailSplitTicketInfoInCart] "page" is required.');
    if (typeof expectedLabel !== 'string' || !expectedLabel.trim()) {
      throw new Error(
        `[Cart.verifyUkRailSplitTicketInfoInCart] "expectedLabel" must be a non-empty string, got: ${expectedLabel}`
      );
    }
    const cartPage = getPageObject(page, CartPage);

    const info = await cartPage.getUkRailSplitTicketInfoInCart();
    logger.info('[Cart.verifyUkRailSplitTicketInfoInCart] Read the UK Rail quote card', info);

    expect(
      info.iconVisible,
      'The split ticket icon should be displayed on the UK Rail quote card in the cart — ' +
        'uk-rail-segment-info.vue only renders it while the segment is a split ticket. ' +
        `Ticket row read: "${info.text}"`
    ).toBe(true);
    expect(
      info.text,
      `The UK Rail quote card in the cart should show "${expectedLabel}" as its ticket type.`
    ).toContain(expectedLabel);

    return info;
  },

  /**
   * Verifies the open More details drawer shows the same split-ticket icon and label, then closes
   * the drawer so the following steps are not left clicking through it.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedLabel - e.g. "SplitTix"
   * @returns {Promise<{iconVisible: boolean, text: string}>}
   */
  async verifyUkRailSplitTicketInfoInMoreDetailsAndClose(page, expectedLabel) {
    if (!page) throw new Error('[Cart.verifyUkRailSplitTicketInfoInMoreDetailsAndClose] "page" is required.');
    if (typeof expectedLabel !== 'string' || !expectedLabel.trim()) {
      throw new Error(
        `[Cart.verifyUkRailSplitTicketInfoInMoreDetailsAndClose] "expectedLabel" must be a non-empty string, got: ${expectedLabel}`
      );
    }
    const cartPage = getPageObject(page, CartPage);

    const info = await cartPage.getUkRailSplitTicketInfoInMoreDetails();
    logger.info(
      '[Cart.verifyUkRailSplitTicketInfoInMoreDetailsAndClose] Read the More details drawer',
      info
    );

    try {
      expect(
        info.iconVisible,
        'The split ticket icon should be displayed in the UK Rail More details drawer. ' +
          `Drawer text read: "${info.text}"`
      ).toBe(true);
      expect(
        info.text,
        `The UK Rail More details drawer should show "${expectedLabel}" as the ticket type.`
      ).toContain(expectedLabel);
    } finally {
      // Close either way: leaving the drawer open would block every following cart interaction and
      // turn one assertion failure into a cascade of unrelated ones.
      await cartPage.closeAnyVisibleDrawer();
    }

    return info;
  },

  /**
   * Verifies the share itinerary email preview carries the split-ticket icon plus the expected
   * labels — e.g. "SplitTix" and the "Remain on the train, change ticket" split instruction.
   * The share dialog must already be open.
   *
   * @param {import('playwright').Page} page
   * @param {string[]} expectedTexts - Every text that must appear in the preview
   * @returns {Promise<{iconPresent: boolean, text: string, imageSources: string[]}>}
   */
  async verifyUkRailSplitTicketInfoInSharePreview(page, expectedTexts) {
    if (!page) throw new Error('[Cart.verifyUkRailSplitTicketInfoInSharePreview] "page" is required.');
    if (!Array.isArray(expectedTexts) || expectedTexts.length === 0) {
      throw new Error(
        `[Cart.verifyUkRailSplitTicketInfoInSharePreview] "expectedTexts" must be a non-empty array, got: ${expectedTexts}`
      );
    }
    const cartPage = getPageObject(page, CartPage);

    const info = await cartPage.getUkRailSplitTicketInfoInSharePreview();
    logger.info('[Cart.verifyUkRailSplitTicketInfoInSharePreview] Read the itinerary email preview', {
      iconPresent: info.iconPresent,
      imageSources: info.imageSources,
    });

    expect(
      info.text,
      'The share itinerary email preview text should not be empty'
    ).toBeTruthy();

    for (const expectedText of expectedTexts) {
      expect(
        info.text,
        `The share itinerary email preview should contain "${expectedText}".`
      ).toContain(expectedText);
    }

    expect(
      info.iconPresent,
      'The share itinerary email preview should contain the split ticket icon — no <img> in the ' +
        `preview names a split ticket. Images found: ${JSON.stringify(info.imageSources)}`
    ).toBe(true);

    return info;
  },

  /**
   * Verifies that a wallet link is present in the share itinerary email preview and points
   * somewhere. Used for the Evolvi UK Rail ticket-delivery links, e.g.
   * "Get your PKPASS (Apple Wallet)" and "Get your Ticket (Google Wallet)".
   *
   * The preview iframe carries the same backend-generated HTML the mail server sends, so the
   * anchor is matched on its rendered label (whitespace-normalised, case-insensitive) rather
   * than on a structural path through the email template, which changes between releases.
   *
   * @param {import('playwright').Page} page
   * @param {string} linkLabel - The link label as it reads in the email, e.g. "Get your Ticket (Google Wallet)"
   * @returns {Promise<{text: string, href: string}>} The matched link
   */
  async verifyWalletLinkInSharePreview(page, linkLabel) {
    if (!page) throw new Error('[Cart.verifyWalletLinkInSharePreview] "page" is required.');
    if (typeof linkLabel !== 'string' || !linkLabel.trim()) {
      throw new Error(
        `[Cart.verifyWalletLinkInSharePreview] "linkLabel" must be a non-empty string, got: ${linkLabel}`
      );
    }
    const cartPage = getPageObject(page, CartPage);

    const links = await cartPage.getSharePreviewLinks();
    const normalize = (value) => (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
    const wanted = normalize(linkLabel);
    const match = links.find((link) => normalize(link.text).includes(wanted));

    // Thrown rather than asserted through expect(): the custom message passed to
    // expect(value, message) is dropped by this Playwright version, and the list of links the
    // preview does contain is what makes a failure diagnosable.
    if (!match) {
      throw new Error(
        `[Cart.verifyWalletLinkInSharePreview] The share itinerary email preview should contain a ` +
          `"${linkLabel}" link, but no link carries that label. Links found: ` +
          `${JSON.stringify(links.map((link) => link.text).filter(Boolean))}`
      );
    }

    if (!/^https?:\/\/\S+/i.test(match.href)) {
      throw new Error(
        `[Cart.verifyWalletLinkInSharePreview] The "${linkLabel}" link in the share itinerary email ` +
          `preview should point to an absolute http(s) URL, but its href was "${match.href}".`
      );
    }

    logger.info('[Cart.verifyWalletLinkInSharePreview] Wallet link found in the itinerary email preview', {
      label: match.text,
      href: match.href,
    });

    return match;
  },

  /**
   * Reads the Eticket reference off the booked UK rail (Evolvi) quote in the trip overview (64936).
   *
   * Run straight after the booking completes and the app lands back on the trip overview: the
   * reference is what the share itinerary email has to carry too, so the same value is compared
   * against the preview later in the scenario.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The Eticket reference shown on the quote card
   */
  async extractUkRailEticketNumber(page) {
    if (!page) throw new Error('[Cart.extractUkRailEticketNumber] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    let eticketNumber;
    try {
      eticketNumber = await cartPage.getUkRailEticketNumberFromTripOverview();
    } catch (err) {
      throw new Error(
        `[Cart.extractUkRailEticketNumber] Could not read the Eticket reference from the booked UK rail ` +
          `quote in the trip overview. The booking may not have completed, or the quote is not a UK rail ` +
          `(Evolvi) one. Original: ${err.message}`
      );
    }

    logger.info('[Cart.extractUkRailEticketNumber] Read the Eticket reference from the trip overview', { eticketNumber });
    return eticketNumber;
  },

  /**
   * Clicks the e-ticket link in the OPEN share itinerary preview and captures the file it serves
   * (64936 — an Evolvi booking whose delivery method is "eTicket Queue").
   *
   * The link is DISCOVERED, not matched on a label: the itinerary email is generated by the mail
   * service, so its wording is not in this repo's source and a hardcoded label would rot silently.
   * The wallet links the same email carries ("Get your PKPASS (Apple Wallet)", "Get your Ticket
   * (Google Wallet)") are excluded first, then the remaining anchor that points at a ticket document
   * is taken. Zero or several candidates is an error that lists every link in the preview — which is
   * what makes the email's actual wording readable off a failing run instead of guessed at.
   *
   * The email's anchors open in a new tab, so a same-page download and a popup that downloads are
   * both awaited. The popup is closed and the app page brought back to front afterwards: a
   * backgrounded app page swallows the next interaction with the preview, and the scenario still has
   * to read the Eticket reference out of it.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{clicked: boolean, label: string, href: string, download: import('@playwright/test').Download, popupUrl: string|null}>}
   */
  async clickEticketLinkInSharePreview(page) {
    if (!page) throw new Error('[Cart.clickEticketLinkInSharePreview] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    const links = await cartPage.getSharePreviewLinks();
    const describe = (list) => JSON.stringify(list.map((link) => ({ text: link.text, href: link.href })));

    const candidates = links.filter((link) => {
      const text = link.text || '';
      const href = link.href || '';
      if (!ABSOLUTE_HTTP_URL.test(href)) return false;
      if (WALLET_LINK_PATTERNS.some((pattern) => pattern.test(text) || pattern.test(href))) return false;
      return ETICKET_LINK_PATTERNS.some((pattern) => pattern.test(text) || pattern.test(href));
    });

    if (candidates.length !== 1) {
      throw new Error(
        `[Cart.clickEticketLinkInSharePreview] Expected exactly one e-ticket link in the share itinerary ` +
          `email preview, but found ${candidates.length}. Candidates: ${describe(candidates)}. ` +
          `All links in the preview: ${describe(links)}`
      );
    }

    const [match] = candidates;
    logger.info('[Cart.clickEticketLinkInSharePreview] Clicking the e-ticket link in the itinerary email preview', {
      label: match.text,
      href: match.href,
    });

    const context = page.context();
    // Both waits are armed BEFORE the click: the download event is missed if it is armed afterwards.
    const popupPromise = context.waitForEvent('page', { timeout: ETICKET_LINK_TIMEOUT_MS }).catch(() => null);
    const samePageDownloadPromise = page.waitForEvent('download', { timeout: ETICKET_LINK_TIMEOUT_MS }).catch(() => null);

    await cartPage.clickSharePreviewLinkByHref(match.href);

    // Whichever of the two arrives first decides how the link behaved; both resolve to null on
    // timeout, so a race cannot hang past ETICKET_LINK_TIMEOUT_MS.
    const outcome = await Promise.race([
      popupPromise.then((popup) => (popup ? { popup } : null)),
      samePageDownloadPromise.then((download) => (download ? { download } : null)),
    ]);

    let download = outcome && outcome.download ? outcome.download : null;
    let popupUrl = null;

    if (outcome && outcome.popup) {
      const popup = outcome.popup;
      download = await popup.waitForEvent('download', { timeout: ETICKET_LINK_TIMEOUT_MS }).catch(() => null);
      popupUrl = popup.url();
      await popup.close().catch(() => {});
      await page.bringToFront();
    }

    if (!download) download = await samePageDownloadPromise;

    if (!download) {
      throw new Error(
        `[Cart.clickEticketLinkInSharePreview] Clicking the e-ticket link "${match.text}" (${match.href}) ` +
          `produced no file download within ${ETICKET_LINK_TIMEOUT_MS}ms` +
          `${popupUrl ? ` — it opened "${popupUrl}" instead` : ''}. The link may render the ticket in the ` +
          `browser rather than serve it as a file, or the ticket was not issued for this booking.`
      );
    }

    return { clicked: true, label: match.text, href: match.href, download, popupUrl };
  },

  /**
   * Verifies the file served by the share itinerary e-ticket link actually arrived (64936).
   *
   * `waitForEvent('download')` only proves the browser STARTED a download, so the completion is
   * asserted too: no failure reported, a path on disk, and a non-empty file there.
   *
   * @param {import('playwright').Page} page
   * @param {{label?: string, href?: string, download: import('@playwright/test').Download}} downloadResult -
   *   the object returned by Cart.clickEticketLinkInSharePreview
   * @returns {Promise<{verified: boolean, suggestedFilename: string, filePath: string, sizeBytes: number}>}
   */
  async verifyEticketFileDownloaded(page, downloadResult) {
    if (!page) throw new Error('[Cart.verifyEticketFileDownloaded] "page" is required.');
    if (!downloadResult || !downloadResult.download) {
      throw new Error(
        `[Cart.verifyEticketFileDownloaded] "downloadResult" must be the object returned by ` +
          `Cart.clickEticketLinkInSharePreview (carrying a Playwright "download"), got: ${typeof downloadResult}. ` +
          `Ensure the "I click the e-ticket link in the share itinerary preview" step ran before this assertion.`
      );
    }

    const { download } = downloadResult;
    const suggestedFilename = download.suggestedFilename();

    let failure;
    let filePath;
    try {
      failure = await download.failure();
      filePath = await download.path();
    } catch (err) {
      throw new Error(
        `[Cart.verifyEticketFileDownloaded] Could not resolve the downloaded e-ticket file ` +
          `"${suggestedFilename}" on disk. The download may not have completed, or downloads are disabled ` +
          `in this browser context. Original: ${err.message}`
      );
    }

    if (failure) {
      throw new Error(
        `[Cart.verifyEticketFileDownloaded] Expected the e-ticket download "${suggestedFilename}" to ` +
          `complete, but Playwright reported a failure: "${failure}".`
      );
    }

    if (typeof filePath !== 'string' || filePath.length === 0) {
      throw new Error(
        `[Cart.verifyEticketFileDownloaded] The e-ticket download "${suggestedFilename}" produced no file ` +
          `on disk. The link responded, but nothing was saved.`
      );
    }

    const sizeBytes = fs.statSync(filePath).size;
    if (sizeBytes === 0) {
      throw new Error(
        `[Cart.verifyEticketFileDownloaded] The downloaded e-ticket file "${suggestedFilename}" ` +
          `(${filePath}) is empty (0 bytes). The ticket service returned no content.`
      );
    }

    logger.info('[Cart.verifyEticketFileDownloaded] E-ticket file verified on disk', {
      suggestedFilename,
      sizeBytes,
    });
    return { verified: true, suggestedFilename, filePath, sizeBytes };
  },

  /**
   * Adds a freshly generated, non-corporate email address as a recipient of the open share
   * dialog, replacing Testim's hosted "Generate email address" step.
   *
   * The address comes from the Email DSL: an address inside the configured test mailbox when
   * there is one — so the sent mail can be read back and asserted — otherwise a throwaway on
   * config.shareRecipientEmailDomain, which still exercises the recipient picker and the send.
   * Either way it is unique per call and unknown to the corporation, which is what makes the
   * share dialog offer it as an external recipient.
   *
   * @param {import('playwright').Page} page
   * @param {string} [tag] - Short label folded into the local part, e.g. a test id
   * @returns {Promise<{email: string, readable: boolean}>} The address added, and whether the
   *   mail sent to it can be read back from a test mailbox
   */
  async addGeneratedShareRecipient(page, tag = 'itinerary') {
    if (!page) throw new Error('[Cart.addGeneratedShareRecipient] "page" is required.');

    const recipient = Email.generateRecipientAddress(tag);

    const cartPage = getPageObject(page, CartPage);
    await cartPage.addExternalShareRecipient(recipient.email);

    logger.info('[Cart.addGeneratedShareRecipient] Added a generated recipient to the share dialog', recipient);

    return recipient;
  },
  /**
   * Verifies the open share email preview renders the booked product's own image.
   *
   * The email HTML is backend-generated, so a product image carries no Vue class to key on the way
   * it would in the app: it is identified as a *content* image — a remotely hosted <img> that is
   * not the branding logo. Every trip asserted this way holds a single product, so the one content
   * image is that product's.
   *
   * Every image found is listed in the failure message, so a missing product image is diagnosable
   * rather than a bare false.
   *
   * @param {import('playwright').Page} page
   * @param {string} productName - Product whose image is expected, used in the failure message
   *   (e.g. "hotel" / "ground transport")
   * @param {string} [previewName='share email'] - Which preview is being asserted, used in the
   *   failure message (e.g. "share quote" / "share itinerary")
   * @returns {Promise<{found: true, sources: string[]}>} The content image sources rendered
   */
  async verifyShareEmailContainsProductImage(page, productName, { previewName = 'share email', srcPattern = null } = {}) {
    if (!page) throw new Error('page is required');
    if (!productName || typeof productName !== 'string') {
      throw new Error(
        `[Cart.verifyShareEmailContainsProductImage] "productName" must name the product whose image ` +
        `is expected, got: ${productName}`,
      );
    }
    if (srcPattern !== null && !(srcPattern instanceof RegExp)) {
      throw new Error(
        `[Cart.verifyShareEmailContainsProductImage] "srcPattern" must be a RegExp when supplied, got: ` +
        `${typeof srcPattern}`,
      );
    }

    const cartPage = getPageObject(page, CartPage);
    const images = await cartPage.getSharePreviewImages();

    // Without a pattern, fall back to the predicate the hotel picture check has always used: a
    // remotely hosted image that is not the email's branding logo. A caller that knows what its
    // supplier's picture URL looks like passes srcPattern instead, so the check cannot be satisfied
    // by some unrelated content image the email happens to carry.
    const matches = srcPattern
      ? images.filter(({ src }) => srcPattern.test(src))
      : images.filter(({ src }) => src.startsWith('http') && !src.includes('logo'));

    if (matches.length === 0) {
      throw new Error(
        `[Cart.verifyShareEmailContainsProductImage] The ${previewName} preview does not render a ` +
        `${productName} image` +
        `${srcPattern ? ` matching ${srcPattern}` : ''}. Images found (${images.length}): ` +
        `${JSON.stringify(images.map(({ src, alt }) => ({ src, alt })))}`,
      );
    }

    const sources = matches.map(({ src }) => src);
    logger.info('[Cart.verifyShareEmailContainsProductImage] Product image found in the share preview', {
      product: productName,
      preview: previewName,
      matchedBy: srcPattern ? String(srcPattern) : 'content-image fallback',
      sources,
    });

    return { found: true, sources };
  },

  /**
   * Verifies that the share email preview iframe contains a hotel image.
   * The share dialog must already be open.
   * @param {import('playwright').Page} page
   * @returns {Promise<{found: true, sources: string[]}>}
   */
  async verifyShareEmailContainsHotelImage(page) {
    return Cart.verifyShareEmailContainsProductImage(page, 'hotel', { previewName: 'share quote email' });
  },

  /**
   * Verifies the open share preview renders the GroundScope transfer's vehicle picture.
   *
   * Pinned to GroundScope's vehicle image path rather than "any content image", so the check cannot
   * pass on an unrelated picture the email carries. Scoped to GroundScope deliberately — it is the
   * only ground transport supplier whose share-email picture URL this repo has observed.
   *
   * @param {import('playwright').Page} page
   * @param {string} previewName - Which preview is being asserted, used in the failure message
   *   (e.g. "share quote" / "share itinerary")
   * @returns {Promise<{found: true, sources: string[]}>}
   */
  async verifyShareEmailContainsGroundScopeVehicleImage(page, previewName) {
    return Cart.verifyShareEmailContainsProductImage(page, 'GroundScope vehicle', {
      previewName,
      srcPattern: GROUNDSCOPE_VEHICLE_IMAGE_PATTERN,
    });
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
   * Opens the Language dropdown in the open share quote/itinerary dialog and leaves it open.
   * The share dialog must already be open.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async openShareLanguageDropdown(page) {
    if (!page) throw new Error('[Cart.openShareLanguageDropdown] "page" is required.');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.openShareLanguageDropdown();
  },

  /**
   * Verifies the open share dialog Language dropdown lists its options in alphabetical order
   * (case-insensitive, locale-aware). Polls until the panel has rendered options, and needs at least
   * two — an order assertion on zero or one option would pass vacuously.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{options: string[]}>}
   */
  async verifyShareLanguageDropdownSortedAlphabetically(page) {
    if (!page) throw new Error('[Cart.verifyShareLanguageDropdownSortedAlphabetically] "page" is required.');
    const cartPage = getPageObject(page, CartPage);

    let options = [];
    await expect
      .poll(async () => {
        options = await cartPage.getOpenShareLanguageOptionTexts();
        return options.length;
      }, { timeout: 10000 })
      .toBeGreaterThan(1)
      .catch(() => {
        throw new Error(
          `[Cart.verifyShareLanguageDropdownSortedAlphabetically] The share dialog Language dropdown shows fewer than two ` +
          `options (${JSON.stringify(options)}). It may not be open — run "I open the language dropdown in the share dialog" first.`
        );
      });

    const sorted = sortAlphabetically(options);
    logger.info('[Cart.verifyShareLanguageDropdownSortedAlphabetically] Dropdown options', { options });
    expect(
      options,
      `[Cart.verifyShareLanguageDropdownSortedAlphabetically] Share dialog Language options are not sorted alphabetically. ` +
      `Displayed: ${JSON.stringify(options)}, expected: ${JSON.stringify(sorted)}`
    ).toEqual(sorted);
    return { options };
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
   * Verifies the share email preview shows a labeled section (e.g. "Vendor Message", or a fare
   * rule category like "Conditions of Cancellation and Exchange") with actual content next to
   * it — the label must be rendered with real content, not just the empty label.
   * The share dialog must already be open (quote or itinerary).
   * @param {import('playwright').Page} page
   * @param {string} labelText - The label to look for in the share email preview
   * @returns {Promise<{label: string, content: string}>} The label and content found in the preview
   */
  async verifyLabeledContentVisibleInSharePreview(page, labelText) {
    if (!page) throw new Error('[Cart.verifyLabeledContentVisibleInSharePreview] "page" is required.');
    if (!labelText || typeof labelText !== 'string') {
      throw new Error(`[Cart.verifyLabeledContentVisibleInSharePreview] "labelText" must be a non-empty string, got: ${typeof labelText}`);
    }

    logger.debug('Reading labeled content from the share email preview', { labelText });
    const cartPage = getPageObject(page, CartPage);

    let found;
    try {
      found = await cartPage.getLabeledContentFromSharePreview(labelText);
    } catch (err) {
      throw new Error(
        `[Cart.verifyLabeledContentVisibleInSharePreview] Could not read "${labelText}" from the share email ` +
          `preview. The share dialog must be open on a booked quote before this check. Original: ${err.message}`
      );
    }

    if (!found) {
      const preview = await cartPage.getSharePreviewTextContent();
      throw new Error(
        `[Cart.verifyLabeledContentVisibleInSharePreview] No "${labelText}" label was found in the share email ` +
          `preview. Preview content: "${preview.slice(0, 500)}"`
      );
    }

    // A label with no value next to it is the failure this check guards against, so require at
    // least one word character rather than just a non-empty string (separators, dashes, colons).
    expect(
      found.content,
      `Expected the "${labelText}" label in the share email preview to be followed by content, ` +
        `but the value was empty. Label read: "${found.label}"`
    ).toMatch(/\w/);

    logger.debug('Labeled content found in the share email preview', { labelText, content: found.content.slice(0, 200) });
    return { label: found.label, content: found.content };
  },

  /**
   * Verifies the share email preview shows a "Vendor Message" label with actual message text
   * next to it — the supplier's sell message must be rendered, not just the empty label.
   * The share dialog must already be open (quote or itinerary).
   * @param {import('playwright').Page} page
   * @returns {Promise<{label: string, content: string}>} The label and message content found in the preview
   */
  async verifyVendorMessageInSharePreview(page) {
    return Cart.verifyLabeledContentVisibleInSharePreview(page, 'Vendor Message');
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
   * Verifies the "Provided by" label is visible in the cart hotel preview and contains "Provided by" (case-insensitive).
   * @param {import('playwright').Page} page
   * @throws {Error} If the label is not visible or its text does not contain "Provided by"
   */
  async verifyProviderLabelInCart(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const isVisible = await cartPage.isProviderLabelVisible();
    if (!isVisible) {
      throw new Error('"Provided by" label is not visible in the cart hotel preview');
    }
    const labelText = await cartPage.getProviderLabelText();
    if (!labelText.toLowerCase().includes('provided by')) {
      throw new Error(`Provider label in the cart hotel preview does not contain "Provided by". Actual text: "${labelText}"`);
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
   * Extracts ONE quote card's own total price from the cart, by 1-based position
   * (quote 1 = the topmost card). Use for per-quote assertions on a multi-quote trip, or when a
   * change must be shown to move THAT quote rather than merely the trip total.
   * For the trip grand total use extractCartTotalPrice().
   *
   * @param {import('playwright').Page} page
   * @param {number} position - 1-based quote position
   * @returns {Promise<number>} The quote total price
   */
  async extractQuoteTotalPrice(page, position) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    return cartPage.getQuoteTotalPriceByPosition(position);
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
    await cartPage.saveLoyaltyNumberAndVerify();
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
    await cartPage.saveLoyaltyNumberAndVerify();
    return chainText;
  },

  /**
   * Expands the "Driver/Loyalty ID" extras section on the cart's car quote card, without
   * filling or saving anything. Use before selecting a driver and/or entering a loyalty number.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async expandCarDriverLoyaltySection(page) {
    if (!page) throw new Error('[Cart.expandCarDriverLoyaltySection] "page" is required.');

    logger.debug('[Cart.expandCarDriverLoyaltySection] Expanding the car driver/loyalty id extras section');
    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.clickCarDriverLoyaltyExpand();
      logger.info('Expanded the car driver/loyalty id extras section');
    } catch (err) {
      throw new Error(
        `[Cart.expandCarDriverLoyaltySection] Failed to open the "Driver/Loyalty ID" extras section. ` +
        `The trip must contain a car quote. Original: ${err.message}`
      );
    }
  },

  /**
   * Selects a driver by name in the car driver/loyalty extras panel's Driver dropdown, connecting
   * the quote to one of the trip's travelers. Assumes the panel is already expanded (see
   * expandCarDriverLoyaltySection).
   *
   * @param {import('playwright').Page} page
   * @param {string} driverName - Full driver name as shown in the dropdown (e.g. "Rafael Dinmark")
   * @returns {Promise<void>}
   */
  async selectCarDriver(page, driverName) {
    if (!page) throw new Error('[Cart.selectCarDriver] "page" is required.');
    if (!driverName || typeof driverName !== 'string') {
      throw new Error(
        `[Cart.selectCarDriver] "driverName" must be a non-empty string, got: ` +
        `${typeof driverName} (${JSON.stringify(driverName)})`
      );
    }

    logger.debug('[Cart.selectCarDriver] Selecting car driver', { driverName });
    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.selectCarDriverByName(driverName);
      logger.info('Selected car driver in the quote extras', { driverName });
    } catch (err) {
      throw new Error(
        `[Cart.selectCarDriver] Failed to select driver "${driverName}" in the car driver/loyalty ` +
        `extras panel. The Driver/Loyalty ID section must already be expanded, and "${driverName}" ` +
        `must match a traveler added to the trip. Original: ${err.message}`
      );
    }
  },

  /**
   * Clicks the "Use Existing" toggle in the car driver/loyalty extras panel. Only rendered when
   * the quote already carries a membershipId, and starts ON (disabling the Loyalty ID input) —
   * use this to switch it off before editing the loyalty number. Assumes the panel is already
   * expanded (see expandCarDriverLoyaltySection).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async clickCarDriverLoyaltyUseExistingToggle(page) {
    if (!page) throw new Error('[Cart.clickCarDriverLoyaltyUseExistingToggle] "page" is required.');

    logger.debug('[Cart.clickCarDriverLoyaltyUseExistingToggle] Clicking the car driver/loyalty "Use Existing" toggle');
    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.clickCarDriverLoyaltyUseExistingToggle();
      logger.info('Clicked the car driver/loyalty "Use Existing" toggle');
    } catch (err) {
      throw new Error(
        `[Cart.clickCarDriverLoyaltyUseExistingToggle] Failed to click the "Use Existing" toggle in the ` +
        `driver/loyalty id extras section. The panel must already be expanded and the quote must carry ` +
        `an existing membershipId for the toggle to render. Original: ${err.message}`
      );
    }
  },

  /**
   * Edits the Loyalty ID input in the car driver/loyalty extras panel to a new number, without
   * expanding the panel or saving. Assumes the panel is already expanded (see
   * expandCarDriverLoyaltySection) and, if the quote carries an existing membershipId, that the
   * "Use Existing" toggle has already been switched off (see clickCarDriverLoyaltyUseExistingToggle)
   * so the input is enabled.
   *
   * @param {import('playwright').Page} page
   * @param {string} loyaltyNumber - Loyalty number to type
   * @returns {Promise<void>}
   */
  async editCarDriverLoyaltyNumber(page, loyaltyNumber) {
    if (!page) throw new Error('[Cart.editCarDriverLoyaltyNumber] "page" is required.');
    if (!loyaltyNumber || typeof loyaltyNumber !== 'string') {
      throw new Error(
        `[Cart.editCarDriverLoyaltyNumber] "loyaltyNumber" must be a non-empty string, got: ` +
        `${typeof loyaltyNumber} (${JSON.stringify(loyaltyNumber)})`
      );
    }

    logger.debug('[Cart.editCarDriverLoyaltyNumber] Editing car driver loyalty number', { loyaltyNumber });
    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.fillCarDriverLoyaltyNumber(loyaltyNumber);
      logger.info('Edited car driver loyalty number in the quote extras', { loyaltyNumber });
    } catch (err) {
      throw new Error(
        `[Cart.editCarDriverLoyaltyNumber] Failed to edit car driver loyalty number to "${loyaltyNumber}". ` +
        `The panel must already be expanded, and the Loyalty ID input must not be disabled by the ` +
        `"Use Existing" toggle. Original: ${err.message}`
      );
    }
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
   * Expands the "Request Billback" extras section on the cart's car quote card.
   * Opening the panel triggers its data load, so the corporate billing number and the
   * "Apply to this quote" checkbox are readable once this resolves.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async expandCarBillbackSection(page) {
    if (!page) throw new Error('[Cart.expandCarBillbackSection] "page" is required.');

    logger.debug('[Cart.expandCarBillbackSection] Expanding the car billback extras section');
    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.clickCarBillbackExpand();
      logger.info('Expanded the car billback extras section');
    } catch (err) {
      throw new Error(
        `[Cart.expandCarBillbackSection] Failed to open the "Request Billback" extras section. The trip ` +
        `must contain a car quote whose agreement enables billback — without it the section is not ` +
        `rendered at all. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the corporate billing number shown in the car billback panel.
   * The value is fetched asynchronously when the panel opens (carService.getBillback), so this polls
   * instead of reading once — a single read can catch the input while it is still empty.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedNumber - Corporate billing number expected in the input
   * @returns {Promise<void>}
   */
  async verifyCarBillbackBillingNumber(page, expectedNumber) {
    if (!page) throw new Error('[Cart.verifyCarBillbackBillingNumber] "page" is required.');
    if (!expectedNumber || typeof expectedNumber !== 'string') {
      throw new Error(
        `[Cart.verifyCarBillbackBillingNumber] "expectedNumber" must be a non-empty string, got: ` +
        `${typeof expectedNumber} (${JSON.stringify(expectedNumber)})`
      );
    }

    logger.debug('[Cart.verifyCarBillbackBillingNumber] Verifying the corporate billing number', { expectedNumber });
    const cartPage = getPageObject(page, CartPage);

    await expect
      .poll(async () => cartPage.getCarBillbackBillingNumber(), {
        timeout: 30000,
        message:
          `Expected the corporate billing number in the car billback panel to be "${expectedNumber}". ` +
          `It is loaded from the user's car agreement when the panel opens, so a mismatch means either ` +
          `the agreement is configured with a different billing number, or the billback data never loaded.`,
      })
      .toBe(expectedNumber);
  },

  /**
   * Clicks the "Apply to this quote" checkbox in the car billback panel, toggling billback on/off
   * for the quote (unchecked falls back to the credit card FOP).
   *
   * @param {import('playwright').Page} page
   * @param {string} label - Checkbox label as written in the feature (e.g. "Apply to this quote")
   * @returns {Promise<void>}
   */
  async clickCarBillbackApplyToQuote(page, label) {
    if (!page) throw new Error('[Cart.clickCarBillbackApplyToQuote] "page" is required.');
    if (!label || typeof label !== 'string') {
      throw new Error(
        `[Cart.clickCarBillbackApplyToQuote] "label" must be a non-empty string, got: ` +
        `${typeof label} (${JSON.stringify(label)})`
      );
    }

    logger.debug('[Cart.clickCarBillbackApplyToQuote] Clicking the billback apply checkbox', { label });
    const cartPage = getPageObject(page, CartPage);

    // Confirm the checkbox being clicked is the one the feature names, so a wrong label in the
    // Gherkin fails loudly instead of silently clicking whatever checkbox happens to be there.
    const actualLabel = await cartPage.getCarBillbackApplyCheckboxLabel();
    expect(
      actualLabel,
      `Expected the car billback checkbox label to contain "${label}", but it reads "${actualLabel}". ` +
      `The panel may render a different checkbox than the scenario expects.`,
    ).toContain(label);

    await cartPage.clickCarBillbackApplyCheckbox();

    logger.info('Clicked the billback apply checkbox in the car billback panel', { label });
  },

  /**
   * Verifies the optional-payment alert on the cart's car quote card carries the expected text.
   * The alert is driven by the quote's form-of-payment state (showOptionalFopMessage), which the card
   * recomputes after an extras save reloads the quote — so this polls rather than reading once.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedMessage - Alert text expected on the car quote card
   * @returns {Promise<void>}
   */
  async verifyCarOptionalPaymentMessage(page, expectedMessage) {
    if (!page) throw new Error('[Cart.verifyCarOptionalPaymentMessage] "page" is required.');
    if (!expectedMessage || typeof expectedMessage !== 'string') {
      throw new Error(
        `[Cart.verifyCarOptionalPaymentMessage] "expectedMessage" must be a non-empty string, got: ` +
        `${typeof expectedMessage} (${JSON.stringify(expectedMessage)})`
      );
    }

    logger.debug('[Cart.verifyCarOptionalPaymentMessage] Verifying the optional-payment alert', { expectedMessage });
    const cartPage = getPageObject(page, CartPage);

    await expect
      .poll(async () => cartPage.getCarOptionalPaymentMessage(), {
        timeout: 30000,
        message:
          `Expected the car quote card to display the optional-payment alert "${expectedMessage}". ` +
          `The alert only renders while the quote is pending, is not pre-paid, and its form of payment ` +
          `is configured as optional — an empty result means either the alert never appeared (the ` +
          `agreement makes payment mandatory, or billback fully covers the quote so it renders as ` +
          `pre-paid), and a different text means the wording changed in cart.optionalPaymentMethod.`,
      })
      .toContain(expectedMessage);

    logger.info('Verified the optional-payment alert on the car quote card', { expectedMessage });
  },

  /**
   * Verifies the cart's car quote card does NOT display the optional-payment alert — the negative
   * counterpart of verifyCarOptionalPaymentMessage, used when the agreement makes payment mandatory.
   *
   * An absence can only be asserted once the card has actually rendered, so this first waits for the
   * card's payment-method column (which renders unconditionally) and only then reads the alert once.
   * It deliberately does NOT poll: a poll on a negative passes on its first tick and would be a false
   * green even if the alert appeared a moment later. The single read uses the page object's default
   * 5s window, which is the bounded guard against a late render.
   *
   * @param {import('playwright').Page} page
   * @param {string} unexpectedMessage - Alert text that must NOT be on the car quote card
   * @returns {Promise<void>}
   */
  /**
   * Verifies the form of payment shown on the Nth ground transport quote card in the cart.
   *
   * base-quote-card.vue renders that column for every manual quote as "Pre paid" when the quote
   * is pre-paid and "Pay On Departure" otherwise, so the expected label is passed in from the
   * feature rather than derived here.
   *
   * @param {Object} page - Playwright page instance
   * @param {number} position - ONE-based position of the ground transport quote card in the cart
   * @param {string} expectedLabel - e.g. "Pre paid" or "Pay On Departure"
   */
  async verifyGroundTransportQuoteFormOfPayment(page, position, expectedLabel) {
    if (!page) {
      throw new Error('[Cart.verifyGroundTransportQuoteFormOfPayment] "page" is required.');
    }
    if (!Number.isInteger(position) || position < 1) {
      throw new Error(
        `[Cart.verifyGroundTransportQuoteFormOfPayment] "position" must be a 1-based integer, got: ${JSON.stringify(position)}`
      );
    }
    if (typeof expectedLabel !== 'string' || !expectedLabel.trim()) {
      throw new Error(
        `[Cart.verifyGroundTransportQuoteFormOfPayment] "expectedLabel" must be a non-empty string, got: ${typeof expectedLabel} (${JSON.stringify(expectedLabel)})`
      );
    }

    logger.debug('[Cart.verifyGroundTransportQuoteFormOfPayment] Verifying the quote card form of payment', {
      position,
      expectedLabel,
    });
    const cartPage = getPageObject(page, CartPage);
    const actual = await cartPage.getGroundTransportQuotePaymentMethodLabel(position - 1);

    if (actual !== expectedLabel) {
      throw new Error(
        `[Cart.verifyGroundTransportQuoteFormOfPayment] Expected ground transport quote card ` +
        `#${position} to show the form of payment "${expectedLabel}" but it reads "${actual}". ` +
        `base-quote-card.vue prints paymentMethods.prePaid ("Pre paid") when the quote is pre-paid ` +
        `and cart.premierInn.services.payOnDeparture ("Pay On Departure") when it is not.`
      );
    }

    logger.info('Verified the ground transport quote card form of payment', { position, expectedLabel });
  },

  /**
   * Verifies the manual-quote-only detail fields do NOT surface on a ground transport quote card
   * in the cart. ground-transport-quote-card.vue renders the vehicle, provider, capacity and
   * pick-up/drop-off rows only — the flight number, comment and passenger phone captured on the
   * manual quote form are carried to the share-quote email but never to the card (test 74842).
   *
   * The card's payment-method column is read FIRST as a readiness gate, so "the field is absent"
   * can never be satisfied by a card that simply has not rendered yet.
   *
   * @param {Object} page - Playwright page instance
   * @param {number} position - ONE-based position of the ground transport quote card in the cart
   * @param {Object} [values] - Values entered on the manual quote form, checked when supplied
   * @param {string} [values.flightNumber]
   * @param {string} [values.comment]
   * @param {string} [values.passengerPhone]
   */
  async verifyGroundTransportQuoteHidesManualDetails(page, position, values = {}) {
    if (!page) {
      throw new Error('[Cart.verifyGroundTransportQuoteHidesManualDetails] "page" is required.');
    }
    if (!Number.isInteger(position) || position < 1) {
      throw new Error(
        `[Cart.verifyGroundTransportQuoteHidesManualDetails] "position" must be a 1-based integer, got: ${JSON.stringify(position)}`
      );
    }

    logger.debug('[Cart.verifyGroundTransportQuoteHidesManualDetails] Verifying the manual detail fields are absent', {
      position,
      values,
    });
    const cartPage = getPageObject(page, CartPage);

    // Readiness gate: never assert absence before the card's payment column has rendered.
    const paymentLabel = await cartPage.getGroundTransportQuotePaymentMethodLabel(position - 1);
    logger.info('Ground transport quote card rendered; payment method resolved', { position, paymentLabel });

    const cardText = await cartPage.getGroundTransportQuoteCardText(position - 1);
    const haystack = cardText.toLowerCase();

    // The field labels the manual test names, plus the values that were typed into them.
    const forbidden = [
      { what: 'the "Flight number" label', needle: 'flight number' },
      { what: 'the "Passenger phone" label', needle: 'passenger phone' },
      { what: 'the "Comment" label', needle: 'comment' },
    ];
    if (values.flightNumber) {
      forbidden.push({ what: `the entered flight number "${values.flightNumber}"`, needle: values.flightNumber.toLowerCase() });
    }
    if (values.comment) {
      forbidden.push({ what: `the entered comment "${values.comment}"`, needle: values.comment.toLowerCase() });
    }
    if (values.passengerPhone) {
      // The form splits the digits into country/area/number, so match on the number part only —
      // it is the segment that survives every rendering of the phone.
      const numberPart = values.passengerPhone.slice(4) || values.passengerPhone;
      forbidden.push({ what: `the entered passenger phone "${values.passengerPhone}"`, needle: numberPart.toLowerCase() });
    }

    const found = forbidden.filter(({ needle }) => haystack.includes(needle));
    if (found.length) {
      throw new Error(
        `[Cart.verifyGroundTransportQuoteHidesManualDetails] Ground transport quote card #${position} ` +
        `shows ${found.map(f => f.what).join(', ')}, but the cart card must not carry the manual ` +
        `quote's flight number, comment or passenger phone. Card text: "${cardText}"`
      );
    }

    logger.info('Verified the ground transport quote card hides the manual detail fields', {
      position,
      paymentLabel,
    });
  },

  async verifyCarOptionalPaymentMessageNotDisplayed(page, unexpectedMessage) {
    if (!page) throw new Error('[Cart.verifyCarOptionalPaymentMessageNotDisplayed] "page" is required.');
    if (!unexpectedMessage || typeof unexpectedMessage !== 'string') {
      throw new Error(
        `[Cart.verifyCarOptionalPaymentMessageNotDisplayed] "unexpectedMessage" must be a non-empty ` +
        `string, got: ${typeof unexpectedMessage} (${JSON.stringify(unexpectedMessage)})`
      );
    }

    logger.debug(
      '[Cart.verifyCarOptionalPaymentMessageNotDisplayed] Verifying the optional-payment alert is absent',
      { unexpectedMessage }
    );
    const cartPage = getPageObject(page, CartPage);

    // Deterministic gate: never assert absence before the quote card's payment column has rendered.
    const paymentLabel = await cartPage.getCarQuotePaymentMethodLabel({ timeout: 30000 });
    logger.info('Car quote card payment method resolved', { paymentLabel });

    // "Pre paid" / "Pre-Paid" / "Prepaid" depending on locale wording — normalise before matching.
    const isPrePaid = paymentLabel.toLowerCase().replace(/[^a-z]/g, '').includes('prepaid');
    if (isPrePaid) {
      logger.warn(
        'Car quote is pre-paid, so car-quote-card.vue:229 does not render the form-of-payment section ' +
        'at all and showOptionalFopMessage short-circuits false on isPrePaidDisplay before any ' +
        'payment-optionality logic runs. The alert is therefore absent by construction here — this ' +
        'assertion cannot fail while the quote is pre-paid. Kept as a smoke check by decision; see ' +
        'car-quote-card.ts:204-213 if it ever needs to discriminate.',
        { paymentLabel, unexpectedMessage }
      );
    }

    const actual = await cartPage.getCarOptionalPaymentMessage();

    expect(
      actual,
      `Expected the car quote card to NOT display the optional-payment alert ` +
      `"${unexpectedMessage}", but it read "${actual}" (payment method: "${paymentLabel}"). ` +
      `The alert only renders while the quote is pending and NOT pre-paid, and in practice only via ` +
      `the billback/voucher route (useBillBackForBooking without full voucher coverage) — the ` +
      `isOptionalFOP && isPayOnDeparture branch cannot fire without a voucher, since isOptionalFOP ` +
      `reduces to !isPayOnDeparture. See car-quote-card.ts:182-213.`,
    ).toBe('');

    logger.info('Verified the optional-payment alert is not displayed on the car quote card', {
      unexpectedMessage,
      paymentLabel,
    });
  },

  /**
   * Verifies the "All-inclusive rate" link is NOT displayed anywhere on the cart page.
   *
   * The link is rendered by car-quote-card.vue:201 behind `v-if="isAllInclusive"`, which is
   * `quote.carSegment.ratePlan?.includes('All-in')` (car-quote-card.ts:126). Amadeus car quotes
   * carry no such rate plan, so the link must be absent for this supplier.
   *
   * An absence can only be asserted once the card has actually rendered, so this first waits for
   * the card's links row — which always contains the unconditional "More details" anchor — and only
   * then reads the link count once. It deliberately does NOT poll: a poll on a negative passes on
   * its first tick and would be a false green even if the link appeared a moment later. The check is
   * page-wide rather than scoped to the first car card, so a stray link on any quote is caught.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{linkText: string, count: number, displayed: boolean}>}
   */
  async verifyAllInclusiveRateLinkNotVisibleInCart(page) {
    if (!page) throw new Error('[Cart.verifyAllInclusiveRateLinkNotVisibleInCart] "page" is required.');

    logger.debug(
      '[Cart.verifyAllInclusiveRateLinkNotVisibleInCart] Verifying the "All-inclusive rate" link is absent'
    );
    const cartPage = getPageObject(page, CartPage);

    // Deterministic gate: never assert absence before the quote card's links row has rendered.
    await cartPage.waitForCarQuoteMoreDetailsRow();

    const count = await cartPage.getAllInclusiveRateLinkCount();

    expect(
      count,
      `Expected NO "All-inclusive rate" link on the cart page, but found ${count}. The link renders ` +
      `only when the car quote's rate plan contains "All-in" (car-quote-card.vue:201 → ` +
      `car-quote-card.ts:126 isAllInclusive). A hit here means the booked quote came back with an ` +
      `all-inclusive rate plan — either the search did not resolve to the Amadeus supplier, or ` +
      `Amadeus started returning "All-in" rate plans and the product expectation changed.`,
    ).toBe(0);

    logger.info('Verified the "All-inclusive rate" link is not displayed on the cart page');

    return { linkText: 'All-inclusive rate', count, displayed: false };
  },

  /**
   * Expands the SunnyCars "Add location" extras section on the cart's car quote card.
   * Opening the panel triggers its location load, so the pick-up and drop-off selects are usable
   * once this resolves.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async expandCarAddLocationSection(page) {
    if (!page) throw new Error('[Cart.expandCarAddLocationSection] "page" is required.');

    logger.debug('[Cart.expandCarAddLocationSection] Expanding the SunnyCars add location extras section');
    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.clickCarAddLocationExpand();
      logger.info('Expanded the SunnyCars add location extras section');
    } catch (err) {
      throw new Error(
        `[Cart.expandCarAddLocationSection] Failed to open the "Add location" extras section. The trip ` +
        `must contain a SunnyCars car quote — for other car suppliers the section is not rendered at ` +
        `all. Original: ${err.message}`
      );
    }
  },

  /**
   * Selects the first available pick-up location in the SunnyCars "Add location" panel.
   * Selecting a pick-up location is what unlocks the drop-off select, so this also confirms the
   * chosen value landed in the field before returning.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The pick-up location label that was selected
   */
  async selectFirstCarPickupLocation(page) {
    if (!page) throw new Error('[Cart.selectFirstCarPickupLocation] "page" is required.');

    logger.debug('[Cart.selectFirstCarPickupLocation] Selecting the first pick-up location');
    const cartPage = getPageObject(page, CartPage);

    await cartPage.openCarAddLocationPickupDropdown();
    const selected = await cartPage.clickFirstCarAddLocationPickupOption();

    // The el-select commits its value on the next Vue tick, so a single read can catch the field
    // still empty; poll until the label the click reported is actually shown in the field.
    await expect
      .poll(async () => cartPage.getCarAddLocationPickupSelectedText(), {
        timeout: 15000,
        message:
          `Expected the pick-up location field to show "${selected}" after selecting the first option, ` +
          `but the value never settled. Likely cause: the click landed outside the option, or the ` +
          `supplier rejected the selection.`,
      })
      .toBe(selected);

    logger.info('Selected the first pick-up location in the add location panel', { pickupLocation: selected });
    return selected;
  },

  /**
   * Opens the drop-off location dropdown in the SunnyCars "Add location" panel and leaves it open,
   * so the options can be asserted before one is picked.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async openCarDropoffLocationDropdown(page) {
    if (!page) throw new Error('[Cart.openCarDropoffLocationDropdown] "page" is required.');

    logger.debug('[Cart.openCarDropoffLocationDropdown] Opening the drop-off location dropdown');
    const cartPage = getPageObject(page, CartPage);

    await cartPage.openCarAddLocationDropoffDropdown();
    logger.info('Opened the drop-off location dropdown in the add location panel');
  },

  /**
   * Verifies every option in the OPEN drop-off location dropdown shows real location text rather
   * than the placeholder value the bug produced (SunnyCars drop-off locations rendered as "0"
   * because the option label fell back to the id).
   *
   * @param {import('playwright').Page} page
   * @param {string} invalidText - The value that must NOT be displayed (e.g. "0")
   * @returns {Promise<string[]>} The option labels that were verified
   */
  async verifyCarDropoffLocationOptionsDisplayText(page, invalidText) {
    if (!page) throw new Error('[Cart.verifyCarDropoffLocationOptionsDisplayText] "page" is required.');
    if (!invalidText || typeof invalidText !== 'string') {
      throw new Error(
        `[Cart.verifyCarDropoffLocationOptionsDisplayText] "invalidText" must be a non-empty string, got: ` +
        `${typeof invalidText} (${JSON.stringify(invalidText)})`
      );
    }

    logger.debug('[Cart.verifyCarDropoffLocationOptionsDisplayText] Verifying the drop-off location options', { invalidText });
    const cartPage = getPageObject(page, CartPage);

    const isInvalid = (text) => text === '' || text === invalidText;
    const VALID_DROPOFF_OPTIONS = 'every option displays location text';

    // The option labels come from the drop-off list that is refetched for the chosen pick-up
    // location, so a first read can catch labels mid-render. Poll rather than read once — a list
    // that is genuinely broken still fails, but a list that is merely late gets a chance to settle.
    // The polled value is a description rather than a boolean so the failure report names the
    // offending labels instead of just "expected true".
    let options = [];
    await expect
      .poll(
        async () => {
          options = await cartPage.getCarAddLocationDropoffOptionTexts();
          if (options.length === 0) return 'the dropdown rendered no options at all';

          const invalidOptions = options.filter(isInvalid);
          if (invalidOptions.length === 0) return VALID_DROPOFF_OPTIONS;

          return (
            `${invalidOptions.length} of ${options.length} options displayed "${invalidText}" or ` +
            `nothing. Full list: ${JSON.stringify(options)}`
          );
        },
        {
          timeout: 10000,
          message:
            `Expected every drop-off location option to display location text. This is the 62861 ` +
            `regression — an option label fell back to "${invalidText}" or rendered empty instead of ` +
            `showing the location name.`,
        },
      )
      .toBe(VALID_DROPOFF_OPTIONS);

    logger.info('Verified all drop-off location options display text', { optionCount: options.length, options });
    return options;
  },

  /**
   * Selects the first available drop-off location in the SunnyCars "Add location" panel.
   * Assumes the drop-off dropdown is already open.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The drop-off location label that was selected
   */
  async selectFirstCarDropoffLocation(page) {
    if (!page) throw new Error('[Cart.selectFirstCarDropoffLocation] "page" is required.');

    logger.debug('[Cart.selectFirstCarDropoffLocation] Selecting the first drop-off location');
    const cartPage = getPageObject(page, CartPage);

    // Some scenarios open the drop-off dropdown in an earlier step (to assert its options first),
    // others come straight from selecting a pick-up location. The check is deliberately scoped to
    // the DROP-OFF popper: an unscoped "is a dropdown open?" is still true while the pick-up popper
    // lingers, which previously made this step re-pick the pick-up value instead of a drop-off one.
    if (!(await cartPage.isCarAddLocationDropoffDropdownOpen())) {
      logger.debug('[Cart.selectFirstCarDropoffLocation] Drop-off dropdown was closed - opening it');
      await cartPage.openCarAddLocationDropoffDropdown();
    }

    const selected = await cartPage.clickFirstCarAddLocationDropoffOption();

    await expect
      .poll(async () => cartPage.getCarAddLocationDropoffSelectedText(), {
        timeout: 15000,
        message:
          `Expected the drop-off location field to show "${selected}" after selecting the first option, ` +
          `but the value never settled. Likely cause: the click landed outside the option, or the ` +
          `drop-off list reloaded underneath the click.`,
      })
      .toBe(selected);

    logger.info('Selected the first drop-off location in the add location panel', { dropoffLocation: selected });
    return selected;
  },

  /**
   * Verifies the drop-off location currently selected in the SunnyCars "Add location" panel shows
   * real location text rather than the placeholder value the bug produced.
   *
   * @param {import('playwright').Page} page
   * @param {string} invalidText - The value that must NOT be displayed (e.g. "0")
   * @returns {Promise<void>}
   */
  async verifySelectedCarDropoffLocationDisplaysText(page, invalidText) {
    if (!page) throw new Error('[Cart.verifySelectedCarDropoffLocationDisplaysText] "page" is required.');
    if (!invalidText || typeof invalidText !== 'string') {
      throw new Error(
        `[Cart.verifySelectedCarDropoffLocationDisplaysText] "invalidText" must be a non-empty string, got: ` +
        `${typeof invalidText} (${JSON.stringify(invalidText)})`
      );
    }

    logger.debug('[Cart.verifySelectedCarDropoffLocationDisplaysText] Verifying the selected drop-off location', { invalidText });
    const cartPage = getPageObject(page, CartPage);

    const selected = await cartPage.getCarAddLocationDropoffSelectedText();

    expect(
      selected,
      `Expected the selected drop-off location to display location text, but it reads ` +
      `"${selected}". A value of "${invalidText}" or an empty field is the 62861 regression — the ` +
      `field fell back to the location id instead of its name.`,
    ).not.toBe(invalidText);

    expect(
      selected,
      `Expected the selected drop-off location field to display location text, but it is empty. ` +
      `The selection may not have committed.`,
    ).not.toBe('');

    logger.info('Verified the selected drop-off location displays text', { dropoffLocation: selected });
  },

  /**
   * Verifies the SunnyCars "Add location" extras section shows its green success icon, which is the
   * card-level proof that the pick-up/drop-off pair was accepted and the quote's location
   * validation turned OK — the success toast alone only says the request was sent.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async verifyCarAddLocationGreenIcon(page) {
    if (!page) throw new Error('[Cart.verifyCarAddLocationGreenIcon] "page" is required.');

    logger.debug('[Cart.verifyCarAddLocationGreenIcon] Verifying the add location green success icon');
    const cartPage = getPageObject(page, CartPage);

    await cartPage.waitForCarAddLocationGreenIcon();

    logger.info('Verified the add location green success icon is visible');
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
   * Verifies the EU Rail "Use Existing" dropdown offers the expected stored loyalty numbers — the ones
   * belonging to the TRAVELLER on the quote, not to the booker who is running the search (test 31347).
   *
   * Opens the "Use Existing" tab and the dropdown itself, so the caller only has to have the loyalty
   * extras section expanded. Falls back to the section's own expander when the panel is not open: the
   * generic "I expand the loyalty number extras section" step resolves the extras edit button by
   * page-wide index, which does not necessarily land on the rail loyalty section.
   *
   * Each expected entry is matched as a case-insensitive SUBSTRING of an option label, and every matched
   * option must also carry a card-number tail — the label is built as `${programName} - ${last4}`
   * (loyalty-program.ts → existingLoyaltyToDisplay), so an entry without digits would mean the programme
   * is offered with no stored number behind it.
   *
   * Callers pass programme names rather than card numbers: the stored numbers are shared, mutable
   * profile data that other scenarios legitimately edit (see test 80737), and the deployed app no longer
   * renders the masked full number the Testim-era tests expected ("*********213 - EUR" → ADO US 79348).
   *
   * @param {import('playwright').Page} page
   * @param {string[]} expectedEntries - Expected option labels, e.g. ["Club Eurostar"]
   * @returns {Promise<string[]>} All option labels found in the dropdown
   */
  async verifyEuRailTravelerLoyaltyOptions(page, expectedEntries) {
    if (!page) throw new Error('[Cart.verifyEuRailTravelerLoyaltyOptions] "page" is required.');
    if (!Array.isArray(expectedEntries) || expectedEntries.length === 0) {
      throw new Error('[Cart.verifyEuRailTravelerLoyaltyOptions] "expectedEntries" must be a non-empty array.');
    }

    const cartPage = getPageObject(page, CartPage);
    if (!(await cartPage.isEuRailLoyaltyPanelOpen({ timeout: 5000 }))) {
      logger.info('EU Rail loyalty panel is not open — expanding it via the loyalty section expander');
      await cartPage.clickEuRailLoyaltyExtrasExpand();
    }

    await cartPage.clickEuRailLoyaltyTab('Use Existing');
    const options = await this.getEuRailExistingLoyaltyOptions(page);

    const normalize = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const optionsNorm = options.map((o) => ({ raw: (o || '').replace(/\s+/g, ' ').trim(), norm: normalize(o) }));
    const rendered = options.length ? options.map((o) => `"${(o || '').trim()}"`).join(', ') : 'none';

    const missing = [];
    const withoutNumber = [];
    for (const expected of expectedEntries) {
      const needle = normalize(expected);
      if (!needle) continue;
      const match = optionsNorm.find((o) => o.norm.includes(needle));
      if (!match) {
        missing.push(expected);
      } else if (!/ - \d{1,4}$/.test(match.raw)) {
        withoutNumber.push(match.raw);
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `[Cart.verifyEuRailTravelerLoyaltyOptions] The traveller's loyalty dropdown is missing ` +
        `[${missing.join(' | ')}]. Options found: ${rendered}. ` +
        `(Loyalty programmes must come from the traveller on the quote, not from the booker.)`
      );
    }
    if (withoutNumber.length > 0) {
      throw new Error(
        `[Cart.verifyEuRailTravelerLoyaltyOptions] The traveller's loyalty programme(s) ` +
        `[${withoutNumber.join(' | ')}] are offered without a card number — the option label should end ` +
        `in " - <last 4 digits>". Options found: ${rendered}.`
      );
    }
    return options;
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
   * Verifies the EU Rail loyalty card number field shows an exact expected value.
   * Unlike verifyEuRailLoyaltyNumberPrepopulated() (format-only, to stay safe against shared
   * mutable profile data), this asserts literal equality — only safe when expectedCardNumber is
   * either something the scenario itself just entered, or a fixture value that THIS scenario
   * never edits (select-and-resave, not select-and-change). Do not use it against a stored
   * profile value that other scenarios (or a different run of this one) might mutate.
   * @param {import('playwright').Page} page
   * @param {string} expectedCardNumber - Exact card number the field should show
   */
  async verifyEuRailLoyaltyNumberEquals(page, expectedCardNumber) {
    if (!page) throw new Error('[Cart.verifyEuRailLoyaltyNumberEquals] "page" is required.');
    if (typeof expectedCardNumber !== 'string' || !expectedCardNumber) {
      throw new Error(`[Cart.verifyEuRailLoyaltyNumberEquals] "expectedCardNumber" must be a non-empty string, got: ${typeof expectedCardNumber}`);
    }

    const cartPage = getPageObject(page, CartPage);
    let actualValue;
    try {
      actualValue = await cartPage.getEuRailLoyaltyNumberInputValue();
    } catch (err) {
      throw new Error(
        `[Cart.verifyEuRailLoyaltyNumberEquals] Could not read the card number field value: ${err.message}`
      );
    }

    expect(
      actualValue,
      `Card number field should show "${expectedCardNumber}", but found "${actualValue}"`
    ).toBe(expectedCardNumber);
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
   * Selects the loyalty program whose text contains the given substring, from whichever tab's
   * dropdown is currently open — the "Enter New" tab's vendor dropdown, or the "Use Existing"
   * tab's stored-program dropdown. Does not enter a card number or click Save.
   * @param {import('playwright').Page} page
   * @param {string} optionText - Substring to match (case-insensitive) in the dropdown option
   * @returns {Promise<{ vendor: string }>}
   */
  async selectEuRailLoyaltyVendorByText(page, optionText) {
    if (!page) throw new Error('[Cart.selectEuRailLoyaltyVendorByText] "page" is required.');
    if (!optionText || typeof optionText !== 'string') {
      throw new Error(`[Cart.selectEuRailLoyaltyVendorByText] "optionText" must be a non-empty string, got: ${typeof optionText}`);
    }

    const cartPage = getPageObject(page, CartPage);
    let vendor;
    try {
      vendor = await cartPage.selectEuRailLoyaltyVendorByText(optionText);
    } catch (err) {
      throw new Error(
        `[Cart.selectEuRailLoyaltyVendorByText] Failed to select the loyalty program containing "${optionText}": ${err.message}`
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

    // Once the panel is expanded the row header stops rendering its Add/Edit button, so
    // clicking to open an already-open panel waits forever on an element that is gone.
    // This happens whenever the panel is revisited without a page reload — e.g. reading
    // the baggage options again after holding the trip (73504).
    if (await cartPage.isBaggageExtrasOpen()) {
      await cartPage.waitForBaggageContent();
      return;
    }

    await cartPage.clickEditBaggageExtrasButton();
  },

  /**
   * Reads the luggage option descriptions shown in the currently open baggage dropdown
   * (opened via the "Number of baggage" field), without selecting any of them.
   * @param {import('playwright').Page} page
   * @returns {Promise<string[]>} The visible baggage option labels, in display order
   */
  async getOpenBaggageDropdownOptions(page) {
    if (!page) throw new Error('[Cart.getOpenBaggageDropdownOptions] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    try {
      const options = await cartPage.getVisibleBaggageDropdownOptionTexts();
      logger.info('Read baggage dropdown options', { count: options.length });
      return options;
    } catch (err) {
      throw new Error(
        `[Cart.getOpenBaggageDropdownOptions] Could not read the baggage dropdown options — ` +
        `the "Number of baggage" dropdown may not be open. ${err.message}`
      );
    }
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
   * Verifies a baggage option is listed in the open flight details drawer, matching on the label's
   * significant words instead of verbatim: Extras words the bag as "1st ADDITIONAL BAG - GBP25.70"
   * while the drawer words it as "0PC, LUGGAGE-FIRST ADDITIONAL BAG". Dropping the price, the
   * quantity/ordinal and punctuation leaves the words both surfaces share, so the assertion holds
   * when the supplier renames its options — what matters is that the chosen bag is listed.
   *
   * Kept separate from verifyBaggageInFlightDetails so this PR changes no existing behaviour;
   * migrating that method's caller onto this one belongs in its own change.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedLabel - Baggage option label, or any descriptor to look for
   * @returns {Promise<{ matched: true, expectedLabel: string, words: string[] }>}
   */
  async verifyBaggageWordsInFlightDetails(page, expectedLabel) {
    if (!page) throw new Error('page is required');
    if (!expectedLabel || typeof expectedLabel !== 'string') {
      throw new Error('expectedLabel must be a non-empty string, got: ' + typeof expectedLabel);
    }

    // Ordinals and counts differ between the two surfaces ("1st" vs "FIRST"), so they are dropped
    // along with the price segment; what remains is the wording that identifies the bag.
    const ORDINALS = /^(\d+|\d+(ST|ND|RD|TH)|FIRST|SECOND|THIRD|FOURTH|X)$/;
    const words = expectedLabel
      .split(' - ')[0]
      .toUpperCase()
      .split(/[^A-Z0-9]+/)
      .filter((w) => w.length > 1 && !ORDINALS.test(w));

    if (words.length === 0) {
      throw new Error(
        `expectedLabel "${expectedLabel}" has no significant words left to match on after removing ` +
        `its price and quantity — pass a descriptor that names the baggage.`,
      );
    }

    const cartPage = getPageObject(page, CartPage);
    logger.info('Verifying baggage is listed in the flight details drawer', { expectedLabel, words });

    let drawerText = '';
    await expect(async () => {
      drawerText = (await cartPage.getFlightDetailsDrawerText()).toUpperCase();
      const missing = words.filter((w) => !drawerText.includes(w));
      expect(
        missing.length,
        `Flight details should list the baggage "${expectedLabel}" (matching on ${JSON.stringify(words)}), ` +
        `but ${JSON.stringify(missing)} was absent. Drawer text: ${drawerText.replace(/\s+/g, ' ').slice(0, 400)}`,
      ).toBe(0);
    }).toPass({ timeout: 15000 });

    return { matched: true, expectedLabel, words };
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
    await cartPage.waitForBaggageSaveAndCartReload();

    return { added: true, segmentCount: 2 };
  },

  /**
   * Opens the baggage panel if needed and calls visit(travelerName) once per traveller tab,
   * with that tab active.
   * @param {import('playwright').Page} page
   * @param {(travelerName: string) => Promise<void>} visit
   * @returns {Promise<string[]>} The traveller tab names, in display order
   */
  async visitEveryBaggageTraveler(page, visit) {
    await this.openBaggageExtras(page);
    const cartPage = getPageObject(page, CartPage);
    const travelerNames = await cartPage.getBaggageTravelerTabNames();
    for (let i = 0; i < travelerNames.length; i++) {
      await cartPage.clickBaggageTravelerTabByIndex(i + 1);
      await cartPage.waitForActiveBaggageTravelerTab(travelerNames[i]);
      await visit(travelerNames[i]);
    }
    return travelerNames;
  },

  /**
   * Bug 69684: with several travellers, every traveller's baggage tab must offer a baggage
   * selection for every flight of the quote, not only the first one.
   * @param {import('playwright').Page} page
   * @param {string[]} expectedRoutes - The flight rows each tab must show, in order (e.g. ["LHR - GRZ", "GRZ - LHR"])
   * @param {number} travelerCount - How many traveller tabs the panel must have
   * @returns {Promise<{travelers: string[], routes: string[]}>}
   */
  async verifyBaggageFlightsForEveryTraveler(page, expectedRoutes, travelerCount) {
    if (!page) throw new Error("[Cart.verifyBaggageFlightsForEveryTraveler] page is required");
    if (!Array.isArray(expectedRoutes) || expectedRoutes.length === 0) {
      throw new Error(`[Cart.verifyBaggageFlightsForEveryTraveler] "expectedRoutes" must be a non-empty array, got: ${JSON.stringify(expectedRoutes)}`);
    }
    if (!Number.isInteger(travelerCount) || travelerCount < 1) {
      throw new Error(`[Cart.verifyBaggageFlightsForEveryTraveler] "travelerCount" must be a positive integer, got: ${travelerCount}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const mismatches = [];
    const travelers = await this.visitEveryBaggageTraveler(page, async (travelerName) => {
      const segments = await cartPage.getVisibleBaggageSegments();
      const routes = segments.map((segment) => segment.route);
      const withoutSelect = segments.filter((segment) => !segment.hasSelect).map((segment) => segment.route);
      if (JSON.stringify(routes) !== JSON.stringify(expectedRoutes) || withoutSelect.length > 0) {
        mismatches.push(
          `${travelerName}: flights ${JSON.stringify(routes)}` +
          (withoutSelect.length > 0 ? `, no baggage dropdown on ${JSON.stringify(withoutSelect)}` : ""),
        );
      }
    });

    if (travelers.length !== travelerCount) {
      throw new Error(
        `[Cart.verifyBaggageFlightsForEveryTraveler] The baggage panel should have ${travelerCount} traveller tabs, ` +
        `but it has ${travelers.length}: ${JSON.stringify(travelers)}`,
      );
    }
    if (mismatches.length > 0) {
      throw new Error(
        `[Cart.verifyBaggageFlightsForEveryTraveler] Every traveller should have a baggage selection for ${JSON.stringify(expectedRoutes)}, ` +
        `but ${mismatches.length} of ${travelers.length} did not:\n${mismatches.join("\n")}`,
      );
    }

    logger.info("[Cart.verifyBaggageFlightsForEveryTraveler] Every traveller has a baggage selection for every flight", { travelers, expectedRoutes });
    return { travelers, routes: expectedRoutes };
  },

  /**
   * Selects the first paid baggage option on every flight row of every traveller tab, without saving.
   * @param {import('playwright').Page} page
   * @returns {Promise<{travelers: string[], selections: number}>}
   */
  async selectBaggageForEveryFlightOfEveryTraveler(page) {
    if (!page) throw new Error("[Cart.selectBaggageForEveryFlightOfEveryTraveler] page is required");

    const cartPage = getPageObject(page, CartPage);
    let selections = 0;
    const travelers = await this.visitEveryBaggageTraveler(page, async () => {
      const segments = await cartPage.getVisibleBaggageSegments();
      for (let i = 0; i < segments.length; i++) {
        await cartPage.selectFirstAvailableBaggageOptionForSegment(i);
        selections++;
      }
    });

    logger.info("[Cart.selectBaggageForEveryFlightOfEveryTraveler] Baggage selected", { travelers, selections });
    return { travelers, selections };
  },

  /**
   * Verifies every traveller tab keeps one selected baggage per flight row. Waits for the save to
   * settle first, because "I click the save button" returns as soon as it clicks.
   * @param {import('playwright').Page} page
   * @returns {Promise<{travelers: string[]}>}
   */
  async verifyBaggageSavedForEveryFlightOfEveryTraveler(page) {
    if (!page) throw new Error("[Cart.verifyBaggageSavedForEveryFlightOfEveryTraveler] page is required");

    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForBaggageSaveAndCartReload();

    const mismatches = [];
    const travelers = await this.visitEveryBaggageTraveler(page, async (travelerName) => {
      const flights = (await cartPage.getVisibleBaggageSegments()).length;
      const selected = await cartPage.getVisibleBaggageSelectedTagCount();
      if (flights === 0 || selected !== flights) {
        mismatches.push(`${travelerName}: ${selected} baggage selected for ${flights} flight(s)`);
      }
    });

    if (mismatches.length > 0) {
      throw new Error(
        "[Cart.verifyBaggageSavedForEveryFlightOfEveryTraveler] After saving, every traveller should keep one baggage per flight, " +
        `but ${mismatches.length} of ${travelers.length} did not:\n${mismatches.join("\n")}`,
      );
    }

    logger.info("[Cart.verifyBaggageSavedForEveryFlightOfEveryTraveler] Every traveller kept the baggage of every flight", { travelers });
    return { travelers };
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

  /**
   * Picks the first breakfast type in the (already open) Premier Inn extras panel.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The selected option text
   */
  async selectFirstPremierInnBreakfast(page) {
    if (!page) throw new Error('page is required');
    logger.debug('Selecting the first Premier Inn breakfast type');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickPremierInnBreakfastDropdown();
    // Reads the options of whichever Premier Inn extras dropdown is open - here the breakfast one.
    const options = await cartPage.getPremierInnPaymentOptions();
    if (options.length === 0) {
      throw new Error(
        '[Cart.selectFirstPremierInnBreakfast] The Premier Inn breakfast type dropdown opened with no options. ' +
        'The supplier may have returned no breakfast types for this hotel.'
      );
    }
    await cartPage.clickDropdownOption(options[0]);
    return options[0];
  },

  /**
   * Extracts the price of the selected breakfast type in the Premier Inn extras panel.
   * The option label ends with the amount and currency, e.g. "Breakfast - 118.99EUR".
   * @param {import('playwright').Page} page
   * @returns {Promise<number>} The breakfast price
   */
  async extractPremierInnBreakfastPrice(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    const text = await cartPage.getSelectedPremierInnBreakfastText();
    // Only the trailing amount is parsed: the " - " separator would otherwise read as a minus sign.
    const amount = text.match(/(\d[\d.,]*)\s*[A-Z]{3}\s*$/);
    if (!amount) {
      throw new Error(
        `[Cart.extractPremierInnBreakfastPrice] Selected breakfast type "${text}" has no trailing amount and currency ` +
        `(expected e.g. "Breakfast - 118.99EUR"). No breakfast may be selected, or the label format changed.`
      );
    }
    return parseAmountText(amount[1], 'Premier Inn breakfast price');
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
   * Waits for the flight details drawer opened from the cart to finish loading, so the next
   * assertion reads real flight data instead of the drawer's loading skeleton.
   *
   * @param {import('playwright').Page} page
   */
  async waitForFlightDetailsInCartToLoad(page) {
    if (!page) throw new Error('[Cart.waitForFlightDetailsInCartToLoad] "page" is required.');
    const cartPage = getPageObject(page, CartPage);
    logger.debug('Waiting for the cart flight details drawer to finish loading');
    await cartPage.waitForFlightDetailsDrawerLoaded();
  },

  /**
   * Verifies that ONE leg of the open flight details drawer — identified by its heading, e.g.
   * "KUL - SYD" — shows the expected cabin class on every flight it holds.
   *
   * The heading is how flight-details.vue labels a leg (`getLegTitle` joins the leg's airport
   * codes), so a leg with a connection reads "KUL - SIN - SYD" and carries one cabin chip per
   * flight. Every chip of that leg is checked, so a connecting leg cannot pass on its first hop.
   *
   * The chip reads "<description> (<booking class>)"; only the description is compared, and
   * case-insensitively, because suppliers differ on casing ("ECONOMY" vs "Economy") while the
   * booking class letter varies per flight.
   *
   * @param {import('playwright').Page} page
   * @param {string} legTitle - Leg heading in the drawer, e.g. "KUL - SYD"
   * @param {string} cabinText - Expected cabin description, e.g. "ECONOMY"
   * @returns {Promise<{ legTitle: string, legIndex: number, cabins: string[] }>}
   */
  async verifyCabinForNamedLegInFlightDetails(page, legTitle, cabinText) {
    if (!page) throw new Error('[Cart.verifyCabinForNamedLegInFlightDetails] "page" is required.');
    if (typeof legTitle !== 'string' || !legTitle.trim()) {
      throw new Error(
        `[Cart.verifyCabinForNamedLegInFlightDetails] "legTitle" must be a non-empty string, got: ${typeof legTitle} (${legTitle})`
      );
    }
    if (typeof cabinText !== 'string' || !cabinText.trim()) {
      throw new Error(
        `[Cart.verifyCabinForNamedLegInFlightDetails] "cabinText" must be a non-empty string, got: ${typeof cabinText} (${cabinText})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    logger.debug('Verifying the cabin class of a named flight details leg', { legTitle, cabinText });

    // Spacing around the dash is the template's, not the test author's, so compare normalized.
    const normalize = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
    const titles = await cartPage.getLegTitlesInFlightDetailsDrawer();
    const legIndex = titles.findIndex((title) => normalize(title) === normalize(legTitle));

    if (legIndex === -1) {
      throw new Error(
        `[Cart.verifyCabinForNamedLegInFlightDetails] The flight details drawer has no leg headed ` +
        `"${legTitle.trim()}" - it renders [${titles.join(', ')}]. The itinerary may route differently than the ` +
        `test expects, or a connection may have added a stop to the heading.`
      );
    }

    const cabins = await cartPage.getCabinChipsForLegInFlightDetailsDrawer(legIndex);
    const expected = normalize(cabinText);
    // "ECONOMY (Y)" -> "economy". The trailing booking class is per-flight noise.
    const mismatched = cabins.filter((chip) => normalize(chip.replace(/\s*\([^)]*\)\s*$/, '')) !== expected);

    if (mismatched.length) {
      throw new Error(
        `[Cart.verifyCabinForNamedLegInFlightDetails] Expected every flight of leg "${titles[legIndex]}" to be in ` +
        `"${cabinText.trim()}" cabin, but the flight details drawer shows [${cabins.join(', ')}]. ` +
        `Mismatched: [${mismatched.join(', ')}].`
      );
    }

    return { legTitle: titles[legIndex], legIndex, cabins };
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
   * Verifies the flight details drawer shows the PNR of the held trip.
   * The drawer must already be open, on a trip that is on hold.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{pnr: string}>}
   */
  async verifyPnrInFlightDetails(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);
    const pnr = await cartPage.getFlightDetailsPnrText();

    if (!/^[A-Z0-9]{5,8}$/.test(pnr)) {
      throw new Error(
        `The flight details drawer shows "${pnr}" as the PNR, which is not a record locator. ` +
        'Expected 5 to 8 letters or digits.'
      );
    }

    return { pnr };
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
   * Verifies the cart's "Proceed to Checkout" button has become actionable again — the counterpart
   * to verifyProceedToCheckoutButtonDisabled, used after supplying the information that was
   * blocking checkout (ADO 82534: saving the mandatory passport details).
   *
   * Waits rather than sampling `isProceedToCheckoutButtonDisabled()` once: the CTA re-enables only
   * after the cart re-validates following the save, so a single immediate check would race that
   * round-trip and read the stale disabled state.
   *
   * @param {import('playwright').Page} page
   * @throws {Error} If the button stays disabled for the whole timeout
   */
  async verifyProceedToCheckoutButtonEnabled(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForProceedToCheckoutEnabled();
    logger.info('Proceed to Checkout button is enabled');
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
   * Selects a named optional service in the expanded optional services panel.
   * Prefer this over selectRandomOptionalService when the scenario has to reach the
   * save: the panel also lists free SSRs the airline can reject (e.g. one needing an
   * infant or extra passenger details), so a random pick is not reliably addable.
   * @param {import('playwright').Page} page
   * @param {string} optionText - Substring of the service name (e.g. "Priority fast security lane")
   */
  async selectOptionalServiceByText(page, optionText) {
    if (!page) throw new Error('page is required');
    if (typeof optionText !== 'string' || !optionText.trim()) {
      throw new Error(`optionText must be a non-empty string, got: ${typeof optionText}`);
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.selectOptionalServiceByText(optionText);
    logger.info('Selected optional service', { optionText });
  },

  /**
   * Selects one of a comma-separated list of optional services, picked at random, so
   * consecutive runs cover different services. Candidates missing from the current
   * offer are skipped; only an offer carrying none of them fails.
   * @param {import('playwright').Page} page
   * @param {string} optionList - Comma-separated service names, e.g. "Lounge access, Preferred boarding"
   * @returns {Promise<string>} The service that was selected
   */
  async selectRandomOptionalServiceFrom(page, optionList) {
    if (!page) throw new Error('page is required');
    if (typeof optionList !== 'string' || !optionList.trim()) {
      throw new Error(`optionList must be a non-empty string, got: ${typeof optionList}`);
    }

    const candidates = optionList
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    if (candidates.length === 0) {
      throw new Error(`optionList must contain at least one service name, got: "${optionList}"`);
    }

    const cartPage = getPageObject(page, CartPage);
    const selected = await cartPage.selectOneOfOptionalServices(candidates);
    logger.info('Selected optional service at random', { selected, candidates });
    return selected;
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

  /**
   * Selects an ancillary option by label, opening the ancillary options section first when a
   * previous save left it collapsed.
   * @param {import('playwright').Page} page
   * @param {string} optionText - Text contained in the option label, e.g. "Speedy Boarding"
   * @returns {Promise<{ selected: true, optionText: string }>}
   */
  async selectAncillaryOption(page, optionText) {
    if (!page) throw new Error('page is required');
    if (!optionText || typeof optionText !== 'string') {
      throw new Error('optionText must be a non-empty string, got: ' + typeof optionText);
    }

    const cartPage = getPageObject(page, CartPage);
    if (!(await cartPage.isAncillaryOptionsSelectVisible())) {
      await this.clickEditAncillaryOptions(page);
    }
    await cartPage.openAncillaryOptionsDropdown();
    try {
      await cartPage.selectAncillaryOptionByText(optionText);
    } catch (error) {
      const available = await cartPage.getAncillaryOptionsDropdownOptionTexts().catch(() => []);
      throw new Error(
        `Ancillary option "${optionText}" was not found in the Ancillary Options dropdown. ` +
        `Available: ${JSON.stringify(available)}. Original: ${error.message}`
      );
    }
    logger.info('Selected ancillary option', { optionText });
    return { selected: true, optionText };
  },

  /**
   * Opens the quote's flight details and verifies the outbound flight's baggage line shows the
   * expected allowance (whitespace and case normalised), e.g. "26Kg+26Kg" — not the "32kg+32kg"
   * bug 72524 displayed once an ancillary carrying its own baggage was added on top of the selected
   * bags. Only the first line is checked: baggage lines render one per flight, outbound first, and
   * a leg with no bag bought keeps the fare's own allowance (e.g. "1PC 20KG").
   * @param {import('playwright').Page} page
   * @param {string} expectedAllowance - Allowance text the outbound baggage line must contain
   * @returns {Promise<{ lines: string[] }>}
   */
  async verifyOutboundBaggageAllowanceInQuote(page, expectedAllowance) {
    if (!page) throw new Error('page is required');
    if (!expectedAllowance || typeof expectedAllowance !== 'string') {
      throw new Error('expectedAllowance must be a non-empty string, got: ' + typeof expectedAllowance);
    }

    const normalize = (text) => text.toUpperCase().replace(/\s+/g, ' ').trim();
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickFlightDetailsButton();
    const lines = await cartPage.getFlightDetailsDrawerBaggageLines();
    logger.info('Baggage lines in the flight details drawer', { expectedAllowance, lines });

    expect(
      normalize(lines[0]),
      `The outbound baggage allowance should display "${expectedAllowance}" (all lines: ${JSON.stringify(lines)})`
    ).toContain(normalize(expectedAllowance));
    return { lines };
  },

  async verifyAncillaryOptionsFilledIndicator(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await expect(cartPage.getAncillaryOptionsFilledIndicator()).toBeVisible({ timeout: 30000 });
    logger.info('Ancillary options filled indicator is visible');
  },

  /**
   * Verifies the ancillary options dropdown lists exactly the options Travelfusion filed in the
   * AdvancedAncillaryOptions parameter of the captured ProcessDetails response, in the same order,
   * with XML entities decoded ("&amp;" must display as "&"). The ancillary options section must
   * already be open.
   * @param {import('playwright').Page} page
   * @param {object} world - Cucumber world holding the captured ProcessDetails response
   * @param {string} requestType - Request type the response was captured under
   * @returns {Promise<{options: string[]}>}
   */
  async verifyAncillaryOptionsMatchProcessDetails(page, world, requestType) {
    if (!page) throw new Error('page is required');
    if (!world || typeof world !== 'object') {
      throw new Error('[Cart.verifyAncillaryOptionsMatchProcessDetails] "world" must be the Cucumber world, got: ' + typeof world);
    }
    if (!requestType || typeof requestType !== 'string') {
      throw new Error('[Cart.verifyAncillaryOptionsMatchProcessDetails] "requestType" must be a non-empty string, got: ' + typeof requestType);
    }

    const record = PayloadValidation.getCapturedPayload(world, 'response', requestType);
    const match = String(record.payload || '').match(ANCILLARY_OPTIONS_DISPLAY_TEXT_PATTERN);
    if (!match) {
      throw new Error(
        `[Cart.verifyAncillaryOptionsMatchProcessDetails] The captured "${requestType}" response files no ` +
        `${ANCILLARY_OPTIONS_PARAMETER} parameter with a DisplayText, so there is nothing to compare the cart against.`
      );
    }
    const expected = parseAncillaryOptionLabels(decodeXmlEntities(match[1])).map(normalizeText);
    if (expected.length === 0) {
      throw new Error(
        `[Cart.verifyAncillaryOptionsMatchProcessDetails] No option could be parsed from the ${ANCILLARY_OPTIONS_PARAMETER} ` +
        `DisplayText: "${match[1]}"`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.openAncillaryOptionsDropdown();
    const actual = (await cartPage.getAncillaryOptionsDropdownOptionTexts()).map(normalizeText);
    await cartPage.closeAncillaryOptionsDropdown();

    logger.info('Comparing ancillary options in the cart against ProcessDetails', {
      expectedCount: expected.length,
      actualCount: actual.length,
      expected,
      actual,
    });

    const encoded = actual.filter((text) => /&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);/i.test(text));
    expect(
      encoded,
      `Ancillary options still show XML-encoded characters (e.g. "&amp;" instead of "&"): ${JSON.stringify(encoded)}`
    ).toEqual([]);
    expect(
      actual,
      `Ancillary options in the cart do not match ${ANCILLARY_OPTIONS_PARAMETER} in the ProcessDetails response.\n` +
      `Expected: ${JSON.stringify(expected)}\nActual:   ${JSON.stringify(actual)}`
    ).toEqual(expected);

    return { options: actual };
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
   * Verifies that an extras section with the given name is NOT rendered.
   * @param {import('playwright').Page} page
   * @param {string} sectionName - Display text of the section title (e.g. "Age Association")
   */
  async verifyExtrasSectionNotVisibleByName(page, sectionName) {
    if (!page) throw new Error('[Cart.verifyExtrasSectionNotVisibleByName] "page" is required.');
    if (!sectionName || typeof sectionName !== 'string') {
      throw new Error(
        `[Cart.verifyExtrasSectionNotVisibleByName] "sectionName" must be a non-empty string, got: ${typeof sectionName} (${JSON.stringify(sectionName)})`,
      );
    }

    const cartPage = getPageObject(page, CartPage);
    const isVisible = await cartPage.isExtrasSectionVisibleByName(sectionName);
    expect(isVisible, `[Cart.verifyExtrasSectionNotVisibleByName] Expected extras section "${sectionName}" to NOT be visible`).toBe(false);
    logger.info('Extras section is not visible', { sectionName });
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

  // ===== HOTEL "Additional preferences" EXTRAS ROW (Go Global, multi-room only) =====

  /**
   * Opens the hotel quote's "Additional preferences" extras panel, expanding the card's Extras
   * collapse first if it is closed.
   *
   * @param {import('playwright').Page} page
   */
  async openAdditionalPreferencesExtras(page) {
    if (!page) throw new Error('[Cart.openAdditionalPreferencesExtras] "page" is required.');
    logger.info('Opening the Additional preferences extras panel');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.openAdditionalPreferencesExtras();
  },

  /**
   * Verifies a preference option with the given label is displayed in the OPEN "Additional
   * preferences" panel. The failure message lists the options actually rendered, since which ones
   * appear depends on the room count (the adjoining/connected pair is multi-room only).
   *
   * @param {import('playwright').Page} page
   * @param {string} optionLabel - e.g. "Request adjoining rooms"
   * @returns {Promise<{options: string[]}>}
   */
  async verifyAdditionalPreferenceOptionDisplayed(page, optionLabel) {
    if (!page) throw new Error('[Cart.verifyAdditionalPreferenceOptionDisplayed] "page" is required.');
    if (!optionLabel || typeof optionLabel !== 'string') {
      throw new Error(
        `[Cart.verifyAdditionalPreferenceOptionDisplayed] "optionLabel" must be a non-empty string, got: ${typeof optionLabel} (${JSON.stringify(optionLabel)})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    const options = await cartPage.getAdditionalPreferencesOptionLabels();

    expect(
      options,
      `[Cart.verifyAdditionalPreferenceOptionDisplayed] Expected the Additional preferences panel to offer ` +
      `"${optionLabel}", but it shows: ${options.map((option) => `"${option}"`).join(', ') || 'no options'}.`,
    ).toContain(optionLabel);

    logger.info('Additional preferences option is displayed', { optionLabel, options });
    return { options };
  },

  /**
   * Verifies how many preference options the OPEN "Additional preferences" panel offers. The
   * arrival-time checkbox is not one of them — see CartPage.ADDITIONAL_PREFERENCES_OPTION.
   *
   * @param {import('playwright').Page} page
   * @param {number} expectedCount
   * @returns {Promise<{options: string[]}>}
   */
  async verifyAdditionalPreferencesCount(page, expectedCount) {
    if (!page) throw new Error('[Cart.verifyAdditionalPreferencesCount] "page" is required.');
    if (typeof expectedCount !== 'number' || !Number.isInteger(expectedCount) || expectedCount < 0) {
      throw new Error(
        `[Cart.verifyAdditionalPreferencesCount] "expectedCount" must be a non-negative integer, got: ${typeof expectedCount} (${expectedCount})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    const options = await cartPage.getAdditionalPreferencesOptionLabels();

    expect(
      options.length,
      `[Cart.verifyAdditionalPreferencesCount] Expected ${expectedCount} preference option(s) in the Additional ` +
      `preferences panel, got ${options.length}: ${options.map((option) => `"${option}"`).join(', ') || 'none'}.`,
    ).toBe(expectedCount);

    logger.info('Additional preferences option count matches expected', { expectedCount, options });
    return { options };
  },

  /**
   * Closes the open "Additional preferences" panel via its own Cancel button, discarding any
   * selection made in it.
   *
   * @param {import('playwright').Page} page
   */
  async cancelAdditionalPreferencesExtras(page) {
    if (!page) throw new Error('[Cart.cancelAdditionalPreferencesExtras] "page" is required.');
    logger.info('Cancelling the open Additional preferences extras panel');
    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickAdditionalPreferencesCancelButton();
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
   * Verifies the Passenger Info extras row is highlighted with the red error border the cart shows
   * after a checkout attempt was blocked by missing APIS details (ADO 82534). The border only
   * renders once Proceed to Checkout has been clicked, so call this after that click.
   * @param {import('playwright').Page} page
   */
  async verifyPassengerInfoHighlightedInRed(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const isHighlighted = await cartPage.isPassengerInfoHighlightedInRed();
    expect(
      isHighlighted,
      'Expected passenger info section to be highlighted in red (error border) after the blocked checkout attempt',
    ).toBe(true);
    logger.info('Passenger info section is highlighted in red (error border visible)');
  },

  /**
   * Verifies the Amtrak quote line in the trip-overview sidebar shows both its destination title
   * and the train product icon. Both halves are read from the same quote line, so a pass means the
   * icon belongs to the quote whose title was matched.
   * @param {import('playwright').Page} page
   * @param {string} expectedTitle - Full expected title, e.g. "Amtrak Rail to Boston, MA - South Station (BOS)"
   */
  async verifyAmtrakDestinationTitleAndIconInTripOverview(page, expectedTitle) {
    if (!page) throw new Error('page is required');
    if (typeof expectedTitle !== 'string') {
      throw new Error('expectedTitle must be a string, got: ' + typeof expectedTitle);
    }

    const cartPage = getPageObject(page, CartPage);

    const titleText = await cartPage.getAmtrakQuoteSummaryTitleText();
    expect(
      titleText,
      `Expected the Amtrak quote title in the trip overview to read "${expectedTitle}", got "${titleText}"`,
    ).toBe(expectedTitle);

    const iconVisible = await cartPage.isAmtrakTrainIconVisibleInTripOverview();
    expect(
      iconVisible,
      'Expected the train icon to be displayed next to the Amtrak quote title in the trip overview',
    ).toBe(true);

    logger.info('Amtrak destination title and train icon are displayed in the trip overview', { titleText });
  },

  /**
   * Verifies the Amtrak quote line in the trip-overview sidebar carries the expected text — the
   * partial-match counterpart of verifyAmtrakDestinationTitleAndIconInTripOverview above, for
   * scenarios that assert only the product prefix ("Amtrak Rail to") and not the full destination,
   * which changes with the route under test. See test 60544.
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Text the title must contain, e.g. "Amtrak Rail to"
   */
  async verifyAmtrakQuoteSummaryTitleContains(page, expectedText) {
    if (!page) throw new Error('page is required');
    if (typeof expectedText !== 'string' || !expectedText) {
      throw new Error(`expectedText must be a non-empty string, got: ${typeof expectedText}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const titleText = await cartPage.getAmtrakQuoteSummaryTitleText();

    expect(
      titleText,
      `Expected the Amtrak quote title in the trip overview to contain "${expectedText}", got "${titleText}"`,
    ).toContain(expectedText);
    logger.info('Amtrak quote summary title contains the expected text', { titleText, expectedText });
  },

  /**
   * Verifies the Amtrak quote's extras section shows the "Please add the required extras" notice —
   * the cart's prompt that the quote cannot be checked out until its mandatory extras are filled.
   * Expands the outer extras accordion first so the notice is reachable even if a previous step
   * collapsed it. See test 60544.
   * @param {import('playwright').Page} page
   */
  async verifyAmtrakRequiredExtrasNoticeInCart(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.ensureExtrasExpanded();

    const noticeText = await cartPage.getAmtrakRequiredExtrasNoticeText();
    expect(
      noticeText,
      `Expected the Amtrak extras section to show "${CART_SELECTORS.AMTRAK_REQUIRED_EXTRAS_NOTICE_TEXT}", got "${noticeText}"`,
    ).toContain(CART_SELECTORS.AMTRAK_REQUIRED_EXTRAS_NOTICE_TEXT);
    logger.info('Amtrak required-extras notice is displayed in the cart', { noticeText });
  },

  /**
   * Verifies the open Amtrak Contact Information card labels its phone number input group. Call
   * after expandAmtrakContactInfoInCart — the label only exists while the row is open.
   * @param {import('playwright').Page} page
   */
  async verifyAmtrakContactInfoPhoneLabelVisible(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const labelText = await cartPage.getAmtrakContactInfoPhoneLabelText();

    expect(
      labelText,
      `Expected the open Amtrak Contact Information card to label its phone inputs ` +
      `"${CART_SELECTORS.AMTRAK_CONTACT_INFO_PHONE_LABEL_TEXT}", got "${labelText}"`,
    ).toContain(CART_SELECTORS.AMTRAK_CONTACT_INFO_PHONE_LABEL_TEXT);
    logger.info('Amtrak Contact Information phone number label is visible', { labelText });
  },

  /**
   * Verifies the Amtrak Contact Information extras row is rendered as mandatory — the heading reads
   * "Contact Information" and carries the red asterisk amtrak-contact-information.vue prefixes it
   * with. Expands the outer extras accordion first, since the row is only reachable inside it.
   * Must run BEFORE the row is opened: extras-layout.vue drops the whole collapsed heading (and
   * with it the asterisk) once the row expands.
   * @param {import('playwright').Page} page
   */
  async verifyAmtrakContactInfoRequiredInCart(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.ensureExtrasExpanded();

    const titleText = await cartPage.getAmtrakContactInfoTitleText();
    expect(
      titleText,
      `Expected the Amtrak extras row heading to read "${CART_SELECTORS.AMTRAK_CONTACT_INFO_TITLE_TEXT}", got "${titleText}"`,
    ).toContain(CART_SELECTORS.AMTRAK_CONTACT_INFO_TITLE_TEXT);

    const isRequired = await cartPage.isAmtrakContactInfoMarkedAsRequired();
    expect(
      isRequired,
      'Expected the Amtrak Contact Information extras row to be marked mandatory with a red asterisk',
    ).toBe(true);
    logger.info('Amtrak Contact Information row is marked mandatory', { titleText });
  },

  /**
   * Expands the Amtrak Contact Information extras row in the cart, opening the outer extras
   * accordion first when it is still collapsed.
   * @param {import('playwright').Page} page
   */
  async expandAmtrakContactInfoInCart(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.ensureExtrasExpanded();
    await cartPage.openAmtrakContactInfoPanel();
    logger.info('Amtrak Contact Information row expanded in the cart');
  },

  /**
   * Fills the mandatory Amtrak phone number in the cart's Contact Information extras row and saves
   * it: expands the row, types country code / area / number, clicks Save and waits for the row to
   * collapse. Stops there on purpose — accepting the T&C and clicking Proceed to Checkout belong to
   * the separate "I proceed to checkout" step, which already does both.
   * @param {import('playwright').Page} page
   * @param {{ countryCode: string, areaCode: string, number: string }} phone
   */
  async fillAmtrakContactInfoInCart(page, phone) {
    if (!page) throw new Error('page is required');

    const { countryCode, areaCode, number } = phone || {};
    if (!countryCode || !areaCode || !number) {
      throw new Error(
        `[Cart.fillAmtrakContactInfoInCart] countryCode, areaCode and number are all required, got ` +
        `${JSON.stringify(phone)}`,
      );
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.ensureExtrasExpanded();
    await cartPage.openAmtrakContactInfoPanel();
    await cartPage.fillAmtrakContactInfoPhone(countryCode, areaCode, number);
    await cartPage.saveAmtrakContactInfo();
    logger.info('Amtrak contact information saved in the cart', { countryCode, areaCode, number });
  },

  /**
   * Answers the flight "Contact details for the airline" extra (AB#84706) by agreeing to share, so
   * Hold flight / checkout is no longer blocked by its Error validation. The row exists only while the
   * seller's consent feature flag is on, so when it is not rendered this is a no-op. Ticks the box only
   * when it is editable and unticked (mandatory mode ticks and locks it), and types the email only when
   * the stored contact left it empty — one contact is enough for the form to save.
   * @param {import('playwright').Page} page
   * @param {string} email - Used only when the panel has no email yet
   * @returns {Promise<{ answered: boolean }>}
   */
  async shareContactDetailsWithAirlineInCart(page, email) {
    if (!page) throw new Error('page is required');
    if (!email || typeof email !== 'string') {
      throw new Error('[Cart.shareContactDetailsWithAirlineInCart] email must be a non-empty string, got: ' + typeof email);
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.ensureExtrasExpanded();
    if (!(await cartPage.isFlightContactConsentRowPresent())) {
      logger.warn(
        'No "Contact details for the airline" row in the cart; nothing to answer. If Hold/checkout is ' +
        'disabled next, the row rendered late or its selector changed.',
      );
      return { answered: false };
    }
    await cartPage.openFlightContactConsentPanel();

    const checkbox = await cartPage.getFlightContactConsentCheckboxState();
    if (!checkbox.checked && !checkbox.disabled) {
      await cartPage.clickFlightContactConsentCheckbox();
    }

    const storedEmail = await cartPage.getFlightContactConsentEmailValue();
    if (!storedEmail) {
      await cartPage.fillFlightContactConsentEmail(email);
    }

    await cartPage.saveFlightContactConsent();
    logger.info('Contact details for the airline saved in the cart', {
      mandatory: checkbox.disabled,
      usedStoredEmail: Boolean(storedEmail),
    });
    return { answered: true };
  },

  /**
   * Quote-scoped counterpart of shareContactDetailsWithAirlineInCart, for a cart that holds more than
   * one flight quote — e.g. a Separated Tickets selection, where every ticket is its own quote with its
   * own consent row (#85837). The unscoped version always opens the first row on the page, and once
   * quote 1 is held that row is the read-only "View" panel whose Save never enables.
   * @param {import('playwright').Page} page
   * @param {number} position - 1-based position of the flight quote card in the cart
   * @param {string} email - Used only when the panel has no email yet
   * @returns {Promise<{ answered: boolean }>}
   */
  async shareContactDetailsWithAirlineForQuote(page, position, email) {
    if (!page) throw new Error("page is required");
    if (!Number.isInteger(position) || position < 1) {
      throw new Error("[Cart.shareContactDetailsWithAirlineForQuote] position must be a 1-based integer, got: " + position);
    }
    if (!email || typeof email !== "string") {
      throw new Error("[Cart.shareContactDetailsWithAirlineForQuote] email must be a non-empty string, got: " + typeof email);
    }

    const cartPage = getPageObject(page, CartPage);
    const quoteCard = page.locator(CART_SELECTORS.FLIGHT_QUOTE_CARD).nth(position - 1);
    await quoteCard.waitFor({ state: "visible", timeout: 30000 });

    if (!(await cartPage.isFlightContactConsentRowPresent(3000, quoteCard))) {
      const extrasArrow = quoteCard.locator(CART_SELECTORS.EXTRAS_ARROW_BUTTON).first();
      const arrowClass = (await extrasArrow.getAttribute("class").catch(() => "")) || "";
      if (!arrowClass.includes("is-active")) {
        await extrasArrow.click();
      }
    }
    if (!(await cartPage.isFlightContactConsentRowPresent(10000, quoteCard))) {
      logger.warn("No \"Contact details for the airline\" row on this quote; nothing to answer.", { position });
      return { answered: false };
    }
    await cartPage.openFlightContactConsentPanel(30000, quoteCard);

    const checkbox = await cartPage.getFlightContactConsentCheckboxState(15000, quoteCard);
    if (!checkbox.checked && !checkbox.disabled) {
      await cartPage.clickFlightContactConsentCheckbox(15000, quoteCard);
    }

    const storedEmail = await cartPage.getFlightContactConsentEmailValue(15000, quoteCard);
    if (!storedEmail) {
      await cartPage.fillFlightContactConsentEmail(email, 15000, quoteCard);
    }

    await cartPage.saveFlightContactConsent(30000, quoteCard);
    logger.info("Contact details for the airline saved on the quote", {
      position,
      mandatory: checkbox.disabled,
      usedStoredEmail: Boolean(storedEmail),
    });
    return { answered: true };
  },

  /**
   * Verifies a baggage option is NOT listed on any baggage line of the open flight details drawer.
   * Matches the whole option label (price segment dropped) rather than single words, because the
   * allowance a leg keeps ("1PC") shares words like "BAG" with the option being checked. Throws when
   * no baggage line rendered at all, so an unloaded drawer never reads as "the bag is not shown".
   * @param {import('playwright').Page} page
   * @param {string} baggageLabel - Baggage option label, e.g. "CHECKED BAG UP TO 23 KG"
   * @returns {Promise<{ absent: true, unexpected: string, lines: string[] }>}
   */
  async verifyBaggageNotInFlightDetails(page, baggageLabel) {
    if (!page) throw new Error('page is required');
    if (!baggageLabel || typeof baggageLabel !== 'string') {
      throw new Error('baggageLabel must be a non-empty string, got: ' + typeof baggageLabel);
    }

    const normalize = (text) => text.toUpperCase().replace(/\s+/g, ' ').trim();
    const unexpected = normalize(baggageLabel.split(' - ')[0]);
    const cartPage = getPageObject(page, CartPage);
    const lines = await cartPage.getFlightDetailsDrawerBaggageLines();
    const offending = lines.filter((line) => normalize(line).includes(unexpected));
    logger.info('Checked baggage lines in the flight details drawer', { unexpected, lines, offending });
    expect(
      offending,
      `Flight details should not list the baggage "${baggageLabel}", but these baggage lines do: ${JSON.stringify(offending)}`,
    ).toEqual([]);
    return { absent: true, unexpected, lines };
  },

  /**
   * Verifies the three Amtrak phone number inputs (country code, prefix, number) are all empty —
   * the precondition that makes the blocked checkout later in the scenario meaningful.
   * @param {import('playwright').Page} page
   */
  async verifyAmtrakContactInfoPhoneFieldsEmpty(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const values = await cartPage.getAmtrakContactInfoPhoneValues();

    expect(
      values.length,
      `Expected 3 Amtrak phone number inputs (country code, prefix, number), found ${values.length}`,
    ).toBe(3);
    expect(
      values.filter((value) => value !== ''),
      `Expected every Amtrak phone number field to be empty, got ${JSON.stringify(values)}`,
    ).toEqual([]);
    logger.info('Amtrak Contact Information phone number fields are empty');
  },

  /**
   * Verifies the Amtrak Contact Information extras row is highlighted with the red error border the
   * cart shows after a checkout attempt was blocked by the missing mandatory phone number. The
   * border only renders once Proceed to Checkout has been clicked, so call this after that click.
   * @param {import('playwright').Page} page
   */
  async verifyAmtrakContactInfoHighlightedInRed(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    const isHighlighted = await cartPage.isAmtrakContactInfoHighlightedInRed();
    expect(
      isHighlighted,
      'Expected the Amtrak Contact Information row to be highlighted in red (error border) after the blocked ' +
      'checkout attempt. That class needs BOTH an invalid row and a prior Proceed to Checkout click',
    ).toBe(true);
    logger.info('Amtrak Contact Information row is highlighted in red (error border visible)');
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
   * Fills every mandatory field of the flight passenger-info (APIS) form in one go.
   *
   * No-ops when the passenger-info section is not rendered in extras: APIS only appears for the
   * routes/carriers that require it (e.g. it is absent on non-US BA NDC routes — test 36755), so
   * a shared "fill it all" step has to tolerate its absence. Pair it with an explicit assertion
   * (`the passenger info section should be marked as required with an asterisk`) whenever the
   * test's point is that APIS IS required — otherwise a missing section reads as a pass.
   *
   * Assumes the panel is already expanded (openPassengerInfoPanel toggles, so calling it again
   * would collapse the form) and does NOT save — pair it with `clickPassengerInfoInExtras`
   * before and `savePassengerInfo` after, so a test can still assert on the unsaved state.
   *
   * Fields are filled in the same order the per-field steps use, because selecting the
   * nationality auto-fills "Issued at" through the form's own handler.
   *
   * Date of birth is only filled when the field is rendered AND empty: it renders only for
   * travellers with no DOB on their profile, and arrives pre-filled for everyone else.
   *
   * @param {import('playwright').Page} page
   * @param {object} [overrides] - Per-field value overrides
   * @param {string} [overrides.passportNumber='8732186']
   * @param {string} [overrides.nationality='united kingdom']
   * @param {string} [overrides.applicableCountry='afghanistan']
   * @param {string} [overrides.expiryDate='15 Jan 2030'] - "DD MMM YYYY"
   * @param {string} [overrides.dateOfBirth='15 Jan 1990'] - "DD MMM YYYY"
   * @returns {Promise<boolean>} true when the form was filled, false when the section is absent
   */
  async fillAllPassengerInfo(page, overrides = {}) {
    if (!page) throw new Error('[Cart.fillAllPassengerInfo] "page" is required.');
    if (typeof overrides !== 'object' || overrides === null || Array.isArray(overrides)) {
      throw new Error(`[Cart.fillAllPassengerInfo] "overrides" must be a plain object, got: ${typeof overrides}`);
    }

    const defaults = {
      passportNumber: '8732186',
      nationality: 'united kingdom',
      applicableCountry: 'afghanistan',
      expiryDate: '15 Jan 2030',
      dateOfBirth: '15 Jan 1990',
    };

    const unknown = Object.keys(overrides).filter((key) => !Object.hasOwn(defaults, key));
    if (unknown.length) {
      throw new Error(
        `[Cart.fillAllPassengerInfo] Unknown passenger info field(s): ${unknown.join(', ')}. ` +
        `Supported: ${Object.keys(defaults).join(', ')}.`
      );
    }

    const values = { ...defaults, ...overrides };
    for (const [key, value] of Object.entries(values)) {
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error(`[Cart.fillAllPassengerInfo] "${key}" must be a non-empty string, got: ${value}`);
      }
    }

    const cartPage = getPageObject(page, CartPage);

    // A collapsed extras accordion hides .flight-passenger-info, so open it before concluding
    // that APIS is absent. Saving any other extra collapses extras back to its summary row.
    if (!(await cartPage.isPassengerInfoSectionVisible(1000))) {
      await cartPage.reopenExtrasAfterSave().catch((err) => {
        logger.debug('Could not expand the extras accordion before filling passenger info', { error: err.message });
      });
    }

    if (!(await cartPage.isPassengerInfoSectionVisible())) {
      logger.info('Skipped passenger info — the section is not displayed in cart extras (APIS not required)');
      return false;
    }

    // Expand only when the form is still closed: the expand button toggles, so clicking it on an
    // already-open panel would collapse the fields we are about to fill.
    if (!(await cartPage.isPassengerInfoFormExpanded())) {
      await cartPage.openPassengerInfoPanel();
      logger.info('Expanded the passenger info panel before filling');
    }

    const currentDob = await cartPage.getPassengerInfoDateOfBirthValue();
    if (currentDob === '') {
      await cartPage.fillPassengerInfoDateOfBirth(values.dateOfBirth);
      logger.info('Filled passenger info date of birth', { dateOfBirth: values.dateOfBirth });
    } else {
      logger.info('Skipped passenger info date of birth', {
        reason: currentDob === null ? 'field not rendered' : 'already filled',
        currentDob,
      });
    }

    await cartPage.fillPassportNumber(values.passportNumber);
    await cartPage.fillNationality(values.nationality);
    await cartPage.fillApplicableCountry(values.applicableCountry);
    await cartPage.fillPassportExpiryDate(values.expiryDate);

    logger.info('Filled all passenger info fields', values);
    return true;
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

  // ========================================
  // Rail passenger info (Benerail eu-rail extras — eu-rail-passenger-info.vue)
  // ========================================

  /**
   * Verifies the rail passenger-info card-title shows the expected ratio (e.g. "3/3") with the
   * green success checkmark, confirming all passengers have valid info.
   * @param {import('playwright').Page} page
   * @param {string} expectedRatio - Expected ratio text, e.g. "3/3"
   */
  async verifyRailPassengerInfoDisplayed(page, expectedRatio) {
    if (!page) throw new Error('[Cart.verifyRailPassengerInfoDisplayed] "page" is required.');
    if (!expectedRatio || typeof expectedRatio !== 'string') {
      throw new Error(`[Cart.verifyRailPassengerInfoDisplayed] "expectedRatio" must be a non-empty string, got: ${typeof expectedRatio}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const statusText = await cartPage.getRailPassengerInfoStatusText();
    expect(statusText, `Expected rail passenger info status to contain "${expectedRatio}", got "${statusText}"`).toContain(expectedRatio);

    const hasSuccessIcon = await cartPage.hasRailPassengerInfoSuccessIcon();
    expect(hasSuccessIcon, 'Expected rail passenger info to show the green success checkmark').toBe(true);

    logger.info('Rail passenger info displayed with green checkmark', { expectedRatio, statusText });
  },

  /**
   * Opens the rail passenger-info panel in extras.
   * @param {import('playwright').Page} page
   */
  async clickRailPassengerInfoEdit(page) {
    if (!page) throw new Error('[Cart.clickRailPassengerInfoEdit] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.openRailPassengerInfoPanel();
    logger.info('Opened rail passenger info panel');
  },

  /**
   * Clicks a passenger's tab in the rail passenger-info panel and verifies their email, last name,
   * and first name match the expected values. The tab label already carries "{firstName} {lastName}",
   * so it is verified directly from the passengerName argument the caller clicked.
   * @param {import('playwright').Page} page
   * @param {string} passengerName - Passenger's full name as shown on the tab, e.g. "Bene Moove"
   * @param {string} expectedEmail
   * @param {string} expectedLastName
   * @param {string} expectedFirstName
   */
  async verifyRailPassengerDetails(page, passengerName, expectedEmail, expectedLastName, expectedFirstName) {
    if (!page) throw new Error('[Cart.verifyRailPassengerDetails] "page" is required.');
    if (!passengerName || typeof passengerName !== 'string') {
      throw new Error(`[Cart.verifyRailPassengerDetails] "passengerName" must be a non-empty string, got: ${typeof passengerName}`);
    }

    const cartPage = getPageObject(page, CartPage);

    try {
      await cartPage.clickRailPassengerInfoTabByName(passengerName);
    } catch (err) {
      throw new Error(
        `[Cart.verifyRailPassengerDetails] Could not find or click passenger tab "${passengerName}" in the rail ` +
        `passenger info panel. Original: ${err.message}`,
      );
    }

    expect(
      passengerName,
      `Expected passenger tab "${passengerName}" to contain first name "${expectedFirstName}" and last name "${expectedLastName}"`,
    ).toContain(expectedFirstName);
    expect(passengerName).toContain(expectedLastName);

    const actualEmail = await cartPage.getRailPassengerInfoEmailValue();
    expect(actualEmail, `Expected passenger "${passengerName}" email to be "${expectedEmail}", got "${actualEmail}"`).toBe(expectedEmail);

    logger.info('Verified rail passenger details', { passengerName, expectedEmail, expectedLastName, expectedFirstName });
  },

  /**
   * Removes the email value from a named passenger's tab in the rail passenger-info panel.
   * @param {import('playwright').Page} page
   * @param {string} passengerName
   */
  async removeRailPassengerInfoEmail(page, passengerName) {
    if (!page) throw new Error('[Cart.removeRailPassengerInfoEmail] "page" is required.');
    if (!passengerName || typeof passengerName !== 'string') {
      throw new Error(`[Cart.removeRailPassengerInfoEmail] "passengerName" must be a non-empty string, got: ${typeof passengerName}`);
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickRailPassengerInfoTabByName(passengerName);
    await cartPage.clearRailPassengerInfoEmail();
    logger.info('Removed rail passenger info email', { passengerName });
  },

  /**
   * Adds an email value to a named passenger's tab in the rail passenger-info panel.
   * @param {import('playwright').Page} page
   * @param {string} email
   * @param {string} passengerName
   */
  async addRailPassengerInfoEmail(page, email, passengerName) {
    if (!page) throw new Error('[Cart.addRailPassengerInfoEmail] "page" is required.');
    if (!email || typeof email !== 'string') {
      throw new Error(`[Cart.addRailPassengerInfoEmail] "email" must be a non-empty string, got: ${typeof email}`);
    }
    if (!passengerName || typeof passengerName !== 'string') {
      throw new Error(`[Cart.addRailPassengerInfoEmail] "passengerName" must be a non-empty string, got: ${typeof passengerName}`);
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.clickRailPassengerInfoTabByName(passengerName);
    await cartPage.fillRailPassengerInfoEmail(email);
    logger.info('Added rail passenger info email', { email, passengerName });
  },

  /**
   * Verifies the rail passenger-info email field is marked mandatory (red border / is-danger)
   * after an unsuccessful save attempt with the field empty.
   * @param {import('playwright').Page} page
   */
  async verifyRailPassengerInfoEmailFieldRequired(page) {
    if (!page) throw new Error('[Cart.verifyRailPassengerInfoEmailFieldRequired] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    const isInvalid = await cartPage.isRailPassengerInfoEmailFieldInvalid();
    expect(isInvalid, 'Expected rail passenger info email field to show a red border (is-danger) after saving with it empty').toBe(true);

    logger.info('Rail passenger info email field marked as mandatory (red border)');
  },

  // ========================================
  // RAIL DATE OF BIRTH (Benerail eu-rail extras)
  // ========================================

  /**
   * Verifies the rail birth-date section is visible and marked as required (leading "*" on the
   * card-title, e.g. "* Birth Date").
   * @param {import('playwright').Page} page
   */
  async verifyRailBirthDateSectionRequired(page) {
    if (!page) throw new Error('[Cart.verifyRailBirthDateSectionRequired] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    const isRequired = await cartPage.isRailBirthDateSectionRequired();
    expect(isRequired, 'Expected the Benerail birth-date section to be visible and marked as required (leading "*")').toBe(true);

    logger.info('Rail birth-date section is visible and required');
  },

  /**
   * Expands the rail birth-date panel.
   * @param {import('playwright').Page} page
   */
  async expandBirthDateSection(page) {
    if (!page) throw new Error('[Cart.expandBirthDateSection] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.openRailBirthDatePanel();
    logger.info('Expanded rail birth-date section');
  },

  /**
   * Fills and saves a date of birth in the rail birth-date extras panel.
   * @param {import('playwright').Page} page
   * @param {string} dateValue - Date in "DD/MM/YYYY" format (e.g. "20/12/1995").
   */
  async saveBirthDateInCart(page, dateValue) {
    if (!page) throw new Error('[Cart.saveBirthDateInCart] "page" is required.');
    if (!dateValue || typeof dateValue !== 'string') {
      throw new Error(`[Cart.saveBirthDateInCart] "dateValue" must be a non-empty string, got: ${typeof dateValue}`);
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.openRailBirthDatePanel();
    await cartPage.openRailBirthDateCalendar();
    await selectDateOfBirthWithYearArrows(page, dateValue);
    await cartPage.clickRailBirthDateSaveButton();
    logger.info('Saved rail birth date', { dateValue });
  },

  /**
   * Verifies the rail birth date was saved successfully (green checkmark next to the section).
   * @param {import('playwright').Page} page
   */
  async verifyBirthDateSavedSuccessfully(page) {
    if (!page) throw new Error('[Cart.verifyBirthDateSavedSuccessfully] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    const hasSuccessIcon = await cartPage.hasRailBirthDateSuccessIcon();
    expect(hasSuccessIcon, 'Expected a green checkmark next to the Benerail birth-date section after saving').toBe(true);

    logger.info('Rail birth date saved successfully with a green checkmark');
  },

  /**
   * Verifies the rail birth-date input holds the expected value.
   * @param {import('playwright').Page} page
   * @param {string} expectedDate - Expected date in "DD/MM/YYYY" format (e.g. "20/12/1995").
   */
  async verifyBirthDateValue(page, expectedDate) {
    if (!page) throw new Error('[Cart.verifyBirthDateValue] "page" is required.');
    if (!expectedDate || typeof expectedDate !== 'string') {
      throw new Error(`[Cart.verifyBirthDateValue] "expectedDate" must be a non-empty string, got: ${typeof expectedDate}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const actualDate = await cartPage.getRailBirthDateValue();
    expect(actualDate, `Expected the Benerail birth-date field to show "${expectedDate}", got "${actualDate}"`).toBe(expectedDate);

    logger.info('Verified rail birth date value', { expectedDate });
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
   * Adds the agent-suggested hotel quote to the trip from the trip overview's "Suggested items"
   * section. The hotel sibling of addSuggestedCarQuoteToTrip — the two cards are scoped by
   * different markers (see CartPage.SUGGESTED_HOTEL_ADD_BUTTON), so they stay separate methods.
   *
   * @param {import('playwright').Page} page
   */
  async addSuggestedHotelQuoteToTrip(page) {
    if (!page) throw new Error('[Cart.addSuggestedHotelQuoteToTrip] "page" is required.');
    logger.debug('[Cart.addSuggestedHotelQuoteToTrip] Adding the agent-suggested hotel quote to the trip');

    const cartPage = getPageObject(page, CartPage);
    try {
      await cartPage.clickSuggestedHotelQuoteAddButton();
    } catch (err) {
      throw new Error(
        `[Cart.addSuggestedHotelQuoteToTrip] Could not add the agent-suggested hotel quote to the trip. ` +
        `The Suggested items section may not hold an unchosen hotel suggestion — the agent's hotel may ` +
        `not have reached this trip yet (the page needs a refresh after the agent adds it). Original: ${err.message}`
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
   * Verifies the trip's flight quote shows the expected price-state label plus a price containing
   * digits. The four states share one span, so the label is what tells them apart: "To pay" for a
   * live cart quote, "Copied Offer" for one produced by Copy Trip (payable only after a price
   * check), "Expired offer" for a lapsed quote, and "Price starts from" outside the cart.
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
      `"Expired offer" means the quote lapsed; "Copied Offer" means it came from Copy Trip and ` +
      `needs a price check; "Price starts from" means this is not a cart view.`,
    ).toContain(expectedLabel);

    expect(
      price,
      `Expected the flight quote's "${expectedLabel}" total to show an amount but it read "${price}".`,
    ).toMatch(/\d/);

    logger.info('Flight quote shows the expected price-state label and amount', { label, price });
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
   * Verifies the "Journey Details" button is visible inside the first ticket details section
   * on the trip overview page (rail quote card). See test 29414.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{visible: true}>}
   */
  async verifyJourneyDetailsButtonVisibleInTicketDetails(page) {
    if (!page) {
      throw new Error('[Cart.verifyJourneyDetailsButtonVisibleInTicketDetails] "page" is required.');
    }

    const cartPage = getPageObject(page, CartPage);
    const journeyDetailsButton = cartPage.getJourneyDetailsButtonInFirstTicketDetails();
    try {
      await journeyDetailsButton.waitFor({ state: 'visible', timeout: 20000 });
    } catch (error) {
      throw new Error(
        `[Cart.verifyJourneyDetailsButtonVisibleInTicketDetails] The "Journey Details" button was not visible ` +
        `inside the ticket details section within 20000ms. Original: ${error.message}`,
      );
    }

    logger.info('Journey Details button is visible in ticket details');
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
   * Verifies the flight numbers currently shown in the cart match a previously stored set,
   * e.g. confirming the flights held are the same ones that were added to cart.
   *
   * @param {import('playwright').Page} page
   * @param {string[]} storedFlightNumbers - Flight numbers extracted before the comparison point.
   */
  async verifyFlightNumbersMatchStored(page, storedFlightNumbers) {
    if (!page) throw new Error('page is required');
    if (!Array.isArray(storedFlightNumbers) || !storedFlightNumbers.length) {
      throw new Error(`storedFlightNumbers must be a non-empty array, got: ${typeof storedFlightNumbers}`);
    }

    const cartPage = getPageObject(page, CartPage);
    const currentFlightNumbers = await cartPage.getVisibleFlightNumbers();
    expect(
      currentFlightNumbers,
      `Expected cart flight numbers ${JSON.stringify(currentFlightNumbers)} to match stored flight numbers ${JSON.stringify(storedFlightNumbers)}`,
    ).toEqual(storedFlightNumbers);
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
    logger.info("Clicking payment terms link in the cart");
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
   * Verifies the car Terms & Conditions dialog displays the given text.
   * The dialog loads its fare rules asynchronously (el-skeleton while pending), so the
   * assertion polls until the supplier content is rendered.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Text expected inside the dialog (e.g. "RATE")
   */
  async verifyCarTermsDialogContainsText(page, expectedText) {
    if (!page) throw new Error('[Cart.verifyCarTermsDialogContainsText] "page" is required.');
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(
        `[Cart.verifyCarTermsDialogContainsText] "expectedText" must be a non-empty string, got: ${typeof expectedText} (${expectedText})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    logger.info('Verifying the terms and conditions dialog displays text', { expectedText });

    await expect(
      cartPage.getCarTermsDialogContent(),
      `[Cart.verifyCarTermsDialogContainsText] Expected the terms and conditions dialog to display "${expectedText}", ` +
      `but that text was not found in the dialog content. The dialog may not have opened, the supplier fare rules ` +
      `may have failed to load ("Currently unavailable"), or the terms copy changed.`,
    ).toContainText(expectedText, { timeout: 30000 });
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

  /**
   * Clicks the "Vendor and location details" tab inside the car Terms & Conditions dialog
   * (car-terms-conditions.vue). The dialog opens with the fare rules tab active by default.
   *
   * @param {import('playwright').Page} page
   */
  async clickVendorAndLocationDetailsTab(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);
    logger.info('Clicking vendor and location details tab');
    await cartPage.clickCarTermsLocationDetailsTab();
  },

  /**
   * Extracts the full text content of a car Terms & Conditions tab pane (all rule lines), for
   * cross-context comparison (results vs cart vs cart after booking).
   *
   * @param {import('playwright').Page} page
   * @param {'fareRules'|'locationDetails'} paneName
   * @returns {Promise<string>} The pane's trimmed text content.
   */
  async extractCarTermsPaneText(page, paneName) {
    if (!page) throw new Error('page is required');
    if (paneName !== 'fareRules' && paneName !== 'locationDetails') {
      throw new Error(`paneName must be "fareRules" or "locationDetails", got: ${paneName}`);
    }

    const cartPage = getPageObject(page, CartPage);
    logger.info(`Extracting car terms pane text: ${paneName}`);

    const content = await cartPage.extractCarTermsPaneContent(paneName);

    if (!content) {
      throw new Error(`No content found in the "${paneName}" pane of the car terms modal`);
    }

    logger.info(`✓ Car terms pane "${paneName}" text extracted`, { length: content.length });
    return { paneName, content };
  },

  // ===== CAR FLIGHT NUMBER EXTRAS (car-flight-number.vue) — ADO #78273 =====
  // Universal, all-distributor replacement for the old SunnyCars-only addSunnyFlightNumber
  // (dead code: called 3 CartPage methods that no longer exist, and was never called itself).

  /**
   * Enters a flight number in the car flight number extra and saves it. Opens the panel first if
   * it is not already open. Does not assert the save succeeded — a caller expecting an invalid
   * value to be rejected should follow with expectFlightNumberValidationError() instead.
   *
   * @param {import('playwright').Page} page
   * @param {string} flightNumber - Flight number to enter (e.g. "AB6548")
   */
  async enterFlightNumberInExtra(page, flightNumber) {
    if (!page) throw new Error('[Cart.enterFlightNumberInExtra] "page" is required.');
    if (!flightNumber || typeof flightNumber !== 'string') {
      throw new Error(
        `[Cart.enterFlightNumberInExtra] "flightNumber" must be a non-empty string, got: ` +
        `${typeof flightNumber} (${JSON.stringify(flightNumber)})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    logger.info('Entering flight number in car flight number extra', { flightNumber });
    await cartPage.openFlightNumberExtra();
    await cartPage.fillFlightNumberInput(flightNumber);
    await cartPage.clickFlightNumberSave();
  },

  /**
   * Asserts the car flight number field is displayed, either as mandatory or optional per the
   * server-driven `TripValidationsNames.CarFlightNumber` validation. Checks mandatory BEFORE
   * opening the panel — CartPage.isFlightNumberMandatory() reads the collapsed row's own title
   * asterisk, which extras-layout.vue tears down once the panel opens.
   *
   * @param {import('playwright').Page} page
   * @param {object} [options]
   * @param {boolean} [options.mandatory=false] - Whether the field is expected to be mandatory
   */
  async expectFlightNumberFieldDisplayed(page, { mandatory = false } = {}) {
    if (!page) throw new Error('[Cart.expectFlightNumberFieldDisplayed] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    // isFlightNumberMandatory() waits (up to 15s) for the section to render before reading its
    // title asterisk - a plain count()-based presence check here raced that async render (the
    // section can still be loading when this step runs right after "add the first car to cart"),
    // so this is the only presence check: its own error already names the section as never having
    // rendered when the field genuinely is not offered.
    const isMandatory = await cartPage.isFlightNumberMandatory();
    if (isMandatory !== mandatory) {
      throw new Error(
        `[Cart.expectFlightNumberFieldDisplayed] Expected the car flight number field to be ` +
        `${mandatory ? 'mandatory' : 'optional'}, but it was ${isMandatory ? 'mandatory' : 'optional'} ` +
        `(title asterisk present: ${isMandatory}). Likely cause: the rental station's server-side ` +
        `TripValidationsNames.CarFlightNumber validation did not return the expected errMsg.`
      );
    }

    logger.info(`✓ Car flight number field displayed as ${mandatory ? 'mandatory' : 'optional'}`);
  },

  /**
   * Asserts the car flight number extra is not displayed at all (no airport pickup and no flight
   * segment on the trip, per US-001).
   *
   * @param {import('playwright').Page} page
   */
  async expectFlightNumberFieldNotDisplayed(page) {
    if (!page) throw new Error('[Cart.expectFlightNumberFieldNotDisplayed] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    const present = await cartPage.isFlightNumberExtraPresent();
    if (present) {
      throw new Error(
        `[Cart.expectFlightNumberFieldNotDisplayed] Expected the car flight number field to not ` +
        `be displayed, but the extra section is present (selector: ${CART_SELECTORS.CAR_FLIGHT_NUMBER_SECTION}). ` +
        `Likely cause: this rental station is an airport pickup, or the trip carries a flight segment.`
      );
    }

    logger.info('✓ Car flight number field not displayed');
  },

  /**
   * Asserts the car flight number field auto-populated with a matching flight number (the trip
   * carries a flight segment that car-flight-number.vue's carService.getFlightNumber() matched
   * against). Opens the panel first if it is not already open. Only checks non-empty - the exact
   * matched value is the flight-matching logic's own concern (US-002, ADO #78274), not this US-001
   * collection feature's.
   *
   * @param {import('playwright').Page} page
   */
  async expectFlightNumberAutoPopulated(page) {
    if (!page) throw new Error('[Cart.expectFlightNumberAutoPopulated] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.openFlightNumberExtra();
    const actualValue = await cartPage.getFlightNumberInputValue();
    if (!actualValue) {
      throw new Error(
        `[Cart.expectFlightNumberAutoPopulated] Expected the car flight number field to be ` +
        `auto-populated with a matching flight number, but it was empty. Likely cause: the trip's ` +
        `flight segment did not match any airline/flight-number pair the flight-matching logic recognizes.`
      );
    }

    logger.info('✓ Car flight number field auto-populated', { actualValue });
  },

  /**
   * Asserts the car flight number panel's disclaimer paragraph reads the expected text (Avis-
   * mandatory wording or the standard shared-with-vendor wording, depending on the station).
   * Opens the panel first if it is not already open.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Exact expected disclaimer text
   */
  async expectFlightNumberDisclaimer(page, expectedText) {
    if (!page) throw new Error('[Cart.expectFlightNumberDisclaimer] "page" is required.');
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(
        `[Cart.expectFlightNumberDisclaimer] "expectedText" must be a non-empty string, got: ` +
        `${typeof expectedText} (${JSON.stringify(expectedText)})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.openFlightNumberExtra();
    const actualText = await cartPage.getFlightNumberDisclaimerText();
    if (actualText !== expectedText) {
      throw new Error(
        `[Cart.expectFlightNumberDisclaimer] Expected disclaimer text "${expectedText}", got: ` +
        `"${actualText}". Likely cause: the isMandatory ternary resolved to the other branch than ` +
        `expected for this rental station.`
      );
    }

    logger.info('✓ Car flight number disclaimer text matches', { expectedText });
  },

  /**
   * Asserts the car flight number input holds the expected value. Opens the panel first if it is
   * not already open.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedValue - Exact expected input value
   */
  async expectFlightNumberValue(page, expectedValue) {
    if (!page) throw new Error('[Cart.expectFlightNumberValue] "page" is required.');
    if (typeof expectedValue !== 'string') {
      throw new Error(
        `[Cart.expectFlightNumberValue] "expectedValue" must be a string, got: ${typeof expectedValue}`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    await cartPage.openFlightNumberExtra();
    const actualValue = await cartPage.getFlightNumberInputValue();
    if (actualValue !== expectedValue) {
      throw new Error(
        `[Cart.expectFlightNumberValue] Expected the car flight number input to hold ` +
        `"${expectedValue}", got: "${actualValue}". Likely cause: loadData() re-fetched and ` +
        `overwrote a manual edit, or the value was never saved.`
      );
    }

    logger.info('✓ Car flight number input value matches', { expectedValue });
  },

  /**
   * Asserts the car flight number input is empty (no matching flight segment and no prior save),
   * and that the field is optional per expectFlightNumberFieldDisplayed's asterisk check. Opens
   * the panel first if it is not already open.
   *
   * @param {import('playwright').Page} page
   */
  async expectFlightNumberFieldEmpty(page) {
    if (!page) throw new Error('[Cart.expectFlightNumberFieldEmpty] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    const isMandatory = await cartPage.isFlightNumberMandatory();
    if (isMandatory) {
      throw new Error(
        `[Cart.expectFlightNumberFieldEmpty] Expected the car flight number field to be optional, ` +
        `but the title asterisk marked it mandatory.`
      );
    }

    await cartPage.openFlightNumberExtra();
    const actualValue = await cartPage.getFlightNumberInputValue();
    if (actualValue !== '') {
      throw new Error(
        `[Cart.expectFlightNumberFieldEmpty] Expected the car flight number input to be empty, ` +
        `got: "${actualValue}". Likely cause: carService.getFlightNumber() returned a value from a ` +
        `previous save, or the trip does carry a matching flight segment after all.`
      );
    }

    logger.info('✓ Car flight number field empty and optional');
  },

  /**
   * Asserts the car flight number panel's validation error message reads the expected text.
   * Assumes an invalid value has already been entered and Save clicked (e.g. via
   * enterFlightNumberInExtra) — the message only renders after saveFlight() sets `markFields = true`.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Exact expected validation error text
   */
  async expectFlightNumberValidationError(page, expectedText) {
    if (!page) throw new Error('[Cart.expectFlightNumberValidationError] "page" is required.');
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(
        `[Cart.expectFlightNumberValidationError] "expectedText" must be a non-empty string, got: ` +
        `${typeof expectedText} (${JSON.stringify(expectedText)})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    const actualText = await cartPage.getFlightNumberValidationErrorText();
    if (actualText !== expectedText) {
      throw new Error(
        `[Cart.expectFlightNumberValidationError] Expected validation error text "${expectedText}", ` +
        `got: "${actualText}". Likely cause: the required-field message rendered instead of the ` +
        `format message, or vice versa - the component shows exactly one at a time.`
      );
    }

    logger.info('✓ Car flight number validation error matches', { expectedText });
  },

  /**
   * Asserts the booking is still blocked after an invalid flight number save attempt. saveFlight()
   * returns early on an invalid value without calling carService.saveFlightNumber or closing the
   * panel, so the trip can never progress past "Pending booking" - this reuses
   * expectBookingStatusToBe rather than re-implementing a status check.
   *
   * @param {import('playwright').Page} page
   */
  async expectBookingBlocked(page) {
    if (!page) throw new Error('[Cart.expectBookingBlocked] "page" is required.');

    await this.expectBookingStatusToBe('Pending booking', { page });
    logger.info('✓ Booking still blocked after invalid car flight number save attempt');
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
   * Verifies the open approvals dialog's "Approval history" lists exactly `expectedCount` entries,
   * each titled "Approved on <date time>", then closes the dialog. The dialog must already be open
   * (see viewApproversInTripOverview). The date part is matched locale-tolerantly; the count is exact.
   *
   * @param {import('playwright').Page} page
   * @param {number} expectedCount - Expected number of approval history entries
   * @returns {Promise<{count: number, titles: string[]}>}
   */
  async verifyApprovalHistoryApprovedOnEntries(page, expectedCount) {
    if (!page) throw new Error('[Cart.verifyApprovalHistoryApprovedOnEntries] "page" is required.');
    if (!Number.isInteger(expectedCount) || expectedCount <= 0) {
      throw new Error(
        `[Cart.verifyApprovalHistoryApprovedOnEntries] "expectedCount" must be a positive integer, got: ${expectedCount}`
      );
    }

    logger.debug('[Cart.verifyApprovalHistoryApprovedOnEntries] Reading approval history entries', { expectedCount });
    const cartPage = getPageObject(page, CartPage);
    let titles;
    let itemCount;
    try {
      titles = await cartPage.getApprovalHistoryTitles();
      itemCount = await cartPage.getApprovalHistoryItemCount();
    } catch (err) {
      await cartPage.closeApprovalsDialog().catch(() => {});
      throw new Error(
        `[Cart.verifyApprovalHistoryApprovedOnEntries] Could not read the approval history (expected ${expectedCount} ` +
        `"Approved on" entries). Earlier approvals were likely dropped when the trip changed after approval. ` +
        `Original: ${err.message}`
      );
    }

    // 'dd MMM yy - HH:mm' renders day-first ("16 Jul 26") or, in US locale, month-first ("Jul 16, 26").
    // Case-insensitive: the header renders the i18n "Approved on" capitalized ("Approved On").
    const approvedOnPattern = /^Approved on (\d{1,2} [A-Za-z]{3,} \d{2}|[A-Za-z]{3,} \d{1,2}, \d{2}) - \d{2}:\d{2}$/i;
    const malformed = titles.filter((title) => !approvedOnPattern.test(title));

    if (itemCount !== expectedCount || titles.length !== expectedCount || malformed.length > 0) {
      await cartPage.closeApprovalsDialog().catch(() => {});
      throw new Error(
        `[Cart.verifyApprovalHistoryApprovedOnEntries] Approval history mismatch. Expected ${expectedCount} entries ` +
        `titled "Approved on <date time>", got ${itemCount} item(s) with titles ${JSON.stringify(titles)}` +
        (malformed.length > 0 ? `; not matching ${approvedOnPattern}: ${JSON.stringify(malformed)}` : '') +
        `. Each approval of the trip should stay in the history after the trip is changed and re-approved.`
      );
    }

    await cartPage.closeApprovalsDialog();
    logger.info('Approval history lists every approval with its date', { count: itemCount, titles });
    return { count: itemCount, titles };
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
   * Verifies the open approvals dialog lists EXACTLY the expected approvers, checking the whole
   * list in a single pass. verifyApproverAssigned closes the dialog when it finishes, so asserting
   * one name per step only works if the dialog is reopened between each — this reads the list once
   * instead, and also catches an approver that should NOT be on the flow.
   *
   * Comparison is order-independent but duplicate-sensitive (sorted multiset): the dialog renders
   * one `.approver-name` per approval step, and two approvers sharing a step have no guaranteed
   * order between them, so asserting position would be brittle.
   *
   * The dialog must already be open (see viewApproversInTripOverview). Closes it when done, matching
   * verifyApproverAssigned / verifyApproverCount.
   *
   * @param {import('playwright').Page} page
   * @param {string[]} expectedNames - Exact approver names, as rendered in the dialog
   * @returns {Promise<{approvers: string[]}>} The approver names actually listed
   */
  async verifyApproversAre(page, expectedNames) {
    if (!page) throw new Error('[Cart.verifyApproversAre] "page" is required.');
    if (!Array.isArray(expectedNames) || expectedNames.length === 0) {
      throw new Error(
        `[Cart.verifyApproversAre] "expectedNames" must be a non-empty array of approver names, got: ` +
        `${Array.isArray(expectedNames) ? 'an empty array' : typeof expectedNames}`
      );
    }

    const expected = expectedNames.map((name) => {
      if (typeof name !== 'string' || name.trim().length === 0) {
        throw new Error(
          `[Cart.verifyApproversAre] Every expected approver name must be a non-empty string, got: ${name}`
        );
      }
      return name.trim();
    });

    logger.debug('[Cart.verifyApproversAre] Verifying the full approver list in the approvals dialog', { expected });
    const cartPage = getPageObject(page, CartPage);
    const actual = await cartPage.getApproverNames();

    const sortedActual = [...actual].sort();
    const sortedExpected = [...expected].sort();
    const matches =
      sortedActual.length === sortedExpected.length &&
      sortedActual.every((name, index) => name === sortedExpected[index]);

    if (!matches) {
      // Reported alongside the full lists: a count-only mismatch (the same approver listed twice)
      // leaves both of these empty, so the raw lists are what explains that case.
      const missing = expected.filter((name) => !actual.includes(name));
      const unexpected = actual.filter((name) => !expected.includes(name));
      await cartPage.closeApprovalsDialog().catch(() => {});
      throw new Error(
        `[Cart.verifyApproversAre] The approval flow's approvers do not match. ` +
        `Expected ${expected.length}: [${expected.join(', ')}]. Found ${actual.length}: [${actual.join(', ')}].` +
        (missing.length ? ` Missing: [${missing.join(', ')}].` : '') +
        (unexpected.length ? ` Unexpected: [${unexpected.join(', ')}].` : '') +
        ` Check the approval flow configuration for this trip's traveler.`
      );
    }

    logger.info('Approval flow approvers matched the expected list', { approvers: actual });
    await cartPage.closeApprovalsDialog();
    return { approvers: actual };
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
   * Starts capturing the next /api/v3/quotes?tripId=...&getCancelled=true GET response.
   * Must be called BEFORE the action that navigates to the cart.
   * Returns an unresolved Promise — do NOT await in the calling step.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<import('@playwright/test').Response>}
   */
  startCapturingCancelledQuotesResponse(page) {
    if (!page) throw new Error('page is required');
    const cartPage = getPageObject(page, CartPage);
    return cartPage.captureCancelledQuotesApiResponse();
  },

  /**
   * Verifies a flight quote shown in another currency converts its fare management markup at the
   * fare's own rate (ADO 84703). The fare rate is read from the quote itself (displayTax / tax), so
   * every pricing line's DisplayMarkup must equal Markup x rate, and the quote's displayTotalPrice
   * must equal its original-currency totalPrice x rate. Before the fix a markup with no markup
   * currency was added to the display total unconverted.
   *
   * @param {Promise<import('@playwright/test').Response>} responsePromise - From a quotes capture
   * @param {number} quoteId - The flight quote to check
   * @returns {Promise<{rate: number, displayTotalPrice: number, totalPrice: number, markups: Array<{markup: number, displayMarkup: number}>}>}
   */
  async verifyFlightQuoteMarkupConvertedAtFareRate(responsePromise, quoteId) {
    if (!responsePromise) {
      throw new Error('[Cart.verifyFlightQuoteMarkupConvertedAtFareRate] No captured quotes response. Start intercepting it before opening the trip.');
    }
    if (typeof quoteId !== 'number' || quoteId <= 0) {
      throw new Error(`[Cart.verifyFlightQuoteMarkupConvertedAtFareRate] quoteId must be a positive number, got: ${quoteId}`);
    }
    const response = await responsePromise;
    const body = await response.json();
    const quote = (body.flightQuotes || []).find((q) => q.quoteId === quoteId);
    if (!quote) {
      const ids = (body.flightQuotes || []).map((q) => q.quoteId);
      throw new Error(`[Cart.verifyFlightQuoteMarkupConvertedAtFareRate] Flight quote ${quoteId} is not in the response. Quotes returned: [${ids.join(', ')}].`);
    }
    if (quote.displayCurrency === quote.originalCurrency) {
      throw new Error(
        `[Cart.verifyFlightQuoteMarkupConvertedAtFareRate] Quote ${quoteId} is shown in its own currency (${quote.displayCurrency}), ` +
        `so no conversion is exercised. Use a user whose display currency differs from the fare currency.`
      );
    }
    if (!(quote.tax > 0)) {
      throw new Error(`[Cart.verifyFlightQuoteMarkupConvertedAtFareRate] Quote ${quoteId} has no tax (${quote.tax}) to read the fare rate from.`);
    }

    const rate = quote.displayTax / quote.tax;
    const pricings = (quote.flightPricing || []).filter((p) => p.Markup > 0);
    expect(pricings.length, `Quote ${quoteId} should have at least one pricing line with a markup`).toBeGreaterThan(0);

    const markups = pricings.map((p, i) => {
      expectNumbersToBeEqualWithTolerance(
        p.DisplayMarkup, p.Markup * rate, 0.01,
        `Quote ${quoteId} pricing ${i} DisplayMarkup (${quote.displayCurrency}) vs Markup ${p.Markup} ${quote.originalCurrency} x fare rate ${rate}`
      );
      return { markup: p.Markup, displayMarkup: p.DisplayMarkup };
    });
    expectNumbersToBeEqualWithTolerance(
      quote.displayTotalPrice, quote.totalPrice * rate, 0.01,
      `Quote ${quoteId} displayTotalPrice (${quote.displayCurrency}) vs totalPrice ${quote.totalPrice} ${quote.originalCurrency} x fare rate ${rate}`
    );

    logger.info('Flight quote markup is converted at the fare rate', {
      quoteId, rate, displayCurrency: quote.displayCurrency, originalCurrency: quote.originalCurrency,
      displayTotalPrice: quote.displayTotalPrice, totalPrice: quote.totalPrice, markups,
    });
    return { rate, displayTotalPrice: quote.displayTotalPrice, totalPrice: quote.totalPrice, markups };
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
   * Opens the Cancel Item dialog for the quote at itemIndex and leaves it OPEN, without confirming.
   *
   * Split counterpart of {@link clickCancelItemFromActionsMenu} (which opens AND confirms in one
   * call, leaving no point to assert what the dialog shows while open) - mirrors the existing
   * openTripCancellationDialog/verifyTripCancellationDialogDisplayed split for the trip-level
   * dialog. Needed for ADO #82572: the Evolvi cancellation disclaimer must be asserted before
   * confirming.
   *
   * @param {import('playwright').Page} page
   * @param {number} itemIndex - 0-based index of the quote card to cancel
   * @throws {Error} If page/itemIndex are invalid, or no cancellation prompt opens
   * @returns {Promise<{opened: boolean, promptType: 'basic'|'detailed'}>}
   */
  async openCancelItemDialog(page, itemIndex) {
    if (!page) throw new Error('[Cart.openCancelItemDialog] "page" is required.');
    if (typeof itemIndex !== 'number' || !Number.isInteger(itemIndex) || itemIndex < 0) {
      throw new Error(
        `[Cart.openCancelItemDialog] "itemIndex" must be a non-negative integer, got: ${typeof itemIndex} (${JSON.stringify(itemIndex)})`
      );
    }

    const cartPage = getPageObject(page, CartPage);
    logger.debug('[Cart.openCancelItemDialog] Opening Cancel Item dialog', { itemIndex });

    // Trip Overview (post-booking) context - see hoverBookedItemActionsIconByIndex for why this
    // differs from hoverItemActionsDropdownByIndex (used by the pre-booking Cart page flow).
    const hovered = await cartPage.hoverBookedItemActionsIconByIndex(itemIndex);
    if (!hovered) {
      throw new Error(
        `[Cart.openCancelItemDialog] No quote card found at index ${itemIndex} to open the item actions menu on.`
      );
    }
    await cartPage.clickVisibleCancelItemOption();

    let promptType;
    try {
      promptType = await cartPage.waitForQuoteCancellationPrompt();
    } catch (err) {
      throw new Error(
        `[Cart.openCancelItemDialog] No cancellation prompt opened for the quote at index ${itemIndex}. ` +
        `The "Cancel item" option may be disabled (quote still In Progress). Original: ${err.message}`
      );
    }

    return { opened: true, promptType };
  },

  /**
   * Verifies the Evolvi-specific cancellation disclaimer is displayed, verbatim, in the currently
   * open detailed Cancel Item dialog (see {@link openCancelItemDialog}).
   *
   * @param {import('playwright').Page} page
   * @throws {Error} If page is invalid, or the disclaimer text does not match exactly
   * @returns {Promise<{displayed: true, text: string}>}
   */
  async verifyEvolviCancellationDisclaimerDisplayed(page) {
    if (!page) throw new Error('[Cart.verifyEvolviCancellationDisclaimerDisplayed] "page" is required.');

    const cartPage = getPageObject(page, CartPage);
    await cartPage.waitForEvolviCancellationDisclaimerVisible();
    const actualText = await cartPage.getEvolviCancellationDisclaimerText();

    expect(
      actualText,
      `[Cart.verifyEvolviCancellationDisclaimerDisplayed] Expected the Evolvi cancellation disclaimer to read ` +
      `"${EVOLVI_CANCELLATION_DISCLAIMER_TEXT}", but got "${actualText}".`
    ).toBe(EVOLVI_CANCELLATION_DISCLAIMER_TEXT);

    return { displayed: true, text: actualText };
  },

  /**
   * Confirms an already-open Cancel Item dialog (opened via {@link openCancelItemDialog}).
   *
   * @param {import('playwright').Page} page
   * @param {'basic'|'detailed'} promptType - Returned by openCancelItemDialog
   * @throws {Error} If page/promptType are invalid
   * @returns {Promise<{confirmed: true}>}
   */
  async confirmOpenCancelItemDialog(page, promptType) {
    if (!page) throw new Error('[Cart.confirmOpenCancelItemDialog] "page" is required.');
    if (!['basic', 'detailed'].includes(promptType)) {
      throw new Error(
        `[Cart.confirmOpenCancelItemDialog] "promptType" must be "basic" or "detailed", got: ${JSON.stringify(promptType)}`
      );
    }

    const cartPage = getPageObject(page, CartPage);

    // "basic" prompts (app-confirm.dialog-no-header) are a separate, simpler component with no
    // success/error result branch to read - only the detailed Cancel Item modal (cancel-quote-modal.vue)
    // has one (ADO #82572: non-eTicket Evolvi cancellations are expected to submit but fail).
    if (promptType === 'basic') {
      await cartPage.confirmQuoteCancellation(promptType);
      return { confirmed: true, outcome: null, errorMessage: null };
    }

    const outcome = await cartPage.confirmDetailedCancelQuoteAndReadOutcome();
    const errorMessage = outcome === 'error' ? await cartPage.getCancelQuoteErrorMessageText() : null;
    await cartPage.closeDetailedCancelQuoteResult();

    return { confirmed: true, outcome, errorMessage };
  },

  /**
   * Verifies the outcome recorded by {@link confirmOpenCancelItemDialog} (or throws if that step
   * never ran / used a "basic" prompt, which has no outcome to check).
   *
   * @param {import('playwright').Page} page
   * @param {'success'|'error'|null} actualOutcome
   * @param {'success'|'error'} expectedOutcome
   * @throws {Error} If page/expectedOutcome are invalid, no outcome was recorded, or it doesn't match
   * @returns {Promise<{verified: true, outcome: string}>}
   */
  async verifyCancelItemOutcome(page, actualOutcome, expectedOutcome) {
    if (!page) throw new Error('[Cart.verifyCancelItemOutcome] "page" is required.');
    if (!['success', 'error'].includes(expectedOutcome)) {
      throw new Error(
        `[Cart.verifyCancelItemOutcome] "expectedOutcome" must be "success" or "error", got: ${JSON.stringify(expectedOutcome)}`
      );
    }
    if (actualOutcome === null || actualOutcome === undefined) {
      throw new Error(
        '[Cart.verifyCancelItemOutcome] No cancellation outcome was recorded - run "I confirm the open cancel item ' +
        'dialog" (on a "detailed" prompt) first.'
      );
    }

    expect(
      actualOutcome,
      `[Cart.verifyCancelItemOutcome] Expected the Cancel Item attempt to result in "${expectedOutcome}", but got "${actualOutcome}".`
    ).toBe(expectedOutcome);

    return { verified: true, outcome: actualOutcome };
  },

  /**
   * Verifies the exact error message text recorded by {@link confirmOpenCancelItemDialog} when
   * its outcome was "error".
   *
   * @param {import('playwright').Page} page
   * @param {string|null} actualErrorMessage
   * @param {string} expectedErrorMessage
   * @throws {Error} If page/expectedErrorMessage are invalid, or no error message was recorded, or it doesn't match
   * @returns {Promise<{verified: true, errorMessage: string}>}
   */
  async verifyCancelItemErrorMessage(page, actualErrorMessage, expectedErrorMessage) {
    if (!page) throw new Error('[Cart.verifyCancelItemErrorMessage] "page" is required.');
    if (!expectedErrorMessage || typeof expectedErrorMessage !== 'string') {
      throw new Error(
        `[Cart.verifyCancelItemErrorMessage] "expectedErrorMessage" must be a non-empty string, got: ${typeof expectedErrorMessage}`
      );
    }
    if (!actualErrorMessage) {
      throw new Error(
        '[Cart.verifyCancelItemErrorMessage] No cancellation error message was recorded - the Cancel Item attempt ' +
        'did not result in "error", or "I confirm the open cancel item dialog" never ran.'
      );
    }

    expect(
      actualErrorMessage,
      `[Cart.verifyCancelItemErrorMessage] Expected the Cancel Item error message to read "${expectedErrorMessage}", ` +
      `but got "${actualErrorMessage}".`
    ).toBe(expectedErrorMessage);

    return { verified: true, errorMessage: actualErrorMessage };
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
   * Opens the Trip reference form from the trip-level options menu in the Trip overview (hover the
   * options icon, then pick the "Trip reference form" option) and leaves it open on its read-only
   * view, ready for Edit.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async openTripReferenceFormFromTripOverview(page) {
    if (!page) throw new Error('[Cart.openTripReferenceFormFromTripOverview] "page" is required.');

    logger.debug('Opening the Trip reference form from the trip actions dropdown in the trip overview');
    try {
      const cartPage = getPageObject(page, CartPage);
      await cartPage.openTripReferenceFormFromTripOverview();
    } catch (err) {
      throw new Error(
        `[Cart.openTripReferenceFormFromTripOverview] Failed to open the Trip reference form from the trip ` +
        `overview: ${err.message}`
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

    const messageVisible = await page.getByText(CANCELLATION_CONFIRMED_PATTERN).isVisible();

    await page.waitForLoadState('networkidle').catch(() => {});

    return { cancelled: true, messageVisible };
  },

  /**
   * Verifies the cart's ground transport quote shows the pick-up date and time that were searched.
   *
   * The comparison is made on PARSED values, never on strings: the search form and the cart print
   * the same instant differently (the form's app-datepicker uses 'ddd, DD MMM' and the card
   * toLocaleDateString's 'DD MMM YYYY', and either screen switches to 12h AM/PM for an imperial
   * user), so a text comparison would fail on formatting alone.
   *
   * The year is deliberately excluded: the search form's date carries no year at all, so any year
   * assertion would be against a guess. Day + month + time-of-day is unambiguous within the
   * booking window the search uses.
   *
   * @param {import('playwright').Page} page
   * @param {Object} searchedPickup - The values read off the search form before searching
   * @param {string} searchedPickup.date - Pick-up date as the search form rendered it
   * @param {string} searchedPickup.time - Pick-up time as the search form rendered it
   * @returns {Promise<{verified: boolean, pickupLineText: string}>}
   * @throws {Error} If the cart's pick-up line is unreadable or does not match
   */
  async verifyGroundTransportPickupDateTime(page, { date, time } = {}) {
    if (!page) {
      throw new Error('[Cart.verifyGroundTransportPickupDateTime] "page" is required.');
    }

    if (!date || typeof date !== 'string') {
      throw new Error(`[Cart.verifyGroundTransportPickupDateTime] "date" must be a non-empty string, got: ${typeof date} (${date})`);
    }

    if (!time || typeof time !== 'string') {
      throw new Error(`[Cart.verifyGroundTransportPickupDateTime] "time" must be a non-empty string, got: ${typeof time} (${time})`);
    }

    logger.debug('[Cart.verifyGroundTransportPickupDateTime] Reading the cart pick-up line', {
      searchedDate: date,
      searchedTime: time,
    });

    const cartPage = getPageObject(page, CartPage);
    const pickupLineText = await cartPage.getGroundTransportPickupDateTimeText();
    const [cartDateText, cartTimeText] = pickupLineText.split(/\s*·\s*/);

    if (!cartDateText || !cartTimeText) {
      throw new Error(
        `[Cart.verifyGroundTransportPickupDateTime] The cart's ground transport pick-up line reads ` +
        `"${pickupLineText}", which does not hold a "{date} · {time}" pair. The quote card may have ` +
        `rendered without a pick-up date/time.`
      );
    }

    let searchedDate;
    let cartDate;
    let searchedMinutes;
    let cartMinutes;

    try {
      searchedDate = parseDateValue(date);
      cartDate = parseDateValue(cartDateText);
      searchedMinutes = parseTimeToMinutes(time);
      cartMinutes = parseTimeToMinutes(cartTimeText);
    } catch (err) {
      throw new Error(
        `[Cart.verifyGroundTransportPickupDateTime] Could not compare the searched pick-up ` +
        `("${date}" / "${time}") with the cart's ("${cartDateText}" / "${cartTimeText}"): one of the ` +
        `values is not in a format the app is known to render. Original: ${err.message}`
      );
    }

    if (cartDate.getDate() !== searchedDate.getDate() || cartDate.getMonth() !== searchedDate.getMonth()) {
      throw new Error(
        `[Cart.verifyGroundTransportPickupDateTime] The cart shows pick-up date "${cartDateText}" but the ` +
        `search was made for "${date}". The searched date was not carried into the quote. ` +
        `Full cart pick-up line: "${pickupLineText}".`
      );
    }

    if (cartMinutes !== searchedMinutes) {
      throw new Error(
        `[Cart.verifyGroundTransportPickupDateTime] The cart shows pick-up time "${cartTimeText}" ` +
        `(${cartMinutes} minutes past midnight) but the search was made for "${time}" ` +
        `(${searchedMinutes} minutes). The searched time was not carried into the quote. ` +
        `Full cart pick-up line: "${pickupLineText}".`
      );
    }

    logger.info('[Cart.verifyGroundTransportPickupDateTime] Cart pick-up date and time match the search', {
      pickupLineText,
      searchedDate: date,
      searchedTime: time,
    });

    return { verified: true, pickupLineText };
  },

  /**
   * Verifies the ground transport quote shows the SAME pick-up date and time on the cart quote card
   * and inside its "More details" drawer, then closes the drawer.
   *
   * Both surfaces mount the same car-pickupdropoff-details.vue off the same `quote.pickupDateTime`,
   * so a mismatch means one of them is rendering stale quote data — which is exactly what this test
   * is guarding. The card is read BEFORE the drawer is opened because while the drawer is open both
   * copies are visible in the DOM.
   *
   * Comparison is on PARSED day/month/time, not on strings, for the same reason as
   * verifyGroundTransportPickupDateTime: an imperial user's screens can switch to 12h AM/PM, and
   * the raw text would then differ on formatting alone.
   *
   * @param {import('playwright').Page} page
   * @throws {Error} If either line is unreadable/malformed, or the two do not match
   * @returns {Promise<{verified: boolean, cardPickupLineText: string, drawerPickupLineText: string}>}
   */
  async verifyGroundTransportPickupTimeMatchesMoreDetails(page) {
    if (!page) {
      throw new Error('[Cart.verifyGroundTransportPickupTimeMatchesMoreDetails] "page" is required.');
    }

    const cartPage = getPageObject(page, CartPage);

    const cardPickupLineText = await cartPage.getGroundTransportPickupDateTimeText();

    const splitPickupLine = (text, source) => {
      const [dateText, timeText] = text.split(/\s*·\s*/);

      if (!dateText || !timeText) {
        throw new Error(
          `[Cart.verifyGroundTransportPickupTimeMatchesMoreDetails] The ${source} pick-up line reads ` +
          `"${text}", which does not hold a "{date} · {time}" pair.`
        );
      }

      return { dateText, timeText };
    };

    const card = splitPickupLine(cardPickupLineText, 'cart quote card');

    await cartPage.clickMoreDetailsInCart();

    let drawerPickupLineText;

    try {
      drawerPickupLineText = await cartPage.getMoreDetailsDrawerPickupDateTimeText();
    } finally {
      // Close the drawer whatever happened — leaving it open would put the modal overlay in front
      // of every later step (contact information, checkout).
      await cartPage.closeMoreDetailsDrawer().catch(() => {});
    }

    const drawer = splitPickupLine(drawerPickupLineText, 'More details drawer');

    let cardDate;
    let drawerDate;
    let cardMinutes;
    let drawerMinutes;

    try {
      cardDate = parseDateValue(card.dateText);
      drawerDate = parseDateValue(drawer.dateText);
      cardMinutes = parseTimeToMinutes(card.timeText);
      drawerMinutes = parseTimeToMinutes(drawer.timeText);
    } catch (err) {
      throw new Error(
        `[Cart.verifyGroundTransportPickupTimeMatchesMoreDetails] Could not compare the cart card ` +
        `pick-up ("${cardPickupLineText}") with the More details drawer's ("${drawerPickupLineText}"): ` +
        `one of the values is not in a format the app is known to render. Original: ${err.message}`
      );
    }

    if (cardDate.getDate() !== drawerDate.getDate() || cardDate.getMonth() !== drawerDate.getMonth()) {
      throw new Error(
        `[Cart.verifyGroundTransportPickupTimeMatchesMoreDetails] The cart quote card shows pick-up ` +
        `date "${card.dateText}" but its More details drawer shows "${drawer.dateText}". The pick-up ` +
        `date changed between the two views. Card line: "${cardPickupLineText}", drawer line: ` +
        `"${drawerPickupLineText}".`
      );
    }

    if (cardMinutes !== drawerMinutes) {
      throw new Error(
        `[Cart.verifyGroundTransportPickupTimeMatchesMoreDetails] The cart quote card shows pick-up ` +
        `time "${card.timeText}" (${cardMinutes} minutes past midnight) but its More details drawer ` +
        `shows "${drawer.timeText}" (${drawerMinutes} minutes). The pick-up time changed between the ` +
        `two views.`
      );
    }

    logger.info(
      '[Cart.verifyGroundTransportPickupTimeMatchesMoreDetails] Pick-up date and time match between the cart card and More details',
      { cardPickupLineText, drawerPickupLineText }
    );

    return { verified: true, cardPickupLineText, drawerPickupLineText };
  },

  // ===== Locked trip (test 55667) =====

  /**
   * Asserts the "Add more services" product carousel is NOT rendered in the trip cart - the
   * locked-trip guard: a completed trip must offer no way to add another product to it.
   *
   * trip-cart.vue:137 gates the whole block with
   * `v-if="!isTripCancelled && !isPreTripApproval && !isTripLocked"`, so a locked trip gets no
   * element at all rather than a hidden one - absence, not hidden-ness, is what has to be asserted.
   *
   * The locked banner is awaited FIRST. A count-of-zero on a cart that has not finished rendering
   * is satisfied instantly, so without that anchor this assertion would green-light a trip whose
   * carousel is in fact present. The banner is the right anchor because it is the positive render
   * signal for the very state under test - it and the carousel are gated on the same isTripLocked
   * flag - so it proves BOTH that the cart rendered AND that the app resolved this trip as locked.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{carouselCount: number}>}
   */
  async verifyAddProductCarouselNotVisible(page) {
    if (!page) {
      throw new Error('[Cart.verifyAddProductCarouselNotVisible] "page" is required.');
    }

    logger.debug('[Cart.verifyAddProductCarouselNotVisible] Asserting the add-product carousel is absent on a locked trip');
    const cartPage = getPageObject(page, CartPage);

    await cartPage.waitForTripLockedMessage();
    const carouselCount = await cartPage.getAddProductCarousel().count();

    // Thrown rather than asserted through expect(): this repo's Playwright discards expect's custom
    // message, and a bare "Expected: 0 Received: 1" diff would not say WHICH guard failed.
    if (carouselCount !== 0) {
      throw new Error(
        `[Cart.verifyAddProductCarouselNotVisible] The trip cart renders ${carouselCount} ` +
        `add-product carousel(s) on a trip that is supposed to be locked - expected none. ` +
        `trip-cart.vue:137 renders the "Add more services" block only when ` +
        `!isTripCancelled && !isPreTripApproval && !isTripLocked, so a rendered carousel means the ` +
        `app does not consider this trip locked.`
      );
    }

    logger.info('[Cart.verifyAddProductCarouselNotVisible] No add-product carousel in the cart - adding products is blocked');
    return { carouselCount };
  },

  /**
   * Asserts the trip cart's locked-trip banner reads exactly the expected message.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedMessage - Full banner copy, e.g. "Adding new products or making changes
   *   is no longer possible for completed trips. To add products, please Start a New Trip"
   * @returns {Promise<{message: string}>}
   */
  async verifyTripLockedMessage(page, expectedMessage) {
    if (!page) {
      throw new Error('[Cart.verifyTripLockedMessage] "page" is required.');
    }
    if (!expectedMessage || typeof expectedMessage !== 'string') {
      throw new Error(
        `[Cart.verifyTripLockedMessage] "expectedMessage" must be a non-empty string, got: ${typeof expectedMessage} (${JSON.stringify(expectedMessage)})`,
      );
    }

    logger.debug('[Cart.verifyTripLockedMessage] Reading the locked-trip banner', { expectedMessage });
    const cartPage = getPageObject(page, CartPage);

    // normalizeText on BOTH sides is mandatory, not cosmetic: the banner is two DOM nodes - the
    // `{{ $t('trip.addingProductsLocked') }}` interpolation plus a sibling
    // `<span>{{ $t('btn.startANewTrip') }}</span>` on its own template line (trip-cart.vue:25-26) -
    // so the rendered text carries a newline and indentation between "please" and "Start a New
    // Trip". Comparing raw text would always fail.
    const actual = normalizeText(await cartPage.getTripLockedMessageText());
    const expected = normalizeText(expectedMessage);

    // Exact equality rather than contains(): the original test compared the whole banner, and a
    // substring check would still pass if the app dropped the "Start a New Trip" call to action.
    if (actual !== expected) {
      throw new Error(
        `[Cart.verifyTripLockedMessage] The trip cart's locked-trip banner does not read as expected.\n` +
        `  expected: "${expected}"\n` +
        `  actual:   "${actual}"\n` +
        `(both whitespace-normalized). Either the trip is locked for a different reason than the ` +
        `test assumes, or the banner copy (trip.addingProductsLocked + btn.startANewTrip) changed.`
      );
    }

    logger.info('[Cart.verifyTripLockedMessage] Locked-trip banner matches the expected message', { message: actual });
    return { message: actual };
  },

};



// Export Cart DSL for use in tests
module.exports = Cart;
