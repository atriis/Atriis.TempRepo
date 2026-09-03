# Test Name: 73595 click on hotel in the map opens another tab
# Description: 
# Status: Active
# Labels: Regression,Hotel,Google Maps,results
# Owner: Shani Hadar
# Created: 2026-02-11T10:02:49Z
# Updated: 2026-02-11T10:18:37Z

@regression @provider:general
Feature: 73595 General - View on map opens room level in new browser tab and prices are not 0
  As a corporate traveler
  I want to enter hotel from map view
  So that a new browser tab opens showing the room level and the prices are not 0

  @priority:medium
  Scenario: View on map opens hotel in a new browser tab and prices are not 0
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I wait for the hotel results page to load
    And I open the hotel results map view
    When I open the first hotel from the map preview in a new browser tab
    Then the new browser tab should show the room level page
    And the hotel name in the new browser tab should match the hotel selected on the map
    And every room in the new browser tab should show a price greater than zero

