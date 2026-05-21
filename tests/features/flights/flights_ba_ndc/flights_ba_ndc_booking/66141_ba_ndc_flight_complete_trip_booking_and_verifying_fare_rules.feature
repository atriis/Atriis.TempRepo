# Test Name: 66141 BA NDC - Flight - Complete Trip booking and verifying Fare Rules
# Description:
# Status: Active
# Labels: Flights,Fare Rules,Pre Prod,NDC,Full Purchase,BA NDC Regression,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-08-29T07:30:46Z
# Updated: 2025-09-02T04:18:45Z

@regression @flights @ndc @ba @fare-rules @full-purchase
Feature: 66141 BA NDC - Complete trip booking and verifying fare rules

  As a corporate traveler
  I want to book a BA NDC flight and verify fare rules at each stage
  So that I can confirm fare rules are accessible throughout the booking flow

  Scenario: Complete trip booking with fare rules verification at each stage
    Given I am logged in as "iancurtis@ndcba.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "AMS"
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
