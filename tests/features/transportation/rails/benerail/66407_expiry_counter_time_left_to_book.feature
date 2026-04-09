# Test Name: 66407 expiry counter> time left to book
# Description: test specific feature- 62769
# Status: Active
# Labels: Regression,Benerail Moove Regression,Expiry,Transportation,2026 plan 2
# Owner: pini harush
# Created: 2025-09-04T12:46:01Z
# Updated: 2025-09-04T01:07:22Z
@wip @transportation @rails @benerail @regression
Feature: 66407 Benerail - Expiry counter shows time left to book in checkout
  As a corporate traveler
  I want to see the time left to book counter in the checkout page
  So that I know how long I have before the Benerail quote expires

  Scenario: Time left to book counter is visible in Benerail checkout
    Given I am logged in as "beny" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToSchiphol"
    And I click proceed on the reference fields popup
    When I add a Benerail round trip to the trip
    When I proceed to checkout
    # TODO: create step "Then the time left to book counter should be visible in the Benerail checkout" in benerail_results.steps.js
    # covers: waitForText(".fs14", /Time left to book/) — verifies countdown timer appears in checkout
    Then the time left to book counter should be visible in the Benerail checkout
