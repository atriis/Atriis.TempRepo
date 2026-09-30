# Test Name: 62471 Galileo NDC - AA - Travel Agency Details request carries the agency email
# Description: Hold an American Airlines one-way LAX-JFK with the booker as the traveler. The
# UAPI TVP NDC Travel Agency Details (JSON Booking) request must carry the email corp@toemail.ndc.
# Status: Design
# Labels: Regression,Flights,Galileo,Galileo NDC,JSON Booking,Payload,Hold
# Owner: Bruna Santos
# Created: 2026-09-30

# ADO Test Case ID: 62471
#
# The hold is clicked without asserting "On hold": the payload is the oracle, and the request is
# sent during the hold whether or not the supplier then confirms it.

@ado:62471
@regression @flights @galileo @ndc @json_booking @payload @hold-flight
Feature: 62471 Galileo NDC - Travel Agency Details request carries the agency email
  As a corporate booker holding an American Airlines NDC flight
  I want the travel agency email sent in the Travel Agency Details request
  So that the reservation is linked to the correct agency contact

  Scenario: The Travel Agency Details request carries the agency email
    Given I am logged in as "corpNDC@gdg.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LAX" to "JFK" with preferred carrier "American Airlines (AA)"
    Then flight results should be available
    When I add the first result to trip
    Then the booking status should be "Pending booking"
    When I click add payment method button
    And I select card 1 and save
    And I accept Terms & Conditions
    And I click hold flight button
    And I wait until "UAPI TVP NDC Travel Agency Details (JSON Booking)" requests have been sent for the trip
    And I capture the "request" payload for request type "UAPI TVP NDC Travel Agency Details (JSON Booking)" from Storage
    Then the captured "request" payload for request type "UAPI TVP NDC Travel Agency Details (JSON Booking)" should contain "corp@toemail.ndc"
