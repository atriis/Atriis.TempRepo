# Test Name: 68824 BenerailMoove - Add Agreement UI Support
# Description:
# Status: Active
# Labels: Rail,Transportation
# Owner: Pedro Carneiro
# Created: 2025-10-10T03:51:37Z
# Updated: 2025-10-22T06:36:23Z
@wip @transportation @rails @benerail
Feature: 68824 Benerail - Agreement UI support in results
  As a corporate traveler
  I want to see agreement information in the Benerail results when a corporate agreement is configured
  So that I can select journeys under my corporate agreement rate

  Scenario: Benerail agreement information is shown in results when configured
    Given I am logged in as "pmac@sncb.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToGbspx"
    When I select the first Benerail option
    # TODO: create step "Then the Benerail agreement UI should be displayed in results" in benerail_results.steps.js
    # covers: test() — verifies the agreement section/badge is visible within the results for a configured agreement
    Then the Benerail agreement UI should be displayed in results
