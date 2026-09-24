# Test Name: 84947 Amadeus - Long layover is flagged on the connection it belongs to
# Status: Draft
# Labels: Regression,Flights,Amadeus,Flight details,Long layover,UI,2026 plan 19
# Owner: Sonia Sousa
# Created: 2026-09-18

# ADO Test Case ID: 84947
# Source: ADO Bug #84773 - OBT - Flight details drawer - Long Layover badge position does not
# match Figma in Flight Details panel

# The badge belongs to one connection, not to the itinerary: it is read from inside a connection
# row, and the flagged connection has to be the longest wait on screen - a badge sitting on the
# short stop would pass a check that only asked whether a badge exists somewhere.
#
# Not every itinerary waits long enough, so the test opens the first result that does instead of
# assuming the first result has one, and fails loudly if none of them do.
#
# REQUIRES the remote feature flag Atriis.App.OBT.IsFlightDetailsRedesignEnabled to be enabled
# for the test user and agency on the environment under test. It is not in the OBT
# feature-flags.<env>.json files: it is managed per user and agency in the internal Atriis app, so
# the same build can serve the redesign in one environment and not in another. With it off the app
# serves the previous drawer (no .flight-details--redesign root) and this test fails on the first
# drawer assertion. The new flight flow flag (IsNewFlightsBookingFlow) is on in every environment's
# build and needs nothing. Nothing here reads or toggles the flag - the assertions describe the
# finished behaviour.

@ado:84947
@regression @flights @amadeus @flight-details @long-layover
Feature: 84947 Amadeus - the long layover badge sits on the connection it describes
  As a corporate traveler reading a connecting itinerary
  I want the long wait flagged on the connection that is long
  So that I can tell at a glance which stop keeps me at the airport

  @priority:medium
  Scenario: The long layover badge is shown on the connection that waits
    Given I am logged in as "oldf.edifactonly@amadeus.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "BUD"
    Then flight results should be available
    When I filter results by carrier "Air France"
    And I open flight details for the first result with a long layover
    Then the flight details panel should be titled "Flight Details"
    And the long layover should be flagged on the connection it belongs to
    And each stop should be shown as a connection between the flights it joins in flight details
