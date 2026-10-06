# Test Name: 86192 Galileo ACH - Optional services bundle save on a 2-traveller round trip completes and reloads
# Status: Active
# Labels: Regression,Flights,Galileo,Travelport ACH,Ryanair,Optional Services
# Owner: Yael Alef
# Created: 2026-10-06

# ADO Test Case ID: 86192
# Source: ADO Bug #85757 - Galileo - OBT optional services save on a round trip with 2 travellers times out
#
# With TMC2.AchBundledComplimentarySeat.Enabled ON, each ACH optional-services save re-prices the quote
# at Travelport. On a round trip with 2 travellers the server needed 60-80 s after the AirPriceRsp, so the
# OBT's 60 s timeout fired ("Something went wrong") and the green icon never appeared; retries posted
# stale service ids and removed the stored bundle. Fixed by TMC2 PR 26982 (batched persistence) and
# Atriis.App PR #462 (reload after every save, one save at a time, 120 s timeout).
# Verified 2026-10-06 on atriis-dev.app: the save completes in about 15 s.
# No checkout: nothing is booked.

@ado:86192 @regression @provider:galileo @flights @ryanair @optional-services @priority:high
Feature: 86192 Galileo ACH - Optional services bundle save on a 2-traveller round trip completes and reloads
  As a corporate traveler booking a Ryanair round trip served by Travelport ACH for two travellers
  I want saving a bundle in Optional Services to complete
  So that the bundle is stored and the panel shows it after reopening instead of timing out

  Scenario: "Bundle - Regular fare" saved for 2 travellers on a Ryanair round trip completes, reloads and saves again
    Given I am logged in as "ach@bundled.gdg" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a round trip flight from "DUB" to "STN" with outbound in 21 days and return in 24 days
    Then flight results should be available
    When I filter airline results by "Ryanair" checkbox
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click optional services in extras
    And I select the "Bundle - Regular fare" optional service
    And I click the save button
    Then the optional services green icon should be visible
    When I click optional services in extras
    Then the "Bundle - Regular fare" option should be displayed in optional services
    When I click the save button
    Then the optional services green icon should be visible
