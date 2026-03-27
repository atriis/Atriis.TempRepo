# Test Name: 33042 By Schedule - Price for selected flights doesn't change after adding to cart
# Status: Active
# Labels: Flights,Adding Passengers,Amadeus,Regression,No Amadeus Hotel Book,by schedule,Club,2026 plan 1
# Owner: Noam Miller
# Created: 2023-07-04T12:24:40Z
# Updated: 2025-12-09T01:38:43Z

@regression @flights @general @by-schedule @amadeus
Feature: 33042 By Schedule - Price for selected flights does not change after adding to cart
  As a corporate traveler
  I want the price shown for my by-schedule selection to remain the same after adding to cart
  So that I can trust the price displayed before checkout

  # TODO: New user needed — testim@amadeus.com → USER_TESTIM_AMADEUS (same as 31202)

  Scenario: Price does not change after adding by-schedule selection to cart
    Given I am logged in as "testim_amadeus" booking a new trip
    And I have added a random guest traveler
    # TODO: Step needed for "Search by schedule non-stop: FRA to YUL"
    # TODO: Step needed for "Select flights by carrier (AC, AC) in by-schedule"
    # TODO: Step needed for "Extract price from pricing page"
    # TODO: Step needed for "Add to cart and handle conflicting quotes"
    # TODO: Step needed for "Verify price in cart matches pricing page price"
