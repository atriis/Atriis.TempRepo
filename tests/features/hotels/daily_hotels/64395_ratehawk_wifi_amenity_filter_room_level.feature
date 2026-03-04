# Test Name: 64395 Ratehawk - can see wi fi in room level
# Description: 
# Status: Active
# Labels: Hotel,Amenities,results,room level,Ratehawk Regression,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-07-14T09:19:49Z
# Updated: 2025-09-15T07:56:32Z

@regression @provider:ratehawk
Feature: 64395 Ratehawk - Wi-Fi amenity filter works in room level results
  As a corporate traveler using Ratehawk
  I want to filter room results by Wi-Fi amenity
  So that I can find rooms that include Wi-Fi connectivity

  @priority:medium
  Scenario: Wi-Fi amenity filter shows only Wi-Fi rooms in Ratehawk room level results
    Given I am logged in as "ratehawk" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I wait to see view rates text in results page
    And I filter hotel results by hotel name "Trafalgar"
    And I select the first hotel result
    When I filter room results by Wi-Fi amenity
    Then only rooms with Wi-Fi should be displayed