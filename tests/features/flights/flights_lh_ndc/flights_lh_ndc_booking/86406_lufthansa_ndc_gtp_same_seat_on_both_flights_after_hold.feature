# Test Name: 86406 Lufthansa NDC - GTP - The same seat on both flights of a held round trip saves on both flights
# Status: Active
# Labels: Regression,Flights,NDC,Lufthansa NDC Regression,Seating,GTP,Hold
# Owner: Yael Alef
# Created: 2026-10-08

# ADO Test Case ID: 86406
# Source: ADO Bug #84961 - Lufthansa NDC: seat save fails when the same seat is chosen on both legs
#
# After booking, GTP's seat popup numbers its flight tabs 1, 2 while the booked quote's legs carry
# the PNR element numbers 2, 3, so the return tab resolved to the OUTBOUND leg. Picking the same
# seat on both flights then sent two seats with one segment number, FareLogixSaveSeatsEngineBase
# threw "An item with the same key has already been added" and nothing was saved (PR 27089).
# The oracles: the browser sends the seat once per flight on different segments, the server
# answers success for each, and the cart no longer reads "No Seats".
#
# Post-booking only: the pending-booking cart never reaches the failing code, so the trip is HELD
# (not completed — this user tickets on Complete booking) and cancelled at the end. The seats are
# paid (EUR 12-36 on dev) but nothing is charged before ticketing.
# The agent works in a separate legacy GTP context: needs LEGACY_GTP_BASEURL (dev: https://3.gtp-staging.com).

@ado:86406
@regression @flights @ndc @lufthansa @seating @hold @gtp @priority:high @provider:lufthansa
Feature: 86406 Lufthansa NDC - GTP - The same seat on both flights of a held round trip saves on both flights

  As a TMC agent
  I want to give a traveller the same seat number on the outbound and the return flight after booking
  So that both seats are reserved instead of the whole save failing

  Scenario: Agent saves the same seat on both Brussels Air flights of a held round trip
    Given I am logged in as "claraaguiar@ndclhclara.com" booking a new trip
    And I have added myself as the traveler
    When I start intercepting the "flightSearch" API response
    And I search for a round trip flight from "BRU" to "ATH"
    Then flight results should be available
    And the intercepted response should have at least one result where "sourceSystem" is "LUFTHANSA"
    When I filter airline results by "Brussels Air" checkbox
    And I click to open first pricing options
    And I select the outbound first option from pricing options page
    And I wait for the inbound leg in pricing options page
    And I select the inbound first option from pricing options page
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
    When I share the contact details with the airline if requested using email "claraaguiar@ndclhclara.com" and phone "1" "310" "2222020"
    And I accept Terms & Conditions
    And I hold the trip
    Then the booking status should be "On hold"
    # --- agent seats the held trip in legacy GTP ---
    When I log in to legacy GTP as the agent "lhNdc@aigb.ams"
    And I open the current trip in legacy GTP as the agent
    And I start recording the seat saves in legacy GTP
    And I pick the same seat on every flight of flight quote 1 in legacy GTP
    And I save the seats in legacy GTP
    Then the legacy GTP seat save should send the picked seat on a different segment for every flight
    And the legacy GTP seat save should succeed for every flight
    And after a reload the legacy GTP seating of flight quote 1 should not be "No Seats"
    And I successfully cancel the trip
