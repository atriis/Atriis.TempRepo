# Test Name: 73142 Amadeus - Cars - PrePaid & Pay on Departure
# Labels: Cars, Full Purchase, Regression, Daily Transportation
# Owner: Pedro Carneiro
# Created: 2026-01-30T05:27:50Z
# Updated: 2026-01-30T07:02:31Z

@regression @cars @amadeus @full-purchase @daily-transportation
Feature: 73142 Amadeus car pay on departure FOP consistency

  As an Amadeus car traveler without billback
  I want to see consistent "Pay on Departure" payment type across results, cart, and checkout
  So that I understand the payment is due at rental location

  Background:
    Given I am logged in as "testim@car.com" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Verify Amadeus pay on departure FOP displayed consistently
    When I search for a car at "LHR"
    Then the payment method should show "Pay On Departure" in results
    When I add the first car to cart
    Then the payment method should show "Pay On Departure" in cart
    When I fill free text justification if needed
    And I accept Terms & Conditions
    And I proceed to checkout
    And I complete the booking
    Then the payment method should show "Pay On Departure" in checkout
    When I cancel the trip
    Then I successfully cancel the trip
    # TODO: Verify re-booking shows the same "Pay on Departure" FOP
