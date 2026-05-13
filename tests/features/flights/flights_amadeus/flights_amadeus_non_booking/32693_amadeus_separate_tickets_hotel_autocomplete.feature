# Test Name: 32693 Amadeus - In case of two separate tickets, autocomplete is displayed for hotels
# Description:
# Status: Active
# Labels: Flights,Amadeus,Regression,No Amadeus Hotel Book,never failed,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-06-29T02:22:19Z
# Updated: 2023-06-29T03:38:52Z

@regression @flights @amadeus @separate-tickets @hotel-autocomplete
Feature: 32693 Amadeus - Separate tickets trigger hotel autocomplete
  As a corporate traveler
  I want to see hotel autocomplete pre-filled with the flight destination
  So that I can quickly add a hotel when booking separate ticket flights

  Scenario: Two separate one-way flights trigger hotel autocomplete for destination
    Given I am logged in as "brunaoliveiraamad@amad.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "BUD" to "LON"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I click to add a hotel to my trip from cart
    Then the hotel destination autocomplete should show "London,United Kingdom,(LON)"
    And the hotel search check-in and check-out dates should be filled
