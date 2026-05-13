# Test Name: 66138 Lufthansa NDC - Flight - Complete Trip booking and verifying Branded Fares
# Description:
# Status: Active
# Labels: Flights,Branded fares,Full Purchase,NDC,Lufthansa NDC Regression,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-08-29T05:47:34Z
# Updated: 2025-09-30T02:38:43Z

@regression @flights @ndc @lufthansa @branded-fares @full-purchase
Feature: 66138 Lufthansa NDC - Complete trip booking and verifying branded fares

  As a corporate traveler
  I want to book a Lufthansa NDC flight and verify branded fares information
  So that I can confirm branded fares are displayed correctly throughout the flow

  Scenario: Book a Lufthansa NDC round trip flight and verify branded fares
    Given I am logged in as "claraaguiar@ndclhclara.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "FRA" to "MIA"
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
