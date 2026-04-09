# Test Name: 66961 Amadeus - Cars - Specific station opening hours are correct
# Labels: Amadeus, Cars, Regression, results, specific
# Owner: Bruna Santos
# Created: 2025-09-10T07:02:17Z
# Updated: 2025-09-15T01:23:53Z

@regression @cars @amadeus
Feature: 66961 Amadeus station opening hours validation

  As an Amadeus car traveler
  I want to see correct opening hours for specific rental stations
  So that I know when I can pick up or drop off my car

  Background:
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    And I have selected Enterprise rental agency

  @priority:high
  Scenario: Verify Amadeus station opening hours are correct
    When I search for a car at "Shipyard Dr @ Pettinaro Park Dr, Wilmington, DE, USA"
    # TODO: Verify the displayed station opening hours match the configured hours
