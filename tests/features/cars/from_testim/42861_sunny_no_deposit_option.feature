@transportation @cars @regression @provider:sunny
Feature: 42861 - Sunny Cars - No Deposit Option Display

  Scenario: Verify no deposit option is displayed for cars that support it
    Given I am logged in with a Sunny Cars account
    When I search for cars
    Then cars with no deposit option should display this option in the results
    And users should be able to select the no deposit option when available
