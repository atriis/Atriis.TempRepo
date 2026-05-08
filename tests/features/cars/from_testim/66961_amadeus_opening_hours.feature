@transportation @cars @regression @provider:amadeus
Feature: 66961 - Amadeus Cars - Specific Station Opening Hours Correct

  Scenario: Verify specific station opening hours are correctly displayed
    Given I am logged in with an Amadeus account
    When I search for cars at a specific location
    Then the station opening hours should be displayed correctly
    And the hours should match the actual location operating hours
