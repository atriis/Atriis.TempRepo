# Test Name: 64333 - Add FQTV to single quote when separate tickets/carriers
# Status: Active
# Labels: FQTV,Club,separate tickets,Flights,Regression,Sabre,2026 plan 2
# Owner: Noam Miller
# Created: 2025-07-09T06:05:27Z
# Updated: 2025-07-15T08:26:27Z

@regression @flights @fqtv @sabre @separate-tickets
Feature: 64333 Flights - Add FQTV to single quote with separate tickets
  As a corporate traveler
  I want to add FQTV to a single quote with separate tickets/carriers
  So that frequent flyer points are assigned correctly to each carrier

  # TODO: New user needed — multifqtv@corp.club → USER_MULTIFQTV
  # Add to .env: USER_MULTIFQTV="multifqtv@corp.club"

  Scenario: FQTV is saved for single quote with separate tickets
    Given I am logged in as "multifqtv" booking a new trip
    And I have added a random guest traveler
    When I search for a flight by schedule from "ATL" to "EWR"
    And I select flight segments by schedule
    And I handle conflicting quotes if visible
    # TODO: Step needed for "Validate FQTV can be added and saved for separate ticket carriers"
    Then I successfully cancel the trip
