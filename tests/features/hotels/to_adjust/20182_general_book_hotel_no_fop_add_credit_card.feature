# Test Name: 20182 Book hotel without sets payment in user settings
# Description: 
# Status: Active
# Labels: CR7,Regression,No Amadeus Hotel Book,progress page,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-06-09T04:23:36Z
# Updated: 2026-01-26T02:42:08Z

@regression @provider:general
Feature: 20182 General - Book hotel with no FOP and add credit card in cart
  As a corporate traveler with no pre-configured payment method
  I want to add a credit card in the cart and complete a hotel booking
  So that I can book hotels with my own payment method

  @priority:critical
  Scenario: Book hotel, add credit card in cart, confirm and cancel
    Given I am logged in as "general" "hotelnofop" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I select the first hotel result
    And I add the first available room to my cart
    Then the booking status should be "Pending booking"
    When I click add payment method button
    And I click add card details button
    # TODO: Create step "When I fill in the credit card details" that calls DSL method fillCreditCardDetails in CartFop.js
    # TODO: Create step "When I save the credit card" that calls DSL method saveCreditCard in CartFop.js
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    When I cancel the trip
