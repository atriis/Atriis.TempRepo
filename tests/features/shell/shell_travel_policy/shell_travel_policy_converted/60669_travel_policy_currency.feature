# Test Name: 60669 Travel Policy - Flight - Policy currency is triggered, not user group currency
# Description:
# Status: Active
# Labels: Travel policy,Flights,Regression,currency,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-04-09T01:03:53Z
# Updated: 2025-04-09T01:15:35Z

@regression @travel_policy @flights @currency @shell
Feature: 60669 Travel Policy - Policy currency triggers, not user group currency

  As a corporate traveler
  I want the travel policy to be evaluated in the policy currency (not my user group currency)
  So that the correct threshold is applied regardless of my display currency

  Scenario: Flight search shows no OOP when within policy currency threshold
    Given I am logged in as "bobsinclair@travelpolicy.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "ARN" to "MAD"
    Then the "Add to trip" text should be visible in results
    And the out of policy indicator should not be visible in results
