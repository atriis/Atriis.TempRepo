# Test Name: 65427 Amadeus - Time Frame Filter - Flights matching criteria are displayed
# Status: Active
# Labels: Regression,Amadeus,Flights,time frame,carrier filter
# Owner: Noam Miller
# Created: 2026-06-30

# ADO Test Case ID: 80191
@ado:80191
@regression @priority:medium @provider:amadeus @flights @time_frame
Feature: 80191 Amadeus - Flights matching time frame search criteria are displayed in results
  As a corporate traveler
  I want to search for flights filtered by time frame and carrier
  So that only flights meeting my search criteria are displayed in results

  Scenario: Flights matching afternoon time frame and carrier filter are displayed
    Given I am logged in as "timeFrame@ama.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "BRU" to "BCN" without clicking search button
    And I select time frame "afternoon" for both legs
    And I click the search button
    And I filter results by carrier "VY"
    Then flight results should be available
    And the displayed results departure times match the selected time frame
