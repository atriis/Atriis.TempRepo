# Test Name: 62007 Amadeus - Cars - Results are displayed when pick up location is airport and drop off location is city
# Labels: Cars, Regression, Amadeus
# Owner: Bruna Santos
# Created: 2025-05-09T09:01:43Z
# Updated: 2026-01-18T09:52:25Z

@regression @cars @amadeus
Feature: 62007 Amadeus car results with airport pickup and city dropoff

  As a traveler with different pickup and dropoff location types
  I want to see car results for airport to city routes
  So that I can book a car with mixed location types

  Background:
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    And I have selected Enterprise as the rental agency

  @priority:high
  Scenario: Display car results for airport pickup and city dropoff
    When I search for a car from "Charles de Gaulle (CDG), Paris, France" to "Le Havre, Le Havre, France (LEH)"
    Then I should see "LE HAVRE" in the results
    When I select one flight segment by schedule
    And I select one flight segment by schedule again
    Then I should see "Add to trip" option available
