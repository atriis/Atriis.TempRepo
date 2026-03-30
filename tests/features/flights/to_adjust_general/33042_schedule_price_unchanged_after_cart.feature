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
    Given I am logged in as "testim_amadeus" booking a new trip
    And I have added a random guest traveler
    When I search for a flight by schedule from "FRA" to "YUL"
    And I select flight segments by schedule
    And I extract the price from first pricing option
    And I add to trip from pricing options
    And I handle conflicting quotes if visible
    # TODO: Step needed for "Verify price in cart matches pricing page price" — compare extracted pricing option price vs cart price
