# Test Name: 42680 Exchange in UA
# Description:
# Status: Active
# Labels: United,Regression,Flights,Full Purchase,exchange,price,UA ndc,progress page,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-11-17T11:04:41Z
# Updated: 2025-11-26T08:04:23Z

@regression @flights @ndc @united @exchange @full-purchase
Feature: 42680 United NDC - Exchange flight

  As a corporate traveler
  I want to exchange a United NDC flight
  So that I can verify the exchange flow works correctly including price validation

  Scenario: Book a United NDC round trip flight and perform an exchange
    Given I am logged in as "bsua@bsua.com" booking a new trip
    And I have added myself as the traveler

    # Book the initial LH NDC flight (LAS-LAX round trip)
    When I search for a round trip flight from "LAS" to "LAX"
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    # TODO: Implement step "I handle price change prompt if visible"
    When I complete the booking

    # Get original flight details for comparison
    # TODO: Implement step "I store the original flight details for exchange comparison" — store origin/destination codes, price, and date from trip overview

    # NOTE: The exchange flow (Old() function) is disabled in the Testim test (if (true) { return; })
    # The following steps are skipped in the original Testim test:
    # - Click on change flight
    # - Change return date
    # - Validate details and proceed with new flight
    # - Validate details in cart
    # - Validate details in price breakdown
    # - Reissue
    # - Validate details in cart after reissue
    # - Validate details in price breakdown after reissue
