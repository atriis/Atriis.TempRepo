# Test Name: 47086 Sabre - Hotel - The first value from the hotel level and the first value of the room level are the same (the lowest)
# Description: 
# Status: Active
# Labels: Regression,Sabre,Hotel,price,GDS,Daily Hotels,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-06-06T11:22:40Z
# Updated: 2025-03-31T10:04:36Z

@regression @provider:sabre
Feature: 47086 Sabre - Price comparison between hotel level and room level
  As a corporate traveler using Sabre
  I want to compare hotel-level displayed price with room-level displayed price
  So that I can verify price consistency across hotel result pages

  @priority:high
  Scenario: Hotel level price matches room level price for Sabre results
    Given I am logged in as "sabre" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Holiday Inn Oxford" for 1 night
    # TODO: Create step "When I extract the price from hotel level results" that calls DSL extractHotelLevelPrice in HotelSearch.js
    And I select the first hotel result
    # TODO: Create step "When I extract the price from room level results" that calls DSL extractRoomLevelPrice in RoomLevelResults.js
    # TODO: Create step "Then the hotel level price should match the room level price" that calls DSL compareHotelAndRoomLevelPrices in HotelSearch.js
