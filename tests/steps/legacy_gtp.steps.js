require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
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

When("I add a hotel to the trip as the agent", async function () {
  logger.info("Agent re-searching and adding a hotel to the trip");
  await LegacyGtp.addHotelToTrip(requireLegacyGtpPage(this));
});
