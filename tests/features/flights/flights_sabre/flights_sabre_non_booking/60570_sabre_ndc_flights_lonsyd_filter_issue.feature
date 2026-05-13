# Test Name: 60570 New UI - Sabre ndc- Flights - LON-SYD issue with filter
# Status: Active
# Labels: Sabre NDC,Regression,Flights,Filters,results,Pre Prod,Gray Dawes,2026 plan 2
# Owner: Yael
# Created: 2025-04-04T05:52:36Z
# Updated: 2025-11-26T05:56:36Z

@regression @flights @sabre @sabre-ndc @filters @provider:sabre_ndc @priority:high
Feature: 60570 Sabre NDC - Flights LON-SYD filter issue resolved
  As a corporate traveler
  I want to filter and add flights on the SYD-LON route
  So that I can book without filter-related issues

  Scenario: Filter works correctly for SYD-LON route and flight can be added to cart
    Given I am logged in as "marianecampos@gdgtravelpolicytest.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "SYD" to "LON"
    And flight results should be available
    Then the stops filter should be visible in flight results
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
