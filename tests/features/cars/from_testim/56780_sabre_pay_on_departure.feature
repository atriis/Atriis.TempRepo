@transportation @cars @regression @provider:sabre
Feature: 56780 - Sabre Car - Display Based on Customer ID Number

  Scenario: Verify car is displayed as pay on departure when only customer ID number is defined
    Given I am logged in with a Sabre account
    And only customer ID number is defined under the agreement
    When I search for cars
    Then the car should be displayed as "pay on departure" in the results
    And the cart should also show "pay on departure"
