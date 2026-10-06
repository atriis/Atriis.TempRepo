# Test Name: 86240 Trips - Travel date 'Next 7 days' lists trips departing in the window even when they return after it
# Description: Regression test for bug 85818. The Trip Monitor travel-date range matches on the
#   trip's departure only: a trip that starts inside the range is listed no matter when it ends,
#   and one that started before the range is not, even if it ends inside it (Celine Boulay,
#   2026-10-06). Before the fix, "Next 7 days" dropped every trip ending after day 7.
# Status: Active
# Labels: Regression,Trips,Filters,2026 plan 20
#
# Each scenario notes the view's trips under "Any Time" (id + the dates on the card), applies
# the preset, and requires the list to be exactly the noted trips whose card start date falls
# in the preset's days. The window is computed from the browser's today. Past trips is left
# out: that view re-fetches from the server for a range, so its "Any Time" list is not the
# source the range is applied to.
#
# The "end after the window" checks need a jskrl@jskrl.com trip that starts inside the window
# and ends after it. On 2026-10-06 Upcoming had six for Next 7 days (e.g. 3794324, 09-31 Oct).
# When they age out that step fails with a test-data message; the exact-list checks still hold.

@regression @shell @trips
Feature: 86240 - Trips travel date presets list trips by their start date

  Scenario: Upcoming trips - Next 7 days and Next 30 days list every trip starting in the window, however long it lasts
    Given I am logged in as "jskrl@jskrl.com"
    When I navigate to the trips page
    And I select the "Upcoming trips" quick view on the trips page
    And I note every trip listed on the trips page
    And I set the trips travel date to "Next 7 days"
    Then the trips page should list exactly the noted trips that start within "Next 7 days"
    And at least one listed trip should end after the "Next 7 days" window
    When I set the trips travel date to "Next 30 days"
    Then the trips page should list exactly the noted trips that start within "Next 30 days"

  Scenario: In travel trips - Last 30 days lists trips that started in the window and have not ended
    Given I am logged in as "jskrl@jskrl.com"
    When I navigate to the trips page
    And I select the "In travel trips" quick view on the trips page
    And I note every trip listed on the trips page
    And I set the trips travel date to "Last 30 days"
    Then the trips page should list exactly the noted trips that start within "Last 30 days"
    And at least one listed trip should end after the "Last 30 days" window
