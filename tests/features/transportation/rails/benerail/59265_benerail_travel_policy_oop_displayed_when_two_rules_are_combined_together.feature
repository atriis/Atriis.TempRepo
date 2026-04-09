# Test Name: 59265 Benerail - Travel Policy - OOP displayed when two rules are combined together
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Travel policy,Rail,OOP,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-12T12:11:15Z
# Updated: 2025-11-14T05:48:05Z
@wip @transportation @rails @benerail @regression @travel_policy
Feature: 59265 Benerail - OOP indicator displayed when two travel policy rules are combined
  As a corporate traveler subject to multiple travel policy rules
  I want the out-of-policy indicator to appear when two rules are triggered simultaneously
  So that combined policy enforcement is correctly reflected in Benerail results

  Scenario: OOP indicator is visible in results when two policy rules are combined
    Given I am logged in as "bruninabenerail" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "berlinhbfToBebmi"
    And I click proceed on the reference fields popup
    When I select the first Benerail option
    # TODO: create step "Then the OOP indicator should be displayed when two Benerail policy rules are combined" in benerail_results.steps.js
    # covers: OOP_displayed_when_two_rules_are_combined_together() — verifies shield/OOP indicator is visible
    # when both rules (e.g. cost + destination) trigger simultaneously on the first result
    Then the OOP indicator should be displayed when two Benerail policy rules are combined
