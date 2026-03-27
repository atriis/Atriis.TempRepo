# Test Name: 64372 - Save correct FQTV from traveler profile when single quote with separate tickets/multiple carriers
# Status: Active
# Labels: FQTV,Club,separate tickets,Flights,Regression,Sabre,2026 plan 2
# Owner: Noam Miller
# Created: 2025-07-13T11:45:42Z
# Updated: 2025-09-14T12:52:45Z

@regression @flights @fqtv @sabre @separate-tickets
Feature: 64372 Flights - Save correct FQTV from traveler profile with separate tickets
  As a corporate traveler
  I want my FQTV from my traveler profile to be correctly saved
  So that frequent flyer points are correctly applied per carrier

  # TODO: New user needed — multifqtv@corp.club → USER_MULTIFQTV (same as 64333)

  Scenario: Correct FQTV from profile is saved for separate tickets
    Given I am logged in as "multifqtv" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "IAH" to "ATL"
    And I select flight segments by schedule
    And I handle conflicting quotes if visible
    # TODO: Step needed for "Validate FQTV from profile is correctly saved per carrier"
    Then I successfully cancel the trip
