# Test Name: 66126 United NDC - Flight - Complete Trip booking and verifying Branded Fares
# Description:
# Status: Active
# Labels: United,UA,Flights,UA ndc,Regression,Branded fares,Full Purchase,2026 plan 2,03
# Owner: Bruna Santos
# Created: 2025-08-29T01:06:25Z
# Updated: 2025-09-29T06:13:04Z

@regression @flights @ndc @united @branded-fares @full-purchase
Feature: 66126 United NDC - Complete Trip booking and verifying Branded Fares

  As a corporate traveler
  I want to book a United NDC flight and verify branded fares are displayed
  So that I can review the ancillary information included in my fare

  Scenario: Complete trip booking with branded fares verification at each stage
    Given I am logged in as "bsua@bsua.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "IAH" to "MIA"
    And flight results should be available
    And I filter results by carrier "United"
    And I click to open flight details
    And I open branded fares from flight details
    Then the branded fare ancillaries text should be visible
    When I close branded fares drawer
    And I close flight details window
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
