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
    And I wait for the cheapest option to be visible
    And I extract the price from the cheapest option
    And I extract the price from "Your selection" fare
    # This will handle if the cheapest option appear as a ribon-text in "Your Selection" card or in a new pricing option card
    Then the cheapest option price should not exceed the selected price
