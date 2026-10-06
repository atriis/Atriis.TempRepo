# Test Name: 86246 Galileo ACH - Selected 20kg bags on a Ryanair round trip are priced and the flight number is sent unpadded
# Status: Active
# Labels: Regression,Flights,Galileo,Travelport ACH,Ryanair,Baggage
# Owner: Yael Alef
# Created: 2026-10-06

# ADO Test Case ID: 86246
# Source: ADO Bug #85656 - [Flight][ACH] Selected bags are not priced and the fare silently reverts to flight only
#
# A zero-padded flight number ("0197") on an ACH AirSegment still prices the fare, but Travelport returns
# every requested bag as Offered with an empty OptionalServicesTotal and no error, so the quote silently
# fell back to the flight-only price. The padding came from GTP's results free-text filter. Fixed by TMC2
# PR 27002: ACH segments go out unpadded. The GTP filter path is manual (step 9 of the test case); this
# scenario guards the shared backend: the bags price and no padded FlightNumber is sent.
# Verified 2026-10-06 on atriis-dev.app, trip 3918234. No checkout: nothing is booked.

@ado:86246 @regression @provider:galileo @flights @ryanair @baggage @priority:high
Feature: 86246 Galileo ACH - Selected 20kg bags on a Ryanair round trip are priced and the flight number is sent unpadded
  As a corporate traveler booking a Ryanair round trip served by Travelport ACH
  I want the checked bags I select to be priced into the quote
  So that the fare never silently falls back to the flight-only price

  Scenario: 20kg bag on both legs of a Ryanair round trip is priced by Travelport ACH
    Given I am logged in as "ach@bundled.gdg" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "DUB" to "STN" with outbound in 21 days and return in 24 days
    Then flight results should be available
    When I filter airline results by "Ryanair" checkbox
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I extract the total cart summary price
    And I note the time before new payload requests are sent
    And I select the "20kg" baggage option for the "outbound" flight
    And I select the "20kg" baggage option for the "inbound" flight
    And I click the save button
    Then the baggage green icon should be visible
    When I extract the total cart summary price
    Then the extracted price at index 1 should be greater than the extracted price at index 0
    When I capture the latest "request" payload for request type "AirPriceReq" sent since the noted time from Storage
    Then the captured "request" payload for request type "AirPriceReq" should contain "BGPP20"
    And the captured "request" payload for request type "AirPriceReq" should not contain "FlightNumber=\"0"
    When I capture the latest "response" payload for request type "AirPriceReq" sent since the noted time from Storage
    Then the captured "response" payload for request type "AirPriceReq" should contain "ServiceStatus=\"Priced\""
    And the captured "response" payload for request type "AirPriceReq" should not contain "<OptionalServicesTotal />"
