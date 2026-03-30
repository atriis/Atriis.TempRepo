# Test Name: 34382 Amadeus - Results are displayed with Pricing Options on search By Schedule
# Description:
# Status: Active
# Labels: Flights,Amadeus,Regression,No Amadeus Hotel Book,Search Flight,by schedule,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-08-10T09:17:07Z
# Updated: 2025-08-07T04:15:17Z

@regression @provider:amadeus
Feature: 34382 Amadeus - Results are displayed with Pricing Options on search By Schedule
  As a corporate traveler
  I want to search flights by schedule and see pricing options
  So that I can compare branded fare options before booking

  @priority:high
  Scenario: Search by schedule displays results with pricing options for both segments
    Given I am logged in as "bruna_nlgov" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "AMS" to "JFK"
    And I click to open first pricing options
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I wait for the change flight button to be visible
    And I click to open first pricing options
    And I select the first option from pricing options
    And I add to trip from pricing options
    Then flight results should be available
