const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const ManageProfilesPage = require("@pages/ManageProfilesPage");
const ProfilePage = require("@pages/ProfilePage");
const logger = require("@utils/logger").child("ManageProfiles");

// The counter reads "Showing <shown> of <total> profile(s)" — the numbers are data-dependent,
// so the shape is what is asserted, not a literal string.
//
// Deliberately boundary-free: the counter is built from separate spans, and whether the rendered
// text carries whitespace between them varies by environment ("Showing 5 of 5 Profiles" on staging,
// "Showing 5of5Profiles" on dev). \b\d+\b matches neither digit in the unspaced form, so the
// old boundary-anchored pattern failed against a list that had rendered perfectly well.
const PROFILES_COUNT_PATTERN = /\d+\D+\d+\D*profiles?/i;

// el-tab-pane name of the tab manage-profiles' dialog lands on. user-profile.vue defaults to
// the personal details pane, and ProfilePage recovers the name from the header's `tab-<name>` id.
const PERSONAL_DETAILS_TAB_NAME = "personalDetails";

/**
 * Manage profiles DSL
 *
 * High-level actions for the /manage-profiles list — the route a user holding
 * "Can view profile of other users" reaches from the header avatar menu, and from which
 * they open another user's profile in a dialog over the dimmed list.
 *
 * Composes ManageProfilesPage for the list itself and ProfilePage for the profile dialog
 * (which is the same `.app-dialog.user-profile-dialog` the mandate-fields flows already
 * assert on, just titled with the selected row's name).
 */
