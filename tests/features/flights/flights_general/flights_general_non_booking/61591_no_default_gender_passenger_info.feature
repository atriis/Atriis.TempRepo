# Test Name: 61591 Passenger Info - No default gender when no title, selection mandatory
# Status: Active
# Labels: Gray Dawes,APIS,Flights,Daily Flights,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-05-04T01:56:33Z
# Updated: 2026-02-16T02:32:19Z

@regression @flights @general @apis
Feature: 61591 Flights - No default gender when no title selection mandatory
  As the system
  I want gender to not be pre-selected when no title is set
  So that travelers must explicitly select their gender

  Scenario: No default gender is set and user can add and save passenger info
    Given I am logged in as "defaultTitle@gdg.com" booking a new trip
    And I have added traveler by name "Adam"
    And I search for a round trip flight from "LHR" to "JFK"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to edit extras at index 0
    Then gender is not selected