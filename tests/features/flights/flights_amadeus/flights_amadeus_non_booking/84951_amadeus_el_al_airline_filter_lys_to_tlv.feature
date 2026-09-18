# Test Name: 84951 Amadeus - Flights - Filters - Results are available after filtering by the EL AL airline
# Status: Active
# Labels: Regression,Flights,Amadeus,Filters
# Owner: Bruna Santos
# Created: 2026-09-18

# ADO Test Case ID: 84951

@regression @flights @amadeus @filters
Feature: 84951 Amadeus - "EL AL" airline checkbox is displayed in preferred carrier filter and works as expected
  As a corporate traveler flying from Lyon to Tel Aviv
  I want to narrow the flight results to EL AL
  So that I only see the carrier I intend to fly

  @priority:high
  Scenario: Filtering the one way results by the EL AL airline checkbox still returns flights
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LYS" to "TLV" on the 2 "sunday" of next month
    And flight results should be available
    When I filter airline results by "EL AL" checkbox
    Then flight results should be available
