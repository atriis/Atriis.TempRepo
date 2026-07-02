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
    When I search for a round trip flight from "lon" to "mad" without clicking search button
    And I edit the parallel hotel destination to "new york"
    And I click the search button
    And I click proceed button if visible
    And flight results should be available
    And I add the first result to trip
    Then the parallel hotel modal should contain "New York hotel"
    