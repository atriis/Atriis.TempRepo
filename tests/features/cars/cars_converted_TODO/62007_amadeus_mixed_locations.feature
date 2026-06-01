@transportation @cars @regression @provider:amadeus
Feature: 62007 - Amadeus Cars - Mixed Pickup and Drop-off Locations

  Scenario: Verify results are displayed when pickup is airport and drop-off is city center
    Given I am logged in with an Amadeus account
    When I search for cars with airport as pickup location
    And city center as drop-off location
    Then the results should be displayed successfully
    And the locations should be honored in the booking
