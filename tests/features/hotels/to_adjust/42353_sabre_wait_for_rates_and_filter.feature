# Test Name: 42353 Sabre - "Holiday Inn Sutton" is displaying rates
# Description: 
# Status: Active
# Labels: Sabre,Hotel,rates,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-02-13T02:52:36Z
# Updated: 2025-11-27T11:40:10Z

@regression @provider:sabre
Feature: 42353 Sabre - Wait for hotel rates and filter results
  As a corporate traveler using Sabre
  I want to search for a hotel, wait for rates to load, filter and view rates
  So that I can see available hotel rates after content loads

  @priority:medium
  Scenario: Hotel rates load and results can be filtered in Sabre
    Given I am logged in as "sabre" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Holiday Inn Sutton" for 1 night
    # TODO: Create step "When I wait for hotel rates to load" that calls DSL method waitForRatesLoaded in HotelSearch.js
    When I filter results by "Holiday Inn" checkbox
    And I select the first hotel result
    # TODO: Create step "Then room level rates should be visible" that calls DSL method verifyRoomRatesVisible in RoomLevelResults.js
