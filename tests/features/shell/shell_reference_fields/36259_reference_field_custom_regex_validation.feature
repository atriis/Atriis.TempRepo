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
    When I initiate a car search at "LHR"
    When I fill "* Custom Regular Expression 1" reference field pop up with "b34434"
    And I fill "* Custom Regular Expression 2" reference field pop up with "rr44!7u"
    Then a validation error is displayed on the "1" pop up reference field
    And a validation error is displayed on the "2" pop up reference field
    When I click proceed on the reference fields popup
    Then the message "Please fill in the required information in order to proceed" is displayed in the pop up reference field
    When I fill "* Custom Regular Expression 1" reference field pop up with "Z567"
    And I fill "* Custom Regular Expression 2" reference field pop up with "bu45%"
    And I click proceed on the reference fields popup
    Then I wait for add to trip text to be visible
