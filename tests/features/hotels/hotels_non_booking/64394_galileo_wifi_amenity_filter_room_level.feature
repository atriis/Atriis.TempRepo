# Test Name: 64394 Galileo - can see wi fi in room level
# Description: 
# Status: Active
# Labels: Regression,Galileo,Hotel,Amenities,results,room level,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-07-14T08:42:47Z
# Updated: 2025-07-14T09:16:59Z

@regression @provider:galileo
Feature: 64394 Galileo - Wi-Fi amenity filter works in room level results
  As a corporate traveler using Galileo
  I want to filter room results by Wi-Fi amenity
  So that I can find rooms that include Wi-Fi connectivity

  @priority:medium
  Scenario: Wi-Fi amenity filter shows only Wi-Fi rooms in Galileo room level results
    Given I am logged in as "gal@leo.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Amsterdam Netherlands" for 1 night
    And I wait to see view rates text in results page
    And I filter hotel results by hotel name "Doubletree" or skip if unavailable
    And I select the first hotel result
    When I filter room results by Wi-Fi amenity
    Then only rooms with Wi-Fi should be displayed