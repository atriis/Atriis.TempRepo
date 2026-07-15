# Test Name: 35168 Reference Fields - User can bypass the reference fields when they're optional
# Description:
# Status: Active
# Labels: Regression,Reference Fields,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-08-29T04:38:53Z
# Updated: 2025-09-14T08:33:16Z

@shell @reference_fields @regression
Feature: 35168 - Optional reference fields can be bypassed

  As a booker
  I want to proceed without filling optional reference fields
  So that optional fields do not block the booking flow

  Scenario: Proceed past an optional reference field without filling it
    Given I am logged in as "carolinaferreira@joysettings.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip "Business" class flight from "LHR" to "BCN"
    Then the reference fields popup should show the following labels:
    | Is this field optional? |
    And I click proceed button if visible
    Then flight results should be available
