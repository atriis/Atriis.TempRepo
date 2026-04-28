# Test Name: 33856 Flights - SEA Agreement - 'Marine Fare' icon is displayed in results and pricing options
# Status: Active
# Labels: Regression,Flights,Marine Fares,No Amadeus Hotel Book,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-07-31T02:18:02Z
# Updated: 2025-09-16T11:14:26Z

@regression @flights @general @marine-fares
Feature: 33856 Flights - Marine Fare icon is displayed in results and pricing options
  As a corporate traveler with a SEA agreement
  I want to see the Marine Fare icon in results and pricing options
  So that I can identify marine fare flights

  Scenario: Marine Fare icon is displayed in results and pricing options
    Given I am logged in as "brunamarinefares" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "NYC"
    And flight results should be available
    And I filter results by "Marine fare" checkbox
    Then the "Marine Fare" indicator should be visible in results
    When I click to open first pricing options
    Then the "Marine Fare" indicator should be visible in pricing options
