# Test Name: 32687 Flight by schedule: Airports do not appear as 'undefined' in filters
# Description:
# Status: Active
# Labels: Flights,Regression,No Amadeus Hotel Book,Fit for Prod,never failed,v3,by schedule,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-06-29T01:56:42Z
# Updated: 2025-09-18T12:08:58Z

@regression @shell @flights @filters @by_schedule
Feature: 32687 Flights - Flight by schedule airports do not appear as 'undefined' in filters
  As a corporate traveler
  I want the airport filters to show real airport names after a by-schedule search
  So that airports are never displayed as 'undefined' in the flight results filters

  Scenario: Airport filters display real airport names after a by-schedule search
    Given I am logged in as "testim@prof.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "ATL" to "JNB"
    And I select one flight segment by schedule
    Then the Select Flight button should be visible in results
    And the airport filter sections "Atlanta Airports" and "Johannesburg Airports" should be visible for route "Atlanta to Johannesburg"
