# Test Name: 69688 Reference Field - 'At User Select' linked Reference Field
# Description:
# Status: Active
# Labels: Regression,Reference Fields,Corp RF,2026 plan 2
# Owner: pini harush
# Created: 2025-11-02T12:07:37Z
# Updated: 2026-02-16T02:35:35Z

@shell @reference_fields @regression @guest
Feature: 69688 - "At User Select" linked reference field

  As a booker
  I want the "At User Select" linked reference field to reflect the selected traveller
  So that the correct linked field is shown per traveller

  Scenario: Linked reference field differs between a profiled traveller and a guest traveller
    Given I am logged in as "Pini@tlgtest.im" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "lon" to "mad"
    Then the following checkout reference fields should be visible:
    | Reference Field - At User Select- par exist |
    When I click the back button
    And I have added a random guest traveler
    And I wait for the traveler name to be displayed
    And I search for a one way flight from "lon" to "mad"
    Then the following checkout reference fields should be visible:
    | Reference Field - At User Select- par exist |
    | Reference Field - At User Select- par not exist |
