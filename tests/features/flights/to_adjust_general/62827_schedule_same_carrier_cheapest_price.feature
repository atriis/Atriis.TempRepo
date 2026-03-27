# Test Name: 62827 Amadeus - Flight - Search by schedule (same carrier) - "Cheapest package" is the same in pricing page and cart
# Status: Active
# Labels: Regression,Flights,by schedule,price,Amadeus,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-29T08:23:01Z
# Updated: 2025-09-01T03:07:34Z

@regression @flights @general @by-schedule @amadeus
Feature: 62827 Amadeus By Schedule - Same carrier cheapest package matches pricing and cart
  As a corporate traveler
  I want the cheapest package price to be consistent between pricing page and cart
  So that I can trust the price when booking

  Scenario: Cheapest package same carrier price matches in pricing page and cart
    Given I am logged in as "coreytaylor" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "DUB" to "PRG"
    # TODO: Step needed for "Add cheapest package (same carrier) to cart"
    # TODO: Step needed for "Verify price in cart matches pricing page price"
    Then I successfully cancel the trip
