require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { BenerailResults, Cart, FlightResults, Results } = require("@dsl");
const { expectSumToBeEqualWithTolerance } = require("../../src/assertions/numberAssertions");
const logger = require("@utils/logger").child("BenerailResults");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I select the first Benerail option", async function () {
  logger.info("Selecting first Benerail option");
  await BenerailResults.waitAndSelectFirstBenerailOption(this.page);
});

When("I add a Benerail one way to the trip", async function () {
  logger.info("Adding Benerail one-way to trip");
  await BenerailResults.addBenerailOneWayToTrip(this.page);
});

When("I add a Benerail round trip to the trip", async function () {
  logger.info("Adding Benerail round trip to trip");
  await BenerailResults.addBenerailRoundtripToTrip(this.page);
});

When("I click Show Later Departures on the outbound results", async function () {
  logger.info("Clicking Show Later Departures on Benerail outbound results");
  await BenerailResults.clickShowLaterDepartures(this.page);
});

When("I expand more options for the first result", async function () {
  logger.info("Expanding more options for the first Benerail result");
  await BenerailResults.expandMoreOptionsForFirstResult(this.page);
});

Then("the handshake badge should be displayed in at least one of more options results", async function () {
  logger.info("Verifying the handshake badge is displayed in at least one of the more options results");
  await BenerailResults.verifyHandshakeBadgeVisibleInMoreOptionsResults(this.page);
});

Then("I hover the agreement logo to see the tooltip in more options results", async function () {
  logger.info("Hovering the agreement logo and verifying its tooltip in more options results");
  await BenerailResults.hoverAndVerifyAgreementTooltipInMoreOptionsResults(this.page);
});

Then("the out of policy tooltip in more options results should be {string}", async function (expectedText) {
  logger.info("Verifying OOP tooltip in more options results", { expectedText });
  const actualText = await BenerailResults.hoverAndGetOOPTooltipTextInMoreOptionsResults(this.page);
  const normalizedActual = actualText.replace(/\s+/g, ' ').trim();
  const normalizedExpected = expectedText.replace(/\s+/g, ' ').trim();
  expect(normalizedActual).toBe(normalizedExpected);
});

When("I select and add to cart the first agreement fare from more options", async function () {
  logger.info("Selecting and adding the first agreement fare from more options to the trip");
  await BenerailResults.selectAndAddAgreementFareFromMoreOptionsToTrip(this.page);
});

When("I expand More Options for the last outbound result and select an alternative fare", async function () {
  logger.info("Expanding More Options and selecting an alternative fare for the last outbound Benerail result");
  await BenerailResults.selectAlternativeFareForLastOutboundResult(this.page);
});

When("I select the first Benerail option for the inbound journey", async function () {
  logger.info("Selecting first Benerail option for the inbound journey");
  await BenerailResults.selectFirstBenerailOptionAndConfirmTransition(this.page);
});

// ===== TODO STUBS — need DSL/Page implementation =====

// --- Fare Rules ---
Then("the fare rules should be accessible in Benerail results and contain {string}", async function (expectedText) {
  logger.info("Verifying Benerail fare rules are accessible in results", { expectedText });
  await Cart.verifyRailFareRulesDialogContainsText(this.page, expectedText, 0);
});

Then("the fare rules should be accessible in the Benerail cart and contain {string}", async function (expectedText) {
  logger.info("Verifying Benerail fare rules are accessible in cart", { expectedText });
  await Cart.verifyRailFareRulesDialogContainsText(this.page, expectedText, 0);
});

Then("the fare rules should be accessible in the Benerail trip overview after booking and contain {string}", async function (expectedText) {
  logger.info("Verifying Benerail fare rules are accessible in the trip overview after booking", { expectedText });
  await Cart.verifyRailFareRulesDialogContainsText(this.page, expectedText, 0);
});

Then("the fare rules link should be visible in the Benerail trip overview", async function () {
  throw new Error("TODO: implement 'the fare rules link should be visible in the Benerail trip overview' — assert the fare rules link is rendered in the Benerail block on the trip overview (see test 22999)");
});

