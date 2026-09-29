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
  // Recorded before the click so a following "later departure results should be displayed" can
  // prove new departures actually arrived — the list grows in place, so nothing about the page
  // after the click distinguishes "loaded more" from "did nothing" on its own.
  this.benerailResultCountBeforeShowLater = await BenerailResults.getResultCount(this.page);
  logger.info("Clicking Show Later Departures on Benerail outbound results", {
    resultCountBeforeClick: this.benerailResultCountBeforeShowLater,
  });
  await BenerailResults.clickShowLaterDepartures(this.page);
});

Then("later departure results should be displayed", async function () {
  if (typeof this.benerailResultCountBeforeShowLater !== "number") {
    throw new Error(
      "[benerail_results.steps] Missing the pre-click result count — expected 'I click Show Later " +
      "Departures on the outbound results' to have run first",
    );
  }
  logger.info("Verifying later departures were added to the Benerail outbound results", {
    resultCountBeforeClick: this.benerailResultCountBeforeShowLater,
  });
  await BenerailResults.verifyLaterDeparturesDisplayed(this.page, this.benerailResultCountBeforeShowLater);
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

When("I add a Benerail fare {string} one way to the trip", async function (fareName) {
  logger.info("Adding the named Benerail fare from more options to the trip", { fareName });
  await BenerailResults.addBenerailFareOneWayToTrip(this.page, fareName);
});

When("I wait to see the change button on the selected Benerail leg", async function () {
  logger.info("Waiting for the committed Benerail leg's Change button");
  await BenerailResults.waitForSelectedLegChangeButton(this.page);
});

// Select-only counterpart of the step above: a round trip picks a fare per leg and adds both with a
// single "Add to trip", so selecting and adding cannot be one step here (test 52934).
When("I select a Benerail {string} from more options", async function (fareDescriptor) {
  logger.info("Selecting a Benerail alternative from more options", { fareDescriptor });
  await BenerailResults.selectBenerailFareFromMoreOptions(this.page, fareDescriptor);
});

When("I click Benerail add to trip button", async function () {
  logger.info("Clicking the Benerail add to trip button");
  await BenerailResults.clickAddToTripBenerail(this.page);
});

Then("the cart should show {string} for the Benerail outbound in cart", async function (expectedClass) {
  logger.info("Verifying the Benerail outbound leg travel class in the cart", { expectedClass });
  const actualClass = await Cart.getEuRailSegmentClass(this.page, 0);
  expect(
    actualClass,
    `Expected the Benerail outbound leg in the cart to show the "${expectedClass}" travel class, but got: "${actualClass}"`,
  ).toBe(expectedClass);
});

Then("the cart should show {string} for the Benerail inbound in cart", async function (expectedClass) {
  logger.info("Verifying the Benerail inbound leg travel class in the cart", { expectedClass });
  const actualClass = await Cart.getEuRailSegmentClass(this.page, 1);
  expect(
    actualClass,
    `Expected the Benerail inbound leg in the cart to show the "${expectedClass}" travel class, but got: "${actualClass}"`,
  ).toBe(expectedClass);
});

Then("I verify that the first train company of the route for the first result is {string}", async function (expectedCompany) {
  logger.info("Verifying the first train company of the route for the first Benerail result", { expectedCompany });
  const actualCompany = await BenerailResults.getFirstTrainCompanyForResult(this.page, 0);
  expect(
    actualCompany,
    `The first train company of the route on the first Benerail result should be "${expectedCompany}", but got: "${actualCompany}"`,
  ).toBe(expectedCompany);
});

// Cart / trip-overview counterpart of the results-page check above: the quote card renders the same
// eu-rail-route-details block, so the carrier the traveller picked can be re-verified after adding.
Then("I verify that the first train company of the route is {string}", async function (expectedCompany) {
  logger.info("Verifying the first train company of the route on the Benerail quote card", { expectedCompany });
  const actualCompany = await Cart.getFirstEuRailTrainCompany(this.page);
  expect(
    actualCompany,
    `The first train company of the route on the Benerail quote card should be "${expectedCompany}", but got: "${actualCompany}"`,
  ).toBe(expectedCompany);
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
// Test 22999 validates the mobile barcode twice: on the booked quote card in the trip overview, and
// again in the share itinerary email. The four trip-overview steps are kept separate rather than
// folded into one so the failure points to which half broke — button missing, dialog not opening, or
// the barcode image itself not rendering.
Then("I should see Benerail mobile barcode in trip overview", async function () {
  logger.info("Verifying the Mobile Barcode button is displayed on the booked Benerail quote");
  await Cart.verifyEuRailMobileBarcodeButtonVisible(this.page);
});

When("I click Benerail mobile barcode", async function () {
  logger.info("Opening the Benerail mobile barcode dialog");
  await Cart.openEuRailMobileBarcodeDialog(this.page);
});

Then("I should see the QR code", async function () {
  logger.info("Verifying the barcode image is displayed in the Benerail mobile barcode dialog");
  await Cart.verifyEuRailMobileBarcodeImageDisplayed(this.page);
});

When("I close the Benerail mobile barcode dialog", async function () {
  logger.info("Closing the Benerail mobile barcode dialog");
  await Cart.closeEuRailMobileBarcodeDialog(this.page);
});

Then("Benerail mobile bar code in share itinerary is displayed", async function () {
  // The itinerary email is backend-generated and renders the barcode row far below the fold of the
  // preview iframe, so this goes through the preview reader that keeps scrolling the iframe until the
  // label appears. Closing the share dialog is part of this step — as the hotel
  // supplier-confirmation check in cart.steps.js also does — because the barcode label is the last
  // thing the scenario needs from the preview, and the approvers check that follows cannot open the
  // approvals dialog while the share dialog is still covering the trip overview.
  logger.info("Verifying the mobile bar code is displayed in the Benerail share itinerary email preview");
  await Cart.verifySharePreviewContainsText(this.page, "Mobile Bar Code");

  logger.info("Closing the share itinerary dialog");
  await Cart.closeShareDialog(this.page);
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

Then(
  "the time left to book counter should be visible in the Benerail checkout showing between {int} and {int} minutes",
  async function (minMinutes, maxMinutes) {
    logger.info("Verifying the time left to book counter in the Benerail checkout", { minMinutes, maxMinutes });
    await Cart.verifyTimeLeftToBookCounterVisibleInCheckout(this.page, { minMinutes, maxMinutes });
  },
);

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

// --- Train information: results vs cart vs itinerary email ---
// Leg keyword → quote card segment index (the cart lists the outbound leg first, the return second).
const BENERAIL_LEG_INDEXES = { outbound: 0, inbound: 1 };

function requireBenerailLeg(leg) {
  if (!(leg in BENERAIL_LEG_INDEXES)) {
    throw new Error(`[benerail_results.steps] Unknown journey "${leg}" — expected "outbound" or "inbound"`);
  }
  return BENERAIL_LEG_INDEXES[leg];
}

function requireResultsTrainInformation(world, leg) {
  const expected = world.benerailResultsTrainInformation?.[leg];
  if (!expected) {
    throw new Error(
      `[benerail_results.steps] No ${leg} train information was extracted from the results page — expected ` +
      `'I extract all train information from the "${leg}" journey details in results' to have run first`,
    );
  }
  return expected;
}

When("I extract all train information from the {string} journey details in results", async function (leg) {
  requireBenerailLeg(leg);
  const trainInformation = await BenerailResults.extractJourneyDetailsTrainInformation(this.page);
  logger.info("Extracted Benerail train information from the results journey details", { leg, trainInformation });
  this.benerailResultsTrainInformation = { ...this.benerailResultsTrainInformation, [leg]: trainInformation };
});

When("I click the cart journey details button for the {string} journey", async function (leg) {
  logger.info("Opening the Benerail cart journey details", { leg });
  await Cart.openEuRailJourneyDetails(this.page, requireBenerailLeg(leg));
});

Then("all {string} train information from cart should match the results", async function (leg) {
  const expected = requireResultsTrainInformation(this, leg);
  const actual = await BenerailResults.extractJourneyDetailsTrainInformation(this.page);
  logger.info("Verifying the Benerail cart train information matches the results", { leg, expected, actual });
  BenerailResults.verifyTrainInformationMatches(expected, actual, `${leg} journey: cart vs results`);
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

Then("the seating price should not be displayed in the Benerail cart summary", async function () {
  logger.info("Verifying no seating price is shown on the Benerail quote's cart summary line");
  await Cart.verifySeatingPriceNotDisplayedInTripSummary(this.page);
});

// --- Cart seating extras ---
When("I click Benerail seating in extras", async function () {
  logger.info("Opening the Benerail seating extras section in the cart");
  const result = await Cart.openRailSeatingExtras(this.page);
  logger.info("Benerail seating extras section opened", result);
});

When("I click outbound and inbound seat checkboxes", async function () {
  logger.info("Selecting a seat on the Benerail outbound and inbound legs");
  const selectedLegs = await Cart.selectRailSeatsForOutboundAndInbound(this.page);
  logger.info("Benerail seats selected", selectedLegs);
});

When("I extract outbound and inbound seat prices", async function () {
  this.benerailSeatPrices = await Cart.extractRailSeatPrices(this.page);
  logger.info("Extracted Benerail outbound and inbound seat prices", this.benerailSeatPrices);
});

When("I select continue without reserving seats", async function () {
  logger.info("Ticking 'Continue without reserving seats' in the Benerail seating extras");
  await Cart.selectRailContinueWithoutSeats(this.page);
});

Then("the seating price in the Benerail cart summary is the sum of outbound and inbound seats", async function () {
  if (!this.benerailSeatPrices) {
    throw new Error(
      "[benerail_results.steps] Missing the per-leg seat prices — expected 'I extract outbound and " +
      "inbound seat prices' to have run first, while the seating panel was still open",
    );
  }

  const { outbound, inbound } = this.benerailSeatPrices;
  logger.info("Verifying the Benerail cart summary seating price is the sum of both legs", {
    outbound,
    inbound,
  });
  await Cart.verifyRailSeatingPriceIsSumOfSeats(this.page, outbound, inbound);
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

Then("the Benerail journey stepper {string} step should show one of the times {string}", async function (leg, allowedTimes) {
  const expectedTimes = allowedTimes.split(",").map((time) => time.trim()).filter(Boolean);
  if (!expectedTimes.length) {
    throw new Error(`[benerail_results.steps] Expected a comma-separated list of times, got: "${allowedTimes}"`);
  }

  const { stepText, time } = await BenerailResults.getJourneyStepperStepTime(this.page, leg);
  logger.info("Verifying the Benerail journey stepper step time", { leg, stepText, time, expectedTimes });
  expect(
    expectedTimes,
    `Expected the ${leg} journey stepper step to show one of ${expectedTimes.join(" / ")}, but it shows "${stepText}"`,
  ).toContain(time);
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
  logger.info("Verifying the Benerail search results are displayed");
  await BenerailResults.waitForBenerailResults(this.page);
});

// ===== Vacancy check (ADO 70431 — Distribusion quote selection and vacancy check) =====

When("I click Benerail add to trip button and capture the vacancy check exchange", async function () {
  logger.info("Clicking Benerail add to trip button and capturing the vacancy check exchange");
  this.lastVacancyCheck = await BenerailResults.clickAddToTripBenerailAndCaptureVacancyCheck(this.page);
  logger.info("Vacancy check exchange captured", {
    itemsCacheKeyCount: Array.isArray(this.lastVacancyCheck.requestBody?.ItemsCacheKey)
      ? this.lastVacancyCheck.requestBody.ItemsCacheKey.length
      : 0,
    spinnerObservedDuringCheck: this.lastVacancyCheck.spinnerObservedDuringCheck,
  });
});

Then("a vacancy check should have been performed for the selected offer", async function () {
  logger.info("Verifying a vacancy check was performed for the selected offer");
  await BenerailResults.assertVacancyCheckPerformedForItems(this.page, this.lastVacancyCheck, 1);
});

Then("a vacancy check should have been performed for both selected offers", async function () {
  logger.info("Verifying a vacancy check was performed for both selected offers");
  await BenerailResults.assertVacancyCheckPerformedForItems(this.page, this.lastVacancyCheck, 2);
});

Then("the Add to cart button should show a loading spinner during the vacancy check", async function () {
  logger.info("Verifying the Add to cart button showed a loading spinner during the vacancy check");
  if (!this.lastVacancyCheck) {
    throw new Error(
      '[benerail_results.steps] No vacancy check has been captured. Run "I click Benerail add to trip ' +
      'button and capture the vacancy check exchange" first.'
    );
  }
  if (!this.lastVacancyCheck.spinnerObservedDuringCheck) {
    throw new Error(
      "[benerail_results.steps] Expected the Add to cart button to show its loading spinner while the " +
      "vacancy check was in flight, but it was never observed loading"
    );
  }
});

Then("no price change or unavailability message should be displayed", async function () {
  logger.info("Verifying no vacancy-outcome message is displayed");
  await BenerailResults.assertNoVacancyMessageDisplayed(this.page);
});

Then("the vacancy check response should report the price as unchanged and the fare as vacant", async function () {
  logger.info("Verifying the vacancy check response reports outcome 1 by value");
  await BenerailResults.assertVacancyResponseReportsPriceUnchangedAndVacant(this.page, this.lastVacancyCheck);
});

Then("the vacancy check request should have a correctly typed payload", async function () {
  logger.info("Verifying the vacancy check request has a correctly typed payload");
  await BenerailResults.assertVacancyCheckRequestShape(this.page, this.lastVacancyCheck);
});

Then("a fare not available alert should be displayed", async function () {
  logger.info("Verifying the fare not available message is displayed");
  await BenerailResults.assertVacancyUnavailableMessageDisplayed(this.page);
});

When("I click Change selection", async function () {
  logger.info("Clicking Change selection");
  await BenerailResults.clickChangeSelection(this.page);
});

Then("the inbound search results should be displayed", async function () {
  logger.info("Verifying the inbound Benerail search results are displayed");
  await BenerailResults.waitForBenerailResults(this.page);
});

Then("the vacancy check request should reference the search and item cache keys of the selected fare", async function () {
  logger.info("Verifying the vacancy check request references the selected fare's cache keys");
  await BenerailResults.assertVacancyCheckReferencesSelectedFareCacheKeys(this.page, this.lastVacancyCheck);
});

Then("the passenger-level and booking-level required attributes from the vacancy response should be present", async function () {
  logger.info("Verifying the vacancy response carries the required-attribute fields");
  await BenerailResults.assertVacancyResponseHasRequiredAttributeFields(this.page, this.lastVacancyCheck);
});
