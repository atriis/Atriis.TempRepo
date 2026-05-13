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

  Scenario: Correct FQTV from profile is saved for separate tickets
    Given I am logged in as "multifqtv@corp.club" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "ATL" to "EWR"
    And I filter results by carrier "DL"
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I filter results by carrier "UA"
    And I select one flight segment by schedule
    And I wait for "Your Selection" text to be visible
    And I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"
    And I click frequent flyer in extras
    Then the FQTV should show "DL - 1741551211"
    And the FQTV should show "UA - N7J91W1"
