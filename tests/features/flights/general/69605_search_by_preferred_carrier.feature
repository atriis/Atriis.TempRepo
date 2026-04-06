# Test Name: 69605: Search flights by preferred carrier
# Status: Active
# Labels: Club,Sabre,Search Flight,carrier,Complete trip,by schedule,Daily Flights,Flights,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-10-30T05:41:06Z
# Updated: 2026-02-17T08:55:24Z

@regression @flights @general @sabre @preferred-carrier
Feature: 69605 Flights - Search by preferred carrier
  As a corporate traveler
  I want to search flights by preferred carrier
  So that results are pre-filtered by my preferred airline

  Scenario: Search flights with preferred carrier filter
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "SYD" to "MEL" with preferred carrier "Qantas"
    Then flight results should be available
    And all flight results should be from airline "Qantas"
    When I click edit search and wait for the "Complete trip" search mode option
    And I search for a flight by schedule from "LAX" to "DEN" with preferred carrier "United" in the edit flight search
    Then I wait for select text to be visible
    And all flight results should be from airline "United"