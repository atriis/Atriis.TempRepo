# Test Name: 33168 After selecting 'hide comparison', can re-open comparison table
# Status: Active
# Labels: Regression,Flights,No Amadeus Hotel Book,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-07-11T02:59:07Z
# Updated: 2023-07-11T03:14:54Z

@regression @flights @general
Feature: 33168 Flights - After selecting hide comparison can reopen comparison table
  As a corporate traveler
  I want to hide and reopen the comparison table
  So that I can manage my view of flight comparisons

  Scenario: Hide and reopen comparison table in flight results
    Given I am logged in as "testim@prof.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "TLV"
    And I hide the comparison table in flight results
    Then the flight comparison toggle should display "Show Comparison"
    When I show the comparison table in flight results
    Then the comparison table should be visible in flight results and the toggle should display "Hide Comparison"
