@transportation @cars @regression @provider:sunny
Feature: 62861 - Sunny Cars - Dropoff Location Text Display

  Scenario: Verify dropoff location has text instead of zero value
    Given I am logged in with a Sunny Cars account
    When I search for cars with dropoff location
    Then the dropoff location should display descriptive text
    And not display a zero or empty value
