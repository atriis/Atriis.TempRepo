# Test Name: 66133 Iberia NDC - Flight - Complete Trip booking and verifying Fare Rules
# Description: Complete Iberia NDC booking with fare rules verified at every entry point
# Status: Active
# Labels: Flights,Fare Rules,Regression,Pre Prod,NDC,Full Purchase,Iberia,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-08-29T04:55:34Z
# Updated: 2025-08-29T05:42:18Z

@regression @flights @iberia @ndc @fare-rules @hold
Feature: 66133 Iberia NDC - Complete trip booking with fare rules verification
  As a corporate traveler
  I want to verify fare rules across results, pricing options, flight details, cart, and price breakdown
  So that the strictest terms note is consistently displayed before and after holding the Iberia NDC trip

  Scenario: Verify fare rules in every entry point and hold the Iberia NDC trip
    Given I am logged in as "iberia" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MAD"
    And flight results should be available
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    When I click to open first pricing options
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    Then I close pricing options modal
    When I click to open flight details
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close flight details window
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    When I open flight details in cart
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close flight details window
    When I click to open price breakdown in cart
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close price breakdown modal
    When I accept Terms & Conditions
    And I hold the trip
    Then the booking status should be "On hold"
    When I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    When I open flight details in cart
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close flight details window
    When I click to open price breakdown in cart
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close price breakdown modal
    Then I successfully cancel the trip
