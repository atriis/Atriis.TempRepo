# Test Name: 32663 When Searching for cities with multiple airports, the hotel search prepopulates the specific airport and not the city
# Description: 
# Status: Active
# Labels: CR7,Regression,No Amadeus Hotel Book,2026 plan 1
# Owner: Unassigned
# Created: 2023-06-29T11:22:11Z
# Updated: 2025-07-16T04:01:10Z

@regression @provider:general
Feature: 32663 When searching for cities with multiple airports, the hotel search prepopulates the specific airport and not the city
  As a corporate traveler with a flight already in the cart
  I want to add a hotel and see the search pre-populated with the flight's airport/city
  So that I don't have to manually re-enter the hotel destination

  @priority:high
  Scenario: Hotel search location is pre-populated from flight destination in cart
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "MAD" to "NYC"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to add a hotel to my trip from cart
    Then the hotel search location should be pre-populated with "New York,NY,USA,(NYC)"