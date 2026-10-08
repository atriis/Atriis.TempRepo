# Test Name: 61170 Galileo and NDC passive booked in a single Pnr (when TMC permission single pnr selected)
# Status: Active
# Labels: Galileo,Gray Dawes,Single PNR,Hotel,hold flight,Regression,tmc role,Passive Pnr,Payload,2026 plan 2
# Owner: Noam Miller
# Created: 2025-04-23T01:56:45Z
# Updated: 2025-09-30T10:30:21Z
#
# The TMC has the "Single PNR For Passive PNRs" permission. A Galileo hotel is booked first, then
# an NDC flight is held on the same trip. The NDC flight keeps its own airline PNR (the one shown on
# its cart card); what must join the hotel's Galileo PNR is the flight's PASSIVE segments. They are
# written by the post-booking passive worker (PostBookingPassiveProcess), a few minutes after the
# hold, as a PassiveCreateReservationReq whose ProviderLocatorCode is the parent PNR. A new PNR
# would carry a different locator, or none.
#
# The cart cannot show this: the flight card's PNR is the airline's, so comparing the two cart PNRs
# never matches even when the merge works. The test therefore checks the passive request itself,
# and waits for it before cancelling - cancelling first stops the passive from ever being sent.
#
# The passive path covers only some NDC sources (BA, Lufthansa, Iberia, AA, AFKL, United - not TVP
# NDC). If the first SIN-ZRH result is ever not one of them, the wait step fails saying the passive
# was never logged.
#
# Verified on staging against trip 3925075: hotel PNR HNBF92, airline PNR ONTH71, passive sent
# ~4 minutes after the hold with ProviderLocatorCode="HNBF92".

# ADO Test Case ID: 61170
@ado:61170 @regression @galileo @flights @hotel @ndc @single_pnr @passive_pnr @tmc @payload
Feature: 61170 Galileo and NDC passive booked in single PNR with TMC permission

  As a TMC agent
  I want the NDC flight's passive segments to be written into the Galileo PNR of the hotel already booked
  So that the itinerary is consolidated in one PNR when the TMC permission is enabled

  Scenario: NDC flight held after a Galileo hotel booking adds its passive segments to the hotel PNR
    Given I am logged in as "corpSingle@pnr.gdg" booking a new trip
    And I have added a random guest traveler
    When I search for a hotel in "London" for 1 night close dates
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    And I store the only quote PNR code in the cart as "hotelPnr"
    And I click to add a flight to my trip from cart
    When I edit the flight search from "SIN" to "ZRH" with the same dates as the hotel search
    And flight results should be available
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I accept Terms & Conditions
    And I hold the trip
    Then the quote destination should contain "Flight to"
    When I wait up to 10 minutes until "PassiveCreateReservationReq" requests have been sent for the trip
    And I capture the "request" payload for request type "PassiveCreateReservationReq" from Storage
    Then the captured "request" payload for request type "PassiveCreateReservationReq" should contain "{hotelPnr}".onKey("ProviderLocatorCode")
    And the captured "request" payload for request type "PassiveCreateReservationReq" should contain "Air".onKey("SegmentType")
    When I capture the "response" payload for request type "PassiveCreateReservationReq" from Storage
    Then the captured "response" payload for request type "PassiveCreateReservationReq" should contain "{hotelPnr}".block("ProviderReservationInfo")
    And I attempt to cancel the trip safely
