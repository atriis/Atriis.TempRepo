# Test Name: 32684 Airport filter working as expected
# Description:
# Status: Active
# Labels: Flights,Regression,No Amadeus Hotel Book,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-06-29T01:33:09Z
# Updated: 2024-12-24T03:01:53Z

@regression @shell @flights @filters
Feature: 32684 Flights - Airport filter working as expected
  As a corporate traveler
  I want the airport filter to apply the destination airports I select
  So that the flight results reflect the chosen destination airports

  Scenario: Selecting destination airports updates the airport filter
    Given I am logged in as "testim@prof.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "AMS" to "NYC"
    And flight results should be available
    When I filter by "JFK" airport in the airports filter
    Then the first flight destination airport should be "JFK"
