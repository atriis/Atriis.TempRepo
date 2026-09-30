# Test Name: 85681 Lufthansa NDC - CLID sent in a single PNRCreate request
# Description: Hold a Lufthansa one-way LON-FRA with the booker as the traveler. The PNRCreate
# request must carry the Lufthansa CLID 1CF05BA, and only one PNRCreate request may be sent.
# Status: Design
# Labels: Regression,Flights,NDC,Lufthansa NDC Regression,CLID,Payload,Hold
# Owner: Noam Miller
# Created: 2026-09-30

# ADO Test Case ID: 85681
#
# The hold itself fails on the test environment (supplier limitation), so this scenario does not
# assert "On hold". The payload is the oracle: the request is sent before the supplier rejects it.
# No cancel step - there is nothing on hold to cancel, and the quote expires on its own.

@ado:85681
@regression @flights @ndc @lufthansa @provider:lufthansa @clid @payload @hold-flight @priority:high
Feature: 85681 Lufthansa NDC - CLID sent in a single PNRCreate request
  As a corporate booker holding a Lufthansa flight
  I want the corporate CLID sent once in the PNR create request
  So that the booking is linked to the negotiated corporate account with the airline

  Scenario: The Lufthansa PNRCreate request carries the CLID and is sent only once
    Given I am logged in as "will@lh.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "FRA"
    Then flight results should be available
    When I filter results by carrier "Lufthansa"
    And I add the first result to trip
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I click hold flight button
    And I wait until "PNRCreate" requests have been sent for the trip
    And I capture the "request" payload for request type "PNRCreate" from Storage
    Then the captured "request" payload for request type "PNRCreate" should contain "1CF05BA"
    And exactly 1 "PNRCreate" requests should have been sent
