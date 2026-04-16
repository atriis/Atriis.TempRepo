# Test Name: 69669 Galileo - Flights - Single PNR is created when two flights are booked separately
# Status: Active
# Labels: Flights,Full Purchase,PNR,Galileo,Regression,Single PNR,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-31T04:22:27Z
# Updated: 2025-12-15T08:41:28Z

@regression @galileo @flights @single_pnr @full_purchase
Feature: 69669 Galileo - Single PNR when two flights booked separately

  As a corporate traveler
  I want a single PNR when booking two flights separately
  So that my itinerary is consolidated

  Scenario: Two separately booked flights result in single PNR
    Given I am logged in as "beatrizpamplonacorp" booking a new trip
    And I have added a random guest traveler
    # First flight
    When I search for a one way flight from "LON" to "DOH"
    And I add the first flight to cart
    And I proceed to checkout
    And I complete the booking
    And I store the first booked flight number
    # Second flight from cart
    And I click to add a flight to my trip from cart
    # TODO: Searching_second_flight — search second flight from within trip (need to search one way from cart)
    And I add the first flight to cart
    And I proceed to checkout
    And I complete the booking
    # Verify single PNR
    And I store the second booked flight number
    Then all quotes should have PNR codes
    # TODO: Verifying_single_PNR — verify both quotes share the same PNR code
    And I successfully cancel the trip
