# Test Name: 31202 By Schedule - Price for 'cheapest combination' is not higher than price for 'your selection'
# Status: Active
# Labels: Flights,Adding Passengers,Amadeus,Regression,No Amadeus Hotel Book,by schedule,67304,2026 plan 1
# Owner: Noam Miller
# Created: 2023-07-04T12:24:40Z
# Updated: 2025-09-18T11:29:34Z

@regression @flights @general @by-schedule @amadeus
Feature: 31202 By Schedule - Cheapest combination price not higher than your selection
  As a corporate traveler
  I want the cheapest combination price to never exceed the your selection price
  So that I know the cheapest option is truly the best deal

  # TODO: New user needed — testim@amadeus.com → USER_TESTIM_AMADEUS
  # Add to .env: USER_TESTIM_AMADEUS="testim@amadeus.com"

  Scenario: Cheapest combination price is not higher than your selection
    Given I am logged in as "testim_amadeus" booking a new trip
    And I have added a random guest traveler
    When I search for a flight by schedule from "LON" to "YUL"
    And I select flight segments by schedule
    # TODO: Step needed for "Verify cheapest combination price <= your selection price in pricing page"
