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
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I wait for the hotel results page to load
    And I open the hotel results map view
    When I open the first hotel from the map preview in a new browser tab
    Then the new browser tab should show the hotel details page

