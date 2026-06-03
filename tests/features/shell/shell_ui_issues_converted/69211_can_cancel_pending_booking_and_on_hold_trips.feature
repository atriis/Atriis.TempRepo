# Test Name: 69211 Can cancel 'Pending Booking' and 'On Hold' trips
# Description:
# Status: Active
# Labels: Regression,general,hold flight,trip cancelation,Full Purchase,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-23T10:10:50Z
# Updated: 2025-10-23T10:45:30Z

@regression @shell @flights @hold-flight @trip-cancelation
Feature: 69211 - Can cancel 'Pending Booking' and 'On Hold' trips
  As a corporate travel booker
  I want to be able to cancel a trip that is in 'Pending Booking' status and a trip that is 'On Hold'
  So that I can correct mistakes or change plans at both stages of the booking lifecycle

  Scenario: Cancel a Pending Booking trip and then cancel an On Hold trip
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MAD"
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    And I successfully cancel the trip
    When I click to add a flight to my trip from cart
    And I have added myself as the traveler
    And I search for a one way flight from "LIS" to "VIE"
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I hold the trip
    Then I successfully cancel the trip
