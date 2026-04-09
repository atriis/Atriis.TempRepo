# Test Name: 55041 Evolvi - CVV field is not displayed when invoice is configured as FOP
# Description:
# Status: Active
# Labels: FOP,Invoice,Regression,Rail,Evolvi,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-12-03T08:24:00Z
# Updated: 2025-06-08T12:28:51Z
@wip @transportation @rails @evolvi @regression
Feature: 55041 Evolvi - CVV field hidden for invoice FOP
  As a corporate traveler
  I want to checkout an Evolvi quote configured with invoice FOP
  So that CVV is not requested in the cart payment section

  Scenario: CVV input is not displayed when Paid by TMC invoice FOP is configured
    Given I am logged in as "vinijus" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "licToMcr"
    When I close mandatory notifications if displayed
    # TODO: create step "When I select the first available Evolvi fare" in evolvi_results.steps.js
    When I select the first available Evolvi fare
    When I add an Evolvi one way to the trip
    When I handle conflicting quotes if visible
    Then the cart status should be Pending booking
    # TODO: create step "Then the FOP owner should be displayed as Paid by TMC" in evolvi_results.steps.js or cart_fop.steps.js
    # covers: waitForText('.fop-owner', 'Paid by TMC')
    Then the FOP owner should be displayed as Paid by TMC
    # TODO: create step "Then the CVV field should not be displayed for invoice FOP" in cart_fop.steps.js
    Then the CVV field should not be displayed for invoice FOP