Then("the fare rules should be visible in the Benerail share quote email", async function () {
  throw new Error("TODO: implement 'the fare rules should be visible in the Benerail share quote email' — share quote, open email preview, assert fare rules content is included (see test 59289)");
});

Then("the fare rules should be visible in the Benerail share itinerary email", async function () {
  throw new Error("TODO: implement 'the fare rules should be visible in the Benerail share itinerary email' — share itinerary, open email preview, assert fare rules content is included (see test 59289)");
});

Then("the fare rules should remain accessible with correct information after the Benerail quote is cancelled", async function () {
  logger.info("Verifying Benerail fare rules remain accessible with correct information after cancellation");
  await Cart.verifyRailFareRulesAccessibleAfterCancellation(this.page, 2);
});

// --- Policy / OOP ---
Then("the OOP justification mandatory error should be displayed", async function () {
  throw new Error("TODO: implement 'the OOP justification mandatory error should be displayed' — attempt checkout without selecting OOP justification and assert the mandatory error is shown (see test 21020)");
});

Then("the OOP indicator should be displayed when two Benerail policy rules are combined", async function () {
  throw new Error("TODO: implement 'the OOP indicator should be displayed when two Benerail policy rules are combined' — search with a user whose policy has combined OOP rules and assert badge/icon is shown (see test 59265)");
});

Then("the travel policy should be triggered for 1st class and destination in Benerail", async function () {
  throw new Error("TODO: implement 'the travel policy should be triggered for 1st class and destination in Benerail' — verify OOP indicator is triggered when selecting 1st class on a destination-restricted route (see test 56134)");
});

// --- Approval flow ---
Then("the approval flow should have the correct approvers assigned", async function () {
  throw new Error("TODO: implement 'the approval flow should have the correct approvers assigned' — after booking with approval-flow policy, verify approvers list is correct on trip/approval page (see test 22999)");
});

Then("the approval flow should have the correct approvers for duration and origin rules", async function () {
  throw new Error("TODO: implement 'the approval flow should have the correct approvers for duration and origin rules' — after booking under duration & origin policy, verify approvers list (see test 23004)");
});

// --- Cancellation with Warning ---
When("I cancel the Benerail trip with warning and continue", async function () {
  throw new Error("TODO: implement 'I cancel the Benerail trip with warning and continue' — cancel the Benerail trip through UI, confirm the warning dialog that appears, then continue (different from standard Trip_Cancelation) (see tests 23004, hybrid_61642)");
});

When("I cancel the quoted Benerail booking from cart with warning", async function () {
  throw new Error("TODO: implement 'I cancel the quoted Benerail booking from cart with warning' — cancel a quoted/pending Benerail booking from the cart, handle the cancellation warning dialog (see test 22999)");
});

// --- Checkout alias ---
When("I checkout the Benerail booking", async function () {
  throw new Error("TODO: implement 'I checkout the Benerail booking' — alias for 'I proceed to checkout' specifically for Benerail approval-flow test (see test 22999); consider reusing When('I proceed to checkout') instead");
});

// --- Barcode ---
Then("the mobile barcode should be visible in cart and itinerary mail", async function () {
  throw new Error("TODO: implement 'the mobile barcode should be visible in cart and itinerary mail' — assert the mobile barcode element is rendered in cart, then send itinerary email and verify barcode is included (see test 22999)");
});

// --- Expiry ---
Then("the Benerail expiry tooltip should show at least {int} minutes", async function (minutes) {
  throw new Error(`TODO: implement 'the Benerail expiry tooltip should show at least ${minutes} minutes' — hover or read the expiry countdown element in cart and assert the value >= ${minutes} minutes (see test 29414)`);
});

Then("the Benerail expiry counter should be visible and show minutes remaining", async function () {
  throw new Error("TODO: implement 'the Benerail expiry counter should be visible and show minutes remaining' — assert the booking expiry countdown widget is visible in cart (see test 65020)");
});

When("I navigate to a specific Benerail trip and verify it shows Expired status", async function () {
  throw new Error("TODO: implement 'I navigate to a specific Benerail trip and verify it shows Expired status' — navigate to a stored trip URL and assert the trip status badge shows 'Expired' (see test 65020)");
});

