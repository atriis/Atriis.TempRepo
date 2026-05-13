# Test Name: HYBRID for 69189 GroundScoupe - validate expired trip when counter is zero
# Description:
# Status: Active
# Labels: Expiry,Transportation,hybrid,Groundscope Regression,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-10-31T05:46:45Z
# Updated: 2026-01-20T04:30:33Z

@regression @transportation @ground_transport @provider:groundscope @expiry
Feature: 69189 GroundScope - Expired quote can be searched again

  As a corporate traveler
  I want an expired GroundScope quote to expose the search again flow
  So that I can recheck availability when the countdown reaches zero

  Scenario: Expired GroundScope quote exposes check availability actions
    Given I am logged in as "elisabeteferreira@groundscope.com" booking a new trip
    And I have added myself as the traveler
    When I search for ground transport from airport "LHR" to specific address "London Emirates Stadium, Hornsey Road, United Kingdom"
    And I wait for add to trip text to be visible
    And I add the first result to trip
    And I hover and validate the ground transport expiry counter
    Then the booking status should be "Pending booking"
    When I open the current ground transport trip
    Then the booking status should be "Expired"
    When I click the check availability button
    Then the check availability result should be displayed
    And the ground transport availability actions should be displayed
