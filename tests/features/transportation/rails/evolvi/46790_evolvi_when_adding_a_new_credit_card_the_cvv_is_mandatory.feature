# Test Name: 46790 Evolvi - When adding a new credit card, the CVV is mandatory
# Description:
# Status: Active
# Labels: Regression,FOP,credit card,Rail,Evolvi,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-06-05T08:14:09Z
# Updated: 2025-09-08T07:34:36Z
@wip @transportation @rails @evolvi @regression
Feature: 46790 Evolvi - CVV is mandatory when adding a new credit card
  As a corporate traveler
  I want to add a new credit card in Evolvi cart
  So that I am required to enter CVV before continuing

  Scenario: New credit card CVV mandatory validation
    Given I am logged in as "thiagosantos@evolvi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "licToMcr"
    When I close mandatory notifications if displayed
    # TODO: create step "When I select a random available Evolvi fare" in evolvi_results.steps.js
    When I select a random available Evolvi fare
    When I add an Evolvi one way to the trip
    When I handle conflicting quotes if visible
    Then the cart status should be Pending booking
    # TODO: create step "Then the Evolvi expiry tooltip should show at least {int} minutes" in evolvi_results.steps.js
    # covers: Expiry_tool_tip__validate_number_of_minutes(60)
    Then the Evolvi expiry tooltip should show at least 60 minutes
    # TODO: create step "When I add a credit card in the cart" in cart_fop.steps.js or evolvi_results.steps.js
    # covers: Add_credit_card_in_cart()
    When I add a credit card in the cart
    # TODO: create step "Then the saved card mask should be visible as {string}" in cart_fop.steps.js
    # covers: waitForText('.last-four-digit', '****4580')
    Then the saved card mask should be visible as "****4580"
    # TODO: create step "When I fill CVV with {string}" in cart_fop.steps.js
    # covers: page.type("[type='number']", '123')
    When I fill CVV with "123"
    # TODO: create step "Then CVV should display {string}" in cart_fop.steps.js
    # covers: waitForText("[type='number']", '123')
    Then CVV should display "123"
    Then I successfully cancel the trip
