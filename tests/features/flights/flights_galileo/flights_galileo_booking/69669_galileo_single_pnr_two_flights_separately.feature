# Test Name: 69669 Galileo - Flights - Single PNR is created when the second flight is booked at checkout
# Status: Active
# Labels: Flights,Full Purchase,hold flight,PNR,Galileo,Regression,Single PNR,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-31T04:22:27Z
# Updated: 2025-12-15T08:41:28Z

@regression @galileo @flights @single_pnr @full_purchase @hold
Feature: 69669 Galileo - Single PNR created at checkout

  As a corporate traveler
  I want the flight I book at checkout to join the PNR of the flight I already held
  So that my itinerary stays in a single PNR

  Scenario: A held flight and a flight booked at checkout share one PNR
    Given I am logged in as "beatrizpamplonacorp@galileo.com" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "LIS" to "WAW" in 60 days
    And I add the first flight to cart
    Then the booking status should be "Pending Booking"
    And I accept Terms & Conditions
    And I hold the trip
    Then the quote destination should contain "Flight to"
    And I click to add a flight to my trip from cart
    When I edit the flight search from "CPH" to "LIS" in 64 days
    And flight results should be available
    And I filter results by a random carrier from "TP,SK"
    And I add the first flight to cart
    Then the quote destination should contain "Flight to"
    And I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
    Then the flight quotes should be merged into a single PNR
  