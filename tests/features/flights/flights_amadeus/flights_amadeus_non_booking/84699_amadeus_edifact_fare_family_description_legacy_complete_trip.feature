# Test Name: 84699 Amadeus EDIFACT - Legacy flow, complete trip - fare family display name from the description
# Status: Draft
# Labels: Regression,Flights,Amadeus,EDIFACT,Branded Fares,Pricing Options,Legacy Flow
# Owner: Sonia Sousa
# Created: 2026-09-09

# ADO Test Case ID: 84699
# Source: ADO Bug #84218, US #82771 QA Test 1 (AC1/AC2/AC3). See the NFF complete-trip file in this
#         folder for why the expectation is read from the search reply rather than written here.
#
# WARNING - do not land while this file and the NFF one both lead with 84218. That is the BUG id,
# and sync-github-run-to-ado-testplan resolves a test point from the filename's LEADING id and
# deduplicates worst-outcome-wins, so a failure here would stamp itself onto the passing NFF test
# point. Four test points need four published Test Case ids; renumber all four before merging.

@ado:84699
@regression @flights @amadeus @edifact @branded-fares @pricing-options
Feature: 84699 Amadeus EDIFACT - Legacy flow complete trip fare family names are the airline's
  As a corporate traveler on a legacy-flow account comparing Delta fare families
  I want each fare named the way Delta names it on its own channels
  So that the naming fix reaches the classic Pricing Options drawer too

  # The classic drawer renders one leg at a time, so the assertion runs against the active leg.
  # This account needs nothing special beyond that - the same steps as the NFF twin (TC 84698).
  @priority:high
  Scenario: Legacy flow - every fare in pricing options is named from the search reply's description
    Given I am logged in as "oldf.edifactonly@amadeus.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "ATL" to "MSP"
    Then flight results should be available
    And I filter results by carrier "Delta"
    Then flight results should be available
    When I capture the fare families described in "Amadeus4.Fare_MasterPricerTravelBoardSearch9" from Storage
    And I click to open first pricing options
    And I wait for the outbound leg in pricing options page
    Then every fare name in pricing options should match its fare family description
