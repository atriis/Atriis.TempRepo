require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { BenerailSearch } = require("@dsl");
const logger = require("@utils/logger").child("BenerailSearch");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I search for a one way Benerail train from {string}", async function (routeKey) {
  logger.info("Searching for one-way Benerail train", { routeKey });
  await BenerailSearch.searchBenerailOneWay(this.page, routeKey);
});

When("I search direct only option for a one way Benerail train from {string}", async function (routeKey) {
  logger.info("Searching for a direct-only one-way Benerail train", { routeKey });
  await BenerailSearch.searchBenerailOneWay(this.page, routeKey, { numberOfStops: "Direct Only" });
});

// Drawer variant: the search form is the one the cart's Rail tile opens over the trip overview, so
// there is no product tab to select and the trip's own search buttons are still on the page.
When("I search for a one way Benerail train from {string} from the cart drawer", async function (routeKey) {
  logger.info("Searching for one-way Benerail train from the cart drawer", { routeKey });
  await BenerailSearch.searchBenerailOneWayFromCartDrawer(this.page, routeKey);
});

// Fills and commits the From/To/date route selection without submitting the search — used to
// inspect what the station autocomplete actually committed into the form (test 66533, umlaut
// character handling).
When("I search for a one way Benerail train from {string} without clicking search button", async function (routeKey) {
  logger.info("Filling one-way Benerail train search without submitting", { routeKey });
  await BenerailSearch.searchBenerailOneWay(this.page, routeKey, { clickSearch: false });
});

Then("search form displays from as {string} and to as {string}", async function (expectedFrom, expectedTo) {
  logger.info("Verifying Benerail search form From/To field values", { expectedFrom, expectedTo });
  const { from, to } = await BenerailSearch.getRouteFieldValues(this.page);
  expect(from, `Expected the From field to display "${expectedFrom}", got "${from}"`).toContain(expectedFrom);
  expect(to, `Expected the To field to display "${expectedTo}", got "${to}"`).toContain(expectedTo);
});

When("I search for a round trip Benerail train from {string}", async function (routeKey) {
  logger.info("Searching for round trip Benerail train", { routeKey });
  await BenerailSearch.searchBenerailRoundTrip(this.page, routeKey);
});

// Near-date variant: the default departure/return indices (10th/13th available date) land far
// enough out that supplier inventory for a given route is sometimes empty on the return leg
// (AB#81914 fix-loop finding). Closer dates consistently have confirmed schedule data.
When("I search for a round trip Benerail train from {string} with a near departure date", async function (routeKey) {
  logger.info("Searching for round trip Benerail train with a near departure date", { routeKey });
  await BenerailSearch.searchBenerailRoundTrip(this.page, routeKey, { departureIndex: 1, returnIndex: 3 });
});

// ===== TODO STUBS — need DSL/Page implementation =====

When("I navigate to the Benerail rail search tab", async function () {
  throw new Error("TODO: implement 'I navigate to the Benerail rail search tab' — navigate to the rail search tab within an existing trip (no booking flow) using BenerailSearch or AppPage");
});

Then("the dynamic fields section should be visible in the Benerail search form", async function () {
  throw new Error("TODO: implement 'the dynamic fields section should be visible in the Benerail search form' — assert that corporate dynamic fields are rendered in the search form even when no reference fields are configured");
});

Then("the linked reference questions should be visible in the Benerail search form", async function () {
  throw new Error("TODO: implement 'the linked reference questions should be visible in the Benerail search form' — assert that linked reference questions appear in the Benerail search form for the configured corporate");
});

When("I fill in the reference and dynamic fields for the Benerail search", async function () {
  throw new Error("TODO: implement 'I fill in the reference and dynamic fields for the Benerail search' — fill in corporate reference and dynamic field inputs on the Benerail search form before proceeding");
});

When("I fill in the reference fields for the guest traveler", async function () {
  throw new Error("TODO: implement 'I fill in the reference fields for the guest traveler' — fill the optional reference field inputs that appear for a guest traveler on the Benerail search form");
});

When("I fill in the reference field if required", async function () {
  throw new Error("TODO: implement 'I fill in the reference field if required' — conditionally fill the reference field on the Benerail search form if the popup is visible (like click_on_proceed_after_search but also fills data)");
});

Then("the Benerail autocomplete improvements should be validated", async function () {
  throw new Error("TODO: implement 'the Benerail autocomplete improvements should be validated' — test autocomplete behaviour: type partial station name, verify dropdown suggestions, select station. See test 63183 for full scenario.");
});

Then("the Benerail time-picker component should function correctly", async function () {
  throw new Error("TODO: implement 'the Benerail time-picker component should function correctly' — verify redesigned time-picker: open, set time, close, verify value persists. See test 68008 for full scenario.");
});
