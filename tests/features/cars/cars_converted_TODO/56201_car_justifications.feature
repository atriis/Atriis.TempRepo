@transportation @cars @regression
Feature: 56201 - Car Justifications Configuration

  Scenario: Verify car justifications are taken from car and general administration settings
    Given I am logged in
    When I book a car
    Then the justifications should be retrieved from both car-specific and general administration settings
    And the correct justifications should be displayed