Then("the Delete button should be displayed and the Search again button should be clickable", async function () {
  throw new Error("TODO: implement 'the Delete button should be displayed and the Search again button should be clickable' — on an expired Benerail trip, assert Delete and Search again CTAs are visible and functional (see test 65020)");
});

Then("the time left to book counter should be visible in the Benerail checkout", async function () {
  logger.info("Verifying the time left to book counter is visible in the Benerail checkout");
  await Cart.verifyTimeLeftToBookCounterVisibleInCheckout(this.page);
});

// --- 1st Class ---
When("I verify the second result is in 2nd class", async function () {
  throw new Error("TODO: implement 'I verify the second result is in 2nd class' — assert the second Benerail result row shows 2nd class label (see test 52934)");
});

When("I select the second Benerail result", async function () {
  throw new Error("TODO: implement 'I select the second Benerail result' — click the Select button on the second Benerail result row (see test 52934)");
});

When("I expand the 1st class options for the first Benerail result", async function () {
  throw new Error("TODO: implement 'I expand the 1st class options for the first Benerail result' — click the 1st class toggle/expand button on the first result (see test 52934)");
});

Then("the 1st class alternative should be visible for the first result", async function () {
  throw new Error("TODO: implement 'the 1st class alternative should be visible for the first result' — assert the 1st class option row is rendered for the first result (see test 52934)");
});

When("I select the 1st class Benerail option and add to trip", async function () {
  throw new Error("TODO: implement 'I select the 1st class Benerail option and add to trip' — click Select on the 1st class row and add to the trip (see test 52934)");
});

Then("the cart should show 1st Class for the Benerail booking", async function () {
  throw new Error("TODO: implement 'the cart should show 1st Class for the Benerail booking' — assert the cart displays '1st Class' or equivalent label for the Benerail quote (see test 52934)");
});

When("I open the Benerail seat selection in cart", async function () {
  throw new Error("TODO: implement 'I open the Benerail seat selection in cart' — click the seat selection button/link in the Benerail cart block (see test 52934)");
});

Then("the Book and Finalize button should be visible in the Benerail seat dialog", async function () {
  throw new Error("TODO: implement 'the Book and Finalize button should be visible in the Benerail seat dialog' — assert Book and Finalize CTA is visible within the seat selection dialog (see test 52934)");
});

// --- Price for multiple travelers ---
When("I set the age association for the second traveler", async function () {
  throw new Error("TODO: implement 'I set the age association for the second traveler' — select age category/association for the second traveler in Benerail extras (see test 34821)");
});

Then("the total price should reflect both travelers correctly", async function () {
  logger.info("Verifying the Benerail price breakdown total reflects both travelers correctly");
  const { total } = await BenerailResults.verifyTotalPriceReflectsAllTravelers(this.page, 0, 2);
  this.benerailLegPrices = this.benerailLegPrices || [];
  this.benerailLegPrices.push(total);
});

When("I extract the Benerail outbound total price for both travelers in results", async function () {
  const [outboundTotalForBothTravelers] = this.benerailLegPrices || [];
  if (typeof outboundTotalForBothTravelers !== "number") {
    throw new Error("[benerail_results.steps] Missing outbound total — expected 'the total price should reflect both travelers correctly' to have run for the outbound leg first");
  }
  logger.info("Storing the verified Benerail outbound leg total for both travelers", { outboundTotalForBothTravelers });
  this.benerailOutboundTotalForBothTravelers = outboundTotalForBothTravelers;
});

When("I extract the Benerail inbound total price for both travelers in results", async function () {
  const inboundTotalForBothTravelers = (this.benerailLegPrices || [])[1];
  if (typeof inboundTotalForBothTravelers !== "number") {
    throw new Error("[benerail_results.steps] Missing inbound total — expected 'the total price should reflect both travelers correctly' to have run a second time for the inbound leg");
  }
  logger.info("Storing the verified Benerail inbound leg total for both travelers", { inboundTotalForBothTravelers });
  this.benerailInboundTotalForBothTravelers = inboundTotalForBothTravelers;
});

