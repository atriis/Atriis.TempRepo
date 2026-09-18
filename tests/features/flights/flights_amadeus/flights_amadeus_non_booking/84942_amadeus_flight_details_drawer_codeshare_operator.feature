# Test Name: 84942 Amadeus - Flight details drawer names the operating airline before the flight number
# Status: Draft
# Labels: Regression,Flights,Amadeus,Flight details,Codeshare,UI,2026 plan 19
# Owner: Sonia Sousa
# Created: 2026-09-17

# ADO Test Case ID: 84942
# Source: ADO Bug #84760 - OBT - Flight details drawer - Flight Details Displays Flight Number Before "Operated by" Information

# The redesigned drawer printed the flight number before the "Operated by" airline. A codeshare is
# the only itinerary that names an operating airline at all - the journeys run flights operated by
# their own carrier, where the line reads "Air France AF1025" and there is nothing to order - so
# this check needs its own search. LON-YMQ filtered to DL is marketed by Delta and operated by Air
# France, the itinerary 35650 already relies on. It cannot be held (the hold returns a supplier
# error), which is why this stays a non-booking test rather than folding into 84940 and 84941.
#
# Narrow on purpose: the panel's layout and its connection rows are judged at four moments by
# 84940 and 84941, so repeating them here would only cost runtime. The title stays as the proof
# that the redesigned panel is the one open.
#
# REQUIRES the feature flag Atriis.App.OBT.IsNewFlightsBookingFlow to be enabled on the
# environment under test: with it off the app serves the previous drawer and this test fails. The
# flag is removed once the story reaches production. Nothing here reads or toggles it - the
# assertions describe the finished behaviour.
#
# Green against dev since 2026-09-17. Staging has had the flag on since 2026-09-18 but runs an
# earlier build: the cart panel is still titled "More details" (#84772) and a codeshare still
# prints the flight number before "Operated by" (#84760), so it stays red there until that build
# lands - that failure is the app's, not the test's.

@ado:84942
@regression @flights @amadeus @flight-details @codeshare
Feature: 84942 Amadeus - the flight details drawer names the operating airline before the flight number
  As a corporate traveler opening the details of a codeshare flight
  I want the airline actually operating it named before its flight number
  So that I can tell who I am flying with before reading the marketing carrier's number

  @priority:medium
  Scenario: A codeshare flight names the operating airline before its flight number
    Given I am logged in as "oldf.edifactonly@amadeus.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "YMQ"
    Then flight results should be available
    When I filter results by carrier "DL"
    And I click to open flight details
    Then the flight details panel should be titled "Flight Details"
    And the operating airline should be shown before the flight number in flight details
