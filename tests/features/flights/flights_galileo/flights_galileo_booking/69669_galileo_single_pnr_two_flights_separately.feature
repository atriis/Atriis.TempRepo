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
    When I search for a one way flight from "LIS" to "DXB"
    And I add the first flight to cart
    Then the booking status should be "Pending Booking"
    And I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
    And I click to add a flight to my trip from cart
    When I edit the flight search from "LHR" to "AUH"
    And flight results should be available
    And I add the first flight to cart
    Then the quote destination should contain "Flight to"
    And I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
    And I store the first quote PNR code
    And I store the second quote PNR code
    Then the stored quote PNR codes should match
  