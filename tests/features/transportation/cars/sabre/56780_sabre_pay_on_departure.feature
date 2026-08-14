@transportation @cars @regression @provider:sabre
Feature: 56780 Sabre - Car -  When only "Customer ID number" is defined under the Agreement, car is displayed as "Pay On Departure" in results and cart

  Scenario: Verify car is displayed as pay on departure when only customer ID number is defined
    Given I am logged in as "robsoncruz@sabrecargdg.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "MXP" with rental agency "National"
    Then handshake badge should be visible in car results
    And the payment type on results should be "Pay On Departure"
    When I add the first car to cart
    Then the payment type should be "Pay On Departure"
