# Test Name: 62007 Amadeus - Cars - Results are displayed when pick up location is airport and drop off location is city
# Labels: Cars, Regression, Amadeus
# Owner: Bruna Santos
# Created: 2025-05-09T09:01:43Z
# Updated: 2026-01-18T09:52:25Z

@regression @cars @amadeus
Feature: 62007 Amadeus - Cars - Results are displayed when pick up location is airport and drop off location is city

  As a traveler with different pickup and dropoff location types
  I want to see car results for airport to city routes
  So that I can book a car with mixed location types

  @priority:high
  Scenario: Display car results for airport pickup and city dropoff
    Given I am logged in as "automation@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car from "Charles de Gaulle (CDG), Paris, France" to "Le Havre, Le Havre, " with rental agency "Enterprise" and 1 months ahead
    And I select the first city center dropoff location
    Then I wait for add to trip text to be visible
