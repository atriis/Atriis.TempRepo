# Test Name: 61474 Profile - Dynamic Fields - Warning messages are not displayed because dynamic field was filled in the traveler's profile
# Description:
# Status: Active
# Labels: Regression,Dynamic fields,Profile,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-04-24T01:26:17Z
# Updated: 2025-09-14T10:50:53Z

@regression @profile @dynamic-fields
Feature: 61474 Profile - No warning when dynamic field is filled
  As a corporate traveler
  I want to not see warning messages for dynamic fields that are already filled in my profile
  So that I am not bothered by unnecessary validation errors

  @priority:medium
  Scenario: Dynamic field warning messages are not shown when field is filled in profile
    Given I am logged in as "dynafiel@dynamicprofilecorp.com" booking a new trip
    When I navigate to my user profile
    Then no dynamic field warning messages should be displayed
    And the dynamic profile field should show value "1"
