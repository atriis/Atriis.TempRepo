# Test Name: 41771 Galileo - Flights - Corp agreement is indicated in results page and pricing options
# Status: Active
# Labels: Regression,Galileo,Filters,Agreement,Flights,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-03-13T08:48:10Z
# Updated: 2025-08-19T12:58:26Z

@regression @galileo @flights @agreement
Feature: 41771 Galileo - Corp agreement indicated in results and pricing options

  As a corporate traveler
  I want to see corporate agreement indicators in results and pricing options
  So that I can identify negotiated rates

  Scenario: Corporate agreement indicator is visible in results and pricing options
    Given I am logged in as "victorvinicius" booking a new trip
    And I have added myself as the traveler
    And I click on the flight tab and uncheck Add hotel to this trip and Add car to this trip
    When I search for a one way flight from "LAX" to "BOS"
    And flight results should be available
    And I filter results by carrier "DL"
    Then the "Agreement" indicator should be visible in results
    And I click to open first pricing options
    And the "Agreement" indicator should be visible in pricing options
