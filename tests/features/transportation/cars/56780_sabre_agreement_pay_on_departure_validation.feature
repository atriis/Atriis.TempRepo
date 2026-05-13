# Test Name: 56780 Sabre - Car -  When only "Customer ID number" is defined under the Agreement, car is displayed as "Pay On Departure" in results and cart
# Labels: Cars, Regression, Sabre, Agreement, Cart, results
# Owner: Bruna Santos
# Created: 2025-01-15T01:28:55Z
# Updated: 2026-02-03T02:17:29Z

@regression @cars @sabre @agreement
Feature: 56780 Sabre agreement with customer ID displays pay on departure

  As a corporate traveler using a Sabre agreement
  I want to see "Pay On Departure" for cars with customer ID-only agreements
  So that I understand the payment method for the rental

  Background:
    Given I am logged in as "robsoncruz@sabrecargdg.com" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Verify payment type consistency for Sabre customer ID agreement
    When I have selected a Sabre rental agency
    And I search for a car at "LHR"
    Then the payment type should show prepaid or pay on departure in results
    When I add the first car to cart
    Then the booking status should be "Pending booking"
    And the payment type should display prepaid or pay on departure in cart
