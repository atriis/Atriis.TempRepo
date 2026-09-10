# Test Name: 84218 Amadeus EDIFACT - New Flight Flow, search by schedule - fare family display name from the description
# Status: Draft
# Labels: Regression,Flights,Amadeus,EDIFACT,Branded Fares,Pricing Options,New Flight Flow,By Schedule
# Owner: Sonia Sousa
# Created: 2026-09-09

# ADO Test Case ID: none - held back on purpose. The other three test points are TC 84698, 84699
#         and 84700; publishing this one would put a permanently failing Automated test in a
#         regression plan. Publish it once the defect below is fixed.
# Source: ADO Bug #84218, US #82771 QA Test 1. See 84698 in this folder for why the expectation is
#         read from the search reply rather than written here.

# BLOCKED BY AN OPEN PRODUCT DEFECT - the test is correct, the app is not. A bug still needs raising.
# Reproduced 5 of 5 (ATL-JFK, Delta, nff.edifactonly@amadeus.ams): every brand card shows the filed
# code where a description exists, e.g. Mainbasic / Mainclasc against DL|MAINBASIC "DELTA MAIN BASIC"
# and DL|MAINCLASC "DELTA MAIN CLASSIC". Checked per occurrence, not per merged family: trip 3850285
# had 11 familyInformation nodes and zero without a description, so the AC3/R2 fallback cannot
# explain it. "Mainextra" is absent from the reply entirely, so it is not judgeable and is not
# flagged. The same account and carrier in complete trip (TC 84698) shows the descriptions
# correctly, which isolates it to the search mode.

@ado:84218
@blocked
@regression @flights @amadeus @edifact @branded-fares @pricing-options @by-schedule
Feature: 84218 Amadeus EDIFACT - By schedule, New Flight Flow fare family names are the airline's
  As a corporate traveler searching by schedule on an Amadeus EDIFACT itinerary
  I want each fare named the way the airline names it on its own channels
  So that the naming fix holds for the by-schedule search mode too

  # A by-schedule search is always a round trip, and no fare screen exists until BOTH segments are
  # selected: the list re-renders for leg 2 after the first pick. The carrier is filtered once per
  # leg because that re-render drops the filter.
  #
  # Scope is the first direction only - the return one needs a leg-agnostic reader, its own decision.
  @priority:high
  Scenario: By schedule - every brand card is named from the search reply's description
    Given I am logged in as "nff.edifactonly@amadeus.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "ATL" to "JFK"
    Then flight results should be available
    And I filter results by carrier "Delta"
    Then flight results should be available
    When I capture the fare families described in "Amadeus4.Fare_MasterPricerTravelBoardSearch9" from Storage
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I filter results by carrier "Delta"
    Then flight results should be available
    And I select one flight segment by schedule
    Then the outbound leg brand cards are displayed
    And every brand card name on the "outbound" leg should match its fare family description
