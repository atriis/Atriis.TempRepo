# Test Name: Bug 85643 - LH NDC - API V1 - Paid seat chosen from a seat map fetched before the trip exists is booked as chargeable
# Description: The Amsalem website books through the public API V1 and fetches the seat map with
# TripId 0, before the trip exists. Before #85643 the seat price was cached under a pseudo-trip that
# the hold never read, so a paid Lufthansa-group seat reached the airline as a free assignment
# (PNRCreateRQ Seat with no OptionalServices / PricingInfo) and no seat EMD followed.
# Status: Design
# Labels: Regression,Flights,NDC,Lufthansa NDC Regression,API V1,Seats,Payload,Hold
# Owner: Yael Alef
# Created: 2026-10-05

# ADO Test Case ID: 85902
#
# How the flow is driven: api/v1/flightsearch returns no results on atriis-dev.app, so the flight is
# found through the app search (its packages land in the same cache V1 reads). Every call after the
# search - seat map with TripId 0, pricing that creates the trip, hold - goes through the public API V1
# with the logged-in user's token, exactly as the website calls it.
# Passed manually on 2026-10-05: trip 3915758, PNR OWOL41 (seat 9C, 0B5 Surcharge EUR 21.00).

@ado:85902
@regression @flights @ndc @lufthansa @provider:lufthansa @api-v1 @seats @payload @hold-flight @priority:high
Feature: 85902 Lufthansa NDC - API V1 paid seat from a seat map fetched before the trip exists is chargeable
  As a website customer booking through the public API
  I want the paid seat I picked to be booked as a chargeable seat
  So that the airline charges the seat and issues its EMD instead of confirming it for free

  Scenario: A paid seat chosen before the trip exists reaches the airline as a chargeable service
    Given I am logged in as "lhNdcpax@corp.ams" booking a new trip
    And I have added myself as the traveler
    And I start recording the app traffic for API V1
    When I search for a one way flight from "LHR" to "VIE"
    Then flight results should be available
    When I select the first "OS" flight from the recorded search for API V1
    And I request the API V1 seat map for the selected flight before any trip exists
    Then the API V1 seat map should offer an available paid seat
    When I price the selected flight through API V1 creating a new trip
    And I hold the API V1 trip with the selected paid seat for the first passenger
    Then the API V1 hold should return a PNR
    When I wait until "PNRCreateRQ Seat" requests have been sent for the trip
    And I capture the "request" payload for request type "PNRCreateRQ Seat" from Storage
    Then the captured "request" payload for request type "PNRCreateRQ Seat" should contain "<SeatLocation>{apiV1SeatLocation}</SeatLocation>"
    And the captured "request" payload for request type "PNRCreateRQ Seat" should contain "<OptionalServices>"
    And the captured "request" payload for request type "PNRCreateRQ Seat" should contain 'Type="Surcharge"'
    And the captured "request" payload for request type "PNRCreateRQ Seat" should contain 'PriceServicesOnly="Y"'
    When I capture the "response" payload for request type "PNRCreateRQ Seat" from Storage
    Then the captured "response" payload for request type "PNRCreateRQ Seat" should not contain "Invalid TravelerIDRef"
    And the captured "response" payload for request type "PNRCreateRQ Seat" should contain "<SeatStatus>HK</SeatStatus>"
    When I open the API V1 trip in the app
    Then I successfully cancel the trip
