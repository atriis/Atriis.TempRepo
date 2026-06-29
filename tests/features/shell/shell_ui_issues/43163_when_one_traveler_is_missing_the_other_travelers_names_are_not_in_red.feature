# Test Name: 43163 When one traveler is missing, the other travelers names are not in red
# Description:
# Status: Active
# Labels: Regression,Adding Passengers,search,UI,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-04-21T08:54:25Z
# Updated: 2026-02-16T02:36:36Z

@regression @shell @ui_issues @traveler @cars @priority:medium
Feature: 43163 - When one traveler is missing, the other travelers names are not in red

  As a travel arranger booking for multiple travelers
  I want the existing travelers names to remain black when one traveler slot is left empty
  So that only the missing traveler slot is flagged and the others are not incorrectly highlighted in red

  Scenario: Existing traveler names are not shown in red when a third traveler slot is left empty
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "gadi cohen"
    Then the traveler name "Gadi Cohen" should be visible in the travelers list
    When I add an empty traveler slot
    # Submitting a car search with an empty slot is blocked by trip-index.handleSearch(),
    # which emits showTravelersErrorTooltip and flags the empty slot in red instead of navigating.
    And I submit a car search at "lhr" without waiting for results
    Then only the empty traveler slot should be highlighted in red