const ManageProfiles = {
  /**
   * Asserts the Manage profiles list has fully rendered: heading, the "Showing X of Y profiles"
   * counter, the search box, the three desktop columns, and at least one profile row.
   *
   * @param {import("@playwright/test").Page} page The Manage profiles tab.
   */
  async verifyListDisplayed(page) {
    if (!page) throw new Error("[ManageProfiles.verifyListDisplayed] \"page\" is required.");

    const manageProfilesPage = getPageObject(page, ManageProfilesPage);
    await manageProfilesPage.waitForList();

    const title = await manageProfilesPage.getTitleText();
    expect(
      title,
      "[ManageProfiles.verifyListDisplayed] The Manage profiles page rendered without a heading. " +
      "manage-profiles.vue always paints an <h1> in .manage-profiles-title, so an empty heading means " +
      "the shell rendered but its content did not.",
    ).not.toBe("");

    const countText = await manageProfilesPage.getProfilesCountText();
    expect(
      countText,
      "[ManageProfiles.verifyListDisplayed] Expected the profiles counter to read \"Showing X of Y profiles\", " +
      `but it reads "${countText}". The counter is driven by profilesToShow/matchingProfiles — an unexpected ` +
      "shape here usually means the profiles fetch returned nothing.",
    ).toMatch(PROFILES_COUNT_PATTERN);

    const searchVisible = await manageProfilesPage.isSearchBoxVisible();
    expect(
      searchVisible,
      "[ManageProfiles.verifyListDisplayed] The profile search box was not visible on the Manage profiles list " +
      "(data-testid=\"manage-profiles.search\").",
    ).toBe(true);

    const headers = await manageProfilesPage.getColumnHeaderVisibility();
    expect(
      headers,
      "[ManageProfiles.verifyListDisplayed] Expected the User / Email / User group column headers to be visible, " +
      `got ${JSON.stringify(headers)}. They are rendered behind v-if="!isMobile", so all three missing means the ` +
      "run is at a mobile viewport.",
    ).toEqual({ user: true, email: true, userGroup: true });

    const rowCount = await manageProfilesPage.getRowCount();
    expect(
      rowCount,
      "[ManageProfiles.verifyListDisplayed] The Manage profiles list showed no profile rows. This user may not " +
      "be entitled to view any other profile, or the list is still loading.",
    ).toBeGreaterThan(0);

    logger.info(`[ManageProfiles.verifyListDisplayed] Manage profiles list displayed with ${rowCount} row(s)`);
  },

  /**
   * Hovers one profile row so its pencil fades in, and reports who that row is for.
   *
   * The name is returned rather than stored here because it is what the profile dialog is
   * titled with — the caller carries it to the final assertion.
   *
   * @param {import("@playwright/test").Page} page The Manage profiles tab.
   * @param {number} [index=0] Zero-based row index.
   * @returns {Promise<string>} The hovered row's full name.
   */
  async hoverProfileRow(page, index = 0) {
    if (!page) throw new Error("[ManageProfiles.hoverProfileRow] \"page\" is required.");

    const manageProfilesPage = getPageObject(page, ManageProfilesPage);
    const rowCount = await manageProfilesPage.getRowCount();

    if (index >= rowCount) {
      throw new Error(
        `[ManageProfiles.hoverProfileRow] Cannot hover profile row ${index} — the list holds only ${rowCount} row(s).`,
      );
    }

    const fullName = await manageProfilesPage.getRowFullName(index);
    await manageProfilesPage.hoverRow(index);

    logger.info(`[ManageProfiles.hoverProfileRow] Hovered profile row ${index} ("${fullName}")`);
    return fullName;
  },

  /**
   * Asserts the hovered row's pencil is revealed — and, when the list holds more than one row,
   * that a non-hovered row's pencil stays hidden. The pencil is `opacity: 0` off-hover rather
   * than unmounted, so checking only the hovered row would pass even if the reveal broke.
   *
   * @param {import("@playwright/test").Page} page The Manage profiles tab.
   * @param {number} [index=0] Zero-based index of the row currently hovered.
   */
  async verifyEditIconRevealedOnRow(page, index = 0) {
    if (!page) throw new Error("[ManageProfiles.verifyEditIconRevealedOnRow] \"page\" is required.");

    const manageProfilesPage = getPageObject(page, ManageProfilesPage);

    const revealed = await manageProfilesPage.isEditIconRevealedOnRow(index);
    expect(
      revealed,
      "[ManageProfiles.verifyEditIconRevealedOnRow] The edit (pencil) icon did not surface on the hovered " +
      `profile row ${index}. manage-profiles.scss reveals it with "&:hover .edit-btn { opacity: 1 }", so a ` +
      "still-transparent pencil means the hover did not land on .profile-row.",
    ).toBe(true);

    const rowCount = await manageProfilesPage.getRowCount();
    if (rowCount > 1) {
      const otherIndex = index === 0 ? 1 : 0;
      const otherRevealed = await manageProfilesPage.isEditIconRevealedOnRow(otherIndex);
      expect(
        otherRevealed,
        `[ManageProfiles.verifyEditIconRevealedOnRow] The edit icon on non-hovered row ${otherIndex} was also ` +
        "revealed. The pencil must surface on the hovered row only.",
      ).toBe(false);
    }

    logger.info(`[ManageProfiles.verifyEditIconRevealedOnRow] Edit icon revealed on hovered row ${index} only`);
  },

  /**
   * Clicks a row's pencil and waits for the profile fetch behind it to settle.
   *
   * editProfile() loads the profile before routing and opening the dialog, swapping the pencil
   * for a spinner while it is in flight — so the click is not done until that spinner clears.
   *
   * @param {import("@playwright/test").Page} page The Manage profiles tab.
   * @param {number} [index=0] Zero-based row index.
   */
  async openProfileFromRow(page, index = 0) {
    if (!page) throw new Error("[ManageProfiles.openProfileFromRow] \"page\" is required.");

    const manageProfilesPage = getPageObject(page, ManageProfilesPage);

    // The pencil only accepts a click while revealed, and a preceding assertion may have moved
    // the pointer off the row while sampling a sibling's opacity.
    await manageProfilesPage.hoverRow(index);
    await manageProfilesPage.clickEditOnRow(index);
    await manageProfilesPage.waitForEditLoaderToClear(index);

    logger.info(`[ManageProfiles.openProfileFromRow] Opened the profile dialog from row ${index}`);
  },

  /**
   * Asserts the user-profile dialog opened for one specific user: it is titled with that row's
   * full name, and it lands on Personal Details.
   *
   * The title is the discriminator that proves the RIGHT profile opened — every profile dialog
   * shares `.app-dialog.user-profile-dialog`, so asserting the dialog alone would pass for any
   * of them. Reuses ProfilePage's existing dialog helpers rather than re-locating the dialog.
   *
   * @param {import("@playwright/test").Page} page The Manage profiles tab.
   * @param {string} expectedFullName The hovered row's full name, as returned by hoverProfileRow.
   */
  async verifyProfileDialogForUser(page, expectedFullName) {
    if (!page) throw new Error("[ManageProfiles.verifyProfileDialogForUser] \"page\" is required.");
    if (!expectedFullName || typeof expectedFullName !== "string") {
      throw new Error(
        "[ManageProfiles.verifyProfileDialogForUser] \"expectedFullName\" must be a non-empty string, got: " +
        `${typeof expectedFullName} (${JSON.stringify(expectedFullName)}). It is captured by hoverProfileRow — ` +
        "ensure the hover step ran first.",
      );
    }

    const profilePage = getPageObject(page, ProfilePage);

    await profilePage.waitForDialogByTitle(expectedFullName);

    const activeTab = await profilePage.getActiveDialogTabName(expectedFullName);
    expect(
      activeTab,
      `[ManageProfiles.verifyProfileDialogForUser] The profile dialog for "${expectedFullName}" opened on the ` +
      `"${activeTab}" tab, expected "${PERSONAL_DETAILS_TAB_NAME}". A null tab means the tab strip never ` +
      "rendered — user-profile.vue only paints it once the profile has loaded.",
    ).toBe(PERSONAL_DETAILS_TAB_NAME);

    logger.info(
      `[ManageProfiles.verifyProfileDialogForUser] Profile dialog displayed for "${expectedFullName}" on Personal Details`,
    );
  },
};

module.exports = ManageProfiles;
