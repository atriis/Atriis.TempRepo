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
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    When I search for a flight by schedule from "LON" to "FRA"
    And I filter results by carrier "Lufthansa"
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I filter results by carrier "Lufthansa"
    And I select one flight segment by schedule
    And I wait for "Cheapest package" text to be visible
    And I extract the price from "Cheapest package" fare
    And I add "Cheapest package" fare to trip
    Then the booking status should be "Pending booking"
    Then the cart total price should be the last extracted price multiplied by the number of travelers 2