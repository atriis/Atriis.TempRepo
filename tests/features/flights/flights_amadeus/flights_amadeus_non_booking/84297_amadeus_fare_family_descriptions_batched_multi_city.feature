# Test Name: 84297 Amadeus - Multi city - fare family descriptions are batched, not one per family
# Status: Active
# Labels: Regression,Flights,Amadeus,New Flight Flow,Branded Fares,Multi City,payload,performance
# Owner: Sonia Sousa
# Created: 2026-09-07

# ADO Test Case ID: 84297
# Source: ADO US #83106 - Batch Fare_GetFareFamilyDescription requests on the Amadeus pricing
#         options screen (G1, TR2)

@ado:84297
@regression @flights @amadeus @nff @branded-fares @multi-city @payload
Feature: 84297 Amadeus - Multi city fare family descriptions are requested in batches
  As a corporate traveler opening the branded fares comparison on a multi city Amadeus itinerary
  I want the fare families of each leg described in batched requests
  So that the widest itinerary type still loads without one supplier round trip per fare family

  @priority:high
  Scenario: Fare families across multi city legs are described in batched requests
    Given I am logged in as "nff.edifactonly@amadeus.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city flight with legs "LON-MAD, MAD-CDG"
    Then flight results should be available
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    And the fare family descriptions should be batched in "*Fare_GetFareFamilyDescription*" requests of at most 6 per call
