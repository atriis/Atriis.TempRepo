# Test Name: 54569 Cars - Travel Policy - In case car initiator is corporate user, restrict result (AIRPORT search)
# Description:
# Status: Active
# Labels: Cars,general,Regression,Travel policy,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-11-22T07:38:05Z
# Updated: 2025-02-25T10:08:24Z
@regression @cars
Feature: 54569 Cars - Travel Policy - In case car initiator is corporate user, restrict result (AIRPORT search)
  As a corporate traveler
  I want restricted airport results to be flagged clearly by policy
  So that policy enforcement is visible and understandable

  @priority:high
  Scenario: Search an airport car and verify the corporate-user policy tooltip
    Given I am logged in as "bruno@car.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR"
    Then the out of policy indicator should be visible in results
    And the out of policy tooltip in results should be "Initiator is corporate user"
    #TODO And the reset add to trip button should be visible and disabled
