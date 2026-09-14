# Test Name: 84296 Amadeus - Round trip fare family descriptions are batched, not one per family
# Status: Active
# Labels: Regression,Flights,Amadeus,New Flight Flow,Branded Fares,payload,performance
# Owner: Sonia Sousa
# Created: 2026-09-05

# ADO Test Case ID: 84296
# Source: ADO US #83106 - Batch Fare_GetFareFamilyDescription requests on the Amadeus pricing
#         options screen (AC1, AC2, TR2)

@ado:84296
@regression @flights @amadeus @nff @branded-fares @payload
Feature: 84296 Amadeus - Fare family descriptions are requested in batches, not one per family
  As a corporate traveler opening the branded fares comparison on an Amadeus offer
  I want every fare family on the screen described in one batched request
  So that the pricing options screen loads without one supplier round trip per fare family

  @priority:high
  Scenario: Every fare family offered on a round trip is described in batched requests
    Given I am logged in as "nff.edifactonly@amadeus.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD"
    Then flight results should be available
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    When I select the outbound first option from pricing options new flight flow
    Then the inbound leg brand cards should be visible
    And the fare family descriptions should be batched in "*Fare_GetFareFamilyDescription*" requests of at most 6 per call
