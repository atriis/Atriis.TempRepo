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
    Given I am logged in as "brunagalm29@brunaautomationgdg.com" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "LON" to "DOH"
    # Checkbox, not the search box: that one also matches a codeshare's "Operated by" label, and
    # those itineraries have no pricing options for the fare rules button to sit in.
    And I filter airline results by "Etihad Airways" checkbox
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    When I click to open flight details
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    And I close flight details window
    When I click to open first pricing options
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    Then I close pricing options modal
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    When I click to open flight details
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    And I close flight details window
    When I click to open price breakdown in cart
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    And I close price breakdown modal
    Then the booking status should be "Pending booking"
    And I accept Terms & Conditions
    When I hold the trip
    Then the quote destination should contain "Flight to"
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    When I click to open flight details
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    And I close flight details window
    When I click to open price breakdown in cart
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    And I close price breakdown modal
    Then I successfully cancel the trip
