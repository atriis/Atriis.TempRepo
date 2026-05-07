# Test Name: 66137 Lufthansa NDC - Flight - Complete Trip booking and verifying Fare Rules
# Description:
# Status: Active
# Labels: Flights,Fare Rules,NDC,Full Purchase,Lufthansa NDC Regression,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-08-29T05:47:10Z
# Updated: 2025-08-29T06:57:52Z

@regression @flights @ndc @lufthansa @fare-rules @full-purchase
Feature: 66137 Lufthansa NDC - Complete trip booking and verifying fare rules

  As a corporate traveler
  I want to book a Lufthansa NDC flight and verify fare rules at each stage
  So that I can confirm fare rules are accessible throughout the booking flow

  Scenario: Complete trip booking with fare rules verification at each stage
    Given I am logged in as "clara" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "FRA" to "SEA"
    Then flight results should be available

    # Verify fare rules on results page
    When I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I close fare rules window

    # Verify fare rules in pricing options
    When I click to open first pricing options
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close pricing options modal

    # Verify fare rules from flight details on results page
    When I click to open flight details
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close flight details window

    # Add flight to cart
    When I add the first flight to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"

    # Verify fare rules in cart - from fare rules button
    When I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window

    # Verify fare rules from flight details in cart
    When I click to open flight details
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close flight details window

    # Verify fare rules from price breakdown in cart
    When I click to open price breakdown in cart
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close price breakdown modal

    # Verify fare rules from T&C link in cart
    # TODO: Implement step "I click the T&C fare rules link in cart" — clicks '.page-view a' to open fare rules from T&C section

    # Accept T&C and hold
    When I accept Terms & Conditions
    And I hold the trip

    # Verify fare rules after hold - from fare rules button
    When I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window

    # Verify fare rules from flight details after hold
    When I click to open flight details
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close flight details window

    # Verify fare rules from price breakdown after hold
    When I click to open price breakdown in cart
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close price breakdown modal

    # Verify fare rules from T&C link after hold
    # TODO: Implement step "I click the T&C fare rules link in cart" — clicks '.page-view a' to open fare rules from T&C section

    # Cancel the trip
    Then I successfully cancel the trip