Then("the total price in cart should equal the sum of the outbound and inbound totals for both travelers", async function () {
  if (typeof this.benerailOutboundTotalForBothTravelers !== "number" || typeof this.benerailInboundTotalForBothTravelers !== "number") {
    throw new Error("[benerail_results.steps] Missing outbound/inbound total — expected both 'I extract the Benerail outbound total price for both travelers in results' and 'I extract the Benerail inbound total price for both travelers in results' to have run first");
  }
  const cartTotal = await Cart.extractCartTotalPrice(this.page);
  logger.info("Verifying the Benerail cart total equals outbound + inbound totals for both travelers", {
    outboundTotalForBothTravelers: this.benerailOutboundTotalForBothTravelers,
    inboundTotalForBothTravelers: this.benerailInboundTotalForBothTravelers,
    cartTotal,
  });
  expectSumToBeEqualWithTolerance(this.benerailOutboundTotalForBothTravelers, this.benerailInboundTotalForBothTravelers, cartTotal, 0.02, "Benerail cart total");
});

Then("the booking status should show In Progress or Finalizing", async function () {
  throw new Error("TODO: implement 'the booking status should show In Progress or Finalizing' — after completing booking, assert the trip status badge is In Progress or Finalizing (see test 34821)");
});

// --- Share from results ---
Then("the journey details button should be visible in Benerail results", async function () {
  throw new Error("TODO: implement 'the journey details button should be visible in Benerail results' — assert the Journey Details expand button is rendered on Benerail results cards (see test 35111)");
});

When("I send the Benerail price offer from results", async function () {
  throw new Error("TODO: implement 'I send the Benerail price offer from results' — click share, select Price Offer, fill email, send from the results page (see test 35111)");
});

When("I close the Benerail share bar", async function () {
  throw new Error("TODO: implement 'I close the Benerail share bar' — close the share options bar/panel in Benerail results (see test 35111)");
});

Then("the traveler name should appear in the share quote email preview", async function () {
  throw new Error("TODO: implement 'the traveler name should appear in the share quote email preview' — share quote, open preview, assert traveler name is shown in the email body (see test 35111)");
});

Then("the EU Rail label should appear in the share itinerary email preview", async function () {
  throw new Error("TODO: implement 'the EU Rail label should appear in the share itinerary email preview' — share itinerary, open preview, assert EU Rail branding label is present in the email body (see test 35111)");
});

// --- Journey details time comparison ---
When("I extract the departure and arrival times from the Benerail results", async function () {
  throw new Error("TODO: implement 'I extract the departure and arrival times from the Benerail results' — read and store departure/arrival times displayed on the first result card (see test 44941)");
});

When("I open journey details for the first Benerail result", async function () {
  logger.info("Opening journey details for the first Benerail result");
  await BenerailResults.openJourneyDetailsForFirstResult(this.page);
});

Then("I should see {string} in journey details", async function (expectedText) {
  logger.info("Verifying text is visible in the Benerail journey details panel", { expectedText });
  await BenerailResults.verifyStationVisibleInJourneyDetails(this.page, expectedText);
});

Then("the travel time should be displayed in the Benerail journey details panel", async function () {
  logger.info("Verifying the 'Travel Time' heading is visible in the Benerail journey details panel");
  await BenerailResults.verifyTravelTimeVisibleInJourneyDetails(this.page);
});

When("I extract the departure and arrival times from the journey details panel", async function () {
  logger.info("Extracting departure and arrival times from the Benerail journey details panel");
  this.benerailJourneyDetailsTimes = await BenerailResults.extractJourneyDetailsTimes(this.page);
});

Then("the journey details times should match the results page times", async function () {
  const { initial } = this.benerailDepartureTimes || {};
  const resultsArrival = this.benerailResultsArrivalTime;
  const journeyDetails = this.benerailJourneyDetailsTimes;
  if (!initial || !resultsArrival || !journeyDetails) {
    throw new Error("Missing stored times — expected the results-page departure/arrival times and the journey-details-panel times to have been extracted first");
  }
  logger.info("Verifying Benerail journey details times match the results page times", {
    resultsDeparture: initial.raw,
    resultsArrival: resultsArrival.raw,
    journeyDetailsDeparture: journeyDetails.departure.raw,
    journeyDetailsArrival: journeyDetails.arrival.raw,
  });
  if (journeyDetails.departure.minutes !== initial.minutes) {
    throw new Error(`Expected the journey details departure time ("${journeyDetails.departure.raw}") to match the results page departure time ("${initial.raw}")`);
  }
  if (journeyDetails.arrival.minutes !== resultsArrival.minutes) {
    throw new Error(`Expected the journey details arrival time ("${journeyDetails.arrival.raw}") to match the results page arrival time ("${resultsArrival.raw}")`);
  }
});

