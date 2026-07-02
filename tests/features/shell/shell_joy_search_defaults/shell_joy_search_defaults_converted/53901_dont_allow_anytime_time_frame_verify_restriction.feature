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
    # TODO: Create step to set the time frame and search, verifying Anytime is restricted (create ParallelSearch.fillTimeFrameAndSearch in src/dsl/ParallelSearch.js — Testim fill_time_frame_and_search opens the danger-flagged time-frame control and selects specific time options for both legs; note the Testim 'html-attr-validation' step must be validated manually)
    And I set the time frame for both legs and search
    # TODO: Create step to verify the flights search remains active after the time-frame restriction (create ParallelSearch.verifyFlightsTabActive in src/dsl/ParallelSearch.js)
    Then the flights search should still be active
    And I click edit search
    # TODO: Create step to verify the Anytime restriction indicator is shown for the departure leg (create ParallelSearch.verifyAnytimeRestrictionVisible in src/dsl/ParallelSearch.js)
    And the Anytime time-frame restriction should be visible for the departure leg
