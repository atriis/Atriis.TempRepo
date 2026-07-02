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
    And the "Add Hotel to this trip" parallel option should be checked by default on the flight tab
    When I search for a round trip flight from "lon" to "nyc"
    And I click proceed button if visible
    And flight results should be available
    And I add the first result to trip
    And I handle conflicting quotes if visible
    And I wait to see view rates text in results page
    Then the hotel results destination on top of the page should contain "New York, NY, USA, (NYC)"
