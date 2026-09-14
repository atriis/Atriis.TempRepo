# Test Name: 84700 Amadeus EDIFACT - Legacy flow, search by schedule - fare family display name from the description
# Status: Draft
# Labels: Regression,Flights,Amadeus,EDIFACT,Branded Fares,Pricing Options,Legacy Flow,By Schedule
# Owner: Sonia Sousa
# Created: 2026-09-09

# ADO Test Case ID: 84700
# Source: ADO Bug #84218, US #82771 QA Test 1 (AC1/AC2/AC3). See the NFF complete-trip file in this
#         folder for why the expectation is read from the search reply rather than written here.

# Route note: ATL-JFK, not the ATL-MSP its complete-trip twin uses. By schedule ATL-MSP came back
# empty in 3 of 5 runs; ATL-JFK passed 3 of 3. Keep this route unless it too starts returning
# nothing.

@ado:84700
@regression @flights @amadeus @edifact @branded-fares @pricing-options @by-schedule
Feature: 84700 Amadeus EDIFACT - By schedule, legacy flow fare family names are the airline's
  As a corporate traveler on a legacy-flow account searching by schedule
  I want each fare named the way the airline names it on its own channels
  So that the naming fix reaches the classic Pricing Options drawer in this search mode too

  # "pricing options are displayed" rather than "I wait for the outbound leg in pricing options
  # page": the latter waits on a per-leg tab that the by-schedule drawer does not render, since it
  # already shows a single direction.
  #
  # Scope: the FIRST direction only. Reaching the return direction needs the add-to-trip re-entry
  # pattern, which commits the outbound fare and would turn this non-booking test into a booking
  # one - its own decision and its own test point.
  @priority:high
  Scenario: By schedule - every fare in pricing options is named from the search reply's description
    Given I am logged in as "oldf.edifactonly@amadeus.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "ATL" to "JFK"
    Then flight results should be available
    And I filter results by carrier "Delta"
    Then flight results should be available
    When I capture the fare families described in "Amadeus4.Fare_MasterPricerTravelBoardSearch9" from Storage
    And I click to open first pricing options
    Then pricing options are displayed
    And every fare name in pricing options should match its fare family description