When("I close the Benerail journey details panel", async function () {
  logger.info("Closing the Benerail journey details panel");
  await BenerailResults.closeJourneyDetailsPanel(this.page);
});

Then("the traveler should still be visible in the Benerail cart", async function () {
  throw new Error("TODO: implement 'the traveler should still be visible in the Benerail cart' — after adding quote to cart, assert traveler is displayed in the cart header/traveler section (see test 44941)");
});

// --- Air-rail mixed ---
Then("the Rail is available for this route message should be visible in flight results", async function () {
  throw new Error("TODO: implement 'the Rail is available for this route message should be visible in flight results' — assert the Air-Rail informational banner/message is visible on the flight results page (see test 47148)");
});

When("I click the rail options button in flight results", async function () {
  logger.info("Clicking Rail Options button in flight results");
  this.page = await FlightResults.clickRailOptionsButton(this.page);
});

Then("the first Benerail result Select button should be visible", async function () {
  logger.info("Verifying the first Benerail result's Select button is visible");
  await Results.verifySelectButtonVisible(this.page);
});

// --- Results improvements ---
Then("the Benerail results page improvements should be visible", async function () {
  throw new Error("TODO: implement 'the Benerail results page improvements should be visible' — assert various UI improvement elements are present on the results page (see test 51524)");
});

Then("the seat price should not be included in the journey price", async function () {
  throw new Error("TODO: implement 'the seat price should not be included in the journey price' — assert the displayed journey price does NOT include seat reservation price (see test 51524)");
});

Then("the seat selection improvements should be validated in results", async function () {
  throw new Error("TODO: implement 'the seat selection improvements should be validated in results' — validate seat selection UI improvements: layout, labels, pricing breakdown (see test 51524)");
});

// --- Mandatory age association ---
Then("the Age Association mandatory field should not be displayed in the Benerail extras", async function () {
  throw new Error("TODO: implement 'the Age Association mandatory field should not be displayed in the Benerail extras' — assert the Age Association field is NOT marked as mandatory in the Benerail extras section (see test 56162)");
});

// --- Route/refundable in itinerary ---
Then("the Benerail route displayed should be the correct one", async function () {
  throw new Error("TODO: implement 'the Benerail route displayed should be the correct one' — assert origin/destination stations shown on the results page match the searched route (see test 62008)");
});

Then("the Benerail route in cart should be the correct one", async function () {
  throw new Error("TODO: implement 'the Benerail route in cart should be the correct one' — assert origin/destination stations in the cart block match the searched route (see test 62008)");
});

Then("the Benerail ticket should be marked as refundable in cart", async function () {
  throw new Error("TODO: implement 'the Benerail ticket should be marked as refundable in cart' — assert the refundable/cancellable indicator is displayed in the Benerail cart block (see test 62008)");
});

When("I select a seat for the Benerail booking", async function () {
  throw new Error("TODO: implement 'I select a seat for the Benerail booking' — open seat selection, pick a seat, confirm selection (see test 62008)");
});

Then("the Benerail ticket should be marked as refundable in the itinerary after booking", async function () {
  throw new Error("TODO: implement 'the Benerail ticket should be marked as refundable in the itinerary after booking' — on the trip overview/itinerary page, assert the Benerail ticket has a refundable indicator (see test 62008)");
});

// --- Train details ---
Then("the train details should be displayed in the Benerail journey details", async function () {
  throw new Error("TODO: implement 'the train details should be displayed in the Benerail journey details' — open journey details and assert train number, type, and departure/arrival fields are visible (see test 62215)");
});

