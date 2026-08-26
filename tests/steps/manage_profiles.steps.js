require("module-alias/register");
const { When, Then } = require("@cucumber/cucumber");
const { ManageProfiles } = require("@dsl");
const logger = require("@utils/logger").child("ManageProfiles");

// The only header-menu entry these steps drive. "My profile" has its own step
// ("I navigate to my user profile"), which opens the menu and clicks through in one go.
const MANAGE_PROFILES_MENU_LABEL = "Manage profiles";

// --- Opening the Manage profiles list ---

When("I open {string} from the profile menu", async function (menuItem) {
  if (menuItem !== MANAGE_PROFILES_MENU_LABEL) {
    throw new Error(
      `No step implementation for the "${menuItem}" profile-menu entry. This step drives ` +
      `"${MANAGE_PROFILES_MENU_LABEL}" only — "My profile" is covered by "I navigate to my user profile".`,
    );
  }

  logger.info(`Opening "${menuItem}" from the header profile menu`);
  // Opens in a new tab (app-profile-menu.ts openInNewTab) — adopt it as the active page so
  // every later step in the scenario runs against the Manage profiles list.
  this.page = await ManageProfiles.openFromProfileMenu(this.page);
});

Then("the Manage profiles list should be displayed", async function () {
  logger.info("Verifying the Manage profiles list is displayed");
  await ManageProfiles.verifyListDisplayed(this.page);
});

// --- Row hover and the pencil it reveals ---

When("I hover over the first profile row in the Manage profiles list", async function () {
  logger.info("Hovering the first profile row in the Manage profiles list");
  this.hoveredProfileRowIndex = 0;
  // The row's name is the title the profile dialog opens with, so it is what the final
  // assertion checks the RIGHT profile was opened against.
  this.hoveredProfileName = await ManageProfiles.hoverProfileRow(this.page, this.hoveredProfileRowIndex);
});

Then("the edit icon should be visible on the hovered profile row", async function () {
  logger.info("Verifying the edit icon surfaced on the hovered profile row");
  await ManageProfiles.verifyEditIconRevealedOnRow(this.page, getHoveredProfileRowIndex(this));
});

// --- Opening that row's profile ---

When("I open that profile by clicking the edit icon", async function () {
  logger.info("Opening the hovered profile via its edit icon");
  await ManageProfiles.openProfileFromRow(this.page, getHoveredProfileRowIndex(this));
});

Then("the user profile should be displayed for the selected user", async function () {
  logger.info(`Verifying the profile dialog opened for "${this.hoveredProfileName}"`);
  await ManageProfiles.verifyProfileDialogForUser(this.page, getHoveredProfileName(this));
});

// --- Scenario state ---

/**
 * The row the scenario hovered. Kept explicit rather than defaulted to 0 so a scenario that
 * reaches the pencil steps without hovering fails with the reason, not with a stale index.
 *
 * @param {object} world
 * @returns {number}
 */
function getHoveredProfileRowIndex(world) {
  if (!Number.isInteger(world.hoveredProfileRowIndex)) {
    throw new Error(
      "No profile row has been hovered yet — run \"I hover over the first profile row in the Manage " +
      "profiles list\" before the steps that act on the hovered row.",
    );
  }
  return world.hoveredProfileRowIndex;
}

/**
 * The hovered row's full name, which the profile dialog is titled with.
 *
 * @param {object} world
 * @returns {string}
 */
function getHoveredProfileName(world) {
  if (typeof world.hoveredProfileName !== "string" || !world.hoveredProfileName.trim()) {
    throw new Error(
      "No hovered profile name was captured — the hover step must run first, and the row it hovers " +
      "must render a name.",
    );
  }
  return world.hoveredProfileName;
}
