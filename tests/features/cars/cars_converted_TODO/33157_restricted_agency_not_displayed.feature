@transportation @cars @regression
Feature: 33157 - Restricted Car Rental Agency Should Not Appear in Results

  Scenario: Verify restricted rental agencies do not appear in search results
    Given I am logged in
    When I search for cars
    Then restricted car rental agencies should not appear in the results
