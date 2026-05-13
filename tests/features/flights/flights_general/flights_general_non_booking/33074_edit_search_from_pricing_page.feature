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
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "LIS" to "BER"
    And I select flight segments by schedule
    And I wait for add to trip text to be visible
    When I click edit search and wait for the "Complete trip" search mode option
    And I change the search type to "Complete trip" and update dates in the edit flight search
    And I search from the edit flight search form
    Then flight results should be available
    And the edited flight search results should reflect the updated dates
    And I add the first flight to cart
    Then the booking status should be "Pending booking"

