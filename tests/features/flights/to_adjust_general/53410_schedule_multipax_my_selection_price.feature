# Test Name: 53410 Amadeus - Flight - Search by schedule - Multipax - "My Selection" has the correct price in pricing page and cart
# Status: Active
# Labels: Regression,multi pax,Flights,by schedule,general,price,Amadeus,Daily Flights,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-10-22T09:27:10Z
# Updated: 2026-02-13T08:27:08Z

@regression @flights @general @by-schedule @multi-pax @amadeus
Feature: 53410 Amadeus By Schedule - Multipax My Selection has correct price
  As a corporate traveler booking for multiple passengers
  I want My Selection price to be correct in the pricing page and cart
  So that I can verify the total cost is accurate

  Scenario: My Selection price is correct in pricing page and cart for multi-pax
    Given I am logged in as "ruimendes" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    When I search for a flight by schedule from "SYD" to "MEL"
    And I select flight segments by schedule
    And I handle conflicting quotes if visible
    # TODO: Step needed for "Extract price from cart and verify it matches pricing page price"
