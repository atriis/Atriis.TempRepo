# Test Name: 62867 BenerailMoove > Traveller should drive content in all cases
# Description: Traveller should drive content in all cases
# Status: Active
# Labels: Daily Transportation,Regression,Benerail Moove Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-06-03T10:54:57Z
# Updated: 2025-08-27T12:30:02Z
@wip @transportation @rails @benerail @regression
Feature: 62867 Benerail - Traveler should drive content in all booking cases
  As a corporate traveler whose profile does not have pre-configured rail content
  I want the system to show a no results message when no trains are available
  So that the booking flow gracefully handles unavailable routes

  Scenario: No trains found message displayed when traveler drives content with no available results
    Given I am logged in as "pini@benerail.com" booking a new trip
    And I have added traveler by name "bene-wo-content"
    When I search for a one way Benerail train from "bebmiToFrpno"
    # TODO: create step "Then the no trains found message should be displayed in Benerail results" in benerail_results.steps.js
    # covers: waitForText(".app-no-results", 'infoNo train found on selected timesTry searching...')
    Then the no trains found message should be displayed in Benerail results
