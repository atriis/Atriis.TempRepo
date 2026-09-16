# Test Name: 28992 When changed time zone, the search dates match the flight dates
# Status: Active
# Labels: Regression,Flights,Time zone,2026 plan 1
# Owner: Bruna Santos
# Created: 2026-09-16T00:00:00Z
# Updated: 2026-09-16T00:00:00Z
#
# The manual test opens with "On your computer, change your time zone to Eastern Time". That step
# is the @timezone tag below: it opens the browser context in America/New_York, which moves the
# browser clock (Date, getTimezoneOffset, Intl) without touching the runner's own time zone, so
# the scenario is safe to run alongside every other one in the same worker.
#
# LON -> JFK is deliberate. The defect only shows for a viewer WEST of the departure point, and an
# Eastern-Time viewer is five hours west of a London departure — the widest gap the routes file
# offers on a heavily-served route. A same-continent route could pass while still broken.
#
# The manual test's "17-24 May" is a fixed past date; the search here uses the framework's default
# relative dates so the scenario keeps working, and the assertions compare what the details drawer
# renders against what the results card showed rather than against a hardcoded date.

@regression @flights @general @timezone:America/New_York
Feature: 28992 Flights - Search dates match the flight dates in a changed time zone
  As a corporate traveler in a time zone behind my departure airport
  I want flight details to show the dates I searched for, at the times the results promised
  So that I do not book a flight a day away from the one I intended

  Scenario: Flight details dates match the searched dates for an Eastern Time viewer
    Given I am logged in as "brunasantosnl@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "JFK"
    And flight results should be available
    # Captures, from the FIRST result card, one entry per leg (outbound then inbound): the departure
    # time, the departure date and the arrival time as raw card text. The two comparison steps below
    # hold the flight details drawer to these values, leg by leg, so both legs are covered. The
    # arrival date is not captured because the card marks a next-day arrival as "+1" on the time.
    And I store the first flight result legs for later comparison
    And I click to open flight details
    And the flight details dates should match the results dates
    And the flight details departure and arrival times should match the results times
