require('module-alias/register');
const { When, Then } = require('@cucumber/cucumber');
const UnusedTickets = require('@dsl/UnusedTickets');
const logger = require('@utils/logger').child('UnusedTickets');

When('I click the airplane icon next to the traveler to view unused tickets', async function () {
  logger.info('Clicking airplane icon next to traveler (search page) to view unused tickets');
  await UnusedTickets.openUnusedTicketsModalFromSearchTraveler(this.page);
});

When('I click the airplane icon in the results header to view unused tickets', async function () {
  logger.info('Clicking airplane icon in results header to view unused tickets');
  await UnusedTickets.openUnusedTicketsModalFromResultsHeader(this.page);
});

When('I click "View details" on the unused tickets banner', async function () {
  logger.info('Clicking "View details" on unused tickets banner');
  await UnusedTickets.openUnusedTicketsFromBannerViewDetails(this.page);
});

Then('the unused tickets list should include a ticket for carrier {string}', async function (carrier) {
  logger.info('Verifying the unused tickets list includes a ticket for carrier', { carrier });
  await UnusedTickets.verifyUnusedTicketForCarrier(this.page, carrier);
});

Then('MCO unused tickets should be hidden', async function () {
  logger.info('Verifying MCO unused tickets are hidden');
  await UnusedTickets.verifyMcoUnusedTicketsHidden(this.page);
});

When('I close the unused tickets modal', async function () {
  logger.info('Closing unused tickets modal');
  await UnusedTickets.closeUnusedTicketsModal(this.page);
});

When('I check the unused ticket checkbox on checkout', async function () {
  logger.info('Checking unused ticket checkbox on checkout');
  await UnusedTickets.checkUnusedTicketCheckboxOnCheckout(this.page);
});

Then('MCO unused tickets should be hidden on checkout', async function () {
  logger.info('Verifying MCO unused tickets are hidden on checkout');
  await UnusedTickets.verifyMcoHiddenOnCheckout(this.page);
});

Then('the checkout unused tickets list should include a ticket with record locator containing {string}', async function (recordLocatorText) {
  logger.info('Verifying the checkout unused tickets list includes a record locator', { recordLocatorText });
  await UnusedTickets.verifyCheckoutTicketWithRecordLocator(this.page, recordLocatorText);
});

When('I select the unused ticket with record locator containing {string} on checkout', async function (recordLocatorText) {
  logger.info('Selecting an unused ticket on checkout', { recordLocatorText });
  await UnusedTickets.selectCheckoutTicketByRecordLocator(this.page, recordLocatorText);
});

Then('the unused tickets action button on checkout should be {string}', async function (expectedLabel) {
  logger.info('Verifying the checkout unused tickets action button label', { expectedLabel });
  await UnusedTickets.verifyCheckoutActionButtonLabel(this.page, expectedLabel);
});

When('I apply the selected unused ticket on checkout', async function () {
  logger.info('Applying the selected unused ticket on checkout');
  await UnusedTickets.applySelectedCheckoutTicket(this.page);
});

Then('the unused tickets banner should be visible in results', async function () {
  logger.info('Verifying unused tickets banner is visible in results');
  await UnusedTickets.verifyBannerVisible(this.page);
});

Then('the unused tickets banner should not be visible in results', async function () {
  logger.info('Verifying unused tickets banner is not visible in results');
  await UnusedTickets.verifyBannerNotVisible(this.page);
});

Then('the unused tickets filter should be visible in results', async function () {
  logger.info('Verifying unused tickets filter is visible in results');
  await UnusedTickets.verifyFilterVisible(this.page);
});

Then('the unused tickets filter should not be visible in results', async function () {
  logger.info('Verifying unused tickets filter is not visible in results');
  await UnusedTickets.verifyFilterNotVisible(this.page);
});
