# Test Name: Hybrid for 69676: BA NDC - Update FQTV for Pax with middle name
# Description: Parent bug 66651 — the post-hold FQTV OrderChange must find the PNR passenger and
#   send the middle name inside GivenName, otherwise BA answers "One or more passenger(s) name in
#   the request does not match with the PNR". Covers the Test Case's manual steps 11-14 as payload checks.
# Status: Active
# Labels: BA NDC Regression,Amsalem,FQTV,hold flight,Search Flight,2026 plan 2
# Owner: Noam Miller
# Created: 2025-11-02T08:44:17Z
# Updated: 2026-10-07

@regression @flights @ndc @ba @fqtv
Feature: 69676 HYBRID BA NDC - Update FQTV for traveler with middle name

  As a corporate traveler with a middle name
  I want to add a frequent flyer loyalty number to a BA NDC held booking
  So that I can verify FQTV is updated correctly for a pax with a middle name

  Scenario: FQTV added after hold sends the middle name and BA accepts it
    Given I am logged in as "baFqtv@update.ams" booking a new trip
    And I have added traveler by name "Elisabeth"
    When I search for a round trip flight from "LHR" to "LAX"
    Then flight results should be available
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    # Elisabeth Casey Smith has no phone on her profile and BA marks the consent phone required.
    When I share the contact details with the airline if requested using email "baFqtv@update.ams" and phone "44" "20" "79460000"
    And I accept Terms & Conditions
    And I hold the trip
    Then the booking status should be "On hold"
    When I capture the "request" payload for request type "OrderCreate17_2_V5" from Storage
    Then the captured "request" payload for request type "OrderCreate17_2_V5" should contain "Elisabeth Casey".onKey("GivenName")
    And the captured "request" payload for request type "OrderCreate17_2_V5" should contain "Smith".onKey("Surname")
    When I note the time before new payload requests are sent
    And I click frequent flyer in extras
    And I add loyalty number "1771177117" using airline "Alaska"
    And I should see a success notification
    And I capture the latest "request" payload for request type "OrderChange17_2_V4" sent since the noted time from Storage
    Then the captured "request" payload for request type "OrderChange17_2_V4" should contain "Elisabeth Casey".onKey("GivenName")
    And the captured "request" payload for request type "OrderChange17_2_V4" should contain "Smith".onKey("Surname")
    And the captured "request" payload for request type "OrderChange17_2_V4" should contain "1771177117".onKey("AccountNumber")
    When I capture the "response" payload from the previous "request" from Storage
    Then the captured "response" payload for request type "OrderChange17_2_V4" should not contain "does not match with the PNR"
    And the captured "response" payload for request type "OrderChange17_2_V4" should contain "<Success"
    And I successfully cancel the trip
