# Test Name: 61713 Hotel - Room Results - "View Hotel On Map" opens correctly
# Description: 
# Status: Active
# Labels: Hotel,Regression,general,Google Maps,room level,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-08T11:51:44Z
# Updated: 2025-05-08T12:56:38Z

@regression @provider:amadeus
Feature: 61713 Amadeus - View hotel on map opens correctly
  As a corporate traveler
  I want to view a hotel on the map
  So that the hotel location opens on a map

  @priority:medium
  Scenario: Clicking view on map opens hotel location on the map
    Given I am logged in as "amadeus" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LHR" for 1 night
    And I select the first hotel result
    And I wait for view hotel on map button to be visible in room level results
    When I click the view on map button in room level
    Then the hotel map should open in room level results