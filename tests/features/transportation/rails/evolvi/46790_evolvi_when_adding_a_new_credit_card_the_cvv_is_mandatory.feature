# Test Name: 46790 Evolvi - When adding a new credit card, the CVV is mandatory
# Description:
# Status: Active
# Labels: Regression,FOP,credit card,Rail,Evolvi,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-06-05T08:14:09Z
# Updated: 2025-09-08T07:34:36Z
@transportation @rails @evolvi @regression
Feature: 46790 Evolvi - CVV is mandatory when adding a new credit card
  As a corporate traveler
  I want to add a new credit card in Evolvi cart
  So that I am required to enter CVV before continuing

  Scenario: New credit card CVV mandatory validation
    Given I am logged in as "thiagosantos@evolvi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "licToMcr"
    And I acknowledge the push notification
    When I add an Evolvi one way to the trip
    And the booking status should be "Pending booking"
    And I add a credit card as payment method
    Then the last 4 digits of the credit card "4580" should be displayed in the FOP section
    When I fill the credit card CVV
    Then CVV should display "123"
