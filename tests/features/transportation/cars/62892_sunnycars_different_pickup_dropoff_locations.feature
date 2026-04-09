# Test Name: 62892 Sunny Cars - Adding location successfully when searching for different pick up and drop off locations
# Labels: Cars, SunnyCars Regression, location, Regression
# Owner: Bruna Santos
# Created: 2025-06-03T12:22:03Z
# Updated: 2025-08-19T11:55:43Z

@regression @cars @sunnycars
Feature: 62892 SunnyCars add location with different pickup and dropoff

  As a SunnyCars traveler with different pickup and dropoff locations
  I want to successfully add locations to my car search
  So that I can complete my car booking

  Background:
    Given I am logged in as "brunaalice" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Add SunnyCars with different pickup and dropoff locations
    When I search for a car from "LHR" to "LGW"
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    # TODO: Verify location is added successfully for different pickup/dropoff
