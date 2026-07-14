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
    # TODO: implement step - verify the linked reference field for the profiled traveller is displayed
    Then the reference field "Reference Field - At User Select- par exist" is displayed
    When I click proceed on the reference fields popup
    # TODO: implement step - add a guest traveller with full personal and contact details
    When I add a guest traveller "Israel Yakov Israeli"
    # TODO: implement step - run the flight search again after adding the guest
    When I search for the flight again
    # TODO: implement step - verify the linked reference field for the guest traveller is displayed
    Then the reference field "Reference Field - At User Select- par not exist" is displayed
