# Test Name: 37263 Amadeus - Amadeus plus hotel (Teldar) logo is displayed
# Description: 
# Status: Active
# Labels: Regression,Amadeus,Hotel,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-10-23T10:23:07Z
# Updated: 2025-11-20T08:08:16Z

@regression @provider:amadeus
Feature: 37263 Amadeus - Amadeus Plus hotel (Teldar) logo is displayed
  As a corporate traveler
  I want to see the Amadeus Plus hotel logo in hotel results
  So that I can identify Amadeus-preferred properties

  @priority:medium
  Scenario: Amadeus Plus hotel logo is visible in hotel level results
    Given I am logged in as "amadeus" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Madrid Reina Victoria, Plaza de Santa Ana, Madrid, Spain" for 1 night
    # TODO: Create step "Then the Amadeus Plus hotel logo should be displayed in results" that calls DSL method verifyAmadeusLogo in HotelSearch.js
