# Test Name: 46237 Flights - Search by schedule - After editing a complete flight search and changing it to by schedule, by schedule results are displayed
# Status: Active
# Labels: Flights,by schedule,Regression,67304,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-20T10:58:16Z
# Updated: 2025-09-18T11:24:28Z

@regression @flights @general @by-schedule
Feature: 46237 Flights - Edit complete search to by-schedule displays schedule results
  As a corporate traveler
  I want to change my complete trip search to a by-schedule search via edit
  So that I can switch search modes without starting over

  Scenario: Changing complete search to by-schedule shows schedule results
    Given I am logged in as "ruimendes" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "TLV" to "AMS"
    And flight results should be available
    # TODO: Step needed for "Click edit search, switch to 'By schedule' radio, and search again"
    # TODO: Step needed for "Verify by-schedule results are displayed (Select button visible)"
