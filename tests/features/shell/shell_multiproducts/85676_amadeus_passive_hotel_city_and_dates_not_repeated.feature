# Test Name: 85676 Amadeus - Passive hotel segment does not repeat the city and dates in the free text
# Status: Active
# Labels: Regression,Amadeus,Hotel,Expedia,multiproducts,Passive Segments,Payload Validation
# Owner: Yael Alef
# Created: 2026-09-29

# ADO Test Case ID: 85676
# Source: ADO Bug #85644 - [Hotel] [Amadeus] Passive hotel segment displays the city and dates twice
#
# A Non-GDS hotel booked in the same trip as an Amadeus flight is mirrored into the Amadeus PNR as a
# passive HU segment. With Passive Hotel Format "Option 6" the free text used to open with
# "CPH 01Dec-02Dec/", repeating the city and dates Amadeus already renders from travelProduct.
# The oracle is the passive PNR_AddMultiElements request: its longFreetext must open with "HN-".
#
# EXPECTED TO FAIL FOR NOW: bug 85644 is still open, and staging still sends the repeated prefix
# (trip 3905743 on 2026-10-01: "CPH 01Jan-02Jan/HN-Clarion Hotel Copenhagen Airport/..."). The
# deferred check reports "<longFreetext>HN-" as not found. That is the bug, not a test fault; the
# test should pass once 85644 is fixed.
#
# Preconditions: office DUBU1210B (nebe@ee.com) on Passive Hotel Format = Option 6. The "/HTS-" check
# proves that layout is in force, so the test fails instead of passing vacuously on another format.
# The passive is written by a background process minutes after booking, so the scenario registers the
# check and finishes; scripts/verify-deferred-payload-checks.js verifies it once the run is over.
# The Amadeus flight stays "Finalising" after booking, so the trip is not cancelled here.

@regression @shell @multiproducts @amadeus @hotels @provider:expedia @passive @payload-validation
Feature: 85676 Amadeus - Passive hotel segment does not repeat the city and dates
  As a TMC whose mid-office interfaces the Amadeus PNR
  I want the passive hotel segment to show the city and dates once
  So that the booking passes QC without manual correction

  @priority:medium
  Scenario: Non-GDS hotel mirrored into the Amadeus PNR opens its free text with the hotel name
    Given I am logged in as "nebe@ee.com" booking a new trip
    When I search for a one way flight from "CPH" to "BOD"
    And I add the first flight to cart
    And I log the trip number from the URL
    Then the booking status should be "Pending booking"
    When I click to add a hotel to my trip from cart
    And I search for a hotel in "Copenhagen" for 1 night from the cart drawer
    And I filter hotel results by hotel name "Clarion Hotel Copenhagen Airport" or skip if unavailable
    And I select the first hotel result
    And I add a refundable room to my cart
    And I accept all Terms & Conditions on the page
    When I proceed to checkout
    And I complete the booking
    # The hotel passive is written to the Amadeus PNR by a background process minutes after booking
    Then after the run, the "request" payload for request type "Amadeus4.PNR_AddMultiElements" should contain:
      | <segmentName>HU</segmentName> |
      | /HTS-                         |
      | <longFreetext>HN-             |
