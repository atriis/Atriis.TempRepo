const { getPageObject } = require("@utils/pageObjectCache");
const AmtrakResultsPage = require("@pages/AmtrakResultsPage");
const { CommonPage } = require("@pages/CommonPage");
const { ResultsPage } = require("@pages/ResultsPage");
const Cart = require("./Cart");
const Results = require("./Results");
const logger = require("@utils/logger").child("AmtrakResults-DSL");

/**
 * AmtrakResults DSL
 *
 * Business actions performed on the Amtrak results list.
 */
const AmtrakResults = {
  /**
   * Adds the first Amtrak one-way result to the trip.
   *
   * The Amtrak results list renders "Select" on every result card and only reveals "Add to trip"
   * once a result is selected, so the plain "add the first result" flow
   * (Results.waitAndClickAddToTripButton) waits for a button that is not on screen yet. This drives
   * the two-click sequence the page actually requires.
   *
   * Selects the first result whose Select button is enabled rather than the first result outright:
   * the app disables Select on restricted trains (a return leg's early departures, for one), and
   * those sort to the top of the list, so the shared "click the first Select" helper would sit on a
   * permanently disabled button until it times out.
   * @param {import('playwright').Page} page
   * @returns {Promise<{addedToTrip: boolean}>}
   */
  async addAmtrakOneWayToTrip(page) {
    if (!page) throw new Error("page is required");

    const amtrakResultsPage = getPageObject(page, AmtrakResultsPage);
    await amtrakResultsPage.clickFirstEnabledSelectButton();
    await Results.waitAndClickAddToTripButton(page);
    return { addedToTrip: true };
  },

  /**
   * Opens the "More details" drawer of the first Amtrak result.
   * @param {import('playwright').Page} page
   * @returns {Promise<{opened: boolean}>}
   */
  async openMoreDetailsForFirstResult(page) {
    if (!page) throw new Error("page is required");

    const amtrakResultsPage = getPageObject(page, AmtrakResultsPage);
    await amtrakResultsPage.clickMoreDetailsButton();
    return { opened: true };
  },

  /**
   * Sends a price offer for a round-trip Amtrak search straight from the results page.
   *
   * Share mode on the Amtrak results is per city pair: only the trains of the pair currently on
   * screen can be added, so the offer is built by adding the first train of the outbound pair,
   * moving to the next city pair, and adding the first train there. Only then does the share bar's
   * email button open the share dialog, whose preview must show the train offer before it is sent.
   *
   * Leaves the page in share mode with the share bar still open — exit it with
   * FlightResults.exitShareMode ("I exit share mode") when the scenario goes on using the results.
   *
   * @param {import('playwright').Page} page
   * @param {string} [expectedOfferText="Train Offer"] - Text the email preview must contain
   * @returns {Promise<{shared: boolean, cityPairs: number}>}
   */
  async sharePriceOfferFromResults(page, expectedOfferText = "Train Offer") {
    if (!page) throw new Error("page is required");

    const amtrakResultsPage = getPageObject(page, AmtrakResultsPage);
    const resultsPage = getPageObject(page, ResultsPage);
    const commonPage = getPageObject(page, CommonPage);

    logger.info("Entering Amtrak results share mode");
    await resultsPage.waitForShareMainButton();
    await resultsPage.clickShareMainButton();

    logger.info("Adding the first train of the outbound city pair to the price offer");
    await amtrakResultsPage.clickFirstResultShareButton();
    await amtrakResultsPage.waitForFirstResultAddedToShare();

    logger.info("Moving to the next city pair");
    await amtrakResultsPage.clickNextCityPairButton();
    await amtrakResultsPage.waitForFirstResultShareButton();

    logger.info("Adding the first train of the return city pair to the price offer");
    await amtrakResultsPage.clickFirstResultShareButton();
    await amtrakResultsPage.waitForFirstResultAddedToShare();

    logger.info("Opening the share email dialog from the share bar");
    await resultsPage.clickShareQuoteToGetEmailPopUp();
    await commonPage.waitForSubjectLabelSharePopUp();

    await Cart.verifySharePreviewContainsText(page, expectedOfferText);

    logger.info("Sending the Amtrak price offer");
    await Cart.sendQuoteAndWaitForSuccess(page);

    return { shared: true, cityPairs: 2 };
  },

  /**
   * Reads the "Supplier Terms & Conditions" link from the open Fare Rules dialog. The assertion
   * itself belongs to the step.
   * @param {import('playwright').Page} page
   * @returns {Promise<{text: string, target: string|null, href: string|null}>}
   */
  async getFareRulesSupplierTermsLink(page) {
    if (!page) throw new Error("page is required");

    const amtrakResultsPage = getPageObject(page, AmtrakResultsPage);
    return amtrakResultsPage.getFareRulesSupplierTermsLink();
  },

  /**
   * Reads the classes card heading of the open "More details" drawer.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} e.g. "Available Classes And Fares"
   */
  async getMoreDetailsClassesTitle(page) {
    if (!page) throw new Error("page is required");

    const amtrakResultsPage = getPageObject(page, AmtrakResultsPage);
    return amtrakResultsPage.getMoreDetailsClassesTitleText();
  },

  /**
   * Selects the train from inside the open "More details" drawer, which is what the drawer's footer
   * Select button does: it commits that train for the city pair and closes the drawer, moving a
   * round-trip search on to the next pair's list.
   * @param {import('playwright').Page} page
   * @returns {Promise<{selected: boolean}>}
   */
  async selectRailFromMoreDetails(page) {
    if (!page) throw new Error("page is required");

    const amtrakResultsPage = getPageObject(page, AmtrakResultsPage);
    await amtrakResultsPage.clickMoreDetailsSelectButton();
    await amtrakResultsPage.waitForMoreDetailsDrawerToClose();
    return { selected: true };
  },
};

module.exports = AmtrakResults;
