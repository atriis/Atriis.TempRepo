/**
 * LegacyGtp DSL
 *
 * High-level business actions for the legacy GTP front (AngularJS) — the application AGENTS use
 * to work trips requested via "Request assistance". Agent-assistance scenarios drive this site in
 * a SEPARATE browser tab so the corporate OBT page keeps its own session and state.
 */
const { getPageObject } = require("@utils/pageObjectCache");
const { LegacyGtpPage } = require("@pages/LegacyGtpPage");
const AdministrationPage = require("@pages/AdministrationPage");
const config = require("@config/config");
const sessionOptions = require("@utils/sessionOptions");
const logger = require("@utils/logger").child("LegacyGtp");

// The legacy front loads a CookieHub consent widget that renders a MODAL dialog
// (#ch2-dialog.ch2-visible) on every authenticated page load — consent is never persisted, so
// dismissing it once does not help: it returns after each navigation and its overlay intercepts
// every click. Blocking the widget's scripts keeps it from rendering at all (verified: login,
// trip view and the re-search links all work without it).
const CONSENT_SCRIPT_URL_PATTERN = /cookiehub|cookieconsent/i;

// Any spelling of "non refundable" a supplier's cancellation policy might use — case-insensitive
// ("NON REFUNDABLE" counts) with space, hyphen or nothing between the words. Mirrors the
// LegacyGtpPage.REFUNDABLE_ROOM_ITEM CSS filter; addRefundableHotelToTrip re-checks the picked
// room against this pattern so the two can never silently disagree.
const NON_REFUNDABLE_POLICY_PATTERN = /non[\s-]*refundable/i;

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
      // The SAME per-scenario overrides the OBT context gets (App.createBrowserSession). Without
      // this an @timezone-tagged scenario would run the legacy GTP front in the runner's own zone
      // while the OBT ran in the tagged one — a half-applied timezone that reports green.
      const context = await browser.newContext({ ...sessionOptions.get() });
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
   * Takes the signed-in agent from the legacy GTP landing page into their agency's GTP Admin Center
   * (the "UNIGLOBE ALL Agencies" account for uniglobe@noam.com), following the landing page's own
   * administration link so the agency id is never hard-coded.
   *
   * @param {import('@playwright/test').Page} page - The legacy GTP tab of a signed-in agent
   * @returns {Promise<{agencyId: string, url: string}>}
   */
  async openAgencyAdministration(page) {
    if (!page) throw new Error('[LegacyGtp.openAgencyAdministration] "page" is required.');

    const legacyGtpPage = getPageObject(page, LegacyGtpPage);
    try {
      await page.goto(config.legacyGtpUrl, { waitUntil: "domcontentloaded" });
      const href = await legacyGtpPage.getAgencyAdministrationHref();
      const url = new URL(href, config.legacyGtpUrl).href;
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await getPageObject(page, AdministrationPage).waitForAgencyAdminMenuReady();

      const agencyId = (href.match(/\/AgencyAdministration\/(\d+)/) || [])[1] || "";
      logger.info("Agency GTP Admin Center is open", { agencyId, url });
      return { agencyId, url };
    } catch (err) {
      throw new Error(
        `[LegacyGtp.openAgencyAdministration] Could not open the agency administration from the legacy GTP ` +
        `landing page (${config.legacyGtpUrl}). Original: ${err.message}`
      );
    }
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
   * Re-searches the requested hotel through the requested item's "Search Online" link and adds
   * the first room of the first hotel to the trip cart. Nothing is typed into the search form —
   * destination and dates arrive pre-populated from the item the traveller requested.
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

  /**
   * Re-searches the requested hotel online and adds a REFUNDABLE room to the trip cart.
   *
   * Refundability has to be chosen, not assumed: the legacy front lists the cheapest rooms first
   * and those are routinely "Prepay non-refundable non-changeable" rates (3 of the 4 rooms of the
   * first hotel, on the run this was built against), so `addHotelToTrip`'s first-room pick lands
   * on a non-refundable rate most of the time. Each room carries its full policy in the title
   * attribute of its cancellation-policy span, which LegacyGtpPage.REFUNDABLE_ROOM_ITEM filters
   * case-insensitively across the "non refundable"/"non-refundable"/"nonrefundable" spellings —
   * and the picked room's policy is re-verified here against NON_REFUNDABLE_POLICY_PATTERN, so a
   * selector drift fails loudly instead of quietly adding a non-refundable room.
   *
   * A single hotel can offer only non-refundable rates, so hotels are walked in results order
   * until one has a refundable room — returning to the results list in between. Running out of
   * hotels is a hard failure, never a silent fall back to a non-refundable rate.
   *
   * @param {import('@playwright/test').Page} page - The legacy GTP tab, already on the trip
   * @param {object} [options]
   * @param {number} [options.maxHotels=5] - How many hotel results to try before giving up.
   * @returns {Promise<{added: boolean, hotelIndex: number, cancellationPolicy: string}>}
   */
  async addRefundableHotelToTrip(page, { maxHotels = 5 } = {}) {
    if (!page) throw new Error('[LegacyGtp.addRefundableHotelToTrip] "page" is required.');
    if (!Number.isInteger(maxHotels) || maxHotels < 1) {
      throw new Error(
        `[LegacyGtp.addRefundableHotelToTrip] "maxHotels" must be a positive integer, got: ${JSON.stringify(maxHotels)}`
      );
    }
    logger.debug("Agent adding a refundable hotel room to trip via legacy GTP", { maxHotels });

    const legacyGtpPage = getPageObject(page, LegacyGtpPage);
    try {
      await legacyGtpPage.clickReSearchLink("hotel");
      await legacyGtpPage.clickHotelSearchButton();
      await legacyGtpPage.waitForHotelResults();

      const hotelCount = await legacyGtpPage.getHotelResultCount();
      if (hotelCount === 0) {
        throw new Error("the hotel re-search returned no results at all");
      }
      const hotelsToTry = Math.min(hotelCount, maxHotels);

      for (let index = 0; index < hotelsToTry; index += 1) {
        await legacyGtpPage.clickHotelPriceOfferByIndex(index);
        await legacyGtpPage.waitForRoomList();

        // The rooms view renders only the first chunk of rooms (data-ng-repeat with |limitTo and
        // an infinite-scroll loadMore()) — a refundable room further down does not EXIST in the
        // DOM until the list is scrolled. Scroll ONLY while no rendered room qualifies: each pass
        // scrolls the last row into view to load the next chunk, and stops as soon as a refundable
        // room appears or the room count stops growing (list exhausted).
        let refundableRooms = await legacyGtpPage.getRefundableRoomCount();
        let renderedRooms = await legacyGtpPage.getRoomCount();
        const maxScrolls = 15;
        for (let scrolls = 0; refundableRooms === 0 && scrolls < maxScrolls; scrolls += 1) {
          await legacyGtpPage.scrollToLastRoom();
          // Brief settle so the infinite-scroll directive can append the next chunk; the
          // count-based exit below decides whether anything new actually rendered.
          await page.waitForTimeout(1000);
          const nowRendered = await legacyGtpPage.getRoomCount();
          refundableRooms = await legacyGtpPage.getRefundableRoomCount();
          if (refundableRooms === 0 && nowRendered === renderedRooms) break; // list exhausted
          renderedRooms = nowRendered;
        }

        if (refundableRooms === 0) {
          logger.debug("Hotel offers no refundable room — trying the next one", {
            index,
            roomsScanned: renderedRooms,
          });
          await legacyGtpPage.clickBackToHotelResults();
          await legacyGtpPage.waitForHotelResults();
          continue;
        }

        // Second line of defence: the CSS filter picked this room, but the DECISION is re-checked
        // here in code — a policy that still reads as non-refundable in any spelling/casing means
        // the selector no longer means what it did, and adding the room would be the exact mistake
        // this method exists to prevent.
        const cancellationPolicy = await legacyGtpPage.getFirstRefundableRoomPolicy();
        if (NON_REFUNDABLE_POLICY_PATTERN.test(cancellationPolicy) || cancellationPolicy.trim() === "") {
          throw new Error(
            `the room selected as refundable carries the cancellation policy ` +
            `"${cancellationPolicy}", which still reads as non-refundable (or empty) — the ` +
            `refundable-room selector no longer matches what the legacy front renders`
          );
        }

        await legacyGtpPage.clickAddFirstRefundableRoomToCart();
        await legacyGtpPage.waitForAddedIndicator();
        await legacyGtpPage.clickBackToTrip();

        logger.info("Agent added a refundable hotel room to the trip", { hotelIndex: index, cancellationPolicy });
        return { added: true, hotelIndex: index, cancellationPolicy };
      }

      throw new Error(
        `none of the first ${hotelsToTry} of ${hotelCount} hotel results offered a refundable room ` +
        `(every rate read as non-refundable or carried no cancellation policy)`
      );
    } catch (err) {
      throw new Error(
        `[LegacyGtp.addRefundableHotelToTrip] Could not re-search and add a REFUNDABLE hotel room to ` +
        `the trip as the agent: ${err.message}`
      );
    }
  },
  /**
   * Records every seat save the agent's tab posts (api/QuotesService/SaveSeatSelection): the seats
   * the browser sent and what the server answered per seat. Call before saving.
   *
   * @param {import('@playwright/test').Page} page - The legacy GTP tab
   * @returns {Array<{status: number, sent: object[], answered: object[]}>} Live list, filled as saves complete
   */
  startRecordingSeatSaves(page) {
    if (!page) throw new Error('[LegacyGtp.startRecordingSeatSaves] "page" is required.');
    const saves = [];
    page.on("response", async (response) => {
      if (!/\/api\/QuotesService\/SaveSeatSelection/i.test(response.url())) return;
      let request = null;
      let body = null;
      try { request = response.request().postDataJSON(); } catch { /* no JSON body */ }
      try { body = await response.json(); } catch { /* non-JSON answer */ }
      saves.push({
        status: response.status(),
        sent: ((request && request.Seats) || []).map((seat) => ({
          seatNumber: seat.SeatNumber,
          segmentNumber: String(seat.SegmentNumber),
          flightNumber: seat.FlightNumber,
          carrier: seat.Carrier,
        })),
        // The answer is grouped per passenger: [[seat, seat], ...]
        answered: (Array.isArray(body) ? body.flat() : []).filter(Boolean).map((seat) => ({
          seat: seat.Seat,
          segmentNumber: String(seat.SegmentNumber),
          isSuccess: seat.IsSuccess,
          errorMsg: seat.ErrorMsg,
        })),
      });
    });
    logger.debug("Recording legacy GTP seat saves");
    return saves;
  },

  /**
   * Opens a flight quote's seat popup and picks ONE seat number that every flight of the quote
   * offers, on every flight — the "same seat on both legs" shape of ADO 84961.
   *
   * @param {import('@playwright/test').Page} page - The legacy GTP tab, on the trip cart
   * @param {number} quoteIndex - 0-based position of the flight quote in the cart
   * @returns {Promise<{seat: string, flights: string[]}>}
   */
  async pickSameSeatOnEveryFlight(page, quoteIndex = 0) {
    if (!page) throw new Error('[LegacyGtp.pickSameSeatOnEveryFlight] "page" is required.');
    const legacyGtpPage = getPageObject(page, LegacyGtpPage);
    try {
      await legacyGtpPage.waitForSeatingTab();
      await legacyGtpPage.clickSeatingTab(quoteIndex);
      await legacyGtpPage.waitForSeatMap();

      const flightCount = await legacyGtpPage.getSeatPopupFlightCount();
      if (flightCount < 2) {
        throw new Error(`the seat popup lists ${flightCount} flight(s); the same-seat check needs at least two`);
      }

      const maps = [];
      for (let i = 0; i < flightCount; i++) {
        if (i > 0) {
          await legacyGtpPage.clickSeatPopupFlight(i);
          await legacyGtpPage.waitForSeatMap();
        }
        maps.push(await legacyGtpPage.getCurrentSeatMap());
      }

      const seat = maps[0].seats.find(
        (number) => maps.every((map) => map.seats.includes(number) && !map.selected.includes(number))
      );
      if (!seat) {
        throw new Error(
          `no seat number is offered on every flight (${maps.map((m) => `${m.flight}: ${m.seats.length} seats`).join(", ")})`
        );
      }

      for (let i = 0; i < flightCount; i++) {
        await legacyGtpPage.clickSeatPopupFlight(i);
        await legacyGtpPage.waitForSeatMap();
        await legacyGtpPage.clickSeat(seat);
      }

      const flights = maps.map((m) => m.flight);
      logger.info("Agent picked the same seat on every flight", { seat, flights });
      return { seat, flights };
    } catch (err) {
      throw new Error(
        `[LegacyGtp.pickSameSeatOnEveryFlight] Could not pick the same seat on every flight of flight quote ` +
        `#${quoteIndex + 1}: ${err.message}`
      );
    }
  },

  /**
   * Clicks the seat popup's Save and waits for the save to come back.
   *
   * @param {import('@playwright/test').Page} page - The legacy GTP tab, seat popup open
   * @param {Array} saves - The recorder returned by startRecordingSeatSaves
   * @returns {Promise<object>} The recorded save
   */
  async saveSeats(page, saves, { timeout = 120000 } = {}) {
    if (!page) throw new Error('[LegacyGtp.saveSeats] "page" is required.');
    if (!Array.isArray(saves)) {
      throw new Error('[LegacyGtp.saveSeats] No seat-save recorder. Start recording the seat saves before saving.');
    }
    const legacyGtpPage = getPageObject(page, LegacyGtpPage);
    const before = saves.length;
    await legacyGtpPage.clickSeatPopupSave();
    const started = Date.now();
    while (saves.length === before) {
      if (Date.now() - started > timeout) {
        throw new Error(`[LegacyGtp.saveSeats] No SaveSeatSelection response within ${timeout}ms of clicking Save.`);
      }
      await page.waitForTimeout(1000);
    }
    return saves[saves.length - 1];
  },

  /**
   * Reloads the trip cart and returns every flight quote's Seating tab text.
   *
   * @param {import('@playwright/test').Page} page - The legacy GTP tab
   * @returns {Promise<string[]>}
   */
  async getSeatingStatusesAfterReload(page) {
    if (!page) throw new Error('[LegacyGtp.getSeatingStatusesAfterReload] "page" is required.');
    const legacyGtpPage = getPageObject(page, LegacyGtpPage);
    await page.reload({ waitUntil: "domcontentloaded" });
    await legacyGtpPage.waitForSeatingTab();
    return legacyGtpPage.getSeatingTabTexts();
  },
};

module.exports = LegacyGtp;
