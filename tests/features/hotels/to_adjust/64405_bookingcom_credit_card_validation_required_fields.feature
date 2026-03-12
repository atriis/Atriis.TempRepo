# Test Name: 64405 booking.com - credit card without card holder name and country
# Description: 
# Status: Active
# Labels: Booking.com,FOP,Regression,No Amadeus Hotel Book,Hotel,Cart,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-07-14T09:37:17Z
# Updated: 2026-02-03T05:06:56Z

@regression @provider:bookingcom
Feature: 64405 Booking.com - Credit card validation without cardholder name and country
  As a corporate traveler
  I want to add a credit card but see validation errors when cardholder name and country are missing
  So that incomplete card details cannot be submitted

  @priority:medium
  Scenario: Credit card cannot be saved without cardholder name and country
    Given I am logged in as "cintia" booking a new trip
    And I have added a random guest traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I click add payment method button
    And I click add card details button
    # TODO: Create step "When I fill in card number and expiry without cardholder name and country" that calls DSL fillPartialCardDetails in CartFop.js
    # TODO: Create step "Then the card form should show validation errors for required fields" that calls DSL verifyCardValidationErrors in CartFop.js

