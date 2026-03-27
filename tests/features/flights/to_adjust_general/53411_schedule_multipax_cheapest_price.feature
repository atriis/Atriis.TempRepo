# Test Name: 53411 Flight - Search by schedule - Multipax - "Cheapest package" has the correct price in pricing page and cart
# Status: Active
# Labels: Regression,Flights,by schedule,multi pax,price,general,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-10-22T01:42:59Z
# Updated: 2025-09-18T11:58:14Z

@regression @flights @general @by-schedule @multi-pax
Feature: 53411 By Schedule - Multipax cheapest package has correct price
  As a corporate traveler booking for multiple passengers
  I want the cheapest package price to be correct in the pricing page and cart
  So that the total cost is accurate for multi-pax bookings

  Scenario: Cheapest package price is correct in pricing page and cart for multi-pax
    Given I am logged in as "ruimendes" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    When I search for a flight by schedule from "LON" to "MAD"
    And I select flight segments by schedule
    # TODO: Step needed for "Verify cheapest package price in pricing page matches cart price"
