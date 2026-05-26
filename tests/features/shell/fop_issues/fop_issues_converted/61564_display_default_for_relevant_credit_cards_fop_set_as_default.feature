# Test Name: 61564 display "Default" for relevant credit cards - fop set as Default
# Description:
# Status: Active
# Labels: Regression,Daily Shell,2026 plan 2
# Owner: Yael
# Created: 2025-05-02T03:14:16Z
# Updated: 2026-02-09T07:23:12Z

@regression @flights @fop @credit-card @default-label
Feature: 61564 Display "Default" label for credit card configured as default FOP
  As a corporate traveler
  I want the credit card configured as default FOP to be labeled "Default"
  So that I can quickly identify the default card in the payment options

  @priority:medium
  Scenario: Credit card labeled as "Default - card one" is displayed in the payment options
    Given I am logged in as "test.approver@atriis.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MAD"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click add payment method button
    Then the card "Default - card one" should be visible
