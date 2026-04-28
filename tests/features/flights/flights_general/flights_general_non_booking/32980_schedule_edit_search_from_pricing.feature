# Test Name: 32980 By Schedule: Edit search from pricing page works as expected
# Status: Active
# Labels: Flights,Adding Passengers,Amadeus,Regression,No Amadeus Hotel Book,Search Flight,by schedule,67304,2026 plan 1
# Owner: Noam Miller
# Created: 2023-07-04T12:24:40Z
# Updated: 2025-09-18T11:46:52Z

@regression @flights @general @by-schedule @amadeus
Feature: 32980 By Schedule - Edit search from pricing page works as expected
  As a corporate traveler
  I want to edit search from the by-schedule pricing page
  So that I can adjust my search without starting over

  Scenario: Edit search from by-schedule pricing page
    Given I am logged in as "testim_amadeus" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "JFK" to "ATL"
    And I select flight segments by schedule
    And I wait for add to trip text to be visible
    When I click edit search and wait for the "Complete trip" search mode option
    And I change the departure location to "SEA" in the edit flight search
    And I search from the edit flight search form
    Then flight results should be available
    And flight search results should reflect the updated departure location "SEA"