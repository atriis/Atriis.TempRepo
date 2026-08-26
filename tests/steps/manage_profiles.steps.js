require("module-alias/register");
const { When, Then } = require("@cucumber/cucumber");
const { ManageProfiles } = require("@dsl");
const logger = require("@utils/logger").child("ManageProfiles");

// --- Opening the Manage profiles list ---
//
// "I open {string} from the profile menu" lives in profile.steps.js, which owns the header dropdown
// for every entry it offers. Declaring the same pattern here as well would make the step ambiguous
// for every scenario. The list render this page's assertions need is waited out by
// verifyListDisplayed below, not by the step that opened the tab.

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
