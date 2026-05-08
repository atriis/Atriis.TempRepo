# Test Name: 66140 AFKL NDC - Flight - Complete Trip booking and verifying Branded Fares
# Description:
# Status: Active
# Labels: Flights,Pre Prod,Branded fares,Full Purchase,NDC,AFKL NDC Regression,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-08-29T07:11:52Z
# Updated: 2025-12-15T11:31:44Z

@regression @flights @ndc @afkl @branded-fares @full-purchase
Feature: 66140 AFKL NDC - Complete trip booking and verifying branded fares

  As a corporate traveler
  I want to book an AFKL NDC flight and verify branded fares information
  So that I can confirm branded fares are displayed correctly throughout the flow

  Scenario: Book an AFKL NDC round trip flight and verify branded fares
    Given I am logged in as "afkl" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "AMS" to "HKG"
    And flight results should be available
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
