const { getPageObject } = require("@utils/pageObjectCache");
const LoginPage = require("@pages/LoginPage");
const config = require("@config/config");
const logger = require("@utils/logger").child("ApiV1Flights");

/**
 * Public API V1 flights DSL
 *
 * Drives the flow the Amsalem website uses — seat map, pricing and hold over the public API V1 —
 * against a flight package found through the app.
 *
 * Why the package comes from the app: on atriis-dev.app `api/v1/flightsearch` answers
 * {"Results":[]} without calling any supplier (seen on #85643 for every route and user tried). The
 * app's V3 search writes its packages to the same package cache, under the result group's cacheKey
 * plus the package's PackageKey, and V1 seat map / pricing / hold all read packages from there. So a
 * V1 call made with that cacheKey as Guid is the same call the website makes after its own search.
 *
 * Authentication: V1 accepts any IdentityServer bearer token, so the logged-in user's app token is
 * reused — captured from the app's own api/v3 calls, never typed into a feature.
 */
const ApiV1Flights = {
  /**
   * Starts recording the app traffic V1 needs: the bearer token, and every flight search request
   * (which carries the user's agency and corporate context) and response. Call it after login and
   * before the search.
   *
   * @param {import('playwright').Page} page
   * @returns {{ token: string|null, searchRequest: object|null, searches: Array<object> }}
   */
  startRecording(page) {
    if (!page) {
      throw new Error("[ApiV1Flights.startRecording] page is required");
    }

    const recorder = { token: null, searchRequest: null, searches: [] };
    const context = page.context();
    const isFlightSearch = (url) => /\/api\/v3\/flightSearch(\?|$)/i.test(url);

    context.on("request", (request) => {
      const auth = request.headers()["authorization"];
      if (auth && auth.startsWith("Bearer ") && /\/api\/v3\//i.test(request.url())) {
        recorder.token = auth.slice("Bearer ".length);
      }
      if (isFlightSearch(request.url()) && request.method() === "POST") {
        try {
          recorder.searchRequest = JSON.parse(request.postData() || "null");
        } catch (err) {
          logger.debug("Skipped a flight search request body", { error: err.message });
        }
      }
    });

    context.on("response", async (response) => {
      const url = response.url();
      if (response.request().method() === "OPTIONS") {
        return;
      }
      try {
        if (isFlightSearch(url)) {
          recorder.searches.push(JSON.parse(await response.text()));
        }
      } catch (err) {
        // A response body that is not JSON (or is gone after a navigation) is not one we need.
        logger.debug("Skipped a recorded response", { url, error: err.message });
      }
    });

    logger.info("Recording app traffic for API V1");
    return recorder;
  },

  /**
   * Picks the first direct, one-flight package of a carrier from the last recorded search.
   *
   * @param {object} recorder - from startRecording
   * @param {string} carrierCode - e.g. "OS"
   * @returns {{ guid: string, packageKey: string, sourceSystem: string, flight: object }}
   */
  selectRecordedPackage(recorder, carrierCode) {
    const search = recorder && recorder.searches[recorder.searches.length - 1];
    if (!search) {
      throw new Error("[ApiV1Flights.selectRecordedPackage] No flight search was recorded. Start recording before the search.");
    }

    const groups = Array.isArray(search) ? search : [search];
    for (const group of groups) {
      for (const pkg of group.results || []) {
        const flights = (pkg.segments || []).flatMap((s) => s.flights || []);
        if (flights.length === 1 && flights[0].carrier === carrierCode) {
          const selected = {
            guid: group.cacheKey,
            packageKey: pkg.packageKey,
            sourceSystem: pkg.sourceSystem,
            flight: {
              flightNumber: flights[0].flightNumber,
              carrier: flights[0].carrier,
              origin: flights[0].origin,
              destination: flights[0].destCode,
            },
          };
          logger.info("Selected recorded package for API V1", selected);
          return selected;
        }
      }
    }

    const offered = [...new Set(groups.flatMap((g) => (g.results || []).map((p) => p.segments?.[0]?.flights?.[0]?.carrier)))];
    throw new Error(
      `[ApiV1Flights.selectRecordedPackage] No direct ${carrierCode} flight in the recorded search. Carriers offered: ${offered.join(", ") || "none"}`
    );
  },

  /**
   * The V1 user context (agency, branch, corporate user/group) of the logged-in user: the app's own
   * flight search request carries agencyId and user {id, corporateId, corporateGroupId}; the branch
   * is the token's org-unit claim.
   *
   * @param {object} recorder - from startRecording
   */
  getUserContext(recorder) {
    const search = recorder && recorder.searchRequest;
    if (!recorder || !recorder.token || !search || !search.user) {
      throw new Error("[ApiV1Flights.getUserContext] The app token or the flight search request was not recorded. Start recording before the search.");
    }

    const claims = JSON.parse(Buffer.from(recorder.token.split(".")[1], "base64").toString("utf8"));
    return {
      agencyId: search.agencyId,
      branchId: Number(claims["http://www.atriis.com/orgunitid"]),
      user: { Id: search.user.id, CorporateId: search.user.corporateId, CorporateGroupId: search.user.corporateGroupId },
    };
  },

  /**
   * POSTs one public API V1 call with the recorded app token.
   *
   * @param {object} recorder - from startRecording
   * @param {string} endpoint - e.g. "flightseatmap"
   * @param {object} body
   */
  async post(recorder, endpoint, body) {
    const url = new URL(endpoint, config.apiV1BaseUrl).toString();
    const startedAt = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${recorder.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    logger.info("API V1 call", { endpoint, status: response.status, durationMs: Date.now() - startedAt });

    if (!response.ok) {
      throw new Error(`[ApiV1Flights.post] ${endpoint} answered HTTP ${response.status}: ${text.slice(0, 300)}`);
    }
    return JSON.parse(text);
  },

  /**
   * Requests the seat map with TripId 0 — before any trip exists, as the website does. The seat
   * map is then cached under a pseudo-trip, which is the #85643 condition.
   */
  async getSeatMapWithoutTrip(recorder, selected) {
    const context = this.getUserContext(recorder);
    const seatMap = await this.post(recorder, "flightseatmap", {
      Guid: selected.guid,
      PackageKey: selected.packageKey,
      FlightNumber: selected.flight.flightNumber,
      Carrier: selected.flight.carrier,
      Origin: selected.flight.origin,
      Destination: selected.flight.destination,
      AgencyId: context.agencyId,
      TripId: 0,
    });

    if (!seatMap.Success) {
      throw new Error(`[ApiV1Flights.getSeatMapWithoutTrip] Seat map failed: ${seatMap.Error || "no error text"}`);
    }
    return seatMap;
  },

  /**
   * The first available seat that carries a price.
   *
   * @returns {{ rowNumber: string, seatNumber: string, price: number, currency: string }}
   */
  findFirstPaidAvailableSeat(seatMap) {
    for (const row of seatMap.Rows || []) {
      for (const seat of row.Seats || []) {
        if (seat.SeatAvailability && seat.Price > 0) {
          return { rowNumber: row.RowNumber, seatNumber: seat.SeatNumber, price: seat.Price, currency: seat.Currency };
        }
      }
    }
    throw new Error("[ApiV1Flights.findFirstPaidAvailableSeat] The seat map has no available paid seat.");
  },

  /**
   * Prices the package with TripId 0, which creates the trip and its quote.
   *
   * @returns {{ tripId: number, quoteId: number }}
   */
  async priceCreatingTrip(recorder, selected) {
    const context = this.getUserContext(recorder);
    const pricing = await this.post(recorder, "pricing", {
      TripId: 0,
      AgencyId: context.agencyId,
      BranchId: context.branchId,
      User: context.user,
      FlightValidationItems: [{ Guid: selected.guid, PackageKey: selected.packageKey, SetAsChosen: true }],
    });

    const item = (pricing.PricingFlightItems || [])[0];
    if (!pricing.TripId || !item || !item.IsSuccess || !item.IsAvailable) {
      throw new Error(
        `[ApiV1Flights.priceCreatingTrip] Pricing did not return an available quote: ${pricing.ErrorMessage || item?.Message || JSON.stringify(item || {}).slice(0, 300)}`
      );
    }
    return { tripId: pricing.TripId, quoteId: item.QuoteId };
  },

  /**
   * Holds the trip with one seat-map seat for one adult.
   *
   * V1 PassengerId is 0-based: the Farelogix seat request sends TravelerIDRef = PassengerId + 1, so
   * PassengerId 1 on a one-traveller trip is answered "Invalid TravelerIDRef" and no seat is stored.
   *
   * @returns {{ pnr: string, quote: object }}
   */
  async holdWithSeat(recorder, selected, trip, seat, traveler) {
    const context = this.getUserContext(recorder);
    const hold = await this.post(recorder, "holdbooking", {
      TripId: trip.tripId,
      AgencyId: context.agencyId,
      BranchId: context.branchId,
      ContactInfo: { FullName: `${traveler.firstName} ${traveler.lastName}`, Email: traveler.email, PhoneNumber: traveler.phone },
      Travelers: [
        {
          PassengerId: 0,
          PassengerRefId: 0,
          Title: traveler.title,
          FirstName: traveler.firstName,
          LastName: traveler.lastName,
          BirthDate: traveler.birthDate,
          TravelerType: 0,
          Email: traveler.email,
          Phone: traveler.phone,
        },
      ],
      FlightBookingItems: [
        {
          Guid: selected.guid,
          PackageKey: selected.packageKey,
          QuoteId: trip.quoteId,
          SeatSegments: [
            {
              Origin: selected.flight.origin,
              DestCode: selected.flight.destination,
              FlightNumber: selected.flight.flightNumber,
              Carrier: selected.flight.carrier,
              TravelerSeats: [{ PassengerId: 0, RowNumber: seat.rowNumber, SeatNumber: seat.seatNumber, SeatType: 1 }],
            },
          ],
        },
      ],
    });

    const quote = (hold.FlightQuote || [])[0];
    if (!quote || !quote.IsSuccess || !quote.Pnr) {
      throw new Error(`[ApiV1Flights.holdWithSeat] Hold did not return a PNR: ${hold.ErrorMessage || JSON.stringify(quote || hold).slice(0, 300)}`);
    }
    return { pnr: quote.Pnr, quote };
  },

  /**
   * Opens a trip's cart in the app and dismisses the cookie banner, which otherwise blocks the
   * trip actions menu. Builds the URL without a doubled slash: AUTOMATION_APP_BASEURL usually ends
   * in "/", and "//trips/..." is a 404.
   */
  async openTripCart(page, tripId) {
    const base = config.baseUrl.replace(/\/+$/, "");
    await page.goto(`${base}/trips/${tripId}/cart`, { waitUntil: "domcontentloaded" });
    await getPageObject(page, LoginPage).acceptCookiesIfPresent(10000);
  },
};

module.exports = ApiV1Flights;
