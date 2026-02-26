# Test Name: 68393 Expedia - Co2 is display with value in room level, hotel level and trip overview
# Description: 
# Status: Active
# Labels: Hotel,Regression,CO2,room level,hotel level,Cart,Expedia,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-09T12:41:26Z
# Updated: 2025-10-09T01:51:39Z

@regression @provider:expedia
Feature: 68393 Expedia - CO2 emissions displayed in hotel level, room level, and trip overview
  As an environmentally-conscious corporate traveler using Expedia
  I want to see CO2 emission data at hotel level, room level, and in the trip overview
  So that I can make sustainable booking choices

  @priority:high
  Scenario: CO2 data is visible throughout the Expedia hotel booking flow
    Given I am logged in as "expedia" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "DoubleTree Heathrow" for 1 night
    # TODO: Create step "Then the CO2 emissions should be displayed in hotel level results" that calls DSL verifyCO2InHotelLevel in HotelSearch.js
    And I select the first hotel result
    # TODO: Create step "Then the CO2 emissions should be displayed in room level results" that calls DSL verifyCO2InRoomLevel in RoomLevelResults.js
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "Then the CO2 emissions should be displayed in the trip overview" that calls DSL verifyCO2InTripOverview in Trip.js

