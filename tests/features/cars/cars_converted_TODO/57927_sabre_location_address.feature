@transportation @cars @regression @provider:sabre
Feature: 57927 - Sabre Car - Pickup and Drop-off Address Location

  Scenario: Verify pickup and drop-off addresses are from selected location not from airport
    Given I am logged in with a Sabre account
    When I search for cars in a city center location
    Then the pickup address should be from the city center location
    And the drop-off address should be from the city center location
    And not from any nearby airport
