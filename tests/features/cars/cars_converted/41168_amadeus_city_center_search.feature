@transportation @cars @regression @provider:amadeus
Feature: 41168 - Search Car City Center Amadeus

  Scenario: User can search for cars in city center with Amadeus provider
    Given I am logged in as "ruimariano@amadeus.com"
    When I book a new trip
    And I add myself as the traveler
    And I search for cars in "LON" city center
    And I select the first car station after city search
    Then car results should be displayed with "Add to trip" button visible
