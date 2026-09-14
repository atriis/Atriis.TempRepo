# Test Name: 84298 Amadeus - A fare family ladder wider than six is chunked into sequential calls
# Status: Active
# Labels: Regression,Flights,Amadeus,New Flight Flow,Branded Fares,payload,performance
# Owner: Sonia Sousa
# Created: 2026-09-07

# ADO Test Case ID: 84298
# Source: ADO US #83106 - Batch Fare_GetFareFamilyDescription requests on the Amadeus pricing
#         options screen (AC2, TR2)

@ado:84298
@regression @flights @amadeus @nff @branded-fares @payload
Feature: 84298 Amadeus - Fare families beyond the six-per-call cap are chunked
  As a corporate traveler opening the branded fares comparison on a wide fare ladder
  I want the families split into as few sequential calls as the supplier cap allows
  So that even the widest ladder loads without one supplier round trip per family

  # Only JFK-LAX on AA was measured above the cap (10 families); European routes topped out at 4.
  # The ladder width is asserted first so a narrowing route fails loudly instead of covering nothing.
  @priority:high
  Scenario: A ladder wider than six fare families is described in chunks capped at six
    Given I am logged in as "nff.edifactonly@amadeus.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "JFK" to "LAX"
    Then flight results should be available
    And I filter results by carrier "American Airlines"
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    And more than 6 fare families should have been described in "*Fare_GetFareFamilyDescription*" requests
    And the fare family descriptions should be batched in "*Fare_GetFareFamilyDescription*" requests of at most 6 per call
