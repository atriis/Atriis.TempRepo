@transportation @cars @regression
Feature: 59292 - Cars Agreement Logo Display on Hover

  Scenario: Verify agreement logo is displayed when hovering over agreement information
    Given I am logged in
    When I search for cars
    And I hover over the agreement section
    Then the agreement logo should be displayed
