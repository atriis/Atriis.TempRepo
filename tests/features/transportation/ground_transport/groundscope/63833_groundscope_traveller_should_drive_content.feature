# Test Name: 63833 GroundTransport - Traveller should drive content and consultant in all cases
# Description: Traveller should drive content and consultant in all cases
# Status: Active
# Labels: Groundscope Regression,Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-06-20T09:29:38Z
# Updated: 2025-09-29T04:03:47Z

@regression @transportation @ground_transport @provider:groundscope
Feature: 63833 GroundTransport - Traveler entitlement should drive GroundScope content for consultants

  As a consultant
  I want GroundScope content to depend on the selected traveler context
  So that only eligible content is shown for each consultant case

  Scenario: Consultant search content changes based on the selected traveler
    Given I am logged in as "testim@groundscoupe.am" booking a new trip
    And I have added myself as the traveler
    When I search for ground transport from specific address "LHR" to specific address "Emirates Stadium, Hornsey Road, London, UK"
    Then I wait for add to trip text to be visible
    When I navigate back to ground transport search via breadcrumb
    And I remove all travelers
    And I have added "Salvador Carneiro" as primary traveler by clicking select traveller
    When I click the search button
    Then I wait for add to trip text to be visible
    When I navigate back to ground transport search via breadcrumb
    And I remove all travelers
    And I have added "Pedro Andrade" as primary traveler by clicking select traveller
    And I click the search button
    Then the no results found message should be displayed
