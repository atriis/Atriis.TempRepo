# Test Name: 61713 Hotel - Room Results - "View Hotel On Map" opens correctly
# Description: 
# Status: Active
# Labels: Hotel,Regression,general,Google Maps,room level,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-08T11:51:44Z
# Updated: 2025-05-08T12:56:38Z

@regression @provider:amadeus
Feature: 61713 Amadeus - View hotel on map opens in new tab
  As a corporate traveler
  I want to view a hotel on the map
  So that a new browser tab opens with the hotel location on a map

  @priority:medium
  Scenario: Clicking view on map opens hotel location in a new tab
    Given I am logged in as "amadeus" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LHR" for 1 night
    And I select the first hotel result
    # TODO: Create step "When I click the view on map button in room level" that calls DSL clickViewOnMap in RoomLevelResults.js
    # TODO: Create step "Then a new browser tab should open with the hotel map location" that calls DSL verifyMapTabOpened in RoomLevelResults.js
