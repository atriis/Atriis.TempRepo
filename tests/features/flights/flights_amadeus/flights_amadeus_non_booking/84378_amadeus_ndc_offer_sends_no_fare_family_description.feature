# Test Name: 84378 Amadeus NDC - an NDC offer sends no Fare_GetFareFamilyDescription
# Status: Active
# Labels: Regression,Flights,Amadeus,Amadeus NDC,New Flight Flow,Branded Fares,payload
# Owner: Sonia Sousa
# Created: 2026-09-08

# ADO Test Case ID: 84378
# Source: ADO US #83106 - Batch Fare_GetFareFamilyDescription requests on the Amadeus pricing
#         options screen (TR1)

@ado:84378
@regression @flights @amadeus @amadeus-ndc @nff @branded-fares @payload
Feature: 84378 Amadeus NDC - the fare family batching does not reach NDC offers
  As a corporate traveler on a Sabre-free, NDC-only Amadeus corporate
  I want my branded fares priced through the NDC message as before
  So that batching the EDIFACT fare family request leaves NDC offers untouched

  # TR1: GetBrandDetailsBatch skips anything flagged IsNDCGDS, so an NDC offer never sends the
  # EDIFACT fare family message - its brand info comes from AMA_TravelOfferPriceRQ instead.
  @priority:medium
  Scenario: An NDC offer's brand info comes from the NDC message, not the fare family request
    Given I am logged in as "nff.ndconly@amadeus.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD"
    Then flight results should be available
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    When I wait until "*AMA_TravelOfferPriceRQ*" requests have been sent for the trip
    And I capture all the "request" types from Storage
    Then the captured "request" types do not contain request type "*Fare_GetFareFamilyDescription*"
