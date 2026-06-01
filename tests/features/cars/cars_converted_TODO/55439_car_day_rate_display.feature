@transportation @cars @regression
Feature: 55439 - Car Display Day Rate

  Scenario: Verify day rate is displayed for car rentals
    Given I am logged in
    When I search for cars
    Then the day rate should be displayed for each car option
    And users should be able to compare day rates
