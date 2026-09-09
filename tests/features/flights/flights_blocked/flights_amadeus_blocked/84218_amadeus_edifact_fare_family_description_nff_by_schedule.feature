# Test Name: 84218 Amadeus EDIFACT - New Flight Flow, search by schedule - fare family display name from the description
# Status: Draft
# Labels: Regression,Flights,Amadeus,EDIFACT,Branded Fares,Pricing Options,New Flight Flow,By Schedule
# Owner: Sonia Sousa
# Created: 2026-09-09

# ADO Test Case ID: TBD
# Source: ADO Bug #84218, US #82771 QA Test 1 (AC1/AC2/AC3). See
#         flights_amadeus/flights_amadeus_non_booking/84218_amadeus_edifact_fare_family_display_name_from_description.feature
#         for why the expectation is read from the search reply rather than written here.
#
# BLOCKED: the brand cards never render in this combination. "I select one flight segment by
# schedule" passes, then "the outbound leg brand cards are displayed" times out - the by-schedule
# selection does not produce the inline .flight-brand-leg nodes the New Flight Flow readers index by
# position. No feature in the repo combines a by-schedule search with any NFF brand-card step, so
# there is no working precedent to copy.
#
# Unblocking needs NEW code, deliberately not written here: a leg-agnostic page reader scoped to the
# single active brand leg, a legIndex-free branch in
# FlightResults.verifyBrandNamesMatchFareFamilyDescriptions (it currently accepts only legIndex 0 or
# 1), and a new step phrase. That is its own decision and its own test point - inventing a step
# phrase to fill the gap would produce Gherkin that resolves to nothing.
#
# WARNING - all four files in this set currently lead with 84218, which is the BUG id.
# sync-github-run-to-ado-testplan resolves a test point from the filename's LEADING id and
# deduplicates worst-outcome-wins, so one failure would stamp itself onto the other three test
# points. Four test points need four published Test Case ids; renumber all four before merging.

@blocked
@regression @flights @amadeus @edifact @branded-fares @pricing-options @by-schedule
Feature: 84218 Amadeus EDIFACT - By schedule, New Flight Flow fare family names are the airline's
  As a corporate traveler searching by schedule on an Amadeus EDIFACT itinerary
  I want each fare named the way the airline names it on its own channels
  So that the naming fix holds for the by-schedule search mode too

  # Scope: the FIRST direction only. By schedule renders one direction per brand-card visit, and the
  # existing readers index .flight-brand-leg by position, so there is no leg-agnostic name reader to
  # assert the return direction with. Covering it would need a new page reader and a new step
  # phrase, which is its own decision and its own test point - not an extra Then here.
  @priority:high
  Scenario: By schedule - every brand card is named from the search reply's description
    Given I am logged in as "nff.edifactonly@amadeus.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "ATL" to "MSP"
    Then flight results should be available
    And I filter results by carrier "Delta"
    Then flight results should be available
    When I capture the fare families described in "Amadeus4.Fare_MasterPricerTravelBoardSearch9" from Storage
    And I select one flight segment by schedule
    Then the outbound leg brand cards are displayed
    And every brand card name on the "outbound" leg should match its fare family description
