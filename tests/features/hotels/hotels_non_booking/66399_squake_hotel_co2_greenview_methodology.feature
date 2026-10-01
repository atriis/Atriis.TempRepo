# Test Name: 66399 SQUAKE - Hotel calculation methodology "GREENVIEW"
# Description: 
# Status: Active
# Labels: Hotel,Regression,No Amadeus Hotel Book,CO2,2026 plan 2
# Owner: Shani Hadar
# Created: 2026-01-25T05:54:18Z
# Updated: 2026-01-25T06:18:45Z

@regression @provider:general
Feature: 66399 Squake - Hotel CO2 calculation uses Greenview methodology
  As a corporate traveler
  I want the hotel CO2 calculation to use the Greenview methodology from SQUAKE
  So that sustainability metrics are accurate and use the correct calculation standard

  @priority:medium
  Scenario: Hotel search loads with CO2 data using Greenview calculation method
    Given I am logged in as "tel@hotel.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LON" for 1 night
    And I wait to see view rates text in results page
    And I log the trip number from the URL
    When I capture the "request" payload for request type "calculations" from Storage
    Then the captured "request" payload for request type "calculations" should contain '"methodology":"GREENVIEW"'

    
