# Test Name: HYBRID for 66399 SQUAKE - Hotel calculation methodology "GREENVIEW"
# Description: 
# Status: Active
# Labels: Hotel,hybrid,Regression,No Amadeus Hotel Book,CO2,2026 plan 2
# Owner: Shani Hadar
# Created: 2026-01-25T05:54:18Z
# Updated: 2026-01-25T06:18:45Z

@regression @provider:general
Feature: 66399 SQUAKE - Hotel CO2 calculation uses Greenview methodology
  As a corporate traveler
  I want the hotel CO2 calculation to use the Greenview methodology from SQUAKE
  So that sustainability metrics are accurate and use the correct calculation standard

  @priority:medium
  Scenario: Hotel search loads with CO2 data using Greenview calculation method
    Given I am logged in as "general" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LON" for 1 night
    # TODO: Create step "Then the hotel CO2 values should be calculated using the Greenview methodology" - hybrid: validate via SQUAKE API log that calculation method is "GREENVIEW"
    # TODO: Create step "Then the price filter should be visible in hotel results" that calls DSL verifyPriceFilterVisible in HotelSearch.js
