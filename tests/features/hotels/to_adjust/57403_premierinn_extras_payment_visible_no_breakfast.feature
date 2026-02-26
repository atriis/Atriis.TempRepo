# Test Name: 57403 Premier Inn - Extras - Breakfast option is not displayed when disabled in administration
# Description: 
# Status: Active
# Labels: Premier Inn Regression,Extras,Hotel,breakfast,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-29T10:09:31Z
# Updated: 2025-01-29T10:48:34Z

@regression @provider:premierinn
Feature: 57403 Premier Inn - Extras panel shows payment method but not breakfast
  As a corporate traveler booking a Premier Inn
  I want to see the extras panel with payment method visible but breakfast not shown
  So that I know meals are not included in the extras for this category

  @priority:medium
  Scenario: Premier Inn extras panel shows payment method visible but no breakfast option
    Given I am logged in as "premierinn" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LHR" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "When I open the Premier Inn extras panel" that calls DSL openPremierInnExtras in Cart.js
    # TODO: Create step "Then the payment method should be visible in extras" that calls DSL verifyExtrasPaymentVisible in Cart.js
    # TODO: Create step "Then the breakfast option should not be visible in extras" that calls DSL verifyBreakfastNotInExtras in Cart.js

