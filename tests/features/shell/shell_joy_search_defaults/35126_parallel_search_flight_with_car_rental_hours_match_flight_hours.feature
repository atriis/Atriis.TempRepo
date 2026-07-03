# Test Name: 35126 MERGED Parallel search flight with Car and rental car hours are according to the flight hours
# Description:
# Status: Active
# Labels: Cars,Parallel,Flights,Regression,No Amadeus Hotel Book,Search Flight,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-09-05T08:56:58Z
# Updated: 2025-09-14T06:32:11Z

@regression @shell @parallel-search @flights @cars
Feature: 35126 Shell - Parallel search flight with car and rental hours match flight hours
  As a corporate traveler using parallel flight and car search
  I want the rental car pick-up and drop-off hours to follow my flight hours
  So that the car booking aligns with my flight itinerary

  Scenario: Rental car hours are aligned to the flight hours after a parallel flight and car booking
    Given I am logged in as "brunasantos@nlgov.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "MUC" to "BUD" with parallel car search
    And I click proceed button if visible
    And I add the first result to trip
    And I handle conflicting quotes if visible
    Then the car results section should be displayed
    And I wait for add to trip text to be visible
    And I add the first car to cart
    And I handle conflicting quotes if visible
    And the booking status should be "Pending booking"
    And the flight quote destination should be "Flight to Budapest"
    And the car quote destination should contain "Hungary"
    And the rental car hours should match the flight hours
