# Test Name: 84683 Galileo NDC - JSON PNR Creation - Guest traveler with BAR
# Status: Active
# Labels: Flights,Galileo,Galileo NDC,Travelport,JSON Booking,PNR,payload,hold flight,guest
# Owner: Noam Miller
# Created: 2026-09-10

# ADO Test Case ID: 84683
# ADO workitem ID: 81829 (User Story)
#
# Story: the JSON-based PNR creation flow for NDC content. The traveler has no individual
# Travelport profile, but the corporate account has a Business Account Record (BAR). The BAR is
# pulled onto the workbench via Host Profile Move (BusinessTitle set, PersonalTitle omitted), the
# guest's personal details are added manually via a separate Add Traveler call, and the workbench
# is committed. The offer attached must be the one the pricing step returned - no re-search or
# re-price substitution.
@ado:81829 @tc:84683 @regression @flights @galileo @ndc @json_booking @payload @hold @guest
Feature: 84683 Galileo NDC - JSON PNR Creation - Guest traveler with BAR

  As an agent booking Travelport NDC content for a guest traveler
  I want the corporate BAR and the manually entered guest details to reach the same workbench
  So that the committed reservation carries both, on the offer that was actually priced

  Scenario: The JSON workbench commits with the BAR, the manual traveler and the priced offer
    Given I am logged in as "isabbelle@reg1.com" booking a new trip
    And I have added a random guest traveler
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

    # Host Profile Move - pulls the corporate BAR onto the workbench by BusinessTitle. The value is
    # the BAR of the account under test, so it changes with the login.
    When I capture the "request" payload for request type "UAPI TVP NDC Host Profile Move (JSON Booking)" from Storage
    Then in the captured "request" payload for request type "UAPI TVP NDC Host Profile Move (JSON Booking)", path "ReservationQueryClientProfileMove.ClientProfileMoveHeaderModifiers.BusinessTitle" should contain "REGRESSION1"

    # The offer priced must be the offer the search returned - no re-search or re-price
    # substitution. Read the three identifiers out of the Flight Price request, then prove the
    # Flight Search response is where they came from. Asserted in that direction on purpose: the
    # search response is a large catalog whose path to the SELECTED offering depends on which one
    # the test picked, while the price request holds each identifier at a fixed path.
    When I capture the "request" payload for request type "UAPI TVP NDC Flight Price (JSON Booking)" from Storage
    And I store the value at path "OfferQueryBuildFromCatalogProductOfferings.BuildFromCatalogProductOfferingsRequest.CatalogProductOfferingsIdentifier.Identifier.value" from the captured "request" payload for request type "UAPI TVP NDC Flight Price (JSON Booking)" as "catalogProductOfferingsIdentifier"
    And I store the value at path "OfferQueryBuildFromCatalogProductOfferings.BuildFromCatalogProductOfferingsRequest.CatalogProductOfferingSelection[0].CatalogProductOfferingIdentifier.Identifier.value" from the captured "request" payload for request type "UAPI TVP NDC Flight Price (JSON Booking)" as "catalogProductOfferingIdentifier"
    And I store the value at path "OfferQueryBuildFromCatalogProductOfferings.BuildFromCatalogProductOfferingsRequest.CatalogProductOfferingSelection[0].ProductIdentifier[0].Identifier.value" from the captured "request" payload for request type "UAPI TVP NDC Flight Price (JSON Booking)" as "productIdentifier"
    When I capture the "response" payload for request type "UAPI TVP NDC Flight Search *(Flight Search)" from Storage
    Then the captured "response" payload for request type "UAPI TVP NDC Flight Search *(Flight Search)" should contain "{catalogProductOfferingsIdentifier}"
    And the captured "response" payload for request type "UAPI TVP NDC Flight Search *(Flight Search)" should contain "{catalogProductOfferingIdentifier}"
    And the captured "response" payload for request type "UAPI TVP NDC Flight Search *(Flight Search)" should contain "{productIdentifier}"

    # Add Traveler - the guest's details are entered manually, and the response returns a unique
    # traveler identifier. .split(" ") checks the given name and surname independently, which the
    # payload carries as separate PersonName.Given / PersonName.Surname fields.
    When I capture the "request" payload for request type "UAPI TVP NDC Add Traveler (JSON Booking)" from Storage
    Then the captured "request" payload for request type "UAPI TVP NDC Add Traveler (JSON Booking)" should contain "{lastAddedGuestName}".split(" ")
    When I capture the "response" payload from the previous "request" from Storage
    Then in the captured "response" payload for request type "UAPI TVP NDC Add Traveler (JSON Booking)", path "TravelerResponse.Traveler.Identifier.value" should exist

    # Commit Booking - the reservation comes back with the 1G PNR. The response carries several
    # Locators (the TP vendor locator among them), so the block is pinned by source rather than by
    # position in the array.
    When I capture the "response" payload for request type "UAPI TVP NDC Commit Booking (JSON Booking)" from Storage
    Then the captured "response" payload for request type "UAPI TVP NDC Commit Booking (JSON Booking)" should contain "1G".block("Locator")
    And the captured "block" payload for request type "UAPI TVP NDC Commit Booking (JSON Booking)" should contain "1G".onKey("source")
    And in the captured "block" payload for request type "UAPI TVP NDC Commit Booking (JSON Booking)", path "value" should exist

    Then I successfully cancel the trip
