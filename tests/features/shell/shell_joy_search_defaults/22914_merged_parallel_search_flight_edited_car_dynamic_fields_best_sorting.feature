# Test Name: 22914 MERGED Parallel search flight with edited Car + reference and dynamic fields on search are taken from the primary traveler (booker) + best sorting explanation
# Description:
# Status: Active
# Labels: Parallel,Flights,Cars,Regression,No Amadeus Hotel Book,Dynamic fields,Reference Fields,NL government,Search Flight,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-12-21T11:33:53Z
# Updated: 2026-02-10T05:14:42Z

@regression @shell @parallel-search @flights @cars @dynamic-fields
Feature: 22914 Shell - Parallel search flight with edited car, booker reference fields and best sorting explanation
  As a corporate traveler (NL government) using parallel flight and car search
  I want the reference and dynamic fields to be taken from the primary traveler (booker) and to understand the best sorting
  So that the trip reflects the booker's fields and I can see why results are sorted as best

  Scenario: Parallel search flight with edited car validates booker reference fields and best sorting explanation
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight from "LON" to "TLV" with an edited car in "MAD"
    Then the reference fields popup should show the following labels:
      | Soort reis/Type of trip |
      | Type of traveller       |
      | Location travel policy  |
      | Personnel number        |
    And the reference fields should have the following values:
      | field                   | value     |
      | Soort reis/Type of trip | Select    |
      | Type of traveller       | Select    |
      | Location travel policy  | Caribbean |
    And the following reference fields should not be editable:
      | Type of traveller |
      | Personnel number  |
    When clicking proceed should show a mandatory field validation error
    And I select the first available option for the "Soort reis/Type of trip" reference field
    And I click proceed on the reference fields popup
    Then flight results should be available
    And the flight origin should show "London (LON)"
    And the flight destination should show "Tel Aviv       (TLV)"
    When I click edit search
    Then the flight depart and return dates should match the entered dates
    When I close the edit search drawer
    Then the best sorting explanation tooltip should be displayed
    When I add the first result to trip
    Then the parallel car modal should contain "car hire"
    When I handle conflicting quotes if visible
    Then the parallel car location should be "Madrid,Spain,(MAD)"
    When I click edit search
    Then the car pick-up and drop-off dates should match the entered dates
