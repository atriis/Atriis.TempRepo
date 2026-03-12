# Test Name: 54541 - Preferred Hotel linked to Point of Interest
# Description: 
# Status: Active
# Labels: Club,Hotel,Preferred Hotels,search,Regression,Point of interest,2026 plan 1
# Owner: Noam Miller
# Created: 2024-11-21T06:58:46Z
# Updated: 2025-09-14T09:35:59Z

@regression @provider:general
Feature: 54541 General - Hotel search by Point of Interest shows preferred hotels
  As a corporate traveler
  I want to search for hotels near a point of interest
  So that I can find preferred hotels in convenient locations

  @priority:medium
  Scenario: Hotel search by POI returns preferred hotels
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step "When I search for a hotel near point of interest {string}" that calls DSL searchHotelByPOI in HotelSearch.js
    # TODO: Create step "Then preferred hotels should be displayed in results" that calls DSL verifyPreferredHotels in HotelSearch.js
