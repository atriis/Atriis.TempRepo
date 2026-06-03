# Test Name: 55074 FOP - Should not be able to select Invoice in case there's no invoice set for the account
# Description:
# Status: Active
# Labels: Regression,FOP,general,credit card,Invoice,Flights,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-12-04T07:41:18Z
# Updated: 2025-02-03T01:56:27Z

@regression @shell @fop @invoice @flights @credit-card
Feature: 55074 - FOP should not be able to select Invoice in case there's no invoice set for the account
  As a corporate traveler whose account has no invoice FOP configured
  I want to be prevented from selecting Invoice as a payment method
  So that invalid payment selections are blocked and the correct corporate FOP is applied automatically

  @priority:medium
  Scenario: Invoice option is unavailable and corporate FOP is applied when no invoice is configured for the account
    Given I am logged in as "marcoscastanho@amadeusfopcc.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "ATH"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And the payment type should be "Paid by Corporate"
