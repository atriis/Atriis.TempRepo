# Test Name: 34833 Sorting flight results from result comparison table is working as expected
# Description:
# Status: Active
# Labels: Regression,UI,Flights,results,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-05-23T09:48:33Z
# Updated: 2024-08-19T06:48:25Z

@regression @shell @flights @results @sorting
Feature: 34833 Flights - Sorting flight results from result comparison table is working as expected
  As a corporate traveler
  I want to sort flight results by clicking options in the comparison table
  So that the flight list reorders correctly to reflect the selected sort criterion

  Scenario: Sorting flight results via comparison table carrier and icon selections
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD"
    Then flight results should be available
    # Filter via the carriers checkbox filter — the default "Best" sort should surface the best-priced Air Europa fare first
    When I clear all flight result filters
    And I filter airline results by "Air Europa" checkbox
    And I extract the "Best" sort price
    Then all flight results should be from airline "Air Europa"
    And the airline checkbox "Air Europa" should be checked
    And the first flight result price should match the "Best" sort price
    # Clearing filters must reset the applied carrier filter before the comparison-table flow
    When I clear all flight result filters
    Then the airline checkbox "Air Europa" should not be checked
    # Filter via the comparison-table carrier logo — this re-sorts the results by "Cheapest"
    When I select the "Air Europa" carrier logo from the comparison table
    Then all flight results should be from airline "Air Europa"
    And the airline checkbox "Air Europa" should be checked
    When I extract the "Cheapest" sort price
    Then the first flight result price should match the "Cheapest" sort price