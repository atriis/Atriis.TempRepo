# Test Name: 47191 Hotel - 'Paid by traveller' is displayed in cart
# Description: 
# Status: Active
# Labels: Regression,Hotel,paid by,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-06-14T07:55:13Z
# Updated: 2026-02-16T01:17:55Z

@regression @provider:general
Feature: 47191 General - Hotel paid by Traveler
  As a corporate traveler with personal payment configured
  I want to book a hotel and see "Paid by Traveler" as the payment type
  So that I know I am personally responsible for payment

  @priority:high
  Scenario: Hotel booking shows "Paid by Traveler" payment type
    Given I am logged in as "general" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LHR" for 1 night
    And I select the first hotel result
    And I add the first available room to my cart
    Then the booking status should be "Pending booking"
    When I add a credit card as payment method
    # TODO: Create step "Then the payment type should be "Paid by Traveler"" that calls DSL verifyPaymentType with "Paid by Traveler" in Cart.js
    When I cancel the trip
