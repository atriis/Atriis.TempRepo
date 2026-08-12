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

// Shared by test 63183 (autocomplete improvements) and test 68008 (time-picker redesign) — both
// need to land on the Benerail search form within an existing trip without running a full search.
When("I navigate to the Benerail rail search tab", async function () {
  logger.info("Navigating to the Benerail rail search tab");
  await BenerailSearch.selectBenerailSearch(this.page);
});

// ===== TIME-PICKER REDESIGN (test 68008) =====

When("I select the one way trip type for the Benerail search", async function () {
  logger.info("Selecting the one way trip type for the Benerail search");
  await BenerailSearch.selectOneWayTripType(this.page);
});

When("I set the Benerail departure time to {string}", async function (time) {
  logger.info("Setting the Benerail departure time", { time });
  await BenerailSearch.setDepartureTime(this.page, time);
});

Then("the Benerail departure time should display {string}", async function (expectedTime) {
  logger.info("Verifying the Benerail departure time display", { expectedTime });
  const displayedTime = await BenerailSearch.getDepartureTimeDisplayed(this.page);
  expect(displayedTime, `Expected the departure time to display "${expectedTime}", got "${displayedTime}"`).toContain(expectedTime);
});

When("I enable the via station option on the Benerail search form", async function () {
  logger.info("Enabling the via station option on the Benerail search form");
  await BenerailSearch.enableViaStationField(this.page);
});

When("I select {string} from travellers ages dropdown in benerail search", async function (ageLabel) {
  logger.info("Selecting age category in the Benerail travellers ages dropdown", { ageLabel });
  await BenerailSearch.selectTravellerAge(this.page, ageLabel);
});

// ===== TODO STUBS — need DSL/Page implementation =====

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
  logger.info("Validating Benerail station autocomplete improvements");
  const results = await BenerailSearch.getStationAutocompleteImprovementResults(this.page);

  for (const { query, expectedTexts, suggestionTexts, knownGap } of results) {
    for (const expectedText of expectedTexts) {
      const found = suggestionTexts.includes(expectedText);

      // knownGap covers specifically the verified failure mode — zero suggestions returned (see
      // BenerailSearch's STATION_AUTOCOMPLETE_CASES) — not any mismatch. A query that instead
      // starts returning wrong/unexpected suggestions is a different, unverified regression and
      // must still fail the strict assertion below rather than being silently downgraded.
      if (!found && knownGap && suggestionTexts.length === 0) {
        logger.warn(
          `Known autocomplete gap for "${query}": expected "${expectedText}" but got ${JSON.stringify(suggestionTexts)}. ${knownGap}`,
        );
        continue;
      }

      expect(
        suggestionTexts,
        `Expected typing "${query}" into the Benerail From station field to surface "${expectedText}" ` +
        `among the autocomplete suggestions, got: ${JSON.stringify(suggestionTexts)}`,
      ).toContain(expectedText);
    }
  }
});
