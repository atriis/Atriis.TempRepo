# Test Name: 45663 Trip monitor - User group is displayed on the trip monitor
# Description:
# Status: Active
# Labels: Regression,Trip monitor,UI,user group,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-06T08:11:21Z
# Updated: 2025-12-16T09:58:45Z

@regression @shell @trips
Feature: 45663 - Trip monitor user group is displayed on the trip monitor
  As a corporate travel manager
  I want to see the user group label on in-travel trips in the trip monitor
  So that I can identify which user group each traveler belongs to at a glance

  Scenario: User group label is visible on the first in-travel trip in the trip monitor
    Given I am logged in as "ruimariano@amadeus.com"
    Then the welcome heading should contain "Welcome"
    When I navigate to the trips page
    And I click active trips tab
    Then the user group label should be visible on the first trip
