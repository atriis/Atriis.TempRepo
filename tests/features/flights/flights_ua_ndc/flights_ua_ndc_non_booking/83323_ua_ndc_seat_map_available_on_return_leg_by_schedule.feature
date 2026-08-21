# Test Name: 83323 UA NDC - Seat map is available on the return leg in a by schedule search
# Description: A by schedule round trip runs one search per leg, and each leg gets its own search cache key.
# The return-leg seat map request used to be sent with the outbound leg's cache key, so the results screen
# rendered "Seating map is not available at the moment" on every return-leg card.
# Status: Active
# Labels: United,UA,UA ndc,Flights,Seating,by schedule,Regression,NDC
# Owner: Noam Miller
# Created: 2026-08-21T00:00:00Z

@ado:80198 @regression @flights @ndc @united @seating @by-schedule
Feature: 83323 UA NDC - Seat map available on the return leg in a by schedule search
  As a corporate traveler
  I want the seat map to open on the return leg of a by schedule round trip
  So that I can preview seats on both legs from the flight selection screen

  Scenario: Return leg seat map renders on the flight selection screen
    Given I am logged in as "traveler@uandc.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "EWR" to "GRR"
    Then "EWR-GRR" leg should have results available

    # Outbound leg - the leg that already worked, guards against a regression
    When I open seat map from results and verify it loads
    Then the seat map should be displayed in results
    And the seat preview only message should be visible

    When I close the seat map drawer in results

    # Return leg - the failing leg in bug 80198
    And I select one flight segment by schedule
    Then "GRR-EWR" leg should have results available
    When I open seat map from results and verify it loads
    Then the seat map should be displayed in results
    And the seat preview only message should be visible
