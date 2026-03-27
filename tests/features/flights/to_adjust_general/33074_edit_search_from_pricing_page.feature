# Test Name: 33074 Flight search - Edit search from pricing page needs to return new results
# Status: Active
# Labels: Regression,CR7,No Amadeus Hotel Book,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-07-07T11:58:27Z
# Updated: 2025-09-14T08:25:27Z

@regression @flights @general
Feature: 33074 Flights - Edit search from pricing page needs to return new results
  As a corporate traveler
  I want to edit my flight search from the pricing page
  So that I can get updated results without starting over

  Scenario: Edit search from pricing page returns new results
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "LIS" to "BER"
    And I select flight segments by schedule
    # TODO: Step needed for "Edit search from results page" — change search type to "Complete trip", update dates, and search again
    # TODO: Step needed for "Validate search results after edit" — verify new results are displayed
    And I add the first result to trip
    Then I successfully cancel the trip
