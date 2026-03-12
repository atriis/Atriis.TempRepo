# Test Name: 35785 MERGED: Hotel - Filters are displayed on availability page (room level)
# Description: 
# Status: Active
# Labels: No Amadeus Hotel Book,Regression,Filters,Hotel,merge,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-09-13T03:17:11Z
# Updated: 2025-01-20T12:46:01Z

@regression @provider:amadeus
Feature: 35785 MERGED: Hotel - Filters are displayed on availability page (room level)
  As a corporate traveler
  I want to use filters in hotel level and room level results
  So that I can narrow down hotels and rooms to my preferences

  @priority:high
  Scenario: Filters are displayed on availability page (room level)
    Given I am logged in as "helenatereza" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "New York City" for 1 night
    And I wait to see view rates text in results page
    Then I see hotel level filter sections
    When I apply hotel level filter "Agreement" with option "My corporate"
    Then the "My corporate" filter tag should be visible in hotel results
    And I select the first hotel result
    And I wait for the first add to trip button in room level results to be visible
    Then I see room level filter sections