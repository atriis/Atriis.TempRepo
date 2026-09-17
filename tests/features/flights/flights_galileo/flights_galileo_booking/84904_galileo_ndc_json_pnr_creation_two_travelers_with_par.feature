# Test Name: 84904 Galileo NDC - JSON PNR Creation - Two travelers with PAR
# Status: Active
# Labels: Flights,Galileo,Galileo NDC,Travelport,JSON Booking,PNR,payload,hold flight,multi pax
# Owner: Noam Miller
# Created: 2026-09-17

# ADO Test Case ID: 84904
# ADO workitem ID: 81830 (User Story)
#
# Story: the JSON PNR creation flow when BOTH travelers have their own Travelport profile. Only one
# profile can be moved onto a workbench, so the app moves one traveler's PAR via Host Profile Move
# and sends the other through Add Traveler as if they were a guest. This test proves both halves of
# that split reach the same workbench: a profile move carrying a PAR, and an Add Traveler call that
# Travelport accepts.
@ado:81830 @tc:84904 @regression @flights @galileo @ndc @json_booking @payload @hold @multi_pax
Feature: 84904 Galileo NDC - JSON PNR Creation - Two travelers with PAR

  As an agent booking Travelport NDC content for two travelers who both have Travelport profiles
  I want one PAR moved onto the workbench and the other traveler added alongside it
  So that the committed reservation carries both travelers

  Scenario: One traveler's profile is moved and the other is added, on one workbench
    Given I am logged in as "isabbelle@reg1.com" booking a new trip
    And I have added traveler by name "Dani Paies"
    And I have added traveler by name "Rafael Essalan"
    When I search for a one way flight from "OPO" to "LON"
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

    # Host Profile Move - the corporate BAR by BusinessTitle and ONE traveler's PAR by PersonalTitle.
    # Kept to the "REG1" suffix the reg1 profiles share rather than a specific traveler: with two
    # profiled travelers the app moves one of them, and this test does not fix which.
    When I capture the "request" payload for request type "UAPI TVP NDC Host Profile Move (JSON Booking)" from Storage
    Then in the captured "request" payload for request type "UAPI TVP NDC Host Profile Move (JSON Booking)", path "ReservationQueryClientProfileMove.ClientProfileMoveHeaderModifiers.BusinessTitle" should contain "REGRESSION1"
    And in the captured "request" payload for request type "UAPI TVP NDC Host Profile Move (JSON Booking)", path "ReservationQueryClientProfileMove.ClientProfileMoveHeaderModifiers.PersonalTitle" should contain "REG1"

    # Verify Host Profile Move - confirms the move landed on the workbench the booking is being
    # built on. Pinned to that workbench by identifier so it cannot pass on a profile move belonging
    # to some other reservation.
    When I capture the "request" payload for request type "UAPI TVP NDC Verify Host Profile Move (JSON Booking)" from Storage
    Then the captured "request" payload for request type "UAPI TVP NDC Verify Host Profile Move (JSON Booking)" should contain "{workbenchIdentifier}"

    # Add Traveler - the traveler whose profile was NOT moved is sent as a guest would be. The
    # returned traveler identifier is what proves Travelport accepted them onto the workbench, so
    # the assertion is on the response rather than on which of the two names it carries.
    When I capture the "request" payload for request type "UAPI TVP NDC Add Traveler (JSON Booking)" from Storage
    And I capture the "response" payload from the previous "request" from Storage
    Then in the captured "response" payload for request type "UAPI TVP NDC Add Traveler (JSON Booking)", path "TravelerResponse.Traveler.Identifier.value" should exist

    # Commit Booking - the reservation comes back with the 1G PNR. The response carries several
    # Locators (the TP vendor locator among them), so the block is pinned by source rather than by
    # position in the array.
    When I capture the "response" payload for request type "UAPI TVP NDC Commit Booking (JSON Booking)" from Storage
    Then the captured "response" payload for request type "UAPI TVP NDC Commit Booking (JSON Booking)" should contain "1G".block("Locator")
    And the captured "block" payload for request type "UAPI TVP NDC Commit Booking (JSON Booking)" should contain "1G".onKey("source")
    And in the captured "block" payload for request type "UAPI TVP NDC Commit Booking (JSON Booking)", path "value" should exist

    # Cleanup. The app currently refuses this cancellation - the dialog answers "Failed to cancel
    # the item" - so this step fails until that is resolved. A 30s pause before it made no
    # difference, which is what rules out the supplier still finalising the hold.
    Then I successfully cancel the trip
