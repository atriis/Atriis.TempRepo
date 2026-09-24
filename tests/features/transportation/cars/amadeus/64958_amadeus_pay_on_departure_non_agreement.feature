# Test Name: 64958 Amadeus - Cars - Enterprise - 'Pay on Departure' text is displayed for non agreement fares
# Labels: search, Regression, Cars, Amadeus, non agreement, specific, rental agency
# Owner: Bruna Santos
# Created: 2025-07-30T02:50:05Z
# Updated: 2025-07-30T03:38:40Z

@regression @cars @amadeus @agreement
Feature: 64958 Amadeus - Cars - 'Pay on Departure' text is displayed for non agreement fares

  As a traveler with Amadeus non-agreement car fares
  I want to see "Pay on Departure" text for non-agreement fares
  So that I understand the payment method is not pre-paid

  @priority:high
  Scenario: Verify pay on departure text for non-agreement Amadeus fares
    Given I am logged in as "automation@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "MXP" with rental agency "Alamo" and 1 months ahead
    Then handshake badge should be visible in car results
    And the payment type on results should be "Pay On Departure"
    When I add the first car to cart
    Then the payment type should be "Pay On Departure"
