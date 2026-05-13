# Test Name: 34878 Amadeus branded info in results, pricing and cart
# Description:
# Status: Active
# Labels: Regression,No Amadeus Hotel Book,2026 plan 1
# Owner: pini harush
# Created: 2023-08-20T02:23:04Z
# Updated: 2026-01-09T01:07:46Z

@regression @flights @amadeus @branded-fares
Feature: 34878 Amadeus - Branded fares info in results, pricing options, and cart
  As a corporate traveler
  I want to see branded fare information at every stage
  So that I know what ancillaries are included in my fare

  Scenario: Branded fare ancillaries are displayed in results, pricing options, and cart
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "JFK" to "CDG"
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
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I open flight details in cart
    And I open branded fares from cart flight details
    Then the branded fare ancillaries text should be visible
    And I close branded fares drawer in cart
