/**
 * LegacyGtp DSL
 *
 * High-level business actions for the legacy GTP front (AngularJS) — the application AGENTS use
 * to work trips requested via "Request assistance". Agent-assistance scenarios drive this site in
 * a SEPARATE browser tab so the corporate OBT page keeps its own session and state.
 */
const { getPageObject } = require("@utils/pageObjectCache");
const { LegacyGtpPage } = require("@pages/LegacyGtpPage");
const config = require("@config/config");
const logger = require("@utils/logger").child("LegacyGtp");

// The legacy front loads a CookieHub consent widget that renders a MODAL dialog
// (#ch2-dialog.ch2-visible) on every authenticated page load — consent is never persisted, so
// dismissing it once does not help: it returns after each navigation and its overlay intercepts
// every click. Blocking the widget's scripts keeps it from rendering at all (verified: login,
// trip view and the re-search links all work without it).
const CONSENT_SCRIPT_URL_PATTERN = /cookiehub|cookieconsent/i;

const LegacyGtp = {
  /**
   * Opens an ISOLATED browser context for the agent and returns it with its page.
   *
   * Isolation is required, not cosmetic: the legacy GTP front and the corporate OBT share the
   * gtp-staging.com domain, so a second tab in the corporate context would leak the corporate
   * session into the agent login — and signing the agent in would sign the corporate user out
   * mid-scenario.
   *
   * @param {import('@playwright/test').Browser} browser
   * @returns {Promise<{context: import('@playwright/test').BrowserContext, page: import('@playwright/test').Page}>}
   */
  async createAgentSession(browser) {
    if (!browser) throw new Error('[LegacyGtp.createAgentSession] "browser" is required.');
    logger.debug("Creating an isolated legacy GTP context for the agent");
    try {
      const context = await browser.newContext();
      await context.route(CONSENT_SCRIPT_URL_PATTERN, (route) => route.abort());
      const page = await context.newPage();
      return { context, page };
    } catch (err) {
      throw new Error(
        `[LegacyGtp.createAgentSession] Could not open an isolated browser context for the legacy GTP ` +
        `agent session. Original: ${err.message}`
      );
    }
  },

  /**
   * Opens the legacy GTP site and signs in as the given agent. If a previous session is still
   * active on the landing page, it is signed out first.
   *
   * @param {import('@playwright/test').Page} page - The legacy GTP tab (NOT the corporate page)
   * @param {string} email - Agent login email, e.g. "amy@deus.com"
   */
  async loginAsAgent(page, email) {
    if (!page) throw new Error('[LegacyGtp.loginAsAgent] "page" is required.');
    if (!email || typeof email !== "string") {
      throw new Error(`[LegacyGtp.loginAsAgent] "email" must be a non-empty string, got: ${typeof email}`);
    }
    logger.debug("Logging in to legacy GTP as agent", { email, url: config.legacyGtpUrl });

    const legacyGtpPage = getPageObject(page, LegacyGtpPage);
    try {
      await page.goto(config.legacyGtpUrl, { waitUntil: "domcontentloaded" });

      // A leftover session lands on the agent home instead of the login form — sign it out first.
      const loginFormShown = await legacyGtpPage
        .getLoginSubmitButton()
        .waitFor({ state: "visible", timeout: 10000 })
        .then(() => true)
        .catch(() => false);
      if (!loginFormShown) {
        await legacyGtpPage.clickSignOut();
      }

      await legacyGtpPage.fillUsername(email);
      await legacyGtpPage.fillPassword(config.password);
      await legacyGtpPage.clickLoginSubmit();
      await legacyGtpPage.waitForWelcomeLanding();
    } catch (err) {
      throw new Error(
        `[LegacyGtp.loginAsAgent] Could not sign in to the legacy GTP front (${config.legacyGtpUrl}) as ` +
        `"${email}". The site may be unreachable, the credentials rejected, or a leftover session could ` +
        `not be signed out. Original: ${err.message}`
      );
    }
    return { loggedIn: true, email };
  },

  /**
   * Navigates the agent directly to a requested trip by its number.
   *
   * @param {import('@playwright/test').Page} page - The legacy GTP tab
   * @param {string|number} tripNumber - The trip id captured on the corporate side
   */
  async openTrip(page, tripNumber) {
    if (!page) throw new Error('[LegacyGtp.openTrip] "page" is required.');
    if (!tripNumber || !/^\d+$/.test(String(tripNumber))) {
      throw new Error(
        `[LegacyGtp.openTrip] "tripNumber" must be a numeric trip id, got: ${JSON.stringify(tripNumber)}`
      );
    }
    const tripUrl = `${config.legacyGtpUrl}/Trip/${tripNumber}`;
    logger.debug("Opening trip in legacy GTP", { tripUrl });
    try {
      await page.goto(tripUrl, { waitUntil: "domcontentloaded" });
    } catch (err) {
      throw new Error(
        `[LegacyGtp.openTrip] Could not open the requested trip at ${tripUrl}. Original: ${err.message}`
      );
    }
    return { opened: true, tripNumber: String(tripNumber) };
  },

  /**
   * Re-searches the requested flight online and adds the first result to the trip cart.
   * The origin is re-typed (the agent may source the flight from a different airport than
   * requested); all other criteria come from the requested item.
   *
   * @param {import('@playwright/test').Page} page - The legacy GTP tab, already on the trip
   * @param {string} from - Origin airport query to type, e.g. "DOH"
   */
  async addFlightToTrip(page, from) {
    if (!page) throw new Error('[LegacyGtp.addFlightToTrip] "page" is required.');
    if (!from || typeof from !== "string") {
      throw new Error(`[LegacyGtp.addFlightToTrip] "from" must be a non-empty string, got: ${typeof from}`);
    }
    logger.debug("Agent adding flight to trip via legacy GTP", { from });

    const legacyGtpPage = getPageObject(page, LegacyGtpPage);
    try {
      await legacyGtpPage.clickReSearchLink("flight");
      await legacyGtpPage.typeFlightOrigin(from);
      await legacyGtpPage.selectFirstAutocompleteOption();
      await legacyGtpPage.clickFlightSearchButton();
      await legacyGtpPage.waitForFlightResults();
      await legacyGtpPage.clickAddFirstFlightToCart();
      await legacyGtpPage.waitForAddedIndicator();
      await legacyGtpPage.clickBackToTrip();
    } catch (err) {
      throw new Error(
        `[LegacyGtp.addFlightToTrip] Could not re-search and add a flight from "${from}" to the trip ` +
        `as the agent. Original: ${err.message}`
      );
    }
    return { added: true, from };
  },

  /**
   * Re-searches the requested car online and adds the first result to the trip cart.
   *
   * @param {import('@playwright/test').Page} page - The legacy GTP tab, already on the trip
   */
  async addCarToTrip(page) {
    if (!page) throw new Error('[LegacyGtp.addCarToTrip] "page" is required.');
    logger.debug("Agent adding car to trip via legacy GTP");

    const legacyGtpPage = getPageObject(page, LegacyGtpPage);
    try {
      await legacyGtpPage.clickReSearchLink("car");
      await legacyGtpPage.clickCarSearchButton();
      await legacyGtpPage.waitForCarResults();
      await legacyGtpPage.clickAddFirstCarToCart();
      await legacyGtpPage.waitForAddedIndicator();
      await legacyGtpPage.clickBackToTrip();
    } catch (err) {
      throw new Error(
        `[LegacyGtp.addCarToTrip] Could not re-search and add a car to the trip as the agent. ` +
        `Original: ${err.message}`
      );
    }
    return { added: true };
  },

  /**
   * Re-searches the requested hotel online and adds the first room of the first hotel to the
   * trip cart.
   *
   * @param {import('@playwright/test').Page} page - The legacy GTP tab, already on the trip
   */
  async addHotelToTrip(page) {
    if (!page) throw new Error('[LegacyGtp.addHotelToTrip] "page" is required.');
    logger.debug("Agent adding hotel to trip via legacy GTP");

    const legacyGtpPage = getPageObject(page, LegacyGtpPage);
    try {
      await legacyGtpPage.clickReSearchLink("hotel");
      await legacyGtpPage.clickHotelSearchButton();
      await legacyGtpPage.waitForHotelResults();
      await legacyGtpPage.clickFirstHotelPriceOffer();
      await legacyGtpPage.clickAddFirstRoomToCart();
      await legacyGtpPage.waitForAddedIndicator();
      await legacyGtpPage.clickBackToTrip();
    } catch (err) {
      throw new Error(
        `[LegacyGtp.addHotelToTrip] Could not re-search and add a hotel room to the trip as the agent. ` +
        `Original: ${err.message}`
      );
    }
    return { added: true };
  },
};

module.exports = LegacyGtp;
