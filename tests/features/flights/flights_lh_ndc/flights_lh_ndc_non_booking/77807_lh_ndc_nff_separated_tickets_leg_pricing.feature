# Test Name: 77807 Lufthansa NDC - New Flight Flow - Leg pricing for separated tickets
# Status: Active
# Labels: Regression,Flights,LH NDC,New Flight Flow,Leg Pricing,Separated Tickets

@regression @flights @ndc @lufthansa @nff @leg-pricing @separated-tickets
Feature: 77807 Lufthansa NDC - New Flight Flow - Leg pricing display for separated tickets
  As a corporate traveler booking separated tickets via LH NDC
  I want to see "Starting from" on the first leg brand card and incremental delta on inbound leg
  So that I can clearly understand the incremental cost of each fare per leg

  Scenario: Round trip separated tickets - outbound shows "Starting from", inbound shows delta
    Given I am logged in as "corp.lhndc.nff@amsalem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "FRA"
    Then flight results should be available
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    And the separated tickets indication is displayed in pricing options view
    And the outbound leg brand cards should display full price with "Starting from" label
    When I select the outbound first option from pricing options new flight flow
    Then the flight selection footer should display a total price per traveller
    And the inbound leg brand cards should be visible
    And the inbound leg brand cards should display incremental price delta
    When I select the inbound first option from pricing options new flight flow
    Then the flight selection footer should display a total price per traveller
