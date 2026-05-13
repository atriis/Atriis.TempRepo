# Test Name: 68009 BenerailMoove - Journey selection elements
# Description:
# Status: Active
# Labels: Rail,Benerail Moove Regression,Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-09-26T03:19:55Z
# Updated: 2025-10-02T10:19:03Z
@wip @transportation @rails @benerail @regression
Feature: 68009 Benerail - Journey selection stepper elements are displayed correctly
  As a corporate traveler selecting a Benerail round trip journey
  I want to see the journey selection stepper element for both outbound and return selections
  So that I can visually track my progress through the journey selection flow

  Scenario: Journey selection stepper element is displayed for both outbound and return legs
    Given I am logged in as "beny@benerail.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Benerail train from "deduiToNlasc"
    And I click proceed on the reference fields popup
    When I select the first Benerail option
    # TODO: create step "Then the Benerail journey stepper should be visible for the outbound selection" in benerail_results.steps.js
    # covers: CSS_element_Validation(".eu-rail-stepper") — validates the stepper element after outbound select
    Then the Benerail journey stepper should be visible for the outbound selection
    When I select the first Benerail option
    # TODO: create step "Then the Benerail journey stepper should be visible for the return selection" in benerail_results.steps.js
    # covers: CSS_element_Validation_1(".eu-rail-stepper") — validates the stepper element after return select
    Then the Benerail journey stepper should be visible for the return selection
