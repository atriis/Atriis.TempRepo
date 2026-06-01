@transportation @cars @regression
Feature: 62201 - Cars Reset Filters Button

  Scenario: Verify reset filters button is visible in car search results
    Given I am logged in
    When I search for cars
    And I apply one or more filters
    Then the reset filters button should be visible
    When I click the reset filters button
    Then all filters should be cleared
    And the original search results should be displayed
