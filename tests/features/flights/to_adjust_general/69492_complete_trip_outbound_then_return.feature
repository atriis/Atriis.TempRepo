# Test Name: 69492: Complete Trip – Select Outbound, Proceed to Select Return
# Status: Active
# Labels: Club,Sabre,Pricing Options,Flights,Daily Flights
# Owner: Noam Miller
# Created: 2025-10-26T08:21:56Z
# Updated: 2025-11-10T02:50:28Z

@regression @flights @general @sabre @pricing-options
Feature: 69492 Flights - Complete Trip select outbound proceed to select return
  As a corporate traveler
  I want to select the outbound flight and be redirected to select the return
  So that I can complete my round trip booking through pricing options

  # TODO: New user needed — sabre@testim.com → USER_SABRE_TESTIM (same as 35108)

  Scenario: Selecting outbound redirects to return segment selection
    Given I am logged in as "sabre_testim" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "MAD" to "FRA"
    # TODO: Step needed for "Click pricing options, select outbound, verify redirect to return segment"
