@transportation @cars @regression @provider:amadeus @priority:high
Feature: 24067 - Amadeus Car - Validate Google Maps and Car Loyalty Field

  Scenario Outline: User can view car location on Google Maps and loyalty is not populated
    Given I am logged in as "testim@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "<location>"
    And I add a car from city center results to cart
    # Payload validation (after Car Location List)
    When I capture the "response" payload for request type "Amadeus4.Car_LocationList" from Storage
    Then the captured "response" payload for request type "Amadeus4.Car_LocationList" should contain "<expectedCity>"
    And the captured "response" payload for request type "Amadeus4.Car_LocationList" should contain "<expectedCity>".block("locationAddress")
    And the captured "block" payload for request type "Amadeus4.Car_LocationList" should contain "<expectedCountryCode>".onKey("countryCode")
    # Payload validation (after Car Location List)
    When I capture the "response" payload for request type "Amadeus4.Car_LocationList" from Storage
    Then the captured "response" payload for request type "Amadeus4.Car_LocationList" should contain "<expectedCity>"
    And the captured "response" payload for request type "Amadeus4.Car_LocationList" should contain "<expectedCity>".block("locationAddress")
    And the captured "block" payload for request type "Amadeus4.Car_LocationList" should contain "<expectedCountryCode>".onKey("countryCode")
    Then the car loyalty field should not be populated in the cart
    When I open the first car location link in results
    Then I should see the selected car location in Google Maps

    Examples:
      | location    | expectedCity | expectedCountryCode |
      | London, UK  | London       | GB                  |
