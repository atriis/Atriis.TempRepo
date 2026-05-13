# Test Name: 47148 Benerail - Air-Rail Mixed message does not take long to load and page does not get stuck when clicking on "Rail Options"
# Description:
# Status: Active
# Labels: Regression,Rail,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-23T09:30:29Z
# Updated: 2025-12-12T01:04:11Z
@wip @transportation @rails @benerail @regression
Feature: 47148 Benerail - Air-Rail mixed message loads quickly and Rail Options page does not get stuck
  As a corporate traveler searching for a flight with available rail alternatives
  I want the Air-Rail mixed message to appear without delay
  So that I can click Rail Options and see Benerail results without the page getting stuck

  Scenario: Air-Rail available message appears and Rail Options can be clicked without page freeze
    Given I am logged in as "alvaresazevedo@benerail.com" booking a new trip
    And I have added myself as the traveler
    # TODO: This test searches for FLIGHTS (round trip VIE-MUC), not Benerail directly.
    # It then verifies the "Rail is available for this route" banner and clicks Rail Options.
    # Step "When I search for a round trip flight from..." exists in flight_search.steps.js
    # but is for flights. For air-rail mixed tests, a combined step may be needed.
    # covers: Search_flights_round_trip('VIE', 'MUC') → flight search DSL
    When I search for a round trip flight from "VIE" to "MUC"
    # TODO: create step "When I proceed past the flight search form" in flight_search.steps.js or results.steps.js
    # covers: Click_on_proceed_after_search() for flights
    When I handle conflicting quotes if visible
    # TODO: create step "Then the Rail is available for this route message should be visible in flight results" in flight_results.steps.js or benerail_results.steps.js
    # covers: waitForText(".available-msg", 'Rail is available for this route')
    Then the Rail is available for this route message should be visible in flight results
    # TODO: create step "When I click the Rail Options button in flight results" in benerail_results.steps.js
    # covers: page.click(".rails-btn")
    When I click the Rail Options button in flight results
    # TODO: create step "Then the first Benerail result Select button should be visible" in benerail_results.steps.js
    # covers: waitForText on first rail result → 'Select' (confirms page did not get stuck)
    Then the first Benerail result Select button should be visible
