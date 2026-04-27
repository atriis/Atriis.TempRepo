# Test Name: Hybrid for 71280: Galileo - Mini Rules - Correctly parse fare rules, non-refundable fare
# Status: Active
# Labels: Gray Dawes,Galileo,mini rule,Flights,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-12-07T01:26:50Z
# Updated: 2025-12-07T01:51:06Z

@regression @galileo @flights @mini_rules @fare_rules @hybrid
Feature: 71280 Galileo - Mini rules correctly parse non-refundable fare rules

  As a corporate traveler
  I want mini rules to correctly display non-refundable fare information
  So that I can see accurate cancellation policies in the price breakdown

  Scenario: Non-refundable fare shows correct mini rules in price breakdown
    Given I am logged in as "carcorp" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "YYZ" to "NYC"
    And flight results should be available
    And I filter results by carrier "AC"
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    # View mini rules in price breakdown
    And I click to open price breakdown in cart
    # TODO: View_Mini_Rules — verify in price breakdown:
    # 1. "Subtotal" text visible in rate-information section
    # 2. Cancel fee section shows "Non-refundable" (before departure)
    # 3. Cancel fee section shows "Non-refundable" (after departure)
