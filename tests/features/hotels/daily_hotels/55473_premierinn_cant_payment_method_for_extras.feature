# Test Name: 55473 Premier Inn - Can't change payment method for extras
# Description: 
# Status: Active
# Labels: Premier Inn Regression,Hotel,Extras,payment method,Cart,2026 plan 1
# Owner: Noam Miller
# Created: 2024-12-10T08:50:38Z
# Updated: 2025-09-16T07:59:49Z

@regression @provider:premierinn
Feature: 55473 Premier Inn - Can't change payment method for extras
  As a corporate traveler booking Premier Inn extras
  I want to confirm that the payment method for extras cannot be changed
  So that corporate billing rules are enforced for Premier Inn extras

  @priority:high
  Scenario: Can't change payment method for extras
    Given I am logged in as "bruna_premier" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I click to edit extras at index 0
    Then the payment method for extras should not be changeable

