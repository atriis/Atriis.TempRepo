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

  @priority:high
  Scenario: Verify Amadeus station opening hours are correct
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    And I search for a car at "Shipyard Dr @ Pettinaro Park Dr, Wilmington, DE, USA" with rental agency "Enterprise"
    And I wait for select text to be visible
    And I click see details for "2" result
    Then the displayed station opening hours are "Monday: 07:30 - 18:00, Tuesday: 07:30 - 18:00, Wednesday: 07:30 - 18:00, Thursday: 07:30 - 18:00, Friday: 07:30 - 18:00, Saturday: 08:00 - 12:00" 
