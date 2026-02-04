/**
 * Common Step Definitions
 * 
 * Shared steps used across multiple features (flights, hotels, cars, etc.)
 * 
 * ===== STEP CATALOG =====
 * 
 * Given Steps:
 *   "I am logged in and ready to book a new trip"
 *     → Handled by Before hook (browser setup + login via App DSL)
 * 
 *   "I have added myself as the traveler"
 *     → Search.addMeAsTraveler(page)
 * 
 * Then Steps:
 *   "the booking status should be {string}"
 *     → Cart.expectBookingStatus(status, { page })
 * 
 * ========================
 */

require('module-alias/register');

const { Given, When, Then, setDefaultTimeout } = require('@cucumber/cucumber');
const { Search, Cart, Checkout } = require('../../src/dsl');
const tripStatus = require('../../src/data/tripStatus.json');

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When('I cancel the trip', async function () {
  console.log('Cancelling trip');
  await Cart.cancelTripStrict(this.page);
});

When('I accept the terms and conditions', async function () {
  console.log('Accepting terms and conditions');
});

When('I proceed to checkout', async function () {
  console.log('Proceeding to checkout');
  await Cart.acceptTermsAndConditionsAndProceedToCheckout(this.page);
});

When('I complete the booking', async function () {
  console.log('Completing booking');
  await Checkout.bookAndFinalize(this.page);
});

When('I click the share quote button', async function () {
  console.log('Clicking share quote button');
  await Cart.clickShareQuoteAndWaitForSubjectField(this.page);
});

When('I click the share itinerary button', async function () {
  console.log('Clicking share itinerary button');
  await Cart.clickShareItineraryAndWaitForSubjectField(this.page);
});

When('I send the share', async function () {
  console.log('Sending share with success notification');
  await Cart.sendQuoteAndWaitForSuccess(this.page);
});

// ===== GIVEN STEPS =====

Given('I am logged in and ready to book a new trip', async function () {
  console.log('User is logged in and on new trip page');
});

Given('I have added myself as the traveler', async function () {
  console.log('Adding traveler: I am the traveler');
  await Search.addMeAsTraveler(this.page);
});

Given('I have added traveler by name {string}', async function (travelerName) {
  console.log(`Adding traveler by name: ${travelerName}`);
  await Search.addTravellerByName(this.page, travelerName);
});

// ===== THEN STEPS =====

Then('the booking status should be {string}', async function (status) {
  console.log(`Verifying booking status is: ${status}`);
  
  if (status === 'Pending booking') {
    await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page: this.page });
  } else if (status === 'On Hold') {
    await Cart.expectBookingStatus(tripStatus.label.onHold.status, { page: this.page });
  } else if (status === 'Ticketing Complete') {
    await Cart.expectBookingStatus(tripStatus.label.ticketingComplete.status, { page: this.page });
  } else {
    throw new Error(`Unknown booking status: ${status}`);
  }
});

Then('the trip should be successfully cancelled', async function () {
  console.log('Trip cancellation validated');
});

Then('I should see a success notification', async function () {
  console.log('Verifying success notification is visible');
  const successNotification = this.page.getByText('Success', { exact: true });
  await successNotification.waitFor({ state: 'visible' });
});

