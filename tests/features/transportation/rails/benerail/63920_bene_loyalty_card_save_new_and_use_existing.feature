# Test Name: 63920 Bene - Loyalty card, Save New and Use Existing
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Rail,Rail loyalty numbers,Transportation,2026 plan 2
# Owner: pini harush
# Created: 2025-06-26T01:43:33Z
# Updated: 2025-10-31T12:13:27Z
@wip @transportation @rails @benerail @regression
Feature: 63920 Benerail - Loyalty card can be saved as new and used as existing at trip level
  As a corporate traveler with a Benerail loyalty card
  I want to save a new loyalty card and use an existing one
  So that my loyalty benefits are applied to the Benerail booking

  Scenario: Benerail loyalty card saved as new and used as existing in trip overview
    Given I am logged in as "pini@benerail.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToAmsterdamCe"
    When I add a Benerail one way to the trip
    # TODO: create step "Then the new and existing loyalty card options should be saved at trip level" in benerail_results.steps.js
    # covers: New_and_Existing_are_saved_in_trip_level() — verifies both save-new and use-existing loyalty card flows
    Then the new and existing Benerail loyalty card options should be saved at trip level
