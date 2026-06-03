# Test Name: 44963 FOP - "Add new cc" button is displayed
# Description:
# Status: Active
# Labels: Regression,FOP,credit card,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-04-19T01:38:45Z
# Updated: 2025-04-21T09:27:03Z

@regression @shell @fop @credit-card @flights
Feature: 44963 FOP - "Add new cc" button is displayed
  As a corporate traveler
  I want to see the "Add new credit card" button in the payment section of the cart
  So that I can add a new credit card as my form of payment before completing the booking

  Scenario: Add new credit card button and card details form are displayed in the FOP section
    Given I am logged in as "renato@amtrak.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "ATH"
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    When I add a credit card as payment method
    Then the card details text should be visible
