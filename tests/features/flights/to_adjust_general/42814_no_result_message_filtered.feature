# Test Name: 42814 No result message for filtered flights
# Status: Active
# Labels: Flights,Adding Passengers,Amadeus,Regression,No Amadeus Hotel Book,2026 plan 1
# Owner: pini harush
# Created: 2024-02-26T06:11:34Z
# Updated: 2024-02-26T06:22:07Z

@regression @flights @general @filters
Feature: 42814 Flights - No result message for filtered flights
  As a corporate traveler
  I want to see a clear message when my filter returns no results
  So that I know to reset filters or edit my search

  Scenario: No results message and reset filters button are displayed
    Given I am logged in as "testim_amadeus" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MAD"
    And I filter results by carrier "hjklp"
    # TODO: Step needed for "Verify 'No results found' message is displayed"
    # TODO: Step needed for "Verify 'Reset Filters' and 'Edit search' buttons are visible"
    # TODO: Step needed for "Click Reset Filters and verify results are restored"
