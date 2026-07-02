# Test Name: 47881 Parallel Search - Navigate to cart without choosing the second product works with success
# Description:
# Status: Active
# Labels: Regression,Parallel,Flights,Cars,Cart,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-07-05T09:18:29Z
# Updated: 2025-07-16T01:03:43Z

@regression @shell @parallel-search @flights @cars
Feature: 47881 Shell - Parallel search navigate to cart without choosing the second product
  As a corporate traveler using parallel flight and car search
  I want to navigate to the cart after adding a flight without selecting a car
  So that I can complete a flight-only booking from a parallel search

  Scenario: Navigate to cart from car results without adding a car and cancel the trip
    Given I am logged in as "catia@testimparallelnlgov.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "LHR" with parallel car search
    And I click proceed button if visible
    And I add the first result to trip
    And I handle conflicting quotes if visible
    Then the car results section should be displayed
    And I wait for add to trip text to be visible
    When I navigate to the trip cart
    Then the booking status should be "Pending booking"
