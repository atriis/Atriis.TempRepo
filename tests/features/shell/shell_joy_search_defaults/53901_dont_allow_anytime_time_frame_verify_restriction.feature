# Test Name: 53901 Don't allow Anytime time frame- verify restriction
# Description:
# Status: Active
# Labels: Regression,No Amadeus Hotel Book,2026 plan 1
# Owner: pini harush
# Created: 2024-11-04T10:31:24Z
# Updated: 2025-09-18T09:45:59Z

@regression @shell @parallel-search @flights
Feature: 53901 Shell - Do not allow Anytime time frame and verify restriction
  As a corporate traveler restricted from using the Anytime time frame
  I want the search to enforce a specific time frame instead of Anytime
  So that the flight search respects the configured time-frame restriction

  Scenario: The Anytime time frame is restricted and a specific time frame must be selected
    Given I am logged in as "Anytime@dont.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD"
    Then both departures time frame fields display message "This field is required" and verifying Anytime is restricted
    And I set the time frame for both legs and search
    Then flight results should be available
    And I click edit search
    And the Anytime time-frame restriction is shown for the both legs
