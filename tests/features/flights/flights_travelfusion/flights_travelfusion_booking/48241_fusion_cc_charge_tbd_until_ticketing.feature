# Test Name: 48241 Fusion - CC charge calculated after checkout (TBD)
# Status: Active
# Labels: Fusion,Transavia,Flights,Regression,FOP,Price Breakdown,Full Purchase
# Owner: Yael Alef
# Created: 2026-10-07

# ADO Test Case ID: 48241
#
# Transavia (HV) through Travelfusion charges a fee per card type, which is only known once the
# ticket is issued. Until then the cart's price breakdown shows the CC Charge as "TBD", and its
# info icon lists the charge for every card type the airline accepts. After ticketing the real
# charge replaces "TBD".
#
# Ticketing happens in the background 1-15 minutes after checkout, so it is not awaited in the
# scenario. The last step is a deferred payload check (docs/DeferredPayloadChecks.md): run
# `npm run deferred:verify` after cucumber-js. Travelfusion logs GetBookingDetails once, when the
# booking succeeds; its BookingRouter (the price as booked) carries the CCS "Credit card surcharge"
# that replaces "TBD" in the cart (stg trips 3923063 = 1.26, 3923070 = 1.30 matched the UI).
#
# fusion2@nlTestim.com has two saved profile cards: "tf- air plus" and "american express".

@regression @flights @fusion @transavia @full-purchase @fop @price-breakdown
Feature: 48241 Fusion - CC charge calculated after checkout (TBD)
  As a traveller paying a Transavia flight by credit card
  I want the CC charge to show as TBD with the list of charges per card type until ticketing
  So that I know the final card fee is only set once the ticket is issued

  Scenario: CC charge shows TBD before checkout and the supplier charges it at ticketing
    Given I am logged in as "fusion2@nlTestim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "AMS" to "BCN" on a random day between 30 and 120 days from now
    Then flight results should be available
    When I filter results by carrier "HV"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click add payment method button
    And I click the card "american express" checkbox
    And I save the card selection
    And I click to open price breakdown in cart
    Then the CC Charge in price breakdown should be "TBD"
    When I hover over the CC Charge info icon in price breakdown
    Then the CC Charge tooltip should contain "CC charge will be updated post ticketing"
    And the CC Charge tooltip should contain "American Express - EUR"
    When I close price breakdown modal
    And I fill credit card cvv if needed
    And I proceed to checkout
    And I complete the booking with Fusion credit card verification in a new tab
    # Ticketing runs in the background after checkout, so it is verified after the run
    Then after the run, the "response" payload for request type "GetBookingDetails" should contain:
      | <Status>Succeeded</Status> |
      | <BookingRouter>            |
      | <Code>CCS</Code>           |
