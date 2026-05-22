# Test Name: 33042 By Schedule - Price for selected flights doesn't change after adding to cart
# Status: Active
# Labels: Flights,Adding Passengers,Amadeus,Regression,No Amadeus Hotel Book,by schedule,Club,2026 plan 1
# Owner: Noam Miller
# Created: 2023-07-04T12:24:40Z
# Updated: 2025-12-09T01:38:43Z

@regression @flights @general @by-schedule @amadeus
Feature: 33042 By Schedule - Price for selected flights does not change after adding to cart
  As a corporate traveler
  I want the price shown for my by-schedule selection to remain the same after adding to cart
  So that I can trust the price displayed before checkout

  Scenario: Price does not change after adding by-schedule selection to cart
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "FRA" to "YUL"
    And I select flight segments by schedule
    And I wait for "Your Selection" text to be visible
    And I extract the price from "Your Selection" fare
    And I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"
    Then the cart total price should match the last extracted price