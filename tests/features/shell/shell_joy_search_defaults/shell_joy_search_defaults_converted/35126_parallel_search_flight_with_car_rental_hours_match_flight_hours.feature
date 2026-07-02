# Test Name: 35126 MERGED Parallel search flight with Car and rental car hours are according to the flight hours
# Description:
# Status: Active
# Labels: Cars,Parallel,Flights,Regression,No Amadeus Hotel Book,Search Flight,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-09-05T08:56:58Z
# Updated: 2025-09-14T06:32:11Z

@regression @shell @parallel-search @flights @cars
Feature: 35126 Shell - Parallel search flight with car and rental hours match flight hours
  As a corporate traveler using parallel flight and car search
  I want the rental car pick-up and drop-off hours to follow my flight hours
  So that the car booking aligns with my flight itinerary

  Scenario: Rental car hours are aligned to the flight hours after a parallel flight and car booking
    Given I am logged in as "brunasantos@nlgov.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "MUC" to "BUD" with parallel car search
    And I click proceed after search
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    # TODO: Create step to verify the car results section is active in parallel search (create ParallelSearch.verifyCarTabActive in src/dsl/ParallelSearch.js)
    Then the car results section should be active
    And the "Car Class" filter should be visible in car results
    And I wait for add to trip text to be visible
    And I add the first car to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    # TODO: Create step to verify the flight quote destination in the trip overview (create ParallelSearch.verifyFlightQuoteDestination in src/dsl/ParallelSearch.js)
    And the flight quote destination should be "Flight to Budapest"
    # TODO: Create step to verify the car quote destination in the trip overview (create ParallelSearch.verifyCarQuoteDestination in src/dsl/ParallelSearch.js)
    And the car quote destination should contain "Hungary"
    # TODO: Create step to verify the rental car pick-up/drop-off hours match the flight hours within 30 minutes (create ParallelSearch.verifyCarHoursMatchFlightHours in src/dsl/ParallelSearch.js — port the Testim validate_hours time-math: pickup = flight arrival +30m, dropoff = flight departure -30m)
    And the rental car hours should match the flight hours
