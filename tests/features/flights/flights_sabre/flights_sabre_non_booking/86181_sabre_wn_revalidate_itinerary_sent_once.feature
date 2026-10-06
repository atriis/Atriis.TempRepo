# Test Name: 86181 Sabre - WN pricing click sends each RevalidateItinerary request once (no identical copies)
# Status: Draft
# Labels: Regression,Flights,Sabre,New Flight Flow,Pricing page,Payload

# ADO Bug #85439 - [Flights][Sabre NDC] Every flight search request is sent to Sabre twice
# Fix: PR 26956 (one Sabre pricing run per OBT click) and PR 26990 (each distinct RevalidateItinerary once)
# Source system: Sabre (EDIFACT) | PCC 9NT0 | User: nffSothwest@tlg.corp (TLG, [TLG16] agreement)
# The bug: for Southwest, SabreHelperService strips FlexibleFares, the only element that tells the
# [public] / [private] / [publicparity] / no-agreement branches apart, so each branch sent the same
# RevalidateItinerary. Before the fix a WN LAS-LAX click logged 54 rows holding 36 distinct bodies
# (trip 3915700). BookingDateTime is stamped per second, so two true copies can differ only there:
# it must be ignored or the duplicates hide. AA is the non-WN control: there FlexibleFares keeps the
# variants apart and each must still be sent once.

# ADO Test Case ID: 86181
@regression @flights @sabre @nff @pricing-options @payload @priority:high @ado:85439 @ado:86181
Feature: 86181 Sabre - each RevalidateItinerary request is sent once per pricing click
  As a corporate traveller pricing a Sabre fare
  I want the pricing page to send every distinct revalidation to Sabre once
  So that the pricing page loads without paying for identical supplier calls

  Background:
    Given I am logged in as "nffSothwest@tlg.corp" booking a new trip
    And I have added myself as the traveler

  Scenario: Southwest round trip - no identical RevalidateItinerary requests
    When I search for a round trip flight from "LAS" to "LAX" with preferred carrier "Southwest Airlines"
    Then flight results should be available
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    And no two "RevalidateItinerary*" requests should have the same body ignoring "BookingDateTime"

  Scenario: Southwest by schedule - no identical RevalidateItinerary requests
    When I search for a flight by schedule from "LAS" to "LAX" with preferred carrier "Southwest Airlines"
    And I select flight segments by schedule
    Then the outbound leg brand cards are displayed
    And no two "RevalidateItinerary*" requests should have the same body ignoring "BookingDateTime"

  Scenario: American Airlines round trip - agreement variants still sent once each
    When I search for a round trip flight from "LAS" to "LAX" with preferred carrier "American Airlines"
    Then flight results should be available
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    And no two "RevalidateItinerary*" requests should have the same body ignoring "BookingDateTime"
