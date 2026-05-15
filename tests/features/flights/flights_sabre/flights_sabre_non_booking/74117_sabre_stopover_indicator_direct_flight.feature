# Test Name: 74117 Flights - Sabre stopover indicator on direct flight results and flight details
# Status: Draft
# Labels: Regression,Flights,Sabre,results,Flight Details,2026 plan 2

@regression @flights @sabre @ado:74117
Feature: 74117 Flights - Sabre stopover indicator on direct flight results and flight details
  As a corporate traveler
  I want direct flights with hidden stops to show a stopover indicator in search results and in flight details
  So that I can identify direct-with-stop itineraries before selecting them

  Scenario Outline: Sabre flight with hidden stop shows a stopover indicator in results and flight details
    Given I am logged in as "<label>" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "JFK" to "SYD"
    And I filter results by carrier "AA7264"
    And I filter results by "No stops" checkbox
    And the filtered flight result should display a stopover indicator for flight "AA7264"
    When I click to open flight details
    Then the stopover indicator should be displayed in flight details
    And the stopover location should be displayed in flight details

    Examples:
      | label                          |
      | sabre.edifactonly.corp@tlc.com  |
      | sabre.ndconly.corp@tlc.com      |
