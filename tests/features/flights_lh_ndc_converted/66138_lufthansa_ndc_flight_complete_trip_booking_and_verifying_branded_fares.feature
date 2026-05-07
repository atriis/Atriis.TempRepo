# Test Name: 66138 Lufthansa NDC - Flight - Complete Trip booking and verifying Branded Fares
# Description:
# Status: Active
# Labels: Flights,Branded fares,Full Purchase,NDC,Lufthansa NDC Regression,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-08-29T05:47:34Z
# Updated: 2025-09-30T02:38:43Z

@regression @flights @ndc @lufthansa @branded-fares @full-purchase
Feature: 66138 Lufthansa NDC - Complete trip booking and verifying branded fares

  As a corporate traveler
  I want to book a Lufthansa NDC flight and verify branded fares information
  So that I can confirm branded fares are displayed correctly throughout the flow

  Scenario: Book a Lufthansa NDC round trip flight and verify branded fares
    Given I am logged in as "clara" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "FRA" to "MIA"
    Then flight results should be available
    When I filter results by carrier "Lufthansa"

    # Verify branded fares from flight details on results page
    # TODO: Implement step to verify branded fares from flight details on results page (open flight details → click branded fares button → verify ancillaries text → close)
    When I click to open flight details
    # TODO: Click branded fares button inside flight details and verify "The following ancillaries are included in this brand." text
    And I close flight details window

    # Verify branded fares from pricing options on results page
    When I click to open first pricing options
    # TODO: Verify branded fares accessible from pricing options (click flight details → branded fares → verify text → close)
    And I close pricing options modal

    # Add first flight to cart
    When I add the first flight to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"

    # Verify branded fares from flight details in cart
    # TODO: Implement step to verify branded fares from flight details in cart page (open flight details → click branded fares → verify ancillaries text → close)

    # Accept T&C and hold
    When I accept Terms & Conditions
    And I hold the trip

    # Verify branded fares from flight details after hold
    # TODO: Implement step to verify branded fares from flight details after hold (same as above)

    # Cancel the trip
    Then I successfully cancel the trip
