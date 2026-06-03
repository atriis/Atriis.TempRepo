@transportation @cars @regression @provider:sunny
Feature: 62892 - Sunny Cars - Add Location Successfully with Different Pickup and Dropoff

  Scenario: Verify location is added successfully when searching for different pickup and dropoff locations
    Given I am logged in with a Sunny Cars account
    When I search for cars with different pickup and dropoff locations
    Then the locations should be added successfully
    And the car results should be displayed