// --- Earlier/Later navigation ---
Then("the first Benerail result should depart from 06:00 or later", async function () {
  const { initial } = this.benerailDepartureTimes || {};
  if (!initial) {
    throw new Error("[benerail_results.steps] Missing stored departure time — expected the initial first result departure time to have been extracted first");
  }
  logger.info("Verifying the first Benerail result departs from 06:00 or later", { initial: initial.raw });
  const earliestAllowedMinutes = 6 * 60;
  if (initial.minutes < earliestAllowedMinutes) {
    throw new Error(`[benerail_results.steps] Expected the first Benerail result's departure time ("${initial.raw}") to be 06:00 or later`);
  }
});

When("I extract the first result departure time", async function () {
  logger.info("Extracting the initial first Benerail result departure time");
  this.benerailDepartureTimes = this.benerailDepartureTimes || {};
  this.benerailDepartureTimes.initial = await BenerailResults.extractFirstResultDepartureTime(this.page);
});

When("I extract the first result arrival time", async function () {
  logger.info("Extracting the first Benerail result arrival time");
  this.benerailResultsArrivalTime = await BenerailResults.extractFirstResultArrivalTime(this.page);
});

When("I click Later and extract the first result departure time", async function () {
  logger.info("Clicking Later and extracting the first Benerail result departure time");
  this.benerailDepartureTimes = this.benerailDepartureTimes || {};
  this.benerailDepartureTimes.firstLater = await BenerailResults.clickLaterAndExtractFirstResultDepartureTime(this.page);
})

When("I click Later and extract the subsequent first result departure time", async function () {
  logger.info("Clicking Later a second time and extracting the new first Benerail result departure time");
  this.benerailDepartureTimes = this.benerailDepartureTimes || {};
  this.benerailDepartureTimes.secondLater = await BenerailResults.clickLaterAndExtractFirstResultDepartureTime(this.page);
});

Then("the first Later click should display results later than the initial results", async function () {
  const { initial, firstLater } = this.benerailDepartureTimes || {};
  if (!initial || !firstLater) {
    throw new Error("Missing stored departure times — expected both the initial extraction and the first Later click to have run first");
  }
  logger.info("Verifying the first Later click shows a later departure time than the initial results", { initial: initial.raw, firstLater: firstLater.raw });
  if (!(firstLater.minutes > initial.minutes)) {
    throw new Error(`Expected the first Later click's departure time ("${firstLater.raw}") to be later than the initial departure time ("${initial.raw}")`);
  }
});

Then("the second Later click should display results later than the first Later click", async function () {
  const { firstLater, secondLater } = this.benerailDepartureTimes || {};
  if (!firstLater || !secondLater) {
    throw new Error("Missing stored departure times — expected both the first and second Later click extractions to have run first");
  }
  logger.info("Verifying the second Later click shows a later departure time than the first Later click", { firstLater: firstLater.raw, secondLater: secondLater.raw });
  if (!(secondLater.minutes > firstLater.minutes)) {
    throw new Error(`Expected the second Later click's departure time ("${secondLater.raw}") to be later than the first Later click's departure time ("${firstLater.raw}")`);
  }
});

When("I click Earlier and extract the first result departure time", async function () {
  logger.info("Clicking Earlier and extracting the first Benerail result departure time");
  this.benerailDepartureTimes = this.benerailDepartureTimes || {};
  this.benerailDepartureTimes.earlier = await BenerailResults.clickEarlierAndExtractFirstResultDepartureTime(this.page);
});

Then("the earlier results departure time should be before the later results time", async function () {
  const { earlier, firstLater } = this.benerailDepartureTimes || {};
  if (!earlier || !firstLater) {
    throw new Error("[benerail_results.steps] Missing stored departure times — expected both the Earlier click and the Later click extractions to have run first");
  }
  logger.info("Verifying the Earlier click's departure time is before the Later click's departure time", { earlier: earlier.raw, firstLater: firstLater.raw });
  if (!(earlier.minutes < firstLater.minutes)) {
    throw new Error(`[benerail_results.steps] Expected the Earlier click's departure time ("${earlier.raw}") to be before the Later click's departure time ("${firstLater.raw}")`);
  }
});

// --- Check-in ---
Then("the check-in required notice should be visible in cart", async function () {
  throw new Error("TODO: implement 'the check-in required notice should be visible in cart' — assert the check-in required notice/badge is shown in the Benerail cart block (see test 62469)");
});

