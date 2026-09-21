# Test Name: Amadeus - New Flight Flow - Results price matches the main pricing option price and the cart total
# Status: Active
# Labels: Regression,Flights,Amadeus,NFF,Pricing
# Owner: Bruna Santos
# Created: 2026-09-21

# ADO Test Case ID: 85000
#
# Domain: Flights | Supplier: Amadeus | Flow: results -> flight selection -> classic pricing
# options drawer -> cart. Single traveller, so every price on the journey is the same number and
# any re-pricing between screens shows up as a mismatch rather than as a per-pax multiplication.
#
# Route: ABZ -> PLQ round trip, outbound +30 / return +35 days, so the search never lands on a
# same-day fare whose ticketing deadline lapses mid-run.
#
# The account is a New Flight Flow one, so the results card carries a "Select Flight" button
# instead of "Pricing Options" - hence "I select the first flight result in new flight flow"
# followed by the classic pricing options drawer steps. That pairing is the established NFF
# combination, see 82774.

@regression @flights @amadeus @nff @pricing @priority:high
Feature: 85000 Amadeus - the flight results price is the price shown in pricing options and in the cart
  As a corporate traveler booking an Amadeus round trip
  I want the price on the results card to be the one quoted in pricing options and charged in the cart
  So that the fare I picked is the fare I am asked to pay

  Scenario: The first flight result price survives pricing options and reaches the cart unchanged
    Given I am logged in as "barbara@amadeusamasalemnff.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "ABZ" to "PLQ" with outbound in 30 days and return in 35 days
    And flight results should be available
    And I extract the price from first flight result
    And I select the first flight result in new flight flow
    And I extract the price from the main pricing option
    # Each extraction step appends to the same list: index 0 is the results-card price,
    # index 1 is the main "Price start from" amount at the top of the pricing options drawer.
    # The cart step below compares against the last entry, so the cart total is checked
    # against that pricing-options price.
    Then the extracted price at index 0 should equal the extracted price at index 1
    And I select the outbound first option from pricing options page
    And I select the inbound first option from pricing options page
    And I add to cart from pricing options page
    And the booking status should be "Pending booking"
    And the cart total price should match the last extracted price
