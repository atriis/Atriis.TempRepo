@transportation @cars @regression @provider:sunny
Feature: 66558 - Sunny Cars Expiry Fix - Tooltip Minute Count

  Scenario: Verify expiry notification tooltip displays correct number of minutes
    Given I am logged in with a Sunny Cars account
    When I search for cars
    And I view the expiry information
    Then the tooltip should display the correct number of minutes remaining
    And the countdown should be accurately calculated
