# Test Name: 84295 Amadeus - One way - fare family descriptions are batched into a single request
# Status: Active
# Labels: Regression,Flights,Amadeus,New Flight Flow,Branded Fares,payload,performance
# Owner: Sonia Sousa
# Created: 2026-09-05

# ADO Test Case ID: 84295
# Source: ADO US #83106 - Batch Fare_GetFareFamilyDescription requests on the Amadeus pricing
#         options screen (AC1, TR2)

@ado:84295
@regression @flights @amadeus @nff @branded-fares @payload
Feature: 84295 Amadeus - One way fare family descriptions are requested in one batch
  As a corporate traveler opening the branded fares comparison on a one way Amadeus offer
  I want every fare family on the screen described in one batched request
  So that the screen loads without one supplier round trip per fare family

  @priority:high
  Scenario: Every fare family on a one way itinerary is described in a single batched request
    Given I am logged in as "nff.edifactonly@amadeus.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MAD"
    Then flight results should be available
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    And the fare family descriptions should be batched in "*Fare_GetFareFamilyDescription*" requests of at most 6 per call
