@daily_cars @provider:amadeus
Feature: 62201  Cars - "Reset Filters" button is visible
  As a corporate traveler using Galileo
  I want to search for cars
  So that I can see "Reset filters" button in results page

  @priority:critical
  Scenario: "Resest Filters" button is visible in search results
    Given I am logged in as "beatrizpamplonacorp@galileo.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "dallasfort worth" with 1 months ahead
    When I wait for add to trip text to be visible
    Then the reset filters button should be visible and disabled
