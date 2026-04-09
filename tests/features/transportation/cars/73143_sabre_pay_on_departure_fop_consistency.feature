# Test Name: 73143 Sabre - Cars - PrePaid & Pay on Departure
# Labels: Cars, Full Purchase, Daily Transportation, Regression
# Owner: Pedro Carneiro
# Created: 2026-01-30T05:56:47Z
# Updated: 2026-02-13T03:40:49Z

@regression @cars @sabre @full-purchase @daily-transportation
Feature: 73143 Sabre car pay on departure FOP consistency

  As a Sabre car traveler
  I want to see consistent "Pay on Departure" payment type across results, cart, and checkout
  So that I understand the payment method for my booking

  Background:
    Given I am logged in as "testim" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Verify Sabre pay on departure FOP displayed consistently
    When I search for a car at "LHR"
    # TODO: Complete Sabre reference fields
    Then the payment method should show "Pay On Departure" in results
    When I add the first car to cart
    Then the payment method should show "Pay On Departure" in cart
    When I fill free text justification if needed
    And I accept Terms & Conditions
    And I proceed to checkout
    # TODO: Complete traveler reference questions
    And I complete the booking
    Then the payment method should show "Pay On Departure" in checkout
    When I cancel the trip
    Then I successfully cancel the trip
    # TODO: Verify re-booking shows the same "Pay on Departure" FOP
