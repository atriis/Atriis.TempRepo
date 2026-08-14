# Test Name: 55041 Evolvi - CVV field is not displayed when invoice is configured as FOP
# Description:
# Status: Active
# Labels: FOP,Invoice,Regression,Rail,Evolvi,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-12-03T08:24:00Z
# Updated: 2025-06-08T12:28:51Z
@transportation @rails @evolvi @regression
Feature: 55041 Evolvi - CVV field hidden for invoice FOP
  As a corporate traveler
  I want to checkout an Evolvi quote configured with invoice FOP
  So that CVV is not requested in the cart payment section

  Scenario: CVV input is not displayed when Paid by TMC invoice FOP is configured
    Given I am logged in as "vinijus@evolvirail.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "licToMcr"
    And I acknowledge the push notification
    When I add an Evolvi one way to the trip
    And the booking status should be "Pending booking"
    Then the payment type should be "Paid by TMC"
    And the CVV field should not be displayed
