@transportation @cars @regression @provider:sabre
Feature: 53976 - Sabre Car - City Center Location Display

  Scenario: Verify location name and address are displayed when searching city center, and pickup/drop-off locations are different
    Given I am logged in with a Sabre account
    When I search for cars in city center location
    Then the location name and address should be displayed
    And the pickup location should be different from the drop-off location
