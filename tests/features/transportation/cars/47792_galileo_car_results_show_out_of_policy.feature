# Test Name: 47792 [Merge] Galileo - Car search display results when travel policy is configured and policy in being triggered correctly
# Description:
# Status: Active
# Labels: Galileo,Regression,Travel policy,Cars,search,merge,OOP,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-07-01T01:04:55Z
# Updated: 2025-09-14T09:28:54Z
@regression @cars @provider:galileo
Feature: 47792 Galileo car search shows out-of-policy results when policy is triggered
  As a corporate traveler
  I want out-of-policy results to be clearly shown in Galileo car search
  So that travel policy behavior remains correct across pages

  @priority:high
  Scenario: Search Hertz cars at CDG and verify out-of-policy results on later pages
    Given I am logged in as "bsgalileoflight@galileoflight.com" booking a new trip
    And I have added myself as the traveler
    # TODO: Map Testim inline agency filter actions before the search to a reusable search/filter step for Hertz.
    When I search for a car at "CDG"
    # TODO: Map Testim sorting action before paging to page 3.
    Then the out of policy indicator should be visible in results
    # TODO: Preserve the explicit page-3 navigation from the Testim flow.
