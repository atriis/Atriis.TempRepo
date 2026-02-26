# Test Name: 34418 "Hotel wasn't found" error message is not displayed (no specific hotel requested)
# Description: 
# Status: Active
# Labels: Hotel,Regression,No Amadeus Hotel Book,Fit for Prod,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-08-11T10:57:07Z
# Updated: 2024-02-11T06:58:18Z

@regression @provider:amadeus
Feature: 34418 Amadeus - Hotel search results load correctly
  As a corporate traveler
  I want to search for hotels and see results load
  So that I can select a hotel for my trip

  @priority:medium
  Scenario: Hotel search results are displayed after search
    Given I am logged in as "amadeus" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Mönchengladbach" for 1 night
    # TODO: Create step "Then hotel results should be displayed" that calls DSL method verifyResultsLoaded in HotelSearch.js
