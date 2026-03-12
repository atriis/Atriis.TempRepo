# Test Name: 62919 Hotels - 'Woking' location appears as a suggested location
# Description: 
# Status: Active
# Labels: Hotel,general,search,location,Regression,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-06-04T03:50:49Z
# Updated: 2025-06-04T07:28:24Z

@regression @provider:amadeus
Feature: 62919 Amadeus - Hotel search location suggestion appears for Woking
  As a corporate traveler
  I want to type "Woking" in hotel search and see it appear as a location suggestion
  So that I can search for hotels in less common cities

  @priority:low
  Scenario: Hotel search shows Woking as a location suggestion
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step "When I type {string} in the hotel search location field" that calls DSL typeHotelSearchLocation in HotelSearch.js
    # TODO: Create step "Then {string} should appear as a location suggestion in the dropdown" that calls DSL verifyLocationSuggestion in HotelSearch.js
    When I search for a hotel in "Woking" for 1 night
    # TODO: Create step "Then hotel results for {string} should be displayed" that calls DSL verifyResultsForLocation in HotelSearch.js
