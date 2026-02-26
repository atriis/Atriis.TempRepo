# Test Name: 35785 MERGED: Hotel - Filters are displayed on availability page (room level)
# Description: 
# Status: Active
# Labels: No Amadeus Hotel Book,Regression,Filters,Hotel,merge,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-09-13T03:17:11Z
# Updated: 2025-01-20T12:46:01Z

@regression @provider:amadeus
Feature: 35785 Amadeus - Hotel and room level filters work correctly
  As a corporate traveler
  I want to use filters in hotel level and room level results
  So that I can narrow down hotels and rooms to my preferences

  @priority:high
  Scenario: Filters are functional in hotel level and room level results
    Given I am logged in as "amadeus" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "New York City" for 1 night
    # TODO: Create step "When I apply hotel level filters" that calls DSL method applyHotelFilters in HotelSearch.js
    # TODO: Create step "Then the hotel results should be filtered correctly" that calls DSL method verifyHotelFilters in HotelSearch.js
    And I select the first hotel result
    # TODO: Create step "When I apply room level filters" that calls DSL method applyRoomFilters in RoomLevelResults.js
    # TODO: Create step "Then the room results should be filtered correctly" that calls DSL method verifyRoomFilters in RoomLevelResults.js
