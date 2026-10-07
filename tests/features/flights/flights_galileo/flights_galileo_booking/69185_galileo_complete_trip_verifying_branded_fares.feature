# Test Name: 69185 Galileo - Flight - Complete Trip booking and verifying Branded Fares
# Status: Active
# Labels: Flights,Branded fares,Full Purchase,Regression,Galileo,GDS,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-22T03:09:08Z
# Updated: 2025-11-03T08:04:24Z

@regression @galileo @flights @branded_fares @full_purchase
Feature: 69185 Galileo - Complete trip booking verifying branded fares

  As a corporate traveler
  I want branded fares to be visible at every stage of the booking flow
  So that I can review ancillary inclusions

  Scenario: Branded fares displayed in results, pricing options, cart and after hold
    Given I am logged in as "bsgalileoflight@galileoflight.com" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "LIS" to "DOH"
    And flight results should be available
    And I click to open flight details
    And I open branded fares from flight details
    Then the branded fare ancillaries text should be visible
    When I close branded fares drawer
    And I close flight details window
    And I click to open first pricing options
    And I open branded fares from pricing options
    Then the branded fare ancillaries text should be visible
    When I close branded fares drawer
    And I close pricing options modal
    And I add the first flight to cart
    Then the booking status should be "Pending Booking"
    And I click to open flight details
    And I open branded fares from flight details
    Then the branded fare ancillaries text should be visible
    When I close branded fares drawer
    And I close flight details window
    And I accept Terms & Conditions
    And I hold the trip
    And I click to open flight details
    And I open branded fares from flight details
    Then the branded fare ancillaries text should be visible
    When I close branded fares drawer
    And I close flight details window
    Then I successfully cancel the trip
