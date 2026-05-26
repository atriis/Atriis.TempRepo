# Test Name: 30583 Conferma payment restrictions are being correctly sent on payment
# Description:
# Status: Active
# Labels: Regression,conferma,FOP,Virtual Card,Hotel,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-12-05T07:36:20Z
# Updated: 2025-11-14T05:22:25Z

@regression @hotels @fop @conferma @virtual-card @billback
Feature: 30583 Conferma payment restrictions are correctly sent on payment
  As a corporate traveler booking a hotel with Conferma virtual card
  I want the Request Billback checkbox and payment restrictions to be displayed
  So that the selected payment restriction is correctly sent on the payment

  @priority:high
  Scenario: Conferma virtual card displays Request Billback and payment restriction selection
    Given I am logged in as "brunaconferma@conferma.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "The Clermont London, Charling Cross" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    And the payment type should be "Paid by TMC"
    When I click add payment method button
    # TODO: new step in cart_fop.steps.js — assert [aria-label='Add payment method'] .el-checkbox__label contains 'Request Billback'
    Then the Request Billback checkbox should be visible in the add payment method panel
    And the card "confermawithenablebillback" should be visible
    When I click the set billback button in cart
    Then payment restriction text should be visible
    When I click payment restriction field
    # TODO: new step in cart_fop.steps.js — click first option in payment restriction dropdown ([id^='el-id'] span)
    And I select the first payment restriction option
    And I save the card selection
    Then I successfully cancel the trip
