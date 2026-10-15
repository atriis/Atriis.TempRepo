require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { LegacyGtp } = require("@dsl");
const logger = require("@utils/logger").child("LegacyGtp");

setDefaultTimeout(120000);

/**
 * Agent-assistance steps that drive the LEGACY GTP front (AngularJS) as the agent.
 *
 * The agent works in a SEPARATE browser tab (this.legacyGtpPage) so the corporate page
 * (this.page) keeps its session and stays on the trip — a later "I refresh the page" on the
 * corporate side then picks up whatever the agent added.
 */

/**
 * Returns the legacy GTP tab, failing with a clear message when the login step did not run.
 * @param {object} world - Cucumber World (`this`)
 * @returns {import('@playwright/test').Page}
 */
function requireLegacyGtpPage(world) {
  if (!world.legacyGtpPage) {
    throw new Error(
      'No legacy GTP tab on the World. Run "I log in to legacy GTP as the agent ..." before this step.'
    );
  }
  return world.legacyGtpPage;
}

When("I log in to legacy GTP as the agent {string}", async function (email) {
  logger.info("Logging in to legacy GTP as the agent in an isolated context", { email });
  if (!this.browser) {
    throw new Error(
      "No browser on the World. A corporate login step (e.g. 'I am logged in as ... booking a new trip') must run first."
    );
  }
  const session = await LegacyGtp.createAgentSession(this.browser);
  this.legacyGtpContext = session.context;
  this.legacyGtpPage = session.page;
  // Kept so teardown can sign the same agent back in if this tab is gone (see administration.steps.js).
  this.legacyGtpAgentEmail = email;
  await LegacyGtp.loginAsAgent(this.legacyGtpPage, email);
});

When("I open the current trip in legacy GTP as the agent", async function () {
  if (!this.tripId) {
    throw new Error(
      'No trip id on the World. The trip id is captured by "I am logged in as ... booking a new trip" — ensure that step ran and the trip was created.'
    );
  }
  logger.info("Opening the current trip in legacy GTP as the agent", { tripId: this.tripId });
  await LegacyGtp.openTrip(requireLegacyGtpPage(this), this.tripId);
});

When("I add a flight to the trip as the agent from {string}", async function (from) {
  logger.info("Agent re-searching and adding a flight to the trip", { from });
  await LegacyGtp.addFlightToTrip(requireLegacyGtpPage(this), from);
});

When("I add a car to the trip as the agent", async function () {
  logger.info("Agent re-searching and adding a car to the trip");
  await LegacyGtp.addCarToTrip(requireLegacyGtpPage(this));
});

When("I add a hotel to the trip as the agent through \"Search Online\"", async function () {
  logger.info('Agent re-searching a hotel via the "Search Online" link and adding it to the trip');
  await LegacyGtp.addHotelToTrip(requireLegacyGtpPage(this));
});

// Picks a REFUNDABLE room rather than the first one — the legacy front lists non-refundable
// prepaid rates first, so "any hotel" adds a non-refundable rate most of the time (test 55155).
When("I add a refundable hotel to the trip as the agent through \"Search Online\"", async function () {
  logger.info('Agent re-searching a hotel via the "Search Online" link and adding a REFUNDABLE room to the trip');
  const result = await LegacyGtp.addRefundableHotelToTrip(requireLegacyGtpPage(this));
  logger.info("Agent added a refundable hotel room", {
    hotelIndex: result.hotelIndex,
    cancellationPolicy: result.cancellationPolicy,
  });
});

// ===== Post-booking seat selection as the agent (ADO 84961) =====

When("I start recording the seat saves in legacy GTP", function () {
  this.legacyGtpSeatSaves = LegacyGtp.startRecordingSeatSaves(requireLegacyGtpPage(this));
});

// Seat maps load per flight and suppliers can take ~30s each, hence the longer step timeout.
When(
  "I pick the same seat on every flight of flight quote {int} in legacy GTP",
  { timeout: 420000 },
  async function (position) {
    this.legacyGtpSeatPick = await LegacyGtp.pickSameSeatOnEveryFlight(requireLegacyGtpPage(this), position - 1);
    logger.info("Same seat picked on every flight in legacy GTP", this.legacyGtpSeatPick);
  }
);

When("I save the seats in legacy GTP", { timeout: 180000 }, async function () {
  this.legacyGtpLastSeatSave = await LegacyGtp.saveSeats(requireLegacyGtpPage(this), this.legacyGtpSeatSaves);
  logger.info("Legacy GTP seat save answered", this.legacyGtpLastSeatSave);
});

/**
 * Returns the last recorded legacy GTP seat save, failing when no save was recorded.
 * @param {object} world - Cucumber World (`this`)
 */
function requireLastSeatSave(world) {
  if (!world.legacyGtpLastSeatSave) {
    throw new Error('No legacy GTP seat save recorded. Run "I save the seats in legacy GTP" first.');
  }
  return world.legacyGtpLastSeatSave;
}

// The 84961 oracle: each flight's seat must go out on its OWN booked segment. Before the fix the
// return tab resolved to the outbound leg, so both seats carried one segment number and the
// engine's duplicate key abandoned the whole save.
Then("the legacy GTP seat save should send the picked seat on a different segment for every flight", function () {
  const save = requireLastSeatSave(this);
  const { seat, flights } = this.legacyGtpSeatPick || {};
  const sent = save.sent.filter((s) => s.seatNumber === seat);
  const segments = new Set(sent.map((s) => s.segmentNumber));
  if (sent.length !== flights.length || segments.size !== flights.length) {
    throw new Error(
      `Expected seat ${seat} once per flight (${flights.join(", ")}) on ${flights.length} different segments, ` +
      `but the browser sent: ${JSON.stringify(save.sent)}`
    );
  }
});

Then("the legacy GTP seat save should succeed for every flight", function () {
  const save = requireLastSeatSave(this);
  const { seat, flights } = this.legacyGtpSeatPick || {};
  const answered = save.answered.filter((s) => s.seat === seat);
  const failed = save.answered.filter((s) => !s.isSuccess || (s.errorMsg && s.errorMsg !== ""));
  if (save.status !== 200 || answered.length !== flights.length || failed.length > 0) {
    throw new Error(
      `Expected HTTP 200 and a successful seat ${seat} for each of ${flights.length} flights, got HTTP ` +
      `${save.status} with: ${JSON.stringify(save.answered)}`
    );
  }
});

Then("after a reload the legacy GTP seating of flight quote {int} should not be {string}", async function (position, status) {
  const texts = await LegacyGtp.getSeatingStatusesAfterReload(requireLegacyGtpPage(this));
  const text = texts[position - 1];
  if (!text || text.includes(status)) {
    throw new Error(`Flight quote #${position} Seating tab reads "${text}" after reload (tabs: ${JSON.stringify(texts)}).`);
  }
});
