# Test Name: 66604 Amadeus - can see wi fi in room level
# Description: 
# Status: Active
# Labels: Hotel,Amenities,results,room level,Regression,Amadeus,No Amadeus Hotel Book,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-09-09T07:14:32Z
# Updated: 2025-09-09T07:23:59Z

@regression @provider:amadeus
Feature: 66604 Amadeus - Wi-Fi amenity filter works in room level results
  As a corporate traveler using Amadeus
  I want to filter room results by Wi-Fi amenity
  So that I can find rooms that include Wi-Fi connectivity

  @priority:medium
  Scenario: Wi-Fi amenity filter shows only Wi-Fi rooms in Amadeus room level results
    Given I am logged in as "amy@gadasy.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I click proceed button if visible
    And I wait to see view rates text in results page
    When I filter hotel results by hotel name "Doubletree" or skip if unavailable
    And I select the first hotel result
    When I filter room results by Wi-Fi amenity
    Then only rooms with Wi-Fi should be displayed
