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
    Given I am logged in as "natalia" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LHR" for 1 night
    When I edit the hotel search location to "BCN"
    Then the hotel results should be for the new location "BCN"
    When I scroll through hotel filters