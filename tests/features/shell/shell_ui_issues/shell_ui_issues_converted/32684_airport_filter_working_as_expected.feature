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
    And I filter airports for route "Amsterdam to New York" by "EWR" in "New York Airports" and "JFK" in "New York Airports"
    # TODO: verify selected airport tooltip shows "EWR" — proposed: Then the airport filter should show airport code "EWR" (ResultsPage.waitForAirportOptionTooltip / verify selected option text)
    # TODO: verify selected airport tooltip shows "JFK" — proposed: Then the airport filter should show airport code "JFK" (ResultsPage.waitForAirportOptionTooltip / verify selected option text)
