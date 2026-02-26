# Test Name: 59023 Booking.com - User with no privilege to select FOP in cart can add new cc when default cc is not supported
# Description: 
# Status: Active
# Labels: Booking.com,booking.com 3.1,FOP,Regression,credit card,Cart,Privileges,Hotel,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-04-21T09:13:02Z
# Updated: 2025-05-12T07:53:44Z

@regression @provider:bookingcom
Feature: 59023 Booking.com - Add new credit card without cardholder privilege restriction
  As a corporate traveler using Booking.com without CC privilege
  I want to add a new credit card to complete a hotel booking
  So that I can pay for the hotel with my own card

  @priority:high
  Scenario: Add new credit card for Booking.com hotel when no privilege restriction applies
    Given I am logged in as "bookingcom" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "The White Swan" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I click add payment method button
    And I click add card details button
    # TODO: Create step "When I fill in the credit card details" that calls DSL fillCreditCardDetails in CartFop.js
    # TODO: Create step "When I save the credit card" that calls DSL saveCreditCard in CartFop.js
    Then the payment method should be added

