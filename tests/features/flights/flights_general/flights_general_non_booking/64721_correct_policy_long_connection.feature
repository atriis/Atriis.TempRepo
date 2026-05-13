# Test Name: 64721 Correct policy calculation, long connection
# Status: Active
# Labels: Amsalem,Travel policy,Flights,results,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-07-17T08:49:13Z
# Updated: 2025-07-17T11:13:41Z

@regression @flights @general @travel-policy
Feature: 64721 Flights - Correct policy calculation for long connection
  As a corporate traveler
  I want the travel policy to be correctly calculated for flights with long connections
  So that OOP indicators accurately reflect policy rules

  Scenario: Travel policy is correctly calculated for long connection flight
    Given I am logged in as "region@policy.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "EDI" to "HKG"
    And flight results should be available
    And I adjust the Limit Layover Duration filter from the half timepoint of the longest point
    Then the out of policy indicator should not be visible in results