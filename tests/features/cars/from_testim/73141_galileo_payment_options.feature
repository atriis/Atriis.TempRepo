@transportation @cars @regression @provider:galileo
Feature: 73141 - Galileo Cars - Prepaid and Pay on Departure

  Scenario: Verify both prepaid and pay on departure options are available for Galileo
    Given I am logged in with a Galileo account
    When I search for cars
    Then both "Prepaid" and "Pay on Departure" options should be displayed
    And users should be able to select either payment option
