# Test Name: 36259 Reference field - Data validation: Custom regular expression
# Description:
# Status: Active
# Labels: CR7,Reference Fields,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-09-25T07:36:26Z
# Updated: 2024-10-01T02:01:13Z

@shell @reference_fields @regression
Feature: 36259 - Reference field custom regular-expression validation

  As a booker
  I want reference fields validated against a custom regular expression
  So that only values matching the configured format are accepted

  Scenario: Reference fields reject values in the wrong format and accept the correct format
    Given I am logged in as "miguelsantos@customregular.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car in "LHR"
    # TODO: implement step - fill the first reference field with an invalid-format value
    When I fill the first reference field with "b34434"
    # TODO: implement step - fill the second reference field with an invalid-format value
    And I fill the second reference field with "rr44!7u"
    # TODO: implement step - verify a validation error is displayed on the first reference field
    Then a validation error is displayed on the first reference field
    # TODO: implement step - verify a validation error is displayed on the second reference field
    And a validation error is displayed on the second reference field
    When I click proceed on the reference fields popup
    # TODO: implement step - verify the mandatory-information validation message is displayed
    Then the message "Please fill in the required information in order to proceed" is displayed
    # TODO: implement step - fill the first reference field with a valid-format value
    When I fill the first reference field with "Z567"
    # TODO: implement step - fill the second reference field with a valid-format value
    And I fill the second reference field with "bu45%"
    When I click proceed on the reference fields popup
    # TODO: implement step - verify the car search results are displayed (correct format accepted)
    Then the car search results are displayed
