# ADO Bug: #82052 - Flight number not sent to GroundScope for airport pickups
# Retest of the OBT fix (Atriis.App #407): a flight number typed without choosing an airline must be
# kept on the booking. This scenario asserts the flight number in the GetQuotesV3 response
# payload captured from Storage after booking.

# ADO Test Case ID: 85533
@ado:85533
@regression @transportation @ground_transport @provider:groundscope @full_purchase @priority:high
Feature: 85533 GroundScope - Flight number typed at search is kept on an airport pickup booking

  As a corporate traveler
  I want the flight number I enter for an airport pickup to be kept on my GroundScope booking
  So that the service partner can track my flight and dispatch the driver without contacting support

  Scenario: Flight number typed without an airline is kept on a GroundScope airport pickup booking
    Given I am logged in as "testim@groundscoupe.am" booking a new trip
    And I have added myself as the traveler
    When I search for ground transport from airport "lgw" to specific address "emirates" with flight number "BA8495"
    And I wait for add to trip text to be visible
    And I add the first result to trip
    And the booking status should be "Pending booking"
    When I add ground transport contact information
    And I add a credit card as payment method
    And I fill credit card cvv if needed
    And I proceed to checkout
    And I complete the booking
    When I capture the "request" payload for request type "GroundScopeBookingResponse" from Storage
    Then the captured "request" payload for request type "GroundScopeBookingResponse" should contain "Pickup flight: BA 8495".block("driverNotes")
    When I capture the "response" payload for request type "GroundScopeBookingDetailsResponse" from Storage
    Then the captured "response" payload for request type "GroundScopeBookingDetailsResponse" should contain "Pickup flight: BA 8495".block("driverNotes")
    When I capture the "response" payload for request type "GetQuotesV3" from Storage
    Then the captured "response" payload for request type "GetQuotesV3" should contain "8495".block("flightNumber")
    Then the captured "response" payload for request type "GetQuotesV3" should contain "BA".block("airLine")
    And I successfully cancel the trip
