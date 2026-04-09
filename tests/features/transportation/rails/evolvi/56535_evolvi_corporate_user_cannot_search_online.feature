# Test Name: 56535 Evolvi - Corporate user cannot search online
# Description:
# Status: Active
# Labels: Regression,Evolvi,Rail,Transportation,2026 plan 1
# Owner: pini harush
# Created: 2025-06-26T12:35:56Z
# Updated: 2025-07-28T12:15:36Z
@wip @transportation @rails @evolvi @regression
Feature: 56535 Evolvi - Corporate user cannot search online
  As a corporate traveler
  I want to run an Evolvi search with a restricted corporate user
  So that no results are returned when online search is not allowed

  Scenario: Restricted corporate user gets no Evolvi results
    Given I am logged in as "we111" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "182To115"
    # TODO: create step "Then the Evolvi no results title should be displayed" in evolvi_results.steps.js
    Then the Evolvi no results title should be displayed
