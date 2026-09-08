@transportation @cars @regression @daily_cars @provider:sunnycars
Feature: 75659 Sunny Cars - Car Model Visibility in Search Results
  As a corporate traveler using Sunny Cars
  I want to see the car model name in the search results
  So that I can identify and compare available vehicles before booking

  @priority:critical
  Scenario: Car model name is visible in Sunny Cars search results at LHR
    Given I am logged in as "automation@sunnycar.gdg" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with rental agency "Sunny Cars" and 1 months ahead
    Then the car model should be visible in the results
