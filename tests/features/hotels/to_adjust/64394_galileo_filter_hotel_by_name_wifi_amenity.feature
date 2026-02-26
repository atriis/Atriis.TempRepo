# Test Name: 64394 Galileo - can see wi fi in room level
# Description: 
# Status: Active
# Labels: Regression,Galileo,Hotel,Amenities,results,room level,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-07-14T08:42:47Z
# Updated: 2025-07-14T09:16:59Z

@regression @provider:galileo
Feature: 64394 Galileo - Filter hotel results by name and Wi-Fi amenity in room level
  As a corporate traveler using Galileo
  I want to filter hotel results by hotel name and then filter rooms by Wi-Fi amenity
  So that I can find a specific hotel with Wi-Fi included

  @priority:medium
  Scenario: Filter hotel by name then filter rooms by Wi-Fi amenity
    Given I am logged in as "galileo" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LON" for 1 night
    # TODO: Create step "When I filter hotel results by name {string}" calls DSL filterHotelByName in HotelSearch.js
    And I select the first hotel result
    # TODO: Create step "When I filter room results by Wi-Fi amenity" that calls DSL filterRoomsByWifi in RoomLevelResults.js
    # TODO: Create step "Then only rooms with Wi-Fi should be displayed" that calls DSL verifyWifiRoomsOnly in RoomLevelResults.js
