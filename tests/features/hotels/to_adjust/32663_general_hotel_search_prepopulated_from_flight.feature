# Test Name: 32663 When Searching for cities with multiple airports, the hotel search prepopulates the specific airport and not the city
# Description: 
# Status: Active
# Labels: CR7,Regression,No Amadeus Hotel Book,2026 plan 1
# Owner: Unassigned
# Created: 2023-06-29T11:22:11Z
# Updated: 2025-07-16T04:01:10Z

@regression @provider:general
Feature: 32663 General - Hotel search from cart pre-populates airport from flight
  As a corporate traveler with a flight already in the cart
  I want to add a hotel and see the search pre-populated with the flight's airport/city
  So that I don't have to manually re-enter the hotel destination

  @priority:high
  Scenario: Hotel search location is pre-populated from flight destination in cart
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step "When I search for a flight from {string} to {string}" that calls DSL searchFlight in FlightSearch.js
    # TODO: Create step "When I navigate to add a hotel to my trip from cart" that calls DSL navigateToAddHotel in Cart.js
    # TODO: Create step "Then the hotel search location should be pre-populated with the flight destination airport" that calls DSL verifyHotelSearchPrePopulated in HotelSearch.js
