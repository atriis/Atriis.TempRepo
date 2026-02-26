# Test Name: HYBRID for 59237 ehotel - see amenities according to the log
# Description: 
# Status: Active
# Labels: hybrid,Ehotel Regression,No Amadeus Hotel Book,Hotel,Amenities,results,Results page hotel,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-07-13T10:43:06Z
# Updated: 2025-07-13T10:57:36Z

@regression @provider:ehotel
Feature: 59237 eHotel - Hotel amenities displayed correctly according to supplier data
  As a corporate traveler using eHotel
  I want to see the correct amenities for each hotel in search results
  So that hotels with gym are shown with the gym amenity and hotels without are not

  @priority:medium
  Scenario: Amenities are shown correctly - with gym and without gym
    Given I am logged in as "ehotel" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LON" for 1 night
    # TODO: Create step "Then the first hotel should display the gym amenity" - hybrid: validate via eHotel API log that gym amenity is present in the response for hotel 1
    # TODO: Create step "When I select the second hotel result" that calls DSL selectHotelByIndex with 2 in HotelSearch.js
    # TODO: Create step "Then the second hotel should not display the gym amenity" - hybrid: validate via eHotel API log that gym amenity is absent for hotel 2
