# Test Name: 21161 move locations via map view
# Description: 
# Status: Closed
# Labels: 
# Owner: Yael Alef
# Created: 2022-12-20T00:00:00Z
# Updated: 2025-03-28T00:00:00Z

@regression @provider:general
Feature: 21161 General - Move locations via map view and verify new hotels load
  As a corporate traveler
  I want to view hotels on a map and change the search location
  So that I can explore hotels in different areas and see updated results

  @priority:medium
  Scenario: Hotels update when changing location after opening map view
    Given I am logged in as "tree@tree.com" booking a new trip
    And I have added myself as the traveler
    When I initiate a hotel search in "London" for 1 night
    And I select the trip purpose as "BILLABLE" and proceed
    And I wait to see view rates text in results page
    And I open the hotel results map view
    And I wait for the hotel map markers to load
    And I drag the hotel map to the "right"
    When I open the first hotel from the map preview in a new browser tab
    Then the new browser tab should show the room level page
