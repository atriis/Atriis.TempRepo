@transportation @cars @regression @amadeus @enterprise
Feature: Amadeus - Pay on Departure text is displayed for non-agreement fares

  Scenario: Verify pay on departure text displays for non-agreement fares
    Given I am logged in as "ruimariano"
    And I book a new trip
    And I add myself as the traveler
    And I select Enterprise rental agency
    When I search for a car at "MXP"
    And I wait for "Add to trip" text to appear on car results
    Then a non-agreement fare is available
    And the payment method is displayed on cart
    When I add the first car to cart
    And I wait for pending booking
    Then the payment method is displayed on results page
