# Test Name: 67425 Ypsilon - Price is not zero for mixed carrier quotes
# Description:
# Status: Active
# Labels: Ypsilon,Flights,price,Regression,multicarrier,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-19T03:20:23Z
# Updated: 2025-09-19T03:35:42Z

@regression @flights @ypsilon @price @multi-carrier
Feature: 67425 Ypsilon - Price is not zero for mixed carrier quotes
  As a corporate traveler using Ypsilon
  I want to verify that mixed carrier flight quotes have non-zero prices
  So that pricing is displayed correctly for multi-carrier itineraries

  Scenario: Mixed carrier quotes show non-zero prices in results
    Given I am logged in as "ypsilon@club.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "DUB" to "MIL"
    Then flight results should be available
    When I filter airline results by "Multi carrier" checkbox
    Then flight results should be available
    # TODO: Verify the first flight result price (.flight-list > :nth-child(1) .amount) is not zero (matches regex ^(?!0+(?:\.0+)?$).+)
