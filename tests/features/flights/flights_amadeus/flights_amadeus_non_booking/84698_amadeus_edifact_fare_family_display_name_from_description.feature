# Test Name: 84698 Amadeus EDIFACT - Fare family display name comes from the description, not the filed code
# Status: Draft
# Labels: Regression,Flights,Amadeus,EDIFACT,Branded Fares,Pricing Options,New Flight Flow
# Owner: Sonia Sousa
# Created: 2026-09-09

# ADO Test Case ID: 84698
# Source: ADO Bug #84218, with US #82771 QA Test 1 (AC1/AC2/AC3). The traveller-facing fare family
#         label must come from familyInformation/description in the
#         Fare_MasterPricerTravelBoardSearch reply, not the fareFamilyname code beside it.
#         The legacy-flow half of this bug is parked under
#         flights_blocked/flights_amadeus_blocked/84218_amadeus_edifact_fare_family_display_name_old_flow.feature

@ado:84698
@regression @flights @amadeus @edifact @branded-fares @pricing-options
Feature: 84698 Amadeus EDIFACT - Fare family names are the airline's, not the filed code
  As a corporate traveler comparing Delta fare families on an Amadeus EDIFACT itinerary
  I want each fare named the way Delta names it on its own channels
  So that I can recognise what I am buying instead of reading an internal filing code

  # The expectation is read from the reply rather than written here, and that is the whole point.
  # AC3/R2 says a family the airline files WITHOUT a description must show its code Title-Cased, so
  # "Mainextra" on screen is correct in that case and a defect in the other. A fixed list of
  # forbidden codes cannot tell those apart and would report a false regression, so the capture step
  # decides per fare family. Measured on staging, one ATL-MSP reply described six families across
  # four carriers (F9, DL, AA, UA) - hence the carrier is part of the key, since a filed code is
  # unique only per airline.
  #
  # ATL-MSP: both are Delta hubs, so inventory is dense enough for a stable fare family ladder.
  # The bug's own ATL-DTW search did not reach the supplier on staging in 2 of 3 attempts.
  @priority:high
  Scenario: New flight flow - every brand card is named from the search reply's description
    Given I am logged in as "nff.edifactonly@amadeus.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "ATL" to "MSP"
    Then flight results should be available
    And I filter results by carrier "Delta"
    Then flight results should be available
    When I capture the fare families described in "Amadeus4.Fare_MasterPricerTravelBoardSearch9" from Storage
    And I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    And every brand card name on the "outbound" leg should match its fare family description
    When I select the outbound first option from pricing options new flight flow
    Then the inbound leg brand cards should be visible
    And every brand card name on the "inbound" leg should match its fare family description
