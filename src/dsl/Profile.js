const { getPageObject } = require("@utils/pageObjectCache");
const ProfilePage = require("@pages/ProfilePage");
const LoginPage = require("@pages/LoginPage");
const logger = require("@utils/logger").child("Profile");

/**
 * Profile DSL
 *
 * High-level actions for user profile management.
 * Describes WHAT the user does in their profile.
 */
const Profile = {
  /**
   * Navigates to the user profile by hovering the avatar and clicking the profile link.
   * The profile opens in a new tab — returns the new page instance.
   */
  async navigateToProfile(page) {
    if (!page) {
      throw new Error('[Profile.navigateToProfile] "page" is required.');
    }

    logger.debug("[Profile.navigateToProfile] Hovering avatar and clicking profile link");

    const profilePage = getPageObject(page, ProfilePage);
    const loginPage = getPageObject(page, LoginPage);
    const context = page.context();

    if (!context) {
      throw new Error('[Profile.navigateToProfile] Page context is null — cannot detect new tab.');
    }

    // Cookie consent banner can overlay the avatar — dismiss it first
    await loginPage.acceptCookiesIfPresent(8000);

    // Profile opens in a new window — listen for it before clicking
    const newPagePromise = context.waitForEvent("page", { timeout: 15000 }).catch(() => null);

    try {
      await profilePage.hoverAvatar();
      await profilePage.clickProfileLink();
    } catch (err) {
      throw new Error(
        `[Profile.navigateToProfile] Failed to navigate to user profile: ${err.message}`
      );
    }

    const newProfilePage = await newPagePromise;

    if (newProfilePage) {
      logger.info("[Profile.navigateToProfile] Profile opened in a new tab");
      await newProfilePage.waitForLoadState("domcontentloaded", { timeout: 30000 });
      return newProfilePage;
    }

    // Fallback: profile opened in same tab
    logger.info("[Profile.navigateToProfile] Profile opened in current tab (no new tab detected)");
    await page.waitForLoadState("domcontentloaded", { timeout: 30000 });
    return page;
  },

  /**
   * Opens the Frequent Programs tab in the user profile.
   */
  async openFrequentProgramsTab(page) {
    if (!page) {
      throw new Error('[Profile.openFrequentProgramsTab] "page" is required.');
    }

    logger.debug("[Profile.openFrequentProgramsTab] Clicking Frequent Programs tab");

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickFrequentProgramsTab();
      await profilePage.waitForFrequentProgramsForm();
    } catch (err) {
      throw new Error(
        `[Profile.openFrequentProgramsTab] Failed to open Frequent Programs tab: ${err.message}`
      );
    }
  },

  /**
   * Removes a FQTV entry by number: clicks delete, confirms the dialog, verifies removal.
   * If the entry doesn't exist (already removed), skips gracefully.
   */
  async removeFqtvEntry(page, fqtvNumber) {
    if (!page) {
      throw new Error('[Profile.removeFqtvEntry] "page" is required.');
    }
    if (!fqtvNumber || typeof fqtvNumber !== "string") {
      throw new Error(
        `[Profile.removeFqtvEntry] "fqtvNumber" must be a non-empty string, got: ${typeof fqtvNumber} (${JSON.stringify(fqtvNumber)})`
      );
    }

    logger.debug(`[Profile.removeFqtvEntry] Removing FQTV entry "${fqtvNumber}"`);

    const profilePage = getPageObject(page, ProfilePage);

    // Check if the entry exists before attempting removal
    const entryExists = await profilePage.isFqtvEntryVisible(fqtvNumber);
    if (!entryExists) {
      logger.info(`[Profile.removeFqtvEntry] FQTV entry "${fqtvNumber}" not found — already removed, skipping`);
      return { skipped: true, reason: "entry not present" };
    }

    try {
      await profilePage.clickRemoveOnEntry(fqtvNumber);
      await profilePage.confirmDeleteDialog();
      // Wait for the entry to disappear from the DOM after deletion
      await profilePage.waitForEntryToDisappear(fqtvNumber);
    } catch (err) {
      throw new Error(
        `[Profile.removeFqtvEntry] Failed to remove FQTV entry "${fqtvNumber}": ${err.message}`
      );
    }

    return { skipped: false };
  },

  /**
   * Verifies that a FQTV entry is no longer visible in the profile.
   */
  async verifyFqtvEntryRemoved(page, fqtvNumber) {
    if (!page) {
      throw new Error('[Profile.verifyFqtvEntryRemoved] "page" is required.');
    }

    logger.debug(`[Profile.verifyFqtvEntryRemoved] Verifying FQTV entry "${fqtvNumber}" is removed`);

    const profilePage = getPageObject(page, ProfilePage);

    const isStillVisible = await profilePage.isFqtvEntryVisible(fqtvNumber);
    if (isStillVisible) {
      throw new Error(
        `[Profile.verifyFqtvEntryRemoved] FQTV entry "${fqtvNumber}" is still visible in the profile — ` +
        `deletion may not have been processed by the server.`
      );
    }
  },

  /**
   * Adds a new FQTV entry: clicks Add, selects first airline, fills number, saves.
   */
  async addFqtvEntry(page, fqtvNumber) {
    if (!page) {
      throw new Error('[Profile.addFqtvEntry] "page" is required.');
    }
    if (!fqtvNumber || typeof fqtvNumber !== "string") {
      throw new Error(
        `[Profile.addFqtvEntry] "fqtvNumber" must be a non-empty string, got: ${typeof fqtvNumber} (${JSON.stringify(fqtvNumber)})`
      );
    }

    logger.debug(`[Profile.addFqtvEntry] Adding FQTV entry "${fqtvNumber}" with first available airline`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickAddFrequentFlyer();
    } catch (err) {
      throw new Error(
        `[Profile.addFqtvEntry] Failed to click "Add Frequent Flyer" button: ${err.message}`
      );
    }

    try {
      await profilePage.selectFirstAirlineFromDropdown();
    } catch (err) {
      throw new Error(
        `[Profile.addFqtvEntry] Failed to select airline from dropdown for entry "${fqtvNumber}": ${err.message}`
      );
    }

    try {
      await profilePage.fillFqtvNumber(fqtvNumber);
    } catch (err) {
      throw new Error(
        `[Profile.addFqtvEntry] Failed to fill FQTV number "${fqtvNumber}": ${err.message}`
      );
    }

    try {
      await profilePage.clickSaveFrequentPrograms();
    } catch (err) {
      throw new Error(
        `[Profile.addFqtvEntry] Failed to save after adding FQTV entry "${fqtvNumber}": ${err.message}`
      );
    }
  },
};

module.exports = Profile;
