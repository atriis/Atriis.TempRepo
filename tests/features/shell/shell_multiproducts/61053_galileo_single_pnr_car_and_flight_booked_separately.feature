# Test Name: 61053 Galileo - Single PNR is created when car and flight segments are booked separately
# Description:
# Status: Active
# Labels: Flights,Full Purchase,Cars,PNR,multiproducts,Galileo,Regression,progress page,Transportation,Cancel by process,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-04-16T10:04:34Z
# Updated: 2026-01-19T01:02:05Z

@regression @shell @multiproducts @galileo @flights @cars @single_pnr @full_purchase
Feature: 61053 Galileo - Single PNR when car and flight segments are booked separately
  As a corporate traveler booking a car and a flight in the same trip
  I want both segments to share one PNR even though I book them separately
  So that my Galileo itinerary stays consolidated under a single record

  Scenario: A separately booked car and flight result in a single PNR
    Given I am logged in as "beatrizpamplonacorp@galileo.com" booking a new trip
    And I have added a random guest traveler
    When I search for a car at "MXP"
    And I add the first car to cart
    And the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    When I click to add a flight to my trip from cart
    And I edit the flight search from "LIS" to "MIA" with the same dates as the car search
    Then flight results should be available
    When I filter results by carrier "TP"
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    When I store the first quote PNR code
    And I store the second quote PNR code
    Then the stored quote PNR codes should match