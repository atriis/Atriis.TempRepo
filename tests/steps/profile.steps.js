const { When, Then } = require("@cucumber/cucumber");
const { Cart, Profile } = require("@dsl");
const logger = require("@utils/logger").child("Profile");

// --- Profile navigation steps ---

When("I navigate to my user profile", async function () {
  logger.info("Navigating to user profile page");
  const profilePage = await Profile.navigateToProfile(this.page);
  // Profile opens in a new tab — update the active page reference
  this.page = profilePage;
});

When("I open the frequent programs tab in my profile", async function () {
  logger.info("Opening frequent programs tab in user profile");
  await Profile.openFrequentProgramsTab(this.page);
});

When("I remove the FQTV entry {string} from my profile", async function (fqtvNumber) {
  logger.info("Removing FQTV entry from profile", { fqtvNumber });
  this.lastRemovedFqtvNumber = fqtvNumber;
  await Profile.removeFqtvEntry(this.page, fqtvNumber);
});

Then("the FQTV entry should no longer be visible in my profile", async function () {
  logger.info("Verifying FQTV entry is no longer visible");
  // Use the fqtvNumber from the previous remove step (stored contextually in the scenario)
  // The last removed number is "123456543" per the scenario — but we verify generically via DOM state
  await Profile.verifyFqtvEntryRemoved(this.page, this.lastRemovedFqtvNumber || "123456543");
});

When("I add a new FQTV entry with number {string} using the first available airline", async function (fqtvNumber) {
  logger.info("Adding new FQTV entry to profile", { fqtvNumber });
  await Profile.addFqtvEntry(this.page, fqtvNumber);
});

// --- Hotel loyalty prepopulation steps ---

Then("the loyalty number should be pre-populated with a green success icon", async function () {
  logger.info("Verifying loyalty number is pre-populated with success icon");
  throw new Error(
    "TODO: implement 'the loyalty number should be pre-populated with a green success icon' — " +
    "scroll to the loyalty section, wait for '.card-title' text 'Loyalty number', " +
    "then verify '.success-icon' contains 'check_circle' text. " +
    "See case_1 and case_2 in Testim 53953. " +
    "DSL candidate: Cart.verifyLoyaltyPrepopulatedWithSuccess(page)"
  );
});

Then("the loyalty chain dropdown should show {string}", async function (expectedChainAndNumber) {
  logger.info("Verifying loyalty chain dropdown shows expected value", { expectedChainAndNumber });
  throw new Error(
    `TODO: implement 'the loyalty chain dropdown should show "${expectedChainAndNumber}"' — ` +
    "click the loyalty clickable area (.quote-extras--loyalty-number .is-clickable), " +
    "then verify '.el-select__placeholder span' contains the expected text. " +
    "See case_1 and case_2 in Testim 53953. " +
    "DSL candidate: Cart.verifyLoyaltyChainDropdown(page, expectedChainAndNumber)"
  );
});

// --- Rail loyalty steps ---

When("I select rail loyalty number {string} with value {string} and proceed to checkout", async function (vendorCode, loyaltyValue) {
  logger.info("Selecting rail loyalty number and proceeding to checkout", { vendorCode, loyaltyValue });
  throw new Error(
    `TODO: implement 'I select rail loyalty number "${vendorCode}" with value "${loyaltyValue}" and proceed to checkout' — ` +
    "expand loyalty section (click .loyalty-program .is-clickable), " +
    "click existing tab (#tab-1), wait, click SVG icon to open vendor dropdown, " +
    "select the vendor matching the code, save (.no-border), " +
    "verify green check_circle icon, then accept T&C and proceed to checkout. " +
    "See choose_loyalty_number_for_EUR__4578213__and_book() in Testim 33805. " +
    "DSL candidate: Cart.selectRailLoyaltyAndProceedToCheckout(page, { vendorCode, loyaltyValue })"
  );
});

When("I select the second rail loyalty vendor and proceed to checkout", async function () {
  logger.info("Selecting second rail loyalty vendor and proceeding to checkout");
  throw new Error(
    "TODO: implement 'I select the second rail loyalty vendor and proceed to checkout' — " +
    "expand loyalty section (click .loyalty-program .is-clickable), " +
    "click existing tab (#tab-1), open vendor dropdown (.el-select__caret), " +
    "select 2nd option in scrollbar view, save (.no-border), " +
    "verify green check_circle, then accept T&C and proceed to checkout. " +
    "See choose_loyalty_number_for_EUR__4578213__and_book_1() in Testim 33805. " +
    "DSL candidate: Cart.selectSecondRailLoyaltyAndProceedToCheckout(page)"
  );
});

// --- Hotel loyalty from profile steps ---

When("I select existing loyalty number from profile", async function () {
  logger.info("Selecting existing loyalty number from traveler profile");
  throw new Error(
    "TODO: implement 'I select existing loyalty number from profile' — " +
    "scroll to loyalty section, click the clickable loyalty area, " +
    "click the first radio button (existing loyalty), " +
    "open the chain dropdown, select '6C' chain option, " +
    "save, verify success notification and green check_circle. " +
    "See add_loyalty_number___6c_456789() in Testim 33863. " +
    "DSL candidate: Cart.selectExistingHotelLoyaltyFromProfile(page)"
  );
});

Then("the loyalty number should be saved with a green success icon", async function () {
  logger.info("Verifying loyalty number is saved with green success icon");
  throw new Error(
    "TODO: implement 'the loyalty number should be saved with a green success icon' — " +
    "verify '.success-icon' text is 'check_circle' in the loyalty section. " +
    "See add_loyalty_number___6c_456789() in Testim 33863. " +
    "DSL candidate: Cart.verifyLoyaltySavedWithSuccess(page)"
  );
});
