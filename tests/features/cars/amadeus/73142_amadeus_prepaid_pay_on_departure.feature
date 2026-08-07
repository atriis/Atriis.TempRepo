@transportation @cars @regression @provider:amadeus
Feature: 73142 Amadeus - Cars - PrePaid & Pay on Departure

  Scenario: Book Amadeus car with PrePaid
    Given I am logged in as "automation@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "MXP" with rental agency "Hertz" and 1 months ahead
    Then the payment type on results should be "Pre paid"
    When I add the first car to cart
    Then the payment type should be "Pre paid"
    And I proceed to checkout
    And I complete the booking
    Then the payment type should be "Pre paid"
    And I successfully cancel the trip

  Scenario: Book Amadeus car with Pay On Departure
    Given I am logged in as "automation@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "MXP" with rental agency "Enterprise" and 1 months ahead
    Then the payment type on results should be "Pay On Departure"
    When I add the first car to cart
    Then the payment type should be "Pay On Departure"
    And I proceed to checkout
    And I complete the booking
    Then the payment type should be "Pay On Departure"
    And I successfully cancel the trip