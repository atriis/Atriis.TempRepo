# Test Name: 32663 When Searching for cities with multiple airports, the hotel search prepopulates the specific airport and not the city
# Description: 
# Status: Active
# Labels: CR7,Regression,No Amadeus Hotel Book,2026 plan 1
# Owner: Unassigned
# Created: 2023-06-29T11:22:11Z
# Updated: 2025-07-16T04:01:10Z

@regression @provider:general
Feature: 32663 General - Hotel search pre-populates airport from flight search in cart
  As a corporate traveler who searched for a flight
  I want to add a hotel from the cart and see the airport pre-populated in hotel search
  So that hotel search is pre-filled with my destination

  @priority:high
  Scenario: Hotel search pre-populates airport from existing flight booking in cart
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step "When I search for a flight from {string} to {string}" to set up a flight in cart first
    # TODO: Create step "When I add a hotel from the cart" that calls DSL method addHotelFromCart in Cart.js
    # TODO: Create step "Then the hotel search should be pre-populated with the destination airport" that calls DSL verifyHotelSearchPrePopulated
