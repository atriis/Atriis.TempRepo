#ADO Test Case: #41168 - Search Amadeus Car in City Center

@transportation @cars @regression @daily_cars @provider:amadeus @ado:41168
Feature: 41168 Search Amadeus Car in City Center 
  As a corporate traveler using Amadeus
  I want to search for cars in city center locations

  @priority:critical
  Scenario: Search car in city center
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LON" with rental agency "AVIS" and 1 months ahead
    And I add a car from city center results to cart
    Then the booking status should be "Pending booking"