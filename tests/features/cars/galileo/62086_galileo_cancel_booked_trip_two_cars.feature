# Test Name: 62086 Galileo - Cars - User successfully cancels a booked trip with two cars
# Labels: Full Purchase, Cars, Galileo, Regression, cancellation, trip cancelation
# Owner: Bruna Santos
# Created: 2025-05-14T11:16:19Z
# Updated: 2026-02-03T01:41:53Z

@regression @cars @galileo @full-purchase @cancellation
Feature: 62086 Galileo cancel booked trip with two cars

  As a traveler who booked multiple cars
  I want to successfully cancel my trip with all cars
  So that I can cancel my complete travel arrangements

  #Couldn't test the entire test due supplier availability, as soon as supplier is available we will make sure test is working as expected
  @priority:high
  Scenario: Cancel booked trip containing two cars
    Given I am logged in as "automation@galileo.gdg" booking a new trip
    And I have added a random guest traveler
    When I search for a car at "Pittsburgh Intl. (PIT), Pittsburgh, PA, United States"
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    When I edit the car search at "Rhode Island T.F. Green International Airport (PVD), Post Road, Warwick, RI, USA" without changing dates
    And I add the first car to cart
    Then the first quote destination should contain "PIT"
    And the last quote destination should contain "PVD"
    And I accept all Terms & Conditions on the page
    And I click the proceed to checkout button
    And I complete the booking
    Then the booking status should be "Confirmed"
    And the last quote status should be "Confirmed"
    And I successfully cancel the trip
