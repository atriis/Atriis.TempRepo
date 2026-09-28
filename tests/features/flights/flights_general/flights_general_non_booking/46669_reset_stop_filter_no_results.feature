# Test Name: 46669 Reset stop filter when no results found according to search criteria
# Status: Active
# Labels: NL government,search,Filters,Regression,2026 plan 1
# Owner: Noam Miller
# Created: 2024-05-29T07:50:16Z
# Updated: 2025-11-25T11:31:22Z

@regression @flights @general @filters
Feature: 46669 Flights - Reset stop filter when no results found
  As a corporate traveler
  I want the stop filter to be reset when no results are found
  So that I still see available flights

  Scenario: Stop filter is reset when no results found according to search criteria
    Given I am logged in as "brunaauto@amadeusgds.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "BOI" to "LEJ"
    Then the alert "No results found according to your search criteria, search parameters have been reset" should be displayed
    Then flight results should be available
    And the flight comparison row for "1 Stop" should have no prices
    When I click edit search and wait for the "Complete trip" search mode option
    And I change the departure location to "SEA" in the edit flight search
    And I click advanced search in the flight search form
    And I select "No stops" in the flight search stops dropdown
    And I search from the edit flight search form
    Then the alert "No results found according to your search criteria, search parameters have been reset" should be displayed
    Then flight results should be available
    And the flight comparison row for "Non Stop" should have no prices
    And the flight comparison row for "1 Stop" should have prices
    And the flight comparison row for "2 Stops" should have prices

