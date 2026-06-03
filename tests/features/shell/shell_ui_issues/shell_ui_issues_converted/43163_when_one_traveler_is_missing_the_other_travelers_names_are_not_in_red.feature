# Test Name: 43163 When one traveler is missing, the other travelers names are not in red
# Description:
# Status: Active
# Labels: Regression,Adding Passengers,search,UI,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-04-21T08:54:25Z
# Updated: 2026-02-16T02:36:36Z

@regression @shell @ui_issues @traveler @cars
Feature: 43163 - When one traveler is missing, the other travelers names are not in red

  As a travel arranger booking for multiple travelers
  I want the existing travelers names to remain black when one traveler slot is left empty
  So that only the missing traveler slot is flagged and the others are not incorrectly highlighted in red

  Scenario: Existing traveler names are not shown in red when a third traveler slot is left empty
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "gadi cohen"
    # TODO: assert second traveler name "Gadi Cohen" is visible in the travelers list -> proposed step: Then the traveler name "Gadi Cohen" should be visible in the travelers list (Search DSL: waitForText on ".travelers-list > section:nth-of-type(2) .traveler-name")
    # TODO: add an empty/unnamed third traveler slot -> proposed step: When I add an empty traveler slot (Search DSL: click tooltip-triggered add-traveler button "[aria-describedby='el-tooltip-6647']", then assert "Add traveller" heading is visible)
    When I search for a car at "lhr"
    # TODO: assert that only the empty traveler slot name is highlighted in red and the other travelers names are not -> proposed step: Then only the empty traveler slot should be highlighted in red (Search/Shell DSL: custom validation-code-step verifying color of traveler name elements)
