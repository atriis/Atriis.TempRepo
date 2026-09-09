# Test Name: 84218 Amadeus EDIFACT - Legacy flow, search by schedule - fare family display name from the description
# Status: Draft
# Labels: Regression,Flights,Amadeus,EDIFACT,Branded Fares,Pricing Options,Legacy Flow,By Schedule
# Owner: Sonia Sousa
# Created: 2026-09-09

# ADO Test Case ID: TBD
# Source: ADO Bug #84218, US #82771 QA Test 1 (AC1/AC2/AC3). See the NFF complete-trip file in this
#         folder for why the expectation is read from the search reply rather than written here.
#
# WARNING - all four files in this set currently lead with 84218, which is the BUG id.
# sync-github-run-to-ado-testplan resolves a test point from the filename's LEADING id and
# deduplicates worst-outcome-wins, so one failure would stamp itself onto the other three test
# points. Four test points need four published Test Case ids; renumber all four before merging.

# NOT CI-READY - @to_adjust keeps it out of the nightly (the orchestration selects
# "not @blocked and not @to_adjust"). The scenario itself is correct and has passed, but the
# by-schedule search on ATL-MSP intermittently returns no results: over 5 runs on 2026-09-09, only 2
# reached the assertion (1 passed, 1 failed), and 3 stopped at "flight results should be available"
# with a real no-results verdict. Remove @to_adjust once a by-schedule route with dependable Delta
# inventory is found, or once the emptiness is understood.
#
# Worth investigating, NOT a confirmed defect: in the one run that reached the assertion and failed,
# the drawer showed "Mainbasic" and "Mainclasc" while the reply carried DELTA MAIN BASIC and DELTA
# MAIN CLASSIC for those exact carrier+code pairs - the 84218 shape. A re-run showed the correct
# names instead, so it is one observation, not a reproduction. It matches the bug's own note that
# the label reverted "on every option a pricing reply produced", and by-schedule prices per
# direction, which would explain a data-dependent occurrence.

@ado:84218
@to_adjust
@regression @flights @amadeus @edifact @branded-fares @pricing-options @by-schedule
Feature: 84218 Amadeus EDIFACT - By schedule, legacy flow fare family names are the airline's
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
    When I search for a flight by schedule from "ATL" to "MSP"
    Then flight results should be available
    And I filter results by carrier "Delta"
    Then flight results should be available
    When I capture the fare families described in "Amadeus4.Fare_MasterPricerTravelBoardSearch9" from Storage
    And I click to open first pricing options
    Then pricing options are displayed
    And every fare name in pricing options should match its fare family description
