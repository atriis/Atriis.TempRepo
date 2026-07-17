# Test Name: 58356 Amadeus - Single PNR is created when car and flight segments are booked separately
# Description:
# Status: Active
# Labels: Amadeus,Regression,PNR,Flights,multiproducts,Full Purchase,Cars,progress page,Transportation,Cancel by process,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-02-14T08:38:20Z
# Updated: 2026-01-19T07:45:43Z

@regression @shell @multiproducts @amadeus @flights @cars @single_pnr @full_purchase
Feature: 58356 Amadeus - Single PNR when car and flight segments are booked separately
  As a corporate traveler booking a car and a flight in the same trip
  I want both segments to share one PNR even though I book them separately
  So that my Amadeus itinerary stays consolidated under a single record

  Scenario: A separately booked car and flight result in a single PNR
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added a random guest traveler
    When I search for a car at "LHR"
    Then the car results section should be displayed
    When I add the first car to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    When I click to add a flight to my trip from cart
    And I edit the flight search from "LIS" to "LON"
    Then flight results should be available
    When I filter results by carrier "TP"
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    When I store the first quote PNR code
    And I store the second quote PNR code
    Then the stored quote PNR codes should match
    And I successfully cancel the trip
