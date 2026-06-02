# Test Name: 60156 Travel Policy - Flight capacity restriction is triggered
# Description:
# Status: Active
# Labels: Regression,Flights,Travel policy,multi pax,Dynamic fields,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-28T11:49:10Z
# Updated: 2026-02-17T08:59:59Z

@regression @travel_policy @flights @multi_pax @shell
Feature: 60156 Travel Policy - Flight capacity restriction is triggered

  As a corporate traveler
  I want the system to trigger flight capacity restriction when too many passengers are on one flight
  So that the company's multi-passenger policy is enforced

  Scenario: Flight capacity restriction modal appears for 2 passengers
    Given I am logged in as "brunamjus@corptestbruna.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "vini cake"
    When I search for a one way flight from "LON" to "MIA"
    And I click proceed button if visible
    When I click add to cart to trigger the flight capacity restriction modal
    Then the flight capacity restriction modal should be visible
