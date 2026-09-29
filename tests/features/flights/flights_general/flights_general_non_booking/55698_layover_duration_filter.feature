# Test Name: 55698 Layover Duration Filter
# Status: Design
# Labels: Flights,results,Filters,Layover duration
# Owner: Noam Miller
# Created: 2024-12-22T05:28:34Z
# Updated: 2026-02-01T15:07:20Z

# ADO Test Case ID: 55698
# Parent: User Story #53402 - [NEW UI][FLIGHTS][SEARCH RESULTS] - Filter - Layover duration
# Related: Bug #68931 (Closed) - "limit layover duration" should be hidden when filtering on no stops only
#          Bug #72380 (Removed) - Layover filter for 2-stops not updating according to layover times

# The "Limit Layover Duration" link sits under the Stops filter and is hidden only when "No stops" is
# the sole ticked option (flight-filter.vue). The filter keeps a result when every non-zero entry of its
# layoverDuration falls inside the slider range (flight.service.ts filterByLayoverDuration). A 1-stop card
# prints its stop time; a 2-stop card does not, so its per-stop times are read from the Flight Details
# drawer and summed, matching the ADO note that the filter uses the total time of the 2 stops.

@regression @flights @filters
Feature: 55698 Layover duration filter
  As a corporate traveler
  I want to limit flight results by layover duration
  So that I only see itineraries whose connections fit the time I am willing to wait

  Scenario: Layover duration filter follows the stops filter and restricts results to the selected range
    Given I am logged in as "brunaauto@amadeusgds.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "AMS" to "NYC" with outbound in 25 days and return in 30 days
    Then flight results should be available
    When I filter results by "No stops" checkbox
    Then the Limit Layover Duration filter should not be displayed
    When I filter results by "No stops" checkbox
    And I filter results by "1 stop" checkbox
    Then the Limit Layover Duration filter should be displayed
    # Using slider, filter by layover duration -> only results meeting the filter criteria are displayed
    When I adjust the Limit Layover Duration filter from the half timepoint of the longest point
    Then only results within the Limit Layover Duration range should be displayed
    And I filter airline results by "Tap Air Portugal" checkbox
    Then all flight results should be from the selected carrier
    And only results within the Limit Layover Duration range should be displayed
    When I navigate back to flight search via breadcrumb
    And I search for a round trip flight from "BER" to "BOI" with outbound in 25 days and return in 30 days
    Then flight results should be available
    And I filter results by "2 stops" checkbox
    Then the Limit Layover Duration filter should be displayed
    And the Limit Layover Duration range should cover the total time of the 2 stops
    # Using slider, filter by layover duration -> only results meeting the filter criteria are displayed
    When I adjust the Limit Layover Duration filter from the half timepoint of the longest point
    Then only results within the Limit Layover Duration range should be displayed
