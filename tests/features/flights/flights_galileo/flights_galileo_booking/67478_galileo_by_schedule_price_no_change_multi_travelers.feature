# Test Name: 67478 Galileo - Flight - By Schedule - Price does not change for Multi Travelers after booking
# Status: Active
# Labels: Regression,Galileo,multi pax,Flights,Full Purchase,price,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-23T12:20:23Z
# Updated: 2026-01-18T02:13:10Z

@regression @galileo @flights @by_schedule @pricing @multi_pax @full_purchase
Feature: 67478 Galileo - By schedule price does not change for multi travelers

  As a corporate traveler
  I want the flight price to remain the same for multiple travelers after booking
  So that multi-pax pricing is consistent

  Scenario: By schedule flight price matches before and after booking for 3 travelers
    Given I am logged in as "beatrizpamplonacorp@galileo.com" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a flight by schedule from "LON" to "DOH"
    And I select flight segments by schedule
    And I wait for "Your Selection" text to be visible
    And I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"
    When I extract the price at index 0 from "cart"
    And I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
    When I extract the price at index 0 from "cart"
    Then the extracted price at index 0 should equal the extracted price at index 1 within tolerance of 0.05

