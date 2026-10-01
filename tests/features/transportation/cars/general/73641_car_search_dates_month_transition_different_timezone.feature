# Test Name: 73641 Car - Car hire search displaying incorrect dates for different TimeZone
# Status: Active
# Labels: Regression,Cars,Transportation,Time zone
# Owner: Bruna Santos
# Created: 2026-10-01T00:00:00Z
# Updated: 2026-10-01T00:00:00Z
#
# Regression test for AB#73047: with the computer in UTC+1, a car search for 31 Jan -> 01 Feb
# showed 30 Jan -> 31 Jan on the result cards' pick-up/drop-off dates, while the info bar above the
# results still showed the searched period.
#
# The manual step "Change local TimeZone: UTC+1" is the @timezone tag below. Africa/Lagos is a fixed
# UTC+1 zone with no daylight saving, so the offset is the same whatever the month the test runs in
# (Europe/Paris would be UTC+2 in summer). It moves only the browser clock.
#
# The manual test's "31/01 to 01/02" is a fixed past date; the search picks the same shape relative
# to today instead — the last day of next month to the first day of the month after.

@regression @cars @general @timezone:Africa/Lagos
Feature: 73641 Car - Car hire search keeps the searched dates in a different time zone
  As a corporate traveler in a time zone ahead of UTC
  I want car results to show the rental period I searched for
  So that I do not book a car for the wrong days

  @priority:high
  Scenario: Car results keep a month-transition rental period for a UTC+1 viewer
    Given I am logged in as "pmac@corp.gdg" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" from the last day of next month to the first day of the following month
    Then the car info bar pickup and drop-off dates should match the search dates
    When I click location details in the car results
    Then the first car location details pickup and drop-off dates should match the search dates
