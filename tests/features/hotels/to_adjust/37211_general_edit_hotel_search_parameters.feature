# Test Name: 37211 [Merge] Hotels - After editing search parameters, hotels from the new location are displayed correctly and there is a scroll bar on the filters
# Description: 
# Status: Active
# Labels: Hotel,merge,Filters,search,Regression,v3,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-10-19T01:30:07Z
# Updated: 2025-11-10T01:21:10Z

@regression @provider:general
Feature: 37211 General - Edit hotel search parameters
  As a corporate traveler
  I want to edit my hotel search parameters after the initial search
  So that I can refine my search without starting over

  @priority:medium
  Scenario: Edit hotel search and verify new results are displayed
    Given I am logged in as "general" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    # TODO: Create step "When I edit the hotel search location to {string}" that calls DSL method editHotelSearchLocation in HotelSearch.js
    # TODO: Create step "Then the hotel results should be for the new location {string}" that calls DSL method verifyResultsLocation in HotelSearch.js
    # TODO: Create step "When I scroll through hotel filters" that calls DSL method scrollHotelFilters in HotelSearch.js
