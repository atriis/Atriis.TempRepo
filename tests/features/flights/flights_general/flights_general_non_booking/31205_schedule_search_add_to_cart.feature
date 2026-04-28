# Test Name: 31205 By Schedule: Search and add to cart works as expected
# Status: Active
# Labels: Flights,Adding Passengers,Amadeus,Regression,No Amadeus Hotel Book,Search Flight,by schedule,67304,2026 plan 1
# Owner: Noam Miller
# Created: 2023-07-04T12:24:40Z
# Updated: 2025-10-27T05:24:10Z

@regression @flights @general @by-schedule @amadeus
Feature: 31205 By Schedule - Search and add to cart works as expected
  As a corporate traveler
  I want to search by schedule and add flights to cart
  So that I can book flights selected individually per segment

  Scenario: Search by schedule and add to cart
    Given I am logged in as "testim_amadeus" booking a new trip
    And I have added a random guest traveler
    When I search for a flight by schedule from "SFO" to "DUB"
    And I select flight segments by schedule
    And I wait for "Your Selection" text to be visible
    And I add "Your Selection" fare to trip
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"