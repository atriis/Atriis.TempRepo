require("module-alias/register");

const { Given, When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { Search } = require("@dsl");
const { expect } = require("@playwright/test");
const logger = require("@utils/logger").child("Search");

setDefaultTimeout(120000);

// ===== GIVEN STEPS =====

Given("I have added myself as the traveler", async function () {
  logger.info("Adding traveler: I am the traveler");
  const result = await Search.addMeAsTraveler(this.page);
  expect(result.starIconVisible, "Star icon should be visible after adding traveler").toBe(true);
  this.selectedTravelerCount = result.selectedTravelerCount;
});

// Product-agnostic: expands any collapsible section of the visible search form by its rendered
// title, e.g. "Advanced search" — which UK Rail hides its class/priority/split-ticket options
// behind. Already-expanded sections are left open rather than toggled shut.
// Submits the shared trip search form. Product-agnostic: flight, shell and parking scenarios
// all use it, which is why it lives here and not in flight_search.steps.js.
When("I click the search button", async function () {
  logger.info('Clicking the trip search button');
  await Search.clickSearchButton(this.page);
});

When("I click {string} in search page", async function (sectionTitle) {
  logger.info("Expanding a section of the search form", { sectionTitle });
  await Search.clickSearchFormSection(this.page, sectionTitle);
});

When("I click to add myself as the traveler", async function () {
  logger.info("Clicking Add me button (profile popup expected)");
  await Search.clickAddMeButton(this.page);
});

When("I add a traveler by name {string} from the search autocomplete", async function (name) {
  logger.info("Selecting traveler from autocomplete (profile popup expected)", { name });
  await Search.selectTravelerFromAutocomplete(this.page, name);
});

// Empty-slot sibling of the autocomplete step above, for travellers the add is expected to be
// REFUSED for: a traveller missing a mandate field raises the user-profile popup instead of being
// added, so nothing is asserted about a traveller tag here. Routed through the slot rather than the
// "Add traveller" button because a scenario that has just run "I remove all travelers" still holds
// one empty slot, and the button would append a second one that blocks the next search.
When("I add a traveler by name {string} through the empty traveler slot", async function (name) {
  logger.info("Selecting traveler through the empty traveler slot (profile popup expected)", { name });
  await Search.selectTravelerFromEmptySlot(this.page, name);
});

Then("the traveler {string} should not be available to add", async function (travelerName) {
  logger.info("Verifying traveler is not available to add", { travelerName });
  const available = await Search.isTravelerAvailableToAdd(this.page, travelerName);
  expect(
    available,
    `Expected traveler "${travelerName}" to NOT be available to add (outside the booker's permitted user group)`
  ).toBe(false);
});

Then("the search is blocked because no traveler was added to the trip", async function () {
  logger.info("Verifying no traveler was added, so the search is blocked");
  await Search.verifyNoTravelerAddedSoSearchIsBlocked(this.page);
});

Given("I have added traveler by name {string}", async function (travelerName) {
  logger.info("Adding traveler by name", { travelerName });
  const result = await Search.addTravelerByName(this.page, travelerName);
  expect(result.starIconVisible, "Star icon should be visible after adding traveler by name").toBe(true);
  this.selectedTravelerCount = result.selectedTravelerCount;
});

// The generated name is kept on the World as `lastAddedGuestName`: the app titles a share-quotes
// email "Share quotes for <traveller> <dates>", with no trip number anywhere in it, so this name is
// the only token that tells this run's mail apart in a shared test inbox. See tests/steps/email.steps.js.
Given("I have added a random guest traveler", async function () {
  logger.info("Adding random guest traveler");
  const result = await Search.addRandomGuest(this.page);
  expect(result.starIconVisible, "Star icon should be visible after adding guest").toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
  this.lastAddedGuestName = `${result.guestData.firstName} ${result.guestData.lastName}`;
});

Given("I have added a random guest traveler with phone type {string}", async function (phoneType) {
  logger.info("Adding random guest traveler with phone type", { phoneType });
  const result = await Search.addRandomGuest(this.page, phoneType);
  expect(result.starIconVisible, "Star icon should be visible after adding guest").toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
  this.lastAddedGuestName = `${result.guestData.firstName} ${result.guestData.lastName}`;
});

// Distinct from "I have added a random guest traveler": that one prefers the round add-traveler
// button, which appends a new slot. This one goes through the empty slot's own placeholder, so
// the guest fills the slot that was just emptied and becomes the trip's PRIMARY traveller --
// asserted below rather than left implicit, since that is the whole point of the step.
Given("I have added a random guest traveler as the primary traveller clicking {string} button copying settings from the user group {string}", async function (label, userGroupName) {
  logger.info("Adding random guest traveler via the empty traveler slot", { label, userGroupName });
  const result = await Search.addRandomGuestViaSelectTravelerSlot(this.page, label, userGroupName);
  const guestName = `${result.guestData.firstName} ${result.guestData.lastName}`;
  expect(result.starIconVisible, "Star icon should be visible after adding guest").toBe(true);
  expect(
    result.isPrimary,
    `Guest "${guestName}" should be the trip's PRIMARY traveller (its own tag must carry the star) — ` +
    `the searched content is resolved against the primary traveller, so a non-primary guest would ` +
    `silently leave the booker's own entitlements in play`
  ).toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
});

// Same "Select traveller" placeholder route as the step above, but for a slot that already exists
// because a search form's traveller count was raised. Deliberately NOT "I have added a random guest
// traveler with name": that one clicks the round add-traveler button, which would append a THIRD
// slot and leave the empty one unfilled. No primary assertion either -- the booker still holds the
// primary slot here, so the guest filling the second one is not expected to carry the star.
Given("I have added a random guest traveler with name {string} {string} in the empty traveler slot", async function (firstName, lastName) {
  logger.info("Adding guest traveler into the existing empty traveler slot", { firstName, lastName });
  const result = await Search.addRandomGuestViaSelectTravelerSlot(this.page, "Select traveller", null, {
    firstName,
    lastName,
  });
  expect(result.added, `Guest traveler "${firstName} ${lastName}" should be added`).toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
});

// ===== WHEN STEPS =====

When("I add an empty traveler slot", async function () {
  logger.info("Adding empty traveler slot (click add-traveler then close without selecting)");
  await Search.addEmptyTravelerSlot(this.page);
});

// Waits for BOTH traveller names to render on the search form before re-searching. After adding a
// guest the trip has two travellers (self + guest); the Search button stays enabled from the prior
// search, so it must not be clicked until the newly added (randomly named) guest is committed —
// otherwise the search runs without that traveller and its reference fields never load.
When("I wait for the traveler name to be displayed", async function () {
  logger.info("Waiting for both traveler names to be displayed on the search form");
  await Search.waitForTravelerNameDisplayed(this.page, 2);
});

// ===== THEN STEPS =====

Then("the traveler name {string} should be visible in the travelers list", async function (name) {
  logger.info("Verifying traveler name is visible in travelers list", { name });
  await Search.verifyTravelerNameVisible(this.page, name);
});

// Asserts the name shown next to the passenger icon on the traveler chip is accurate.
// The chip's name node (.trip-traveler-tag .traveler-name.black) is the name beside the icon,
// so reusing verifyTravelerNameVisible confirms the added traveler is exactly this name.
Then("the traveler name {string} is added successfully", async function (name) {
  logger.info("Verifying traveler name next to the passenger icon is accurate", { name });
  await Search.verifyTravelerNameVisible(this.page, name);
});

Then("the selected traveler should be {string} by default", async function (name) {
  logger.info("Verifying traveler is preselected by default", { name });
  await Search.verifyTravelerNameVisible(this.page, name);
});

Then("the star icon should be visible", async function () {
  logger.info("Verifying star icon is visible in travelers section");
  await Search.assertStarIconVisible(this.page);
});

Then("it should not be possible to add more travelers", async function () {
  logger.info("Verifying add-traveler controls are hidden (DisableBookForMultiPax permission)");
  await Search.verifyCannotAddMoreTravelers(this.page);
});

Then("only the empty traveler slot should be highlighted in red", async function () {
  logger.info("Verifying only the empty traveler slot is highlighted and named travelers are not in red");
  await Search.verifyOnlyEmptyTravelerSlotIsRed(this.page);
});

Then("the search title should contain {string}", async function (expectedText) {
  logger.info("Validating search title contains text", { expectedText });
  await Search.validateSearchTitleContains(this.page, expectedText);
});

Then("I remove myself as the traveler", async function () {
  logger.info("Removing traveler: I am the traveler");
  const result = await Search.removeTraveler(this.page);
  expect(result.removed, "Traveler should be removed").toBe(true);
});

// Clears the whole traveler list, unlike the step above which removes the first tag only. The
// removed count is asserted rather than logged: a no-op would leave the previous traveler on the
// trip, and the next search would then quietly re-run under the wrong traveler.
When("I remove all travelers", async function () {
  logger.info("Removing every traveler from the trip");
  const { removed } = await Search.removeAllTravelers(this.page);
  expect(
    removed,
    "At least one traveler should have been removed — the trip already had no travelers, so the " +
    "step could not have cleared the one the next search is meant to replace"
  ).toBeGreaterThan(0);
  this.selectedTravelerCount = 0;
});

// Same intent as "I have added {string} as primary traveler" below, but routed through the empty
// slot's own "Select traveller" placeholder so the emptied slot is FILLED rather than a second one
// appended — and with the primary checkbox set idempotently, so one the app already ticked is not
// clicked back off. Use after clearing the travelers, where a leftover empty slot would block the
// next search. The DSL asserts primary on the traveler's own tag, so there is nothing to re-check here.
Given("I have added {string} as primary traveler by clicking select traveller", async function (travelerName) {
  logger.info("Adding traveler as primary through the empty traveler slot", { travelerName });
  const result = await Search.addTravelerAsPrimaryViaSelectTravelerSlot(this.page, travelerName);
  logger.info("Traveler added as primary", result);
  this.selectedTravelerCount = result.selectedTravelerCount;
});

Given("I have added {string} as primary traveler", async function (travelerName) {
  logger.info("Adding traveler as primary by name", { travelerName });
  const result = await Search.addTravelerAsPrimaryByName(this.page, travelerName);
  expect(result.starIconVisible, "Star icon should be visible after adding primary traveler").toBe(true);
  this.selectedTravelerCount = result.selectedTravelerCount;
});

Given("I have added a random guest traveler with name {string} {string}", async function (firstName, lastName) {
  logger.info("Adding random guest traveler with custom name", { firstName, lastName });
  const result = await Search.addRandomGuestWithName(this.page, firstName, lastName);
  expect(result.added, "Guest traveler should be added").toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
});

Given("I have added a random guest traveler with email {string}", async function (email) {
  logger.info("Adding random guest traveler with fixed email", { email });
  const result = await Search.addRandomGuestWithEmail(this.page, email);
  expect(result.added, "Guest traveler should be added").toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
});

async function addGuestWithNameAndEmailStep(world, fullName, email, options = {}) {
  logger.info("Adding guest traveler with fixed name and email", { fullName, email, ...options });
  const result = await Search.addGuestWithNameAndEmail(world.page, fullName, email, options);
  expect(result.added, "Guest traveler should be added").toBe(true);
  world.guestTravelerCount = (world.guestTravelerCount ?? 0) + 1;
  world.selectedTravelerCount = result.selectedTravelerCount;
}

// Same underlying action (the "Add Traveller" widget/dialog is shared between the pre-search
// traveler bar and the cart page's own Travellers section — see Search.addGuestWithNameAndEmail),
// registered under two phrasings so scenarios read naturally at either point in the flow.
Given("I have added a guest traveler named {string} with email {string}", async function (fullName, email) {
  await addGuestWithNameAndEmailStep(this, fullName, email);
});

Given("I add guest traveller from cart named {string} with email {string}", async function (fullName, email) {
  await addGuestWithNameAndEmailStep(this, fullName, email);
});

// Third phrasing for the same dialog, opened from the trip header's traveller avatars. Needed by
// any trip page that renders NO travellers section — a flight-only trip is one (test 82591): the
// two steps above look for the travellers-list widget, which Atriis.App mounts only inside the
// search form, so on such a page they time out with nothing to click.
Given("I add a guest traveller to the trip named {string} with email {string}", async function (fullName, email) {
  await addGuestWithNameAndEmailStep(this, fullName, email, { trigger: "tripInfoBar" });
});

Given("I have added a guest passenger without date of birth named {string} {string}", async function (firstName, lastName) {
  logger.info("Adding guest traveler without date of birth", { firstName, lastName });
  const result = await Search.addGuestWithoutDateOfBirth(this.page, firstName, lastName);
  expect(result.added, "Guest traveler should be added").toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
});

Given("I have added a random guest traveler with middle name {string}", async function (middleName) {
  logger.info("Adding random guest traveler with middle name", { middleName });
  const result = await Search.addRandomGuestWithMiddleName(this.page, middleName);
  expect(result.added, "Guest traveler should be added").toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
});

Given("I have added a random guest traveler with spaces in the first name", async function () {
  logger.info("Adding random guest traveler with spaces in the first name");
  const result = await Search.addRandomGuestWithSpacesInFirstName(this.page);
  expect(result.added, "Guest traveler should be added").toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
});

Then("the traveler icon should be displayed", async function () {
  logger.info("Verifying traveler icon button is visible on new trip page");
  await Search.verifyTravelerIconDisplayed(this.page);
});

When("I click add traveller", async function () {
  logger.info("Clicking add traveller button to open edit-traveler dialog");
  await Search.clickAddTraveler(this.page);
});

Then("the traveler checkbox {string} should be visible", async function (labelText) {
  logger.info("Verifying traveler checkbox is visible", { labelText });
  await Search.verifyTravelerCheckboxVisible(this.page, labelText);
});

When("I open the add guest traveler form", async function () {
  logger.info("Opening add guest traveler form");
  await Search.openAddGuestTravelerForm(this.page);
});

Then("the only available guest traveller type should be {string}", async function (expectedType) {
  logger.info("Verifying the guest form offers only one traveller type", { expectedType });
  await Search.verifyOnlyGuestPassengerType(this.page, expectedType);
});

When("I open the date of birth picker for the guest traveler", async function () {
  logger.info("Opening DOB picker in guest traveler form");
  await Search.openGuestDobPicker(this.page);
});

Then("the date of birth picker should show the year restricted to {int} years ago", async function (minAge) {
  logger.info("Verifying DOB picker year restriction", { minAge });
  await Search.verifyDobYearRestriction(this.page, minAge);
});

Then("the date picker should remain open for month selection", async function () {
  logger.info("Verifying DOB picker remains open in month selection mode");
  await Search.verifyDobPickerStillOpen(this.page);
});

Then("the gender field placeholder should display {string}", async function (expectedPlaceholder) {
  logger.info("Verifying the guest gender field placeholder text", { expectedPlaceholder });
  await Search.verifyGuestGenderPlaceholder(this.page, expectedPlaceholder);
});

When("I close the guest traveler dialog", async function () {
  logger.info("Closing the guest traveler dialog");
  await Search.closeEditTravelerDialog(this.page);
});

Given("I have added a guest traveler {string} {string} with user group {string}", async function (firstName, lastName, userGroupName) {
  logger.info("Adding guest traveler with user group", { firstName, lastName, userGroupName });
  const result = await Search.addGuestWithUserGroup(this.page, firstName, lastName, userGroupName);
  expect(result.added, "Guest traveler should be added with user group").toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
});

Given("I have added a random guest traveler not as primary with copying settings from the user group {string}", async function (userGroupName) {
  logger.info("Adding a random guest traveler (not primary) copying settings from the user group", { userGroupName });
  const result = await Search.addRandomGuestCopyingSettingsFromUserGroup(this.page, userGroupName);
  expect(result.added, "Random guest traveler should be added copying settings from user group").toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
});

When("I select {string} as the copy settings for the guest", async function (settingsType) {
  logger.info("Selecting copy settings for guest traveler", { settingsType });
  await Search.selectGuestCopySettings(this.page, settingsType);
});

When("I fill in the guest details first name {string} last name {string} gender {string} email {string}", async function (firstName, lastName, gender, email) {
  logger.info("Filling in guest personal details", { firstName, lastName, gender, email });
  await Search.fillGuestDetails(this.page, firstName, lastName, gender, email);
});

When("I attempt to add the guest traveler", async function () {
  logger.info("Attempting to add guest traveler (triggering form validation)");
  await Search.attemptAddGuestTraveler(this.page);
});

Then("the user group field should be marked as mandatory for the guest", async function () {
  logger.info("Verifying user group field is mandatory");
  await Search.verifyUserGroupMandatory(this.page);
});

When("I select the passenger type {string} for the guest traveler", async function (passengerType) {
  logger.info("Selecting passenger type for guest traveler", { passengerType });
  await Search.selectGuestPassengerType(this.page, passengerType);
});

When("I fill in the guest traveler first name {string} and last name {string}", async function (firstName, lastName) {
  logger.info("Filling guest traveler name", { firstName, lastName });
  await Search.fillGuestName(this.page, firstName, lastName);
});

When("I fill in the guest traveler date of birth {string}", async function (dateOfBirth) {
  logger.info("Filling guest traveler date of birth", { dateOfBirth });
  await Search.fillGuestDateOfBirth(this.page, dateOfBirth);
});

When("I click the guest traveler email field", async function () {
  logger.info("Clicking guest traveler email field");
  await Search.clickGuestEmailField(this.page);
});

Then("the guest traveler email field should show the error {string}", async function (expectedError) {
  logger.info("Verifying guest traveler email field error", { expectedError });
  const actualError = await Search.getGuestEmailFieldError(this.page);
  expect(
    actualError,
    `Guest email field should show the error "${expectedError}", but got "${actualError}"`
  ).toContain(expectedError);
});

When("I fill in the guest traveler email {string}", async function (email) {
  logger.info("Filling guest traveler email", { email });
  await Search.fillGuestEmail(this.page, email);
});

When("I select the guest gender {string}", async function (gender) {
  logger.info("Selecting guest gender", { gender });
  await Search.selectGuestGender(this.page, gender);
});

When("I click the add guest button", async function () {
  logger.info("Clicking the add guest button");
  await Search.confirmAddGuest(this.page);
});

Then("the passenger type tag should display {string}", async function (passengerType) {
  logger.info("Verifying passenger type tag", { passengerType });
  const actualTag = await Search.getPassengerTypeTag(this.page);
  expect(
    actualTag,
    `Passenger type tag should display "${passengerType}", but got "${actualTag}"`
  ).toContain(passengerType);
});

Then("the search should display the message {string}", async function (message) {
  logger.info("Verifying search message is displayed", { message });
  const displayed = await Search.isSearchMessageDisplayed(this.page, message);
  expect(
    displayed,
    `Search should display the message "${message}", but it was not visible`
  ).toBe(true);
});

When("I click the request assistance icon", async function () {
  logger.info("Clicking the request assistance icon");
  await Search.clickRequestAssistanceIcon(this.page);
});

Then("the travelers section title should display {string}", async function (expectedTitle) {
  logger.info("Verifying travelers section title", { expectedTitle });
  const actualTitle = await Search.getTravelersSectionTitle(this.page);
  expect(
    actualTitle,
    `Travelers section title should display "${expectedTitle}", but got "${actualTitle}"`
  ).toContain(expectedTitle);
});

Given("I add a third traveler named {string}", async function (travelerName) {
  throw new Error(`TODO: implement 'I add a third traveler named {string}' — add an additional traveler named ${travelerName}`);
});

Given(
  /^I have added a random traveler from the list: (.+)$/,
  async function (nameList) {
    const names = nameList.split(",").map((n) => n.trim());
    const selectedName = names[Math.floor(Math.random() * names.length)];
    logger.info("Adding randomly selected traveler from list", { selectedName, nameList });
    const result = await Search.addTravelerByName(this.page, selectedName);
    expect(result.starIconVisible, "Star icon should be visible after adding traveler by name").toBe(true);
    this.selectedTravelerCount = result.selectedTravelerCount;
  }
);

// Multi-pax sibling of the single-pick step above. The names are picked WITHOUT replacement: the same
// profile traveler cannot be added to a trip twice, so drawing with replacement would intermittently
// fail on a duplicate. Regex-based (not {string}) so the list can carry apostrophes and accents
// verbatim, e.g. "Anaïs D'Hôtel-Lefèvre" — only commas separate entries.
Given(
  /^I have added (\d+) random travelers from the list: (.+)$/,
  async function (count, nameList) {
    const requested = Number(count);
    const names = nameList
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);

    expect(
      names.length,
      `Cannot pick ${requested} distinct travelers from a list of ${names.length}: ${nameList}`
    ).toBeGreaterThanOrEqual(requested);

    const pool = [...names];
    const selectedNames = [];
    for (let i = 0; i < requested; i++) {
      selectedNames.push(...pool.splice(Math.floor(Math.random() * pool.length), 1));
    }

    logger.info("Adding randomly selected travelers from list", { requested, selectedNames, nameList });

    for (const selectedName of selectedNames) {
      const result = await Search.addTravelerByName(this.page, selectedName);
      expect(
        result.starIconVisible,
        `Star icon should be visible after adding traveler "${selectedName}"`
      ).toBe(true);
      this.selectedTravelerCount = result.selectedTravelerCount;
    }

    expect(
      this.selectedTravelerCount,
      `Expected ${requested} travelers on the trip after adding ${selectedNames.join(", ")}`
    ).toBe(requested);
  }
);

// ===== Restricted-role privilege checks on the search page (test 55155) =====

Then("the search button should not be visible", async function () {
  logger.info("Verifying the main search button is not rendered for this role");
  await Search.verifySearchButtonNotVisible(this.page);
});

Then("the Travel request button should be visible", async function () {
  logger.info("Verifying the Travel request button is visible on the search page");
  await Search.verifyTravelRequestButtonVisible(this.page);
});
