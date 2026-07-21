# Test Name: 64818 Sabre - can see wi fi in room level
# Description: 
# Status: Active
# Labels: Hotel,Amenities,results,room level,Sabre,Regression,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-07-24T02:08:42Z
# Updated: 2025-08-04T08:01:38Z

@regression @provider:sabre
Feature: 64818 Sabre - Wi-Fi amenity filter works in room level results
  As a corporate traveler using Sabre
  I want to filter room results by Wi-Fi amenity
  So that I can find rooms that include Wi-Fi connectivity

  @priority:medium
  Scenario: Wi-Fi amenity filter shows only Wi-Fi rooms in Sabre room level results
    Given I am logged in as "shani@sabnat.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Paris France" for 1 night
    And I select the first hotel result
    When I filter room results by Wi-Fi amenity
    Then only rooms with Wi-Fi should be displayed