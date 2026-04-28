# Test Name: 55725 Filter by airport should be per leg
# Status: Active
# Labels: Regression,Galileo,Flights,Filters,2026 plan 1
# Owner: pini harush
# Created: 2024-12-26T12:17:57Z
# Updated: 2024-12-26T12:33:15Z

@regression @flights @general @galileo @filters
Feature: 55725 Flights - Filter by airport should be per leg
  As a corporate traveler
  I want airport filters to be applied per leg
  So that I can filter airports independently for each direction

  Scenario: Airport filters are displayed per leg for round trip
    Given I am logged in as "bsgalileoflight" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "MIL" to "LON"
    Then the airport filter route label "Milan to London" should be visible
    And the airport filter sections "Milan Airports" and "London Airports" should be visible for route "Milan to London"
    When I filter airports for route "Milan to London" by "BGY" in "Milan Airports" and "STN" in "London Airports"
    Then all flight results should be from airline "Ryanair"
    When I filter results by carrier "British Airways"
    Then the no results found message should be displayed