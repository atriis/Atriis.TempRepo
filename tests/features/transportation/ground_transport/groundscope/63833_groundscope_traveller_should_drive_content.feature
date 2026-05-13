# Test Name: 63833 GroundTransport - Traveller should drive content and consultant in all cases
# Description: Traveller should drive content and consultant in all cases
# Status: Active
# Labels: Groundscope Regression,Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-06-20T09:29:38Z
# Updated: 2025-09-29T04:03:47Z
# TODO: add USER_GROUNDSCOUPE_TESTIM for testim@groundscoupe.am before running this scenario.

@regression @transportation @ground_transport @provider:groundscope
Feature: 63833 GroundTransport - Traveler entitlement should drive GroundScope content for consultants

  As a consultant
  I want GroundScope content to depend on the selected traveler context
  So that only eligible content is shown for each consultant case

  Scenario: Consultant search content changes based on the selected traveler
    Given I am logged in as "testim@groundscope.com" booking a new trip
    And I have added myself as the traveler
    When I search for ground transport from specific address "LHR" to specific address "Emirates Stadium, Hornsey Road, London, UK"
    Then ground transport results should be displayed
    When I navigate back to ground transport search as consultant "Salvador Carneiro"
    Then ground transport results should be displayed
    When I navigate back to ground transport search as consultant "Pedro Andrade"
    Then no ground transport results should be found
