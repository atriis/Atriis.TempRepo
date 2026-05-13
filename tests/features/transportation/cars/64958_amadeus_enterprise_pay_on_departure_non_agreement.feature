# Test Name: 64958 Amadeus - Cars - Enterprise - 'Pay on Departure' text is displayed for non agreement fares
# Labels: search, Regression, Cars, Amadeus, non agreement, specific, rental agency
# Owner: Bruna Santos
# Created: 2025-07-30T02:50:05Z
# Updated: 2025-07-30T03:38:40Z

@regression @cars @amadeus @agreement
Feature: 64958 Amadeus enterprise pay on departure non-agreement fares

  As a traveler with Amadeus non-agreement car fares
  I want to see "Pay on Departure" text for non-agreement fares
  So that I understand the payment method is not pre-paid

  Background:
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    And I have selected Enterprise rental agency

  @priority:high
  Scenario: Verify pay on departure text for non-agreement Amadeus fares
    When I search for a car at "MXP"
    # TODO: Verify non-agreement fare displays "Pay on Departure" in results
    When I add the first car to cart
    Then the booking status should be "Pending booking"
    # TODO: Verify payment type shows "Pay on Departure" in cart
