# Test Name: 70438: Sabre NDC (BA) - Multi Pax, Seating mandatory for all, Cannot view seat map after seat selection
# Status: Active
# Labels: Regression,Frosch,Sabre NDC,Seating,multi pax,Flights,2026 plan 2
# Owner: Noam Miller
# Created: 2025-11-20T07:30:19Z
# Updated: 2025-11-26T05:24:31Z

@regression @flights @sabre-ndc @seating @multi-pax
Feature: 70438 Sabre NDC (BA) - Multi pax seating mandatory for all
  As a corporate traveler
  I want to select seats for all travelers on a Sabre NDC BA flight
  So that seating is mandatory and completed for all passengers

  # TODO: This test has complex seating validation that needs new DSL steps
  Scenario: Seating is mandatory for all travelers on Sabre NDC BA flight
    Given I am logged in as "corpsabrendc_reg" booking a new trip
    And I have added a random guest traveler
    # TODO: Step needed: "Given I have added a second random guest traveler"
    When I search for a round trip flight from "LHR" to "NYC"
    Then flight results should be available
    # TODO: Step needed: "Then second flight result should display NDC direct rate label"
    When I filter results by carrier "BA"
    And I click to open first pricing options
    # TODO: Step needed: "When I select the second fare from pricing options"
    When I accept Terms & Conditions
    And I hold the trip
    # TODO: Step needed: "When I add seats and validate selection mandatory for all travelers"
    # TODO: Step needed: "Then seats saved to trip should be validated"
    Then I successfully cancel the trip
