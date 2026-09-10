# Test Name: 84700 Amadeus EDIFACT - Legacy flow, search by schedule - fare family display name from the description
# Status: Draft
# Labels: Regression,Flights,Amadeus,EDIFACT,Branded Fares,Pricing Options,Legacy Flow,By Schedule
# Owner: Sonia Sousa
# Created: 2026-09-09

# ADO Test Case ID: 84700
# Source: ADO Bug #84218, US #82771 QA Test 1 (AC1/AC2/AC3). See the NFF complete-trip file in this
#         folder for why the expectation is read from the search reply rather than written here.

# Route note: ATL-JFK, not the ATL-MSP the complete-trip twin uses. By schedule, ATL-MSP returned
# no results in 3 of 5 runs on 2026-09-09; ATL-JFK passed 3 of 3 with identical fare families each
# time. Both are Delta hubs - the difference is by-schedule inventory, so keep this route unless it
# too starts coming back empty.
#
# Worth investigating, NOT a confirmed defect: one ATL-MSP run reached the assertion and failed with
# the drawer showing "Mainbasic" and "Mainclasc" while the reply carried DELTA MAIN BASIC and DELTA
# MAIN CLASSIC for those exact carrier+code pairs - the 84218 shape. It has not recurred on ATL-JFK.
# One observation, not a reproduction; recorded because it matches the bug's own note that the label
# reverted "on every option a pricing reply produced", and by-schedule prices per direction.

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
