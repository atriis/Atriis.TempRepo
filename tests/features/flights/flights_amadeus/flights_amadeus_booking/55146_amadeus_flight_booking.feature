# Test Name: 55146 Amadeus - Flight booking
# Description:
# Status: Active
# Labels: Regression,Flights,Amadeus,Full Purchase,progress page,Cancel by process,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-12-05T01:56:37Z
# Updated: 2026-01-19T07:43:56Z

@regression @provider:amadeus
Feature: 55146 Amadeus - Flight booking
  As a corporate traveler
  I want to book a round trip flight via Amadeus GDS
  So that I can complete a full purchase flight booking

  @priority:critical
  Scenario: Book a round trip Amadeus flight successfully
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "DOH"
    And I add the first flight to cart
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Finalizing"
  
