# Test Name: HYBRID for 58677 Galileo - Flight - CTCE/CTCM are not being sent when "Don't share the contact details with airlines" checkbox is checked
# Status: Active
# Labels: Regression,Galileo,Flights,contact info,Full Purchase,hybrid,Checkout,progress page,Cancel by process,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-02-26T01:17:01Z
# Updated: 2026-01-19T04:03:25Z
#
# With "Don't share the contact details with airlines" checked, the booking must tell Galileo the
# traveller refused, in UniversalRecordModifyReq:
# - CTCR with FreeText "REFUSED"
# - no CTCE (email) and no CTCM (mobile)
# Formerly checked by hand in the Logger; the payload step below replaces that manual part.
# The checkbox defaults from the profile, so the scenario checks it explicitly rather than toggling it.

@regression @galileo @flights @contact_info @checkout @full-purchase @ado:58677
Feature: 58677 Galileo - Contact details not shared when checkbox checked

  As a corporate traveler
  I want my contact details not to be sent to airlines when I check the opt-out box
  So that my privacy preference is respected

  Scenario: Booking with contact details sharing refused sends CTCR and no CTCE or CTCM
    Given I am logged in as "beatrizpamplonacorp@galileo.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "BSL" to "AMS"
    And flight results should be available
    And I filter results by carrier "KLM"
    And I add the first flight to cart
    And I proceed to checkout
    And I refuse to share the contact details with airlines in checkout
    When I complete the booking
    Then the quote destination should contain "Flight to"
    When I wait until "UniversalRecordModifyReq" requests have been sent for the trip
    Then the "UniversalRecordModifyReq" request should send the contact refusal as CTCR and no CTCE or CTCM
    And I attempt to cancel the trip safely
