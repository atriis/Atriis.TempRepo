@transportation @cars @regression @provider:merge
Feature: 24067 - Car Search with Google Maps and Loyalty Population

  Scenario: Search for cars and verify Google Maps integration without loyalty population
    Given I am logged in with a merge provider account
    When I book a new trip
    And I add myself as the traveler
    And I search for cars
    Then Google Maps should be integrated in the search results
    And loyalty information should not be populated
