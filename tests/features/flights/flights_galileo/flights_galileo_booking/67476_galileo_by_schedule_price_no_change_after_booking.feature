# Test Name: 67476 Galileo - Flights - By Schedule - Price does not change after booking
# Status: Active
# Labels: Regression,Galileo,Flights,by schedule,Full Purchase,price,Cancel by process,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-23T11:08:05Z
# Updated: 2026-01-19T07:48:41Z

@regression @galileo @flights @by_schedule @pricing @full_purchase
Feature: 67476 Galileo - By schedule price does not change after booking

  As a corporate traveler
  I want the flight price to remain the same after booking
  So that there are no unexpected price changes

  Scenario: By schedule flight price matches before and after booking
    Given I am logged in as "bsgalileoflight@galileoflight.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "MAD" to "BOG"
    And I select flight segments by schedule
    And I wait for "Your Selection" text to be visible
    And I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"
    When I extract the price at index 0 from "cart"
    And I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
    When I extract the price at index 0 from "cart"
    Then the extracted price at index 0 should equal the extracted price at index 1 within tolerance
