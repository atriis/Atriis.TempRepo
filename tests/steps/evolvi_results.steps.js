require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { EvolviResults } = require("@dsl");
const logger = require("@utils/logger").child("EvolviResults");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I add an Evolvi one way to the trip", async function () {
  logger.info("Adding Evolvi one-way to trip");
  await EvolviResults.addEvolviOneWayToTrip(this.page);
});

When("I add an Evolvi round trip to the trip", async function () {
  logger.info("Adding Evolvi round trip to trip");
  await EvolviResults.addEvolviRoundtripToTrip(this.page);
});

// ===== TODO STUBS — need DSL/Page implementation =====

When("I close mandatory notifications if displayed", async function () {
  throw new Error("TODO: implement 'I close mandatory notifications if displayed' — close mandatory notification modal when it appears on search/results");
});

Then("the Select outbound prompt should be displayed", async function () {
  throw new Error("TODO: implement 'the Select outbound prompt should be displayed' — assert outbound prompt text is shown before selecting first leg");
});

When("I select an outbound Evolvi fare", async function () {
  throw new Error("TODO: implement 'I select an outbound Evolvi fare' — click an outbound fare amount on results");
});

When("I select the highlighted inbound Evolvi fare", async function () {
  throw new Error("TODO: implement 'I select the highlighted inbound Evolvi fare' — select the focused inbound fare option after outbound selection");
});

Then("the inbound selection should display the selected return time", async function () {
  throw new Error("TODO: implement 'the inbound selection should display the selected return time' — compare stored outbound/inbound time markers and validate displayed inbound summary");
});

When("I select a random available Evolvi fare", async function () {
  throw new Error("TODO: implement 'I select a random available Evolvi fare' — select the first or random visible fare in Evolvi results");
});

When("I select the first available Evolvi fare", async function () {
  throw new Error("TODO: implement 'I select the first available Evolvi fare' — select the first available fare option in Evolvi results");
});

Then("the cart status should be Pending booking", async function () {
  throw new Error("TODO: implement 'the cart status should be Pending booking' — assert Pending booking badge/label in cart");
});

Then("the departure city should be correct in the Evolvi TOD section", async function () {
  throw new Error("TODO: implement 'the departure city should be correct in the Evolvi TOD section' — validate departure city text in delivery method (TOD) section");
});

When("I select a Split Ticket result", async function () {
  throw new Error("TODO: implement 'I select a Split Ticket result' — select a result marked as SplitTix/Anytime Return according to scenario data");
});

Then("split ticket information should be visible in cart before checkout", async function () {
  throw new Error("TODO: implement 'split ticket information should be visible in cart before checkout' — validate split ticket labels/details are visible in cart pre-checkout");
});

Then("split ticket information should be visible after checkout and in itinerary email", async function () {
  throw new Error("TODO: implement 'split ticket information should be visible after checkout and in itinerary email' — validate split ticket details in post-booking/cart and itinerary email preview");
});

Then("itinerary email split ticket information should match the trip", async function () {
  throw new Error("TODO: implement 'itinerary email split ticket information should match the trip' — compare itinerary email split-ticket details with trip data");
});

Then("the Evolvi no-results helper message should be displayed", async function () {
  throw new Error("TODO: implement 'the Evolvi no-results helper message should be displayed' — assert helper text guiding user to modify filter criteria");
});

Then("the Evolvi no results title should be displayed", async function () {
  throw new Error("TODO: implement 'the Evolvi no results title should be displayed' — assert no-results title/header is shown");
});

Then("the Evolvi expiry tooltip should show at least {int} minutes", async function (minutes) {
  throw new Error(`TODO: implement 'the Evolvi expiry tooltip should show at least ${minutes} minutes' — read expiry tooltip and assert the displayed value is >= ${minutes}`);
});

Then("the FOP owner should be displayed as Paid by TMC", async function () {
  throw new Error("TODO: implement 'the FOP owner should be displayed as Paid by TMC' — assert FOP owner label text in cart payment section");
});

Then("the CVV field should not be displayed for invoice FOP", async function () {
  throw new Error("TODO: implement 'the CVV field should not be displayed for invoice FOP' — assert CVV input is hidden when invoice FOP is configured");
});
