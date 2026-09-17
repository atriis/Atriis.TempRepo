# Test Name: 84898 Galileo NDC - JSON PNR Creation - Profile traveler with BAR and PAR
# Status: Active
# Labels: Flights,Galileo,Galileo NDC,Travelport,JSON Booking,PNR,payload,hold flight,profile
# Owner: Noam Miller
# Created: 2026-09-17

# ADO Test Case ID: 84898
# ADO workitem ID: 81830 (User Story)
#
# Story: the JSON-based PNR creation flow for NDC content when the traveler DOES have an individual
# Travelport profile. Unlike the guest variant (TC 84683), no details are typed in and no separate
# Add Traveler call is sent - one Host Profile Move pulls both the corporate Business Account Record
# (BusinessTitle) and the traveler's Personal Account Record (PersonalTitle) onto the workbench, and
# a Verify Host Profile Move confirms the move landed. The offer attached must be the one the
# pricing step returned - no re-search or re-price substitution.
@ado:81830 @tc:84898 @regression @flights @galileo @ndc @json_booking @payload @hold @profile
Feature: 84898 Galileo NDC - JSON PNR Creation - Traveler with BAR and PAR

  As an agent booking Travelport NDC content for a traveler who has a Travelport profile
  I want the corporate BAR and the traveler's PAR to reach the same workbench in one profile move
  So that the committed reservation carries both, on the offer that was actually priced

  Scenario: The JSON workbench commits with the BAR, the PAR and the priced offer
    Given I am logged in as "isabbelle@reg1.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LIS" to "LON"
    And flight results should be available
    And I filter results by carrier "Tap Air Portugal"
    # This account is on the new flight flow WITHOUT the "new flight flow pricing page" role
    # permission: results show "Select flight", but it opens the CLASSIC pricing-options drawer,
    # not the brand cards. Select and add to trip exactly as in the old flow.
    When I select the first flight result in new flight flow
    And I select the first option from pricing options
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I hold the trip
    Then the quote destination should contain "Flight to"

    # Create Workbench - the response returns the workbench reservation identifier that every
    # later call in this booking is addressed to.
    When I capture the "response" payload for request type "UAPI TVP NDC Create Workbench (JSON Booking)" from Storage
    Then in the captured "response" payload for request type "UAPI TVP NDC Create Workbench (JSON Booking)", path "ReservationResponse.Reservation.Identifier.value" should exist
    And I store the value at path "ReservationResponse.Reservation.Identifier.value" from the captured "response" payload for request type "UAPI TVP NDC Create Workbench (JSON Booking)" as "workbenchIdentifier"

    # Host Profile Move - one call pulls both records onto the workbench: the corporate BAR by
    # BusinessTitle and the traveler's own PAR by PersonalTitle. PersonalTitle is what separates
    # this test from the guest variant, where it is omitted. Both values belong to the account under
    # test, so they change with the login.
    When I capture the "request" payload for request type "UAPI TVP NDC Host Profile Move (JSON Booking)" from Storage
    Then in the captured "request" payload for request type "UAPI TVP NDC Host Profile Move (JSON Booking)", path "ReservationQueryClientProfileMove.ClientProfileMoveHeaderModifiers.BusinessTitle" should contain "REGRESSION1"
    And in the captured "request" payload for request type "UAPI TVP NDC Host Profile Move (JSON Booking)", path "ReservationQueryClientProfileMove.ClientProfileMoveHeaderModifiers.PersonalTitle" should contain "ISABELLEREG1"

    # Verify Host Profile Move - sent only for a profile traveler, to confirm the move landed on the
    # workbench the booking is being built on. Pinned to that workbench by identifier so it cannot
    # pass on a profile move belonging to some other reservation.
    When I capture the "request" payload for request type "UAPI TVP NDC Verify Host Profile Move (JSON Booking)" from Storage
    Then the captured "request" payload for request type "UAPI TVP NDC Verify Host Profile Move (JSON Booking)" should contain "{workbenchIdentifier}"

    # The offer priced must be the offer the search returned - no re-search or re-price
    # substitution. Read the three identifiers out of the Flight Price request, then prove the
    # Flight Search response is where they came from. Asserted in that direction on purpose: the
    # search response is a large catalog whose path to the SELECTED offering depends on which one
    # the test picked, while the price request holds each identifier at a fixed path.
    When I capture the "request" payload for request type "UAPI TVP NDC Flight Price (JSON Booking)" from Storage
    And I store the value at path "OfferQueryBuildFromCatalogProductOfferings.BuildFromCatalogProductOfferingsRequest.CatalogProductOfferingsIdentifier.Identifier.value" from the captured "request" payload for request type "UAPI TVP NDC Flight Price (JSON Booking)" as "catalogProductOfferingsIdentifier"
    And I store the value at path "OfferQueryBuildFromCatalogProductOfferings.BuildFromCatalogProductOfferingsRequest.CatalogProductOfferingSelection[0].CatalogProductOfferingIdentifier.Identifier.value" from the captured "request" payload for request type "UAPI TVP NDC Flight Price (JSON Booking)" as "catalogProductOfferingIdentifier"
    And I store the value at path "OfferQueryBuildFromCatalogProductOfferings.BuildFromCatalogProductOfferingsRequest.CatalogProductOfferingSelection[0].ProductIdentifier[0].Identifier.value" from the captured "request" payload for request type "UAPI TVP NDC Flight Price (JSON Booking)" as "productIdentifier"
    When I capture the "response" payload for request type "UAPI TVP NDC Flight Search  (Flight Search)" from Storage
    Then the captured "response" payload for request type "UAPI TVP NDC Flight Search  (Flight Search)" should contain "{catalogProductOfferingsIdentifier}"
    And the captured "response" payload for request type "UAPI TVP NDC Flight Search  (Flight Search)" should contain "{catalogProductOfferingIdentifier}"
    And the captured "response" payload for request type "UAPI TVP NDC Flight Search  (Flight Search)" should contain "{productIdentifier}"

    # Commit Booking - the reservation comes back with the 1G PNR. The response carries several
    # Locators (the TP vendor locator among them), so the block is pinned by source rather than by
    # position in the array.
    When I capture the "response" payload for request type "UAPI TVP NDC Commit Booking (JSON Booking)" from Storage
    Then the captured "response" payload for request type "UAPI TVP NDC Commit Booking (JSON Booking)" should contain "1G".block("Locator")
    And the captured "block" payload for request type "UAPI TVP NDC Commit Booking (JSON Booking)" should contain "1G".onKey("source")
    And in the captured "block" payload for request type "UAPI TVP NDC Commit Booking (JSON Booking)", path "value" should exist

    Then I successfully cancel the trip