Then("the Check-in button should be visible in cart", async function () {
  throw new Error("TODO: implement 'the Check-in button should be visible in cart' — assert the Check-in button/link is visible in the Benerail cart block (see test 62469)");
});

When("I click the Check-in button in cart", async function () {
  throw new Error("TODO: implement 'I click the Check-in button in cart' — click the Check-in button in the Benerail cart block to open the check-in panel (see test 62469)");
});

Then("the check-in panel should show the Outbound leg", async function () {
  throw new Error("TODO: implement 'the check-in panel should show the Outbound leg' — assert the Outbound leg section is visible in the check-in information panel (see test 62469)");
});

Then("the check-in panel should show the Available from time", async function () {
  throw new Error("TODO: implement 'the check-in panel should show the Available from time' — assert the 'Available from' timestamp section is displayed in the check-in panel (see test 62469)");
});

// --- Notification banner ---
When("I close the mandatory notification banner if visible", async function () {
  throw new Error("TODO: implement 'I close the mandatory notification banner if visible' — conditionally close the mandatory notification banner if it appears on the Benerail results page (see test 62825)");
});

// --- No trains found ---
Then("the no trains found message should be displayed in Benerail results", async function () {
  logger.info("Verifying the no trains found message is displayed in Benerail results");
  await BenerailResults.verifyNoTrainsFoundMessage(this.page, "No train found on selected times");
});

// --- Loyalty card ---
Then("the new and existing loyalty card options should be saved at trip level", async function () {
  throw new Error("TODO: implement 'the new and existing loyalty card options should be saved at trip level' — add/save a new loyalty card during booking, then re-open and verify it is available as existing (see test 63920)");
});

// --- Journey summary (direct/changes) ---
Then("the journey summary should show the same number of change dots as changes", async function () {
  logger.info("Verifying Benerail journey summary change count matches rendered change dots");
  await BenerailResults.verifyJourneySummaryChangesMatchDots(this.page);
});

// --- Journey selection stepper ---
Then("the Benerail journey stepper should show the outbound step highlighted and the inbound step default, both with their date and time", async function () {
  logger.info("Verifying Benerail journey stepper before any leg selection");
  await BenerailResults.verifyJourneyStepperBeforeSelection(this.page);
});

Then("the Benerail journey stepper should show the outbound step completed and the inbound step highlighted, both with their date and time", async function () {
  logger.info("Verifying Benerail journey stepper after the outbound leg is selected");
  await BenerailResults.verifyJourneyStepperAfterOutboundSelection(this.page);
});

// --- Agreement UI ---
Then("the Benerail agreement UI should be displayed in results", async function () {
  throw new Error("TODO: implement 'the Benerail agreement UI should be displayed in results' — assert the agreement terms/consent UI component is rendered in the Benerail results page (see test 68824)");
});

// --- API steps ---
When("I extract the trip number from the current URL", async function () {
  throw new Error("TODO: implement 'I extract the trip number from the current URL' — read the current page URL, extract the trip ID number, and store in this.tripId for subsequent API validation steps (see test 72539)");
});

Then("the Benerail GetTrip API should contain ticket information", async function () {
  throw new Error("TODO: implement 'the Benerail GetTrip API should contain ticket information' — call GetTrip API with this.tripId, parse the response, assert ticket fields (e.g. ticketNumber, ticketType) are present. Note: requires ~120s wait for async processing (see test 72539)");
});

When("I cancel the Benerail trip via API", async function () {
  throw new Error("TODO: implement 'I cancel the Benerail trip via API' — call the cancellation API endpoint with this.tripId and the current user credentials (see test 72539)");
});

// --- Agreements account nav ---
Then("I should see {string} text in breadcrumb", async function (expectedText) {
  logger.info("Verifying text is visible in the Benerail results breadcrumb", { expectedText });
  await BenerailResults.verifyTextVisibleInBreadcrumb(this.page, expectedText);
});

// --- Results confirmation ---
Then("the Benerail search results should be displayed", async function () {
  throw new Error("TODO: implement 'the Benerail search results should be displayed' — wait for and assert the Benerail results page has loaded with at least one result visible (see test hybrid_62913)");
});
