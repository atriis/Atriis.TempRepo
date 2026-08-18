# Test Name: 82795 Sabre - FQTV - Always send post creation
# Status: Draft
# Labels: Regression,Flights,Sabre,FQTV,hold,payload
# Owner: Noam Miller

# ADO Test Case ID: 82795
# ADO workitem: 74585 (User Story - Sabre - FQTV - Always send post creation)
#
# Story background: Atriis used to SUPPRESS the traveler's Atriis-profile FF number whenever the
# GDS TVL profile already carried an FQTV line, on the assumption that Sabre would auto-assign
# that line into the PNR. That assumption only holds when the FF program's own airline is the one
# being booked. On a cross-accrual alliance partner Sabre does NOT auto-assign, so the traveler
# silently failed to accrue miles. The fix removes the suppression: the post-creation FQTV call
# TravelItineraryAddInfoRQ is now ALWAYS sent, regardless of the GDS profile and regardless of carrier.
#
# What this test proves: booking AA - a cross-accrual alliance partner - a TravelItineraryAddInfoRQ
# is sent post PNR creation with TravelingCarrierCode="AA", Sabre accepts it, and the AA FF line
# lands on the PNR. Without that call the traveler earns no miles on the partner carrier.

@regression @flights @sabre @fqtv @hold @payload @provider:sabre @priority:high @ado:74585 @ado:82795
Feature: 82795 Sabre - Profile FQTV is always sent post PNR creation
  As a corporate traveler whose GDS profile contains a frequent traveler and whose Atriis profile contains that same frequent traveler
  I want my Atriis profile FQTV to be sent after the PNR is created even when the GDS profile already carries an FQTV line
  So that I still accrue miles when the flight is operated by a cross-accrual partner carrier

  Scenario: FQTV is sent post creation for the partner carrier and the AA call is accepted by Sabre
    Given I am logged in as "sabreProfile@corp.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LAX" to "PHX"
    Then flight results should be available
    When I filter results by carrier "AA"
    # This account opens the pricing options drawer from the result card's "Select flight" button
    And I select the first flight result in new flight flow
    And I select the pricing option containing "MAIN CABIN FLEXIBLE"
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I hold the trip
    Then the booking status should be "ON HOLD"

    # No UI assertion here on purpose: the FQTV display in the cart is unchanged by this fix. The
    # defect and the fix both live in the PNR, which is only observable in the supplier responses.
    # TravelingCarrierCode is the carrier the miles are claimed on. Sending it as AA is the fix -
    # this is the call that was suppressed, leaving the traveler without miles on the partner flight.
    When I capture the "request" payload for request type "TravelItineraryAddInfoRQ" from Storage
    Then the captured "request" payload for request type "TravelItineraryAddInfoRQ" should contain "TravelingCarrierCode=\"AA\""

    # The response is read from the request captured above rather than from the latest call of that
    # type, so the step still proves the AA call itself succeeded if a future itinerary produces more
    # than one TravelItineraryAddInfoRQ.
    When I capture the "response" payload from the previous "request" from Storage
    Then the captured "response" payload for request type "TravelItineraryAddInfoRQ" should contain "<Success timeStamp="

    # Final proof in the PNR itself. GetReservation returns two FF lines - the QF one from the GDS
    # profile and the AA one this fix adds - so only ReceivingCarrierCode AA proves the new line.
    # Sabre accepting the call is not the same as the FQTV landing on the PNR.
    When I capture the "response" payload for request type "GetReservation" from Storage
    Then the captured "response" payload for request type "GetReservation" should contain "<ReceivingCarrierCode>AA"

    Then I successfully cancel the trip
