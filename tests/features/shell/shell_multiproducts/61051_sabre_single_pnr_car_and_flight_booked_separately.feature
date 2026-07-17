# Test Name: 61051 Sabre - Single PNR is created when car and flight segments are booked separately
# Description:
# Status: Active
# Labels: Sabre,Flights,Regression,Full Purchase,Cars,PNR,multiproducts,progress page,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-04-16T07:21:32Z
# Updated: 2025-09-14T10:44:30Z

@regression @shell @multiproducts @sabre @flights @cars @single_pnr @full_purchase
Feature: 61051 Sabre - Single PNR when car and flight segments are booked separately
  As a corporate traveler booking a car and a flight in the same trip
  I want both segments to share one PNR even though I book them separately
  So that my Sabre itinerary stays consolidated under a single record

  Scenario: A separately booked car and flight result in a single PNR
    Given I am logged in as "brunajuliana@sabretlcfaketest.com" booking a new trip
    And I have added a random guest traveler
    When I submit a car search at "LHR" without waiting for results
    And I select the trip purpose as "BILLABLE" and proceed
    When I add the first car to cart
    And the booking status should be "Pending booking"
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    And I wait for booking details in checkout
    When I type "2" in reference field "Only For Guest" to select the first dropdown option
    And I complete the booking
    When I click to add a flight to my trip from cart
    And I edit the flight search from "LIS" to "LON" with the same dates as the car search
    Then flight results should be available
    When I filter results by carrier "TP"
    And I add the first flight to cart
    And  the booking status should be "Pending booking"
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    And I wait for booking details in checkout
    And I complete the booking
    When I store the first quote PNR code
    And I store the second quote PNR code
    Then the stored quote PNR codes should match
