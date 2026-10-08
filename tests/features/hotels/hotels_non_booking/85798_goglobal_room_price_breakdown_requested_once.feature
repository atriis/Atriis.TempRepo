# Bug: ADO #85754 - [Hotel] [GoGlobal] Room page requests every offer's price breakdown twice on load
# Opening a Go Global hotel's rooms sends a PRICE_BREAKDOWN_REQUEST for every offer before any room is
# clicked. Before the fix each one was sent twice (prod trip 28026008: 192 requests for 96 codes; dev trip
# 3905852: 154 for 77), because IGTPHotelRuleEngine.ProcessRoomResults enumerated a lazy
# batch.Select(req => Task.Run(...)) twice. Fixed by TMC2 PR 27090 (materialised batch).
# Verified on atriis-dev.app build 7.10.9630 (2026-10-08): Paris trip 3925020 14 requests / 14 codes,
# Zurich trip 3925097 117 / 117.
# Expected: every HotelSearchCode is requested at most once.
# Paris, not Zurich: Zurich returns ~80-120 offers and reading every request body overruns the step
# timeout (and the Internal API rate limit, HTTP 429) before the assertion runs.
# If a later change stops pre-fetching breakdowns on load altogether, the anchor step below never sees a
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
