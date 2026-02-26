# Test Name: 27039 Premier Inn Atos Card
# Description: 
# Status: Active
# Labels: Premier Inn Regression,Hotel,Cart,atos card,Daily Hotels,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-02-27T06:58:33Z
# Updated: 2025-03-31T12:29:09Z

@regression @provider:premierinn
Feature: 27039 Premier Inn - Hotel paid by TMC
  As a corporate traveler using Premier Inn
  I want to book a hotel where payment is handled by the TMC
  So that I don't need to use my personal payment method

  @priority:high
  Scenario: Premier Inn hotel booking shows "Paid by TMC" payment type
    Given I am logged in as "premierinn" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Premier Inn London" for 1 night
    And I select the first hotel result
    And I add the first available room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "Then the payment type should be "Paid by TMC"" that calls DSL method verifyPaymentType in Cart.js
