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

  Scenario: FQTV is saved for single quote with separate tickets
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
    And I add the following FQTV entries:
      | carrier | number     |
      | Delta   | 1741551211 |
      | United  | N7J91W1    |
    Then the booking status should be "Pending booking"
    And I click frequent flyer in extras
    Then the FQTV should show "DL - 1741551211"
    And the FQTV should show "UA - N7J91W1"
