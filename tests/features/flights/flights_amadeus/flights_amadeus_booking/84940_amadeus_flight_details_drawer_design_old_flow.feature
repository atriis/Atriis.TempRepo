# Test Name: 84940 Amadeus - Flight details drawer keeps its design on every screen (old flow)
# Status: Draft
# Labels: Regression,Flights,Amadeus,Flight details,UI,2026 plan 19
# Owner: Sonia Sousa
# Created: 2026-09-17

# ADO Test Case ID: 84940
# Source: ADO User Story #84214 - Flights OBT - Update design of Flight details drawer

# The drawer must use the same design wherever it opens: search results, pricing options and the
# cart. The bugs raised against the story and closed with it:
#   #84772 - the panel was titled "Flight details" on results and "More details" in the cart
#   #84771 - the client deadline was missing from the drawer
#   #84760 - the flight number was printed before the "Operated by" airline, covered by 84942
#
# Route: LIS-BUD on Air France connects through CDG, so every moment that opens the drawer has a
# connection row to judge as well as the leg and flight cards. The operating airline check needs a
# real codeshare, and the only one found that renders it cannot be held - it lives in 84942.
#
# REQUIRES the remote feature flag Atriis.App.OBT.IsFlightDetailsRedesignEnabled to be enabled
# for the test user and agency on the environment under test. It is not in the OBT
# feature-flags.<env>.json files: it is managed per user and agency in the internal Atriis app, so
# the same build can serve the redesign in one environment and not in another. With it off the app
# serves the previous drawer (no .flight-details--redesign root) and this test fails on the first
# drawer assertion. The new flight flow flag (IsNewFlightsBookingFlow) is on in every environment's
# build and needs nothing. Nothing here reads or toggles the flag - the assertions describe the
# finished behaviour.
#
# Green against dev since 2026-09-17. Staging has had the flag on since 2026-09-18 but runs an
# earlier build: the cart panel is still titled "More details" (#84772) and a codeshare still
# prints the flight number before "Operated by" (#84760), so it stays red there until that build
# lands - that failure is the app's, not the test's.

@ado:84940
@regression @flights @amadeus @flight-details
Feature: 84940 Amadeus - the flight details drawer keeps its design on every screen (old flow)
  As a corporate traveler opening flight details
  I want the same panel on results, in pricing options and in the cart
  So that the itinerary I am booking reads the same way at every step

  # One journey rather than four separate scenarios: the story is about the panel staying the same
  # across screens, which can only be judged by carrying what the first screen showed into the next.
  @priority:high
  Scenario: The flight details drawer holds its design from results through to a held trip (old flow)
    Given I am logged in as "oldf.edifactonly@amadeus.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "BUD"
    Then flight results should be available
    When I filter results by carrier "Air France"
    And I click to open flight details
    Then the flight details panel should be titled "Flight Details"
    And the flight details drawer should show 2 legs in the redesigned layout
    And each stop should be shown as a connection between the flights it joins in flight details
    When I store what the flight details drawer shows
    And I close flight details window
    And I click to open first pricing options
    And I open flight details from pricing options
    # Pricing options shows the leg being priced, so one leg here - and it has to be the same flight.
    Then the flight details drawer should show 1 leg in the redesigned layout
    And each stop should be shown as a connection between the flights it joins in flight details
    And the flight details drawer should show the same flights
    When I close flight details in pricing options
    And I select the outbound first option from pricing options page
    And I select the inbound first option from pricing options page
    And I add to cart from pricing options page
    Then the booking status should be "Pending booking"
    When I open flight details in cart
    Then the flight details panel should be titled "Flight Details"
    And the flight details drawer should show 2 legs in the redesigned layout
    And each stop should be shown as a connection between the flights it joins in flight details
    And the flight details drawer should show the same flights
    And the time limit hour should be displayed in flight details
    When I close the open drawer
    And I add a credit card as payment method
    And I accept Terms & Conditions
    And I hold the trip
    Then the booking status should be "On hold"
    When I open flight details in cart
    Then the flight details panel should be titled "Flight Details"
    And the flight details drawer should show 2 legs in the redesigned layout
    And each stop should be shown as a connection between the flights it joins in flight details
    And the flight details drawer should show the same flights
    And the time limit hour should be displayed in flight details
    And the PNR should be displayed in flight details
    When I close the open drawer
    Then I successfully cancel the trip
