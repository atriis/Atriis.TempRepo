# Test Name: 34533 Proceeding to the checkout for the 2nd flight search without error
# Status: Active
# Labels: Regression,Amadeus,Flights,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-08-28T02:24:33Z

@regression @amadeus @flights
Feature: 34533 Amadeus - Proceeding to checkout for 2nd flight search without error
  As a corporate traveler
  I want to complete a second flight search after cancelling the first
  So that I can proceed to checkout without errors

  Scenario: Proceeding to checkout for the 2nd flight search without error
    # --- First flight search & checkout round-trip ---
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "SEA"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I navigate to cart from checkout
    Then the booking status should be "On hold"
    And I successfully cancel the trip

    # --- Second flight search & checkout one-way ---
    When I book a new trip
    And I have added myself as the traveler
    And I search for a one way flight from "LON" to "SIN"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I navigate to cart from checkout
    Then the booking status should be "On hold"
    And I successfully cancel the trip
