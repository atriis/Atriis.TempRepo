# Test Name: 62861 Sunny Cars - Drop-off location has text instead of '0'
# Labels: Cars, SunnyCars Regression, location, Regression
# Owner: Bruna Santos
# Created: 2025-06-03T07:13:21Z
# Updated: 2025-08-18T10:12:41Z

@regression @cars @sunnycars
Feature: 62861 SunnyCars dropoff location displays text properly

  As a traveler booking SunnyCars
  I want the dropoff location to display text instead of '0'
  So that I see meaningful location information

  Background:
    Given I am logged in as "kaylesun" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Verify SunnyCars dropoff location displays text
    When I search for a car at "Palma de Mallorca, (PMI) Spain"
    # TODO: Complete reference fields for Chris Tree Fake Test and proceed
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    # TODO: Verify dropoff location displays text instead of '0'
