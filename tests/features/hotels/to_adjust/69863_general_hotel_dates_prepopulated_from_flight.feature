# Test Name: 69863 hotel and flight parallel search - take the hotel dates from the selected flight
# Description: 
# Status: Active
# Labels: Regression,Parallel,Flights,Hotel,results,No Amadeus Hotel Book,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-11-06T01:25:43Z
# Updated: 2025-11-10T12:58:14Z

@regression @provider:general
Feature: 69863 General - Hotel search dates pre-filled from flight search
  As a corporate traveler
  I want to search for flights and then have hotel search dates pre-filled from flight itinerary
  So that I can quickly add a hotel to my trip without re-entering dates

  @priority:high
  Scenario: Hotel search dates are pre-populated from an existing flight search
    Given I am logged in as "shani_nl" booking a new trip
    And I have added myself as the traveler
    And I search for a round trip flight from "BKK" to "NYC" with advanced search and return date type "Arrival" and time "Anytime" and parallel hotel
    And I fill in NL reference fields education and courses
    And I wait for add to trip text to be visible
    And I extract the arrival date of the first flight
    And I extract the departure date of the second flight
    And I add the first result to trip
    And I handle conflicting quotes if visible
    And I wait to see view rates text in results page
    Then the hotel search check-in date should match the arrival date of the first flight
    And the hotel search check-out date should match the departure date of the second flight
