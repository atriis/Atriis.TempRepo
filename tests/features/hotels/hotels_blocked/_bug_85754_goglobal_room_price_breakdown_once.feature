# Bug: ADO #85754 - [Hotel] [GoGlobal] Room page requests every offer's price breakdown twice on load
# Opening a Go Global hotel's rooms sends a PRICE_BREAKDOWN_REQUEST for every offer before any room is
# clicked, and sends each one twice (prod trip 28026008: 192 requests for 96 codes; dev trip 3905852:
# 154 for 77). Cause: IGTPHotelRuleEngine.ProcessRoomResults builds each batch as a lazy
# batch.Select(req => Task.Run(...)) and enumerates it twice (tasks.AddRange + Task.WhenAll).
# Expected: every HotelSearchCode is requested at most once.
# Paris, not Zurich: Zurich returns ~77 offers (154 requests) and downloading them all overruns the
# 120 s step timeout before the assertion runs; Paris returns a handful and still shows the duplicates.
# EXPECTED TO FAIL until 85754 is fixed - parked in hotels_blocked so the suite stays green.
# Once fixed, move it to hotels_non_booking/ as 85798_*.feature and drop @bug.
# If the fix stops pre-fetching breakdowns on load altogether, the anchor step below never sees a
# PRICE_BREAKDOWN_REQUEST; switch the scenario to clicking Price details on one room first.

# ADO Test Case ID: 85798
@ado:85798
@regression @hotels @provider:goglobal @bug:85754 @non-booking
Feature: 85798 Go Global - Opening a hotel's rooms requests each price breakdown only once

  @priority:high
  Scenario: Go Global room list does not request the same price breakdown twice
    Given I am logged in as "ggInvoice@club.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Paris" for 2 nights
    And I wait to see view rates text in results page
    And I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    And I wait until "PRICE_BREAKDOWN_REQUEST" requests have been sent for the trip
    Then every "PRICE_BREAKDOWN_REQUEST" request should reference a different "HotelSearchCode"
