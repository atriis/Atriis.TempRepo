# Test Name: 73595 click on hotel in the map opens another tab
# Description: 
# Status: Active
# Labels: Regression,Hotel,Google Maps,results
# Owner: Shani Hadar
# Created: 2026-02-11T10:02:49Z
# Updated: 2026-02-11T10:18:37Z

@regression @provider:general
Feature: 73595 General - View hotel on map opens in new browser tab
  As a corporate traveler
  I want to view a hotel location on the map
  So that a new browser tab opens showing the hotel on an interactive map

  @priority:medium
  Scenario: Clicking view on map opens hotel location in a new browser tab
    Given I am logged in as "general" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LON" for 1 night
    # TODO: Create step "When I click the view on map button for a hotel in results" that calls DSL clickViewOnMapInResults in HotelSearch.js
    # TODO: Create step "Then a new browser tab should open with the hotel on a map" that calls DSL verifyMapTabOpened in HotelSearch.js
