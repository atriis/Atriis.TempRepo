# Test Name: 73141 Galileo - Cars - PrePaid & Pay on Departure
# Labels: Cars, Full Purchase, Regression, Daily Transportation
# Owner: Pedro Carneiro
# Created: 2026-01-30T04:26:44Z
# Updated: 2026-01-30T05:41:20Z

@regression @cars @galileo @full-purchase @daily-transportation
Feature: 73141 Galileo car prepaid FOP consistency

  As a Galileo car traveler
  I want to see consistent prepaid payment type across results, cart, and checkout
  So that I understand the payment method for my booking

  Background:
    Given I am logged in as "testim" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Verify Galileo prepaid FOP displayed consistently
    When I search for a car at "LHR"
    Then the payment method should show "Pre paid" in results
    When I add the first car to cart
    Then the payment method should show "Pre paid" in cart
    When I fill free text justification if needed
    And I accept Terms & Conditions
    And I proceed to checkout
    And I complete the booking
    Then the payment method should show "Pre paid" in checkout
    When I cancel the trip
    Then I successfully cancel the trip
    # TODO: Verify re-booking shows the same "Pre paid" FOP
