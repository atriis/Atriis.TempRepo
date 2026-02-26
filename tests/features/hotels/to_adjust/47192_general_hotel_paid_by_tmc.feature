# Test Name: 47192 Hotel - 'Paid by TMC' is displayed in cart
# Description: 
# Status: Active
# Labels: Regression,Hotel,paid by,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-06-14T08:33:00Z
# Updated: 2024-06-14T08:50:58Z

@regression @provider:general
Feature: 47192 General - Hotel paid by TMC
  As a corporate traveler with TMC-managed payment
  I want to book a hotel and see "Paid by TMC" as the payment type
  So that I know the travel management company is handling payment

  @priority:high
  Scenario: Hotel booking shows "Paid by TMC" payment type
    Given I am logged in as "general" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LHR" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "Then the payment type should be "Paid by TMC"" that calls DSL verifyPaymentType with "Paid by TMC" in Cart.js
    Then I successfully cancel the trip

