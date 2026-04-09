# Test Name: 23004 MERGED approval flow for benerail duration and origin + linked reference questions + validate traveler name in cart
# Description: the trip goes to the right approvers in case benerail - duration, origin
# Status: Active
# Labels: Approval flow,Financial Reference Code,NL government,No Amadeus Hotel Book,Full Purchase,Reference Fields,search,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1,02
# Owner: Shani Hadar
# Created: 2023-12-20T06:34:41Z
# Updated: 2026-02-03T09:44:16Z
@wip @transportation @rails @benerail @regression
Feature: 23004 Benerail - Approval flow for duration and origin with linked reference questions and traveler name validation
  As a corporate traveler under NL government policy
  I want to complete a Benerail round-trip booking that triggers approval for duration/origin rules
  So that linked reference questions appear and traveler name is validated in cart

  Scenario: Benerail booking with approval flow for duration/origin and linked reference fields
    Given I am logged in as "shani_nl" booking a new trip
    And I have added traveler by name "bina"
    When I search for a one way Benerail train from "nlbanToAmsterdamCe"
    # TODO: create step "Then the linked reference questions should be visible in the Benerail search form" in benerail_search.steps.js
    # covers: validate_fields() — validates that linked reference fields appear on search
    Then the linked reference questions should be visible in the Benerail search form
    When I add a Benerail round trip to the trip
    When I proceed to checkout
    When I complete the booking
    # TODO: create step "Then the approval flow should have the correct approvers for duration and origin rules" in benerail_results.steps.js
    # covers: validate_approvers() — verifies approvers for duration and origin rules
    Then the approval flow should have the correct approvers for duration and origin rules
    # TODO: create step "When I cancel the Benerail trip with warning and continue" in benerail_results.steps.js
    # covers: Trip_Cancelation___warning_and_continue() — handles warning dialog during cancellation
    When I cancel the Benerail trip with warning and continue
