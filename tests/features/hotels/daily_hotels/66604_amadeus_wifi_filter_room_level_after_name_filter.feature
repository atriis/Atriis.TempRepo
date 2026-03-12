# Test Name: 66604 Amadeus - can see wi fi in room level
# Description: 
# Status: Active
# Labels: Hotel,Amenities,results,room level,Regression,Amadeus,No Amadeus Hotel Book,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-09-09T07:14:32Z
# Updated: 2025-09-09T07:23:59Z

@regression @provider:amadeus
Feature: 66604 Amadeus - Wi-Fi amenity filter works in room level after hotel name filter
  As a corporate traveler
  I want to filter hotel results by hotel name then filter rooms by Wi-Fi amenity
  So that I can find a specific hotel that offers rooms with Wi-Fi

  @priority:medium
  Scenario: Wi-Fi filter in room level works after filtering hotels by name
    Given I am logged in as "amy" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I click proceed button if visible
    And I wait to see view rates text in results page
    And I filter hotel results by hotel name "Trafalgar"
    And I select the first hotel result
    When I filter room results by Wi-Fi amenity
    Then only rooms with Wi-Fi should be displayed
