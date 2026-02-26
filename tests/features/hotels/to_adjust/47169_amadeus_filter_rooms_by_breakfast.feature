# Test Name: 47169 Hotels - Breakfast filter is enabled
# Description: 
# Status: Active
# Labels: Regression,Hotel,Filters,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-06-04T09:44:16Z
# Updated: 2024-07-30T02:29:11Z

@regression @provider:amadeus
Feature: 47169 Amadeus - Filter hotel room results by breakfast
  As a corporate traveler
  I want to filter room level results to show only rooms with breakfast
  So that I can easily find rooms that include my preferred meal plan

  @priority:medium
  Scenario: Breakfast filter shows only rooms with breakfast in room level
    Given I am logged in as "amadeus" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Hilton Garden Inn" for 1 night
    And I select the first hotel result
    # TODO: Create step "When I filter room results by breakfast included" that calls DSL filterRoomsByBreakfast in RoomLevelResults.js
    # TODO: Create step "Then only rooms with breakfast should be displayed" that calls DSL verifyBreakfastRoomsOnly in RoomLevelResults.js
