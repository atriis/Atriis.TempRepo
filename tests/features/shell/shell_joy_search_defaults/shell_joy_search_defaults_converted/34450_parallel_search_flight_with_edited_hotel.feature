# Test Name: 34450 Parallel search flight with edited hotel
# Description:
# Status: Active
# Labels: Regression,Parallel,No Amadeus Hotel Book,2026 plan 1
# Owner: pini harush
# Created: 2023-08-13T02:48:20Z
# Updated: 2024-08-05T09:55:58Z

@regression @shell @parallel-search @hotels
Feature: 34450 Shell - Parallel search flight with edited hotel
  As a corporate traveler using parallel search
  I want to edit the parallel hotel destination before searching
  So that the hotel results reflect the destination I chose

  Scenario: Parallel search flight with an edited hotel destination shows results for the new city
    Given I am logged in as "testim@parallel.com" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step to verify the "Add Hotel to this trip" parallel option is visible on the flight tab (create ParallelSearch.verifyAddHotelOptionVisible in src/dsl/ParallelSearch.js)
    Then the "Add Hotel to this trip" parallel option should be visible on the flight tab
    When I search for a round trip flight from "lon" to "mad"
    # TODO: Create step to edit the parallel hotel destination and search (create ParallelSearch.editHotelDestinationAndSearch in src/dsl/ParallelSearch.js)
    And I edit the parallel hotel destination to "new york" and search
    And I click proceed after search
    And flight results should be available
    And I add the first flight to cart
    # TODO: Create step to verify the parallel hotel results heading (create ParallelSearch.verifyHotelDestinationHeading in src/dsl/ParallelSearch.js)
    Then the parallel hotel results heading should be "New York hotel"
    # TODO: Create step to verify hotel results are displayed with the "Sort by" option (create HotelLevelResults.verifySortByVisible in src/dsl/HotelLevelResults.js)
    And the hotel results "Sort by" option should be visible
