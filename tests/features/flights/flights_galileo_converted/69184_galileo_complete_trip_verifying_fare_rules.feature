# Test Name: 69184 Galileo - Flight - Complete Trip booking and verifying Fare Rules
# Status: Active
# Labels: Flights,Fare Rules,Full Purchase,Galileo,Complete trip,GDS,Regression,Pre Prod,Sanity,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-22T02:54:37Z
# Updated: 2025-10-22T03:25:09Z

@regression @galileo @flights @fare_rules @full_purchase @sanity
Feature: 69184 Galileo - Complete trip booking verifying fare rules

  As a corporate traveler
  I want fare rules to be visible at every stage of the booking flow
  So that I can review cancellation and change policies

  Scenario: Fare rules displayed in results, pricing options, flight details, cart and after hold
    Given I am logged in as "bsgalileoflight" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "PAR" to "DOH"
    And flight results should be available
    # Fare rules in results page
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    # Fare rules in pricing options
    And I click to open first pricing options
    # TODO: Open fare rules link inside pricing options, verify "Please note:", close, close pricing options
    And I close pricing options modal
    # Fare rules in flight details (results page)
    And I click to open flight details
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close flight details window
    # Add to cart
    And I add the first flight to cart
    # Fare rules in cart
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    # Fare rules in flight details (cart)
    And I click to open flight details
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close flight details window
    # TODO: Check_flight_fare_rules___price_breakdown__cart_ — open price breakdown, click fare rules, verify
    # TODO: Check_flight_terms_and_conditions__fare_rules____cart — open T&C fare rules in cart, verify
    And I accept Terms & Conditions
    And I click hold flight button
    # Fare rules after hold — same checks repeated
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I click to open flight details
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close flight details window
    Then I successfully cancel the trip
