# Test Name: 34449 Parallel search flight with hotel
# Description:
# Status: Active
# Labels: Regression,Parallel,No Amadeus Hotel Book,2026 plan 1
# Owner: pini harush
# Created: 2023-08-13T02:48:20Z
# Updated: 2024-08-20T08:55:17Z

@regression @shell @parallel-search @hotels
Feature: 34449 Shell - Parallel search flight with hotel
  As a corporate traveler using parallel search
  I want to search for a flight and be offered a parallel hotel search
  So that I am taken to hotel results for the same trip after adding my flight

  Scenario: Parallel search flight lands on hotel results after the flight is added
    Given I am logged in as "testim@parallel.com" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step to verify the "Add Hotel to this trip" parallel option is visible on the flight tab (create ParallelSearch.verifyAddHotelOptionVisible in src/dsl/ParallelSearch.js)
    Then the "Add Hotel to this trip" parallel option should be visible on the flight tab
    When I search for a round trip flight from "lon" to "nyc"
    And I click proceed after search
    And flight results should be available
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    # TODO: Create step to verify the selected trip destination label (create ParallelSearch.verifyTripDestination in src/dsl/ParallelSearch.js)
    Then the parallel search trip destination should show "New York, NY, USA, (NYC)"
    # TODO: Create step to verify the hotels tab is active after adding the flight (create ParallelSearch.verifyHotelsTabActive in src/dsl/ParallelSearch.js)
    And the hotels tab should be active after adding the flight
    # TODO: Create step to verify hotel results are displayed with the "Sort by" option (create HotelLevelResults.verifySortByVisible in src/dsl/HotelLevelResults.js)
    And the hotel results "Sort by" option should be visible
