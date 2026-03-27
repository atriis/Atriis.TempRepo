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
    Given I am logged in as "bruna_galileo" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "MIL" to "LON"
    # TODO: Step needed for "Verify airport filter shows 'Milan to London' per-leg label"
    # TODO: Step needed for "Verify Milan Airports and London Airports filter sections are displayed separately"
    # TODO: Step needed for "Filter by specific airports per leg and verify results change"
    # TODO: Step needed for "Verify 'No results found' when filtering by incompatible airport combination"
