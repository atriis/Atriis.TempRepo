# Test Name: 62109 - Search by schedule - Filters in results page updated according to displayed leg
# Description:
# Status: Active
# Labels: by schedule,Amadeus,multi city,Filters,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-05-15T08:54:12Z
# Updated: 2025-11-25T02:03:15Z

@regression @flights @provider:amadeus @by-schedule @multi-city @filters
Feature: 62109 - Search by schedule filters in results page updated according to displayed leg
  As a corporate traveler searching by schedule
  I want the results-page filters to reflect the leg that is currently displayed
  So that every leg of the itinerary is filtered on its own flights

  @priority:high
  Scenario: Filters follow the displayed leg in a by-schedule round trip search
    Given I am logged in as "brunasantosnl@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "CPH" to "SEA"
    And I wait for select text to be visible
    And I extract the 1 price in preferred airlines "outbound" filter
    And I extract the 3 price in preferred airlines "outbound" filter
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I wait for select text to be visible
    And I extract the 1 price in preferred airlines "inbound" filter
    And I extract the 3 price in preferred airlines "inbound" filter
    Then prices in outbound results and return results filters filters are not same

  @priority:high
  Scenario: Filters follow the displayed leg in a by-schedule multi-city search
    Given I am logged in as "brunasantosnl@testim.com" booking a new trip
    And I have added myself as the traveler
    And I search for a multi-city by-schedule flight with legs "CPH-SEA, LAX-CPH"
    And I wait for select text to be visible
    And I extract the 1 price in preferred airlines "outbound" filter
    And I extract the 3 price in preferred airlines "outbound" filter
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I wait for select text to be visible
    And I extract the 1 price in preferred airlines "inbound" filter
    And I extract the 3 price in preferred airlines "inbound" filter
    Then prices in outbound results and return results filters filters are not same 
