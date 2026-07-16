require('module-alias/register');
const { When, Then } = require('@cucumber/cucumber');
const UnusedTickets = require('@dsl/UnusedTickets');
const logger = require('@utils/logger');

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
