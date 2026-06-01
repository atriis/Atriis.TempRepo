const { When, Then } = require("@cucumber/cucumber");
const { Administration } = require("@dsl");
const logger = require("@utils/logger").child("Administration");

// --- Administration portal navigation ---

When("I navigate to the administration page", async function () {
  logger.info("Navigating to the administration portal");
  const adminTab = await Administration.navigateToAdministration(this.page);
  this.adminPage = adminTab;
});

When("I search for user {string} in the administration", async function (userName) {
  logger.info("Searching for user in administration", { userName });
  await Administration.searchUserInAdmin(this.adminPage, userName);
});

When("I open the form of payment tab in the administration", async function () {
  logger.info("Opening Form of Payment tab in administration user view");
  await Administration.openFopTabInAdmin(this.adminPage);
});

Then("the credit card {string} should show expiry month {string} and year {string}", async function (cardName, month, year) {
  logger.info("Verifying credit card expiry in administration", { cardName, month, year });
  await Administration.verifyCcExpiryInAdmin(this.adminPage, { cardName, month, year });
});

When("I delete the credit card {string} from the administration", async function (cardName) {
  logger.info("Deleting credit card from administration", { cardName });
  await Administration.deleteCcFromAdmin(this.adminPage, cardName);
});
