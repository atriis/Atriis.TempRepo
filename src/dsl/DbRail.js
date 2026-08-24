const { getPageObject } = require("@utils/pageObjectCache");
const { CartPage } = require("@pages/CartPage");
const { DbRailPage } = require("@pages/DbRailPage");
const logger = require("@utils/logger").child("DbRail");

/**
 * DbRail DSL
 *
 * High-level business actions for the Deutsche Bahn (DB Rail) punch-out flow started from the
 * trip overview. DB Rail has no search form: the user opens the DB drawer, is told the booking
 * will continue in a new window, punches out, and then asks the app to retrieve the resulting
 * order.
 */

// Supplier item text in the trip overview's Rail dropdown. product-carousel.vue renders the raw
// `rail.value` ("DB Rail") rather than the localised product label, matched loosely so a
// spacing/casing change in the app does not break the flow.
const DB_RAIL_CAROUSEL_ITEM = /DB\s*Rail/i;

// Pause between the punch-out click and the order-retrieval click, mirroring the 6s sleep the
// original Testim recording of this flow needs (see continueAndConfirmOrderRetrieval).
const PUNCH_OUT_SETTLE_MS = 6000;

// Both message texts come from the DBrail locale block (assets/locale/en.json). Apostrophes are
// matched permissively because the app mixes straight (') and typographic (’) forms across these
// strings, and the second sentence of the error is separated by a <br/> that leaves no whitespace
// in textContent — hence two independent fragments rather than one literal comparison.
const CONTINUE_INFO_MESSAGE = /Clicking ['’]Continue['’] will open a new booking window\..*return to this page to see it in your Trip Overview/i;
const ORDER_NOT_COMPLETED_FRAGMENTS = [
  /We['’]re having trouble finding your Deutsche Bahn order\./i,
  /Please check that you['’]ve completed all steps on the Deutsche Bahn site and try again\./i,
];

const DbRail = {
  /**
   * Opens the Deutsche Bahn booking drawer from the trip overview's "Add more services" carousel.
   *
   * The Rail tile is a supplier dropdown rather than a button, so this hovers it and picks
   * "DB Rail"; the DB form then renders inside the edit-search drawer in place, with the
   * pre-punch-out information message.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async openContinueActionFromTripOverview(page) {
    if (!page) throw new Error('[DbRail.openContinueActionFromTripOverview] "page" is required.');
    logger.debug('[DbRail.openContinueActionFromTripOverview] Opening the DB Rail drawer from the trip overview carousel');

    const cartPage = getPageObject(page, CartPage);
    const dbRailPage = getPageObject(page, DbRailPage);
    try {
      await cartPage.selectRailTypeFromCarousel(DB_RAIL_CAROUSEL_ITEM);
      await dbRailPage.waitForDrawerForm();
    } catch (err) {
      throw new Error(
        `[DbRail.openContinueActionFromTripOverview] Could not open the Deutsche Bahn booking ` +
        `drawer from the trip overview. The trip must be open on its overview and the user must ` +
        `have access to the DB Rail product for it to be listed in the Rail dropdown. ` +
        `Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the DB Rail drawer explains that Continue opens a new booking window.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async verifyContinueBookingInfoMessage(page) {
    if (!page) throw new Error('[DbRail.verifyContinueBookingInfoMessage] "page" is required.');
    logger.debug('[DbRail.verifyContinueBookingInfoMessage] Reading the DB Rail drawer information message');

    const dbRailPage = getPageObject(page, DbRailPage);
    const actual = await dbRailPage.getInfoMessageText();

    if (!CONTINUE_INFO_MESSAGE.test(actual)) {
      throw new Error(
        `[DbRail.verifyContinueBookingInfoMessage] The Deutsche Bahn drawer did not show the ` +
        `"continue in a new booking window" message. Expected text matching ` +
        `${CONTINUE_INFO_MESSAGE} but the drawer rendered: "${actual}". The drawer shows this copy ` +
        `only in edit-search mode; the second-stage copy ("Once you finalise the order…") means ` +
        `the punch-out already happened.`
      );
    }
  },

  /**
   * Punches out to Deutsche Bahn and then asks the app to retrieve the order.
   *
   * Clicking "Continue" always opens a popup tab — db-rail-search-inputs.ts calls window.open
   * before it knows whether the punch-out will succeed. The popup is left open until the drawer
   * has reached its second stage (so the app can still redirect it), then closed and the app tab
   * brought back to the front, because a background tab swallows the next click.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async continueAndConfirmOrderRetrieval(page) {
    if (!page) throw new Error('[DbRail.continueAndConfirmOrderRetrieval] "page" is required.');
    logger.debug('[DbRail.continueAndConfirmOrderRetrieval] Punching out to Deutsche Bahn and retrieving the order');

    const dbRailPage = getPageObject(page, DbRailPage);
    let punchOutTab = null;

    try {
      const popupPromise = page.context().waitForEvent('page', { timeout: 30000 });
      await dbRailPage.clickContinue();
      punchOutTab = await popupPromise;

      // Second stage only appears once the punch-out returned a Deutsche Bahn URL, so this doubles
      // as the wait for the punch-out call itself.
      await dbRailPage.waitForGoToTripButton();

      // The original Testim recording of this flow sleeps 6s between "Continue" and "Go to trip",
      // and the flow only works with that pause: the button renders as soon as the punch-out URL
      // comes back, while the Deutsche Bahn session behind it is still being established, and
      // retrieving the order too early answers before the backend can decide anything.
      await page.waitForTimeout(PUNCH_OUT_SETTLE_MS);

      await punchOutTab.close();
      punchOutTab = null;
      await page.bringToFront();

      await dbRailPage.clickGoToTrip();
    } catch (err) {
      if (punchOutTab) {
        await punchOutTab.close().catch(() => {});
        await page.bringToFront().catch(() => {});
      }
      throw new Error(
        `[DbRail.continueAndConfirmOrderRetrieval] Could not complete the Deutsche Bahn continue ` +
        `flow (punch out, then retrieve the order). The drawer must be open on the DB form and the ` +
        `traveller must be eligible to book Deutsche Bahn for the punch-out to return a booking ` +
        `URL. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the app reports that the Deutsche Bahn order could not be found because it was never
   * completed on the Deutsche Bahn site.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async verifyOrderNotCompletedErrorMessage(page) {
    if (!page) throw new Error('[DbRail.verifyOrderNotCompletedErrorMessage] "page" is required.');
    logger.debug('[DbRail.verifyOrderNotCompletedErrorMessage] Reading the DB Rail warning dialog');

    const dbRailPage = getPageObject(page, DbRailPage);
    const actual = await dbRailPage.getMessageDialogText();

    for (const fragment of ORDER_NOT_COMPLETED_FRAGMENTS) {
      if (!fragment.test(actual)) {
        throw new Error(
          `[DbRail.verifyOrderNotCompletedErrorMessage] The Deutsche Bahn warning dialog did not ` +
          `report an incomplete order. Expected text matching ${fragment} but the dialog read: ` +
          `"${actual}". A different message here means the backend answered with its own punch-out ` +
          `error instead of the "no order found" case this scenario covers.`
        );
      }
    }
  },
};

module.exports = DbRail;
