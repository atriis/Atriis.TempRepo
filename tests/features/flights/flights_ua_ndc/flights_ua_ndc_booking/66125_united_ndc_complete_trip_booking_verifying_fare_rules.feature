# Test Name: 66125 United NDC - Flight - Complete Trip booking and verifying Fare Rules
# Description:
# Status: Active
# Labels: United,UA,Flights,Fare Rules,UA ndc,Regression,Pre Prod,NDC,Full Purchase,2026 plan 2,03
# Owner: Bruna Santos
# Created: 2023-05-26T09:51:38Z
# Updated: 2025-09-29T06:06:33Z

@regression @flights @ndc @united @fare-rules @full-purchase
Feature: 66125 United NDC - Complete Trip booking and verifying Fare Rules

  As a corporate traveler
  I want to book a United NDC flight and verify fare rules are accessible
  So that I can review the fare terms at every stage of the booking process

  Scenario: Complete trip booking with fare rules verification at each stage
    Given I am logged in as "united" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "IAH" to "ORD"
    And flight results should be available
    nd I filter results by carrier "United"
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
    When I click to open flight details
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
    When I click to open flight details
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
