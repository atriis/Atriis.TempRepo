# Test Name: 62892 Sunny Cars - Adding location successfully when searching for different pick up and drop off locations
# Labels: Cars, SunnyCars Regression, location, Regression
# Owner: Bruna Santos
# Created: 2025-06-03T12:22:03Z
# Updated: 2025-08-19T11:55:43Z

@transportation @cars @regression @daily_cars @provider:sunnycars @ado:62892
Feature: 62892 SunnyCars add location with different pickup and dropoff

  As a SunnyCars traveler with different pickup and dropoff locations
  I want to successfully add locations to my car search
  So that I can complete my car booking

  @priority:high
  Scenario: Add SunnyCars with different pickup and dropoff locations
    Given I am logged in as "brunaalice@sunny.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car from "LHR" to "LGW"
    And I add the first car to cart
    And the booking status should be "Pending booking"
    And I click to edit the add location extras section
    And I select the first pickup location in the add location section
    And I select the first drop-off location in the add location section
    And I click the save button
    Then I should see a success notification
    And the booking status should be "Pending booking"
    And the add location green icon should be visible
