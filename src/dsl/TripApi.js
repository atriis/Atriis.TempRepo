const logger = require("@utils/logger").child("TripApi");

/**
 * GetTrip (api/v3/trips) DSL
 *
 * Reads a trip the way the GetTrip Postman call does, but with the logged-in user's own app session:
 * the bearer token and APIM subscription key are taken from the app's api/v3 calls, and the API host
 * is the one the app talks to, so the same steps work on atriis-dev.app and atriis-stg.app. GetTrip
 * authorizes the caller against the trip, so the trip owner's session is enough.
 *
 * The recorder also keeps the flight class each search result offered per flight, so a GetTrip
 * value can be compared with what the supplier returned at search time.
 */
const TripApi = {
  /**
   * Starts recording the app's api/v3 session. Call it after login and before the search.
   *
   * @param {import('playwright').Page} page
   * @returns {{ origin: string|null, headers: object|null, agencyId: number|null, searchedFlightClasses: Map<string, string> }}
   */
  startRecording(page) {
    if (!page) {
      throw new Error("[TripApi.startRecording] page is required");
    }

    const recorder = { origin: null, headers: null, agencyId: null, searchedFlightClasses: new Map() };
    const context = page.context();
    const isFlightSearch = (url) => /\/api\/v3\/flightSearch(\?|$)/i.test(url);

    context.on("request", (request) => {
      const url = request.url();
      if (!/\/api\/v3\//i.test(url) || request.method() === "OPTIONS") {
        return;
      }
      const headers = request.headers();
      if (headers.authorization && headers.authorization.startsWith("Bearer ")) {
        recorder.origin = new URL(url).origin;
        recorder.headers = { authorization: headers.authorization };
        if (headers["ocp-apim-subscription-key"]) {
          recorder.headers["ocp-apim-subscription-key"] = headers["ocp-apim-subscription-key"];
        }
      }
      if (isFlightSearch(url) && request.method() === "POST") {
        try {
          recorder.agencyId = JSON.parse(request.postData() || "null")?.agencyId ?? recorder.agencyId;
        } catch (err) {
          logger.debug("Skipped a flight search request body", { error: err.message });
        }
      }
    });

    context.on("response", async (response) => {
      if (!isFlightSearch(response.url()) || response.request().method() === "OPTIONS") {
        return;
      }
      try {
        const body = JSON.parse(await response.text());
        for (const group of Array.isArray(body) ? body : [body]) {
          for (const pkg of group?.results || []) {
            for (const flight of (pkg.segments || []).flatMap((s) => s.flights || [])) {
              recorder.searchedFlightClasses.set(`${flight.carrier}${flight.flightNumber}`, flight.flightClass);
            }
          }
        }
      } catch (err) {
        // A body that is not JSON (or is gone after a navigation) is not one we need.
        logger.debug("Skipped a flight search response", { error: err.message });
      }
    });

    logger.info("Recording the app api/v3 session for GetTrip");
    return recorder;
  },

  /**
   * POSTs GetTrip for a trip with the recorded session.
   *
   * @param {object} recorder - from startRecording
   * @param {number|string} tripId
   * @returns {Promise<object>} the GetTrip response
   */
  async getTrip(recorder, tripId) {
    if (!recorder || !recorder.headers || !recorder.origin) {
      throw new Error("[TripApi.getTrip] No app api/v3 call was recorded. Start recording after login and before the search.");
    }
    if (!tripId) {
      throw new Error("[TripApi.getTrip] tripId is required");
    }

    const body = { TripId: Number(tripId), AgencyId: recorder.agencyId };
    const startedAt = Date.now();
    const response = await fetch(`${recorder.origin}/api/v3/trips`, {
      method: "POST",
      headers: { ...recorder.headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    logger.info("GetTrip call", { tripId: body.TripId, agencyId: body.AgencyId, status: response.status, durationMs: Date.now() - startedAt });

    if (!response.ok) {
      throw new Error(`[TripApi.getTrip] GetTrip for trip ${tripId} answered HTTP ${response.status}: ${text.slice(0, 300)}`);
    }
    return JSON.parse(text);
  },

  /**
   * Every flight of a carrier across the trip's flight quotes.
   *
   * @param {object} trip - GetTrip response
   * @param {string} carrierCode - e.g. "W6"
   * @returns {Array<object>}
   */
  getFlightsByCarrier(trip, carrierCode) {
    const flights = (trip?.FlightQuotes || []).flatMap((quote) => quote.Flights || []);
    const matching = flights.filter((flight) => flight.Carrier === carrierCode);
    if (matching.length === 0) {
      const carriers = [...new Set(flights.map((flight) => flight.Carrier))];
      throw new Error(`[TripApi.getFlightsByCarrier] Trip ${trip?.TripId} has no ${carrierCode} flight. Carriers on the trip: ${carriers.join(", ") || "none"}`);
    }
    return matching;
  },
};

module.exports = TripApi;
