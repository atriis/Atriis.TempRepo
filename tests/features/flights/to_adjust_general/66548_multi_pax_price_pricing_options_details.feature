# Test Name: 66548 Multi Pax - Correct price in pricing options and Flight Details
# Status: Active
# Labels: Club,price,Pricing Options,Flight Details,Regression,Sabre,2026 plan 2
# Owner: Noam Miller
# Created: 2025-09-07T12:13:57Z
# Updated: 2026-01-06T01:01:24Z

@regression @flights @general @multi-pax @pricing-options @sabre
Feature: 66548 Multi Pax - Correct price in pricing options and flight details
  As a corporate traveler booking for multiple passengers
  I want to see the correct per-traveler price in pricing options and total in flight details
  So that I can verify the pricing is accurate

  # TODO: New user needed — sabre@testim.com → USER_SABRE_TESTIM (same as 35108)

  Scenario: Multi pax pricing is correct in pricing options and flight details
    Given I am logged in as "sabre_testim" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    # TODO: Step needed for "Search flights (route TBD from Testim)"
    # TODO: Step needed for "Validate price in pricing options is per traveler"
    # TODO: Step needed for "Validate price in flight details is total for all pax"
