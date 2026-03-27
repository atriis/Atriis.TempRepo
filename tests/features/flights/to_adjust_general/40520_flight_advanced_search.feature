# Test Name: 40520 Flight advanced search
# Status: Active
# Labels: Advanced search,search,Galileo,Filters,Flights,Regression,Search Flight,Keeps failing,2026 plan 1
# Owner: pini harush
# Created: 2023-12-24T08:09:30Z
# Updated: 2025-09-14T07:47:35Z

@regression @flights @general @advanced-search @galileo
Feature: 40520 Flights - Advanced search
  As a corporate traveler
  I want to use advanced search options including time, stops, and carrier filters
  So that I can narrow down my flight results

  Scenario: Advanced search with time, stops, and carrier filters returns expected results
    Given I am logged in as "bruna_galileo" booking a new trip
    And I have added myself as the traveler
    # TODO: Step needed for "Search flights round trip with advanced options" — FlightSearch.searchRoundTripAdvanced with departure/return time, stops, and carrier
    When I search for a round trip flight from "LON" to "LAX"
    # TODO: Step needed for "Verify carrier filter is pre-selected (British Airways)" — check carrier checkbox is checked
    # TODO: Step needed for "Verify results show British Airways flights"
