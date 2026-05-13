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

  Background:
    Given I am logged in as "beatrizpamplonacorp@galileo.com" booking a new trip
    And I have added a random guest traveler

  @priority:high
  Scenario: Cancel booked trip containing two cars
    When I search for a car at "Pittsburgh Intl. (PIT), Pittsburgh, PA, United States"
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    When I search for a second car and add to cart
    And I complete the booking
    And I cancel the trip
    Then I successfully cancel the trip
