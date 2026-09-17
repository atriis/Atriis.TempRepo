# Test Name: 71511 Flights - Show average trip time on sort
# Description: Each quick-sort option (Best / Cheapest / Quickest) advertises the flight it would
#              surface first: its price and, beside it, the average duration of that flight's legs.
#              Average = round(sum of every leg duration in minutes / number of legs), rendered by
#              utilService.formattedTime as "13h 18m" (e.g. legs of 13h 30m and 13h 05m are 810m and
#              785m, 1595m / 2 legs = 797.5m, rounded to 798m = 13h 18m).
#              The "Average: " prefix is suppressed for by-schedule searches
#              (flight-list-sort.showAverageDuration), so this test must stay on a complete-trip search.
# Status: Draft
# Labels: Regression,UI,Flights,results,sorting
# Owner: Bruna Santos

# ADO Test Case ID: 71511
@regression @flights @general @results @sorting
Feature: 71511 - Average trip time is displayed on the quick-sort options
  As a corporate traveler comparing flight options
  I want each sort option to show the average trip time of the flight it would put first
  So that I can judge Best, Cheapest and Quickest on duration as well as on price

  @priority:medium
  Scenario: Quick-sort options show the average trip time of the flight they advertise
    Given I am logged in as "brunasantosnl@testim.com" booking a new trip
    And I have added myself as the traveler
    # Three legs keep the average visibly different from any single leg duration.
    When I search for a multi-city flight with legs "BUD-NYC" and "NYC-IAH" and "IAH-BUD"
    Then flight results should be available
    # Each tile's third line reads "Average: <h>h <m>m"; the literal prefix is what a by-schedule
    # search drops, so it is asserted rather than just the duration.
    Then the "Best" sort option should display an average trip time
    And the "Cheapest" sort option should display an average trip time
    And the "Quickest" sort option should display an average trip time
    # Results load sorted by Best, so the first card is the flight the Best tile describes: its leg
    # durations, averaged with the store's formula, must equal the tile's value.
    When I extract the average time of each flight in flight results
    Then the best average time is the average time of all legs
