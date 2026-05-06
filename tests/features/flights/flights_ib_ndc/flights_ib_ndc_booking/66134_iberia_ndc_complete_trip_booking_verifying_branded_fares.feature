# Test Name: 66134 Iberia NDC - Flight - Complete Trip booking and verifying Branded Fares
# Description: Complete Iberia NDC booking with branded fares verified before and after hold
# Status: Active
# Labels: Flights,Regression,Branded fares,Full Purchase,Iberia,NDC,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-08-29T04:55:51Z
# Updated: 2025-10-22T03:36:54Z

@regression @flights @iberia @ndc @branded-fares @hold
Feature: 66134 Iberia NDC - Complete trip booking with branded fares verification
  As a corporate traveler
  I want to see branded fare ancillaries in results, pricing options, and cart
  So that I can confirm the brand is consistent before and after holding the Iberia NDC trip

  Scenario: Verify branded fares in every entry point and hold the Iberia NDC trip
    Given I am logged in as "iberia" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "MEX" to "BRU"
    And flight results should be available
    When I click to open flight details
    And I open branded fares from flight details
    Then the branded fare ancillaries text should be visible
    And I close branded fares drawer
    And I close flight details window
    When I click to open first pricing options
    And I open branded fares from pricing options
    Then the branded fare ancillaries text should be visible
    And I close branded fares drawer
    And I close pricing options modal
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I open flight details in cart
    And I open branded fares from cart flight details
    Then the branded fare ancillaries text should be visible
    And I close branded fares drawer in cart
    And I close flight details window
    When I accept Terms & Conditions
    And I hold the trip
    Then the booking status should be "On hold"
    When I open flight details in cart
    And I open branded fares from cart flight details
    Then the branded fare ancillaries text should be visible
    And I close branded fares drawer in cart
    And I close flight details window
    Then I successfully cancel the trip
