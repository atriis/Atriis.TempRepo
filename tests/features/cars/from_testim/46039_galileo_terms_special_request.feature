@transportation @cars @regression @provider:galileo
Feature: 46039 - Galileo Car - Terms and Conditions and Special Request Handling

  Scenario: Verify terms and conditions are displayed and special request character limit
    Given I am logged in with a Galileo account
    When I search for cars
    And I proceed to checkout
    Then the terms and conditions should be displayed
    And the special request field should allow up to 64 characters
    When I complete the booking with valid special request
    Then the booking should be successful
