# Test Name: 85772 Amadeus NDC - Separated Tickets upsell from Pricing Options books one quote per leg with its offer refs
# Status: Active
# Labels: Regression,Flights,Amadeus,Amadeus NDC,separate tickets,Pricing Options,Full Purchase
# Owner: Yael Alef
# Created: 2026-10-01

# ADO Test Case ID: 85772
# Source: ADO Bug #85525 - [Amadeus NDC] Booking fails before reaching Amadeus: offer refs saved empty at
#         add-to-cart
#
# A Separated Tickets NDC selection opened in Pricing Options is upsold once per leg and the per-leg
# options are recombined. The recombined option used to reach the cart as a round trip with no offer
# references (AirPricingSolution ";"), so every booking threw "Missing Offer/Shopping refs" before any
# request reached Amadeus. It must now be saved as one quote per leg, each carrying its own offer, and
# the booking OfferPrice / OrderCreate must be sent with that offer.
# CPH-FRA on dev returns LOT out / Finnair back as the first Multi carrier result - both Amadeus NDC.

@ado:85772 @regression @flights @amadeus @ndc @separate-tickets @pricing-options @full-purchase
Feature: 85772 Amadeus NDC - Separated Tickets upsell books one quote per leg with its offer refs
  As a corporate traveler
  I want to book a Separated Tickets NDC fare I picked in Pricing Options
  So that each ticket is booked with its own offer instead of failing before it reaches Amadeus

  Scenario: Separated Tickets NDC fare picked in Pricing Options is booked with each leg's offer
    Given I am logged in as "amadeus@ndcCorp.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "CPH" to "FRA"
    Then flight results should be available
    And I filter airline results by "Multi carrier" checkbox
    Then the "Separated Tickets" indicator should be visible in results
    And the "NDC Direct Rate" indicator should be visible in results

    When I click to open first pricing options
    And I select the outbound first option from pricing options page
    And I wait for the inbound leg in pricing options page
    And I select the inbound first option from pricing options page
    And I add to cart from pricing options page
    Then the booking status should be "Pending booking"
    # The bug saved the recombined option as one keyless round-trip quote
    And the cart should contain 2 flight quotes

    When I accept all Terms & Conditions on the page
    And I click the proceed to checkout button
    And I wait for booking details in checkout
    # This two-PNR NDC checkout re-renders Booking details after Finalise instead of showing the
    # "Go to trip" dialog (seen on trips 3905620 and 3905664, both booked), so the outcome is read
    # from the supplier payloads and the trip page rather than from that dialog.
    And I complete the booking without navigating to trip overview

    # Before the fix the booking OfferPrice was never sent ("Missing Offer/Shopping refs")
    When I capture the "request" payload for request type "Amadeus4.NDC.AMA_TravelOfferPriceRQ (Booking NDC)" from Storage
    Then the captured "request" payload for request type "Amadeus4.NDC.AMA_TravelOfferPriceRQ (Booking NDC)" should contain "<OfferRefID>TO"
    When I capture the "request" payload for request type "Amadeus4.NDC.AMA_TravelOrderCreateRQ (Booking NDC)" from Storage
    Then the captured "request" payload for request type "Amadeus4.NDC.AMA_TravelOrderCreateRQ (Booking NDC)" should contain "<OfferID>TO"

    When I navigate to the scenario trip
    # The booking lands as a hold: each leg shows ON HOLD with its own PNR
    Then the booking status should be "On hold"
    And I attempt to cancel the trip safely
