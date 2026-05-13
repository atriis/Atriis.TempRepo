# Test Name: 35650 Amadeus - Codeshare flights are displayed
# Description:
# Status: Active
# Labels: Regression,Flights,No Amadeus Hotel Book,Amadeus,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-09-08T09:11:19Z
# Updated: 2025-02-03T09:10:37Z

@regression @provider:amadeus
Feature: 35650 Amadeus - Codeshare flights are displayed
  As a corporate traveler
  I want to see codeshare flight information in results
  So that I can identify flights operated by a different carrier

  @priority:high
  Scenario: Codeshare "Operated by" text is displayed in results and flight details
    Given I am logged in as "testim@prof.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "AMS" to "YMQ"
    And flight results should be available
    And I filter results by carrier "DL"
    Then the "Operated by" text should be visible in the flight results
    When I click to open flight details
    Then the "Operated by" text should be visible in flight details
