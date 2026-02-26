# Test Name: 33939 Booking.com - Pre payed/Pay on departure validation
# Description: 
# Status: Active
# Labels: Regression,Hotel,No Amadeus Hotel Book,booking.com 3.1,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-08-02T08:46:20Z
# Updated: 2025-02-03T10:29:11Z

@regression @provider:bookingcom
Feature: 33939 Booking.com - Payment method selection (pay on departure vs pre-paid)
  As a corporate traveler using Booking.com
  I want to choose between pay-on-departure and pre-paid options
  So that I can select the payment method that suits my needs

  @priority:high
  Scenario: Payment method options are displayed and selectable for Booking.com hotel
    Given I am logged in as "bookingcom" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "Then the mandatory notification should be visible in cart" that calls DSL verifyMandatoryNotification in Cart.js
    # TODO: Create step "Then the payment options should include "Pay on departure" and "Pre-paid"" that calls DSL verifyPaymentOptions in CartFop.js
    # TODO: Create step "When I select the "Pay on departure" payment option" that calls DSL selectPaymentOption in CartFop.js

