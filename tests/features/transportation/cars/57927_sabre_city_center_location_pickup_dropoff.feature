# Test Name: 57927 Sabre - Car - When searching for location, pick up and drop off addresses are from the selected location, not from the airport
# Labels: Regression, Sabre, Cars
# Owner: Bruna Santos
# Created: 2025-02-10T07:21:59Z
# Updated: 2025-06-23T02:02:50Z

@regression @cars @sabre
Feature: 57927 Sabre city-center location validates pickup and dropoff

  As a corporate traveler searching for car at city center
  I want pickup and dropoff addresses to reflect the city location, not the airport
  So that I get the correct rental location details

  Background:
    Given I am logged in as "penelopecruz@sabre.car" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Verify pickup and dropoff addresses from city-center location
    When I have selected an Enterprise rental agency
    And I search for a car at "Giffnock, Glasgow, UK"
    And I select one flight segment by schedule
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    And the pickup and dropoff locations should be from the selected location, not airport
