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

  # TODO: New user needed — region@policy.com → USER_REGION
  # Add to .env: USER_REGION="region@policy.com"

  Scenario: Travel policy is correctly calculated for long connection flight
    Given I am logged in as "region" booking a new trip
    And I have added myself as the traveler
    # TODO: Step needed for "Search flights (route TBD from Testim)"
    # TODO: Step needed for "Adjust flight duration filter"
    # TODO: Step needed for "Verify travel not from EU to EU is not OOP"
