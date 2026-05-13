@transportation @cars @regression @provider:amadeus @priority:high
Feature: 24067 - Amadeus Car - Validate Google Maps and Car Loyalty Field

  Scenario Outline: User can view car location on Google Maps and loyalty is not populated
    Given I am logged in as "isprepaid_on" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "<location>"
    And I add a car from city center results to cart
    When I open the first car location link in results
    Then I should see the selected car location in Google Maps
    And the car loyalty field should not be populated in the cart

    Examples:
      | location   |
      | London, UK |
