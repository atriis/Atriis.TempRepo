# Test Name: 63185 Conflicting Quotes - New tab opens when clicking the trip number
# Description:
# Status: Active
# Labels: Regression,conflicting quote,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-06-06T07:29:03Z
# Updated: 2025-06-06T08:15:24Z

@regression @shell @flights @conflicting-quote
Feature: 63185 - Conflicting Quotes - New tab opens when clicking the trip number
  As a travel arranger
  I want the conflicting quotes dialog to appear when a duplicate flight is added to the same trip
  So that I can review the conflict and navigate to the trip overview without a new tab opening

  @priority:medium
  Scenario: Conflicting quotes dialog appears when adding a second flight that conflicts, and cart loads correctly
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "BKK"
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    And I click to add a flight to my trip from cart
    And I add the first flight to cart
    Then the conflicting quote modal should be visible
    When I navigate to the trip cart
    Then the quote destination should contain "Bangkok"
