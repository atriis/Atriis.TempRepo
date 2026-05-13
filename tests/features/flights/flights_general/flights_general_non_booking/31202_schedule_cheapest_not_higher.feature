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

  Scenario: Cheapest combination price is not higher than your selection
    Given I am logged in as "coreytaylor@amadeusclubdubu.com" booking a new trip
    And I have added a random guest traveler
    And I have added myself as the traveler
    When I search for a flight by schedule from "PRG" to "FRA"
    And flight results should be available
    And I filter results by carrier "Lufthansa"
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I filter results by carrier "Lufthansa"
    And I select one flight segment by schedule
    And I wait for "Cheapest package" text to be visible
    And I extract the price from "Cheapest package" fare
    And I extract the price from "Your selection" fare
    Then the extracted price at index 0 should be less than or equal to the extracted price at index 1
