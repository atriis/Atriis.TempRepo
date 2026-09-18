# Test Name: 84941 Amadeus - Flight details drawer keeps its design on every screen (new flight flow)
# Status: Draft
# Labels: Regression,Flights,Amadeus,Flight details,New Flight Flow,UI,2026 plan 19
# Owner: Sonia Sousa
# Created: 2026-09-17

# ADO Test Case ID: 84941
# Source: ADO User Story #84214 - Flights OBT - Update design of Flight details drawer

# Same story as the old flow file, through the new flight flow, where the middle screen is flight
# selection with its brand cards instead of the pricing options drawer.
# Both front ends render the same component, so both have to be held to it.
#
# Route: LIS-BUD on Air France connects through CDG, so every moment that opens the drawer has a
# connection row to judge as well as the leg and flight cards. The operating airline check needs a
# real codeshare, and the only one found that renders it cannot be held - it lives in 84942.
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

@ado:84941
@regression @flights @amadeus @nff @flight-details
Feature: 84941 Amadeus - the flight details drawer keeps its design on every screen (new flight flow)
  As a corporate traveler opening flight details in the new flight flow
  I want the same panel on results, on flight selection and in the cart
  So that the itinerary I am booking reads the same way at every step

  @priority:high
  Scenario: The flight details drawer holds its design from results through to a held trip (new flight flow)
    Given I am logged in as "nff.edifactonly@amadeus.ams" booking a new trip
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
    And I select the first flight result in new flight flow
    And I click to open flight details
    Then the flight details panel should be titled "Flight Details"
    And the flight details drawer should show 2 legs in the redesigned layout
    And each stop should be shown as a connection between the flights it joins in flight details
    And the flight details drawer should show the same flights
    When I close flight details window
    And I select the outbound first option from pricing options new flight flow
    And I select the inbound first option from pricing options new flight flow
    And I add to cart from pricing options new flight flow
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
