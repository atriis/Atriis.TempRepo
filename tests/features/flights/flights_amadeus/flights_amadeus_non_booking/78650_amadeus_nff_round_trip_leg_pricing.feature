# Test Name: 78650 Amadeus - New Flight Flow - Round trip leg pricing: "Starting from" on outbound, delta on inbound
# Status: Active
# Labels: Regression,Flights,Amadeus,New Flight Flow,Leg Pricing

@regression @flights @amadeus @nff @leg-pricing
Feature: 78650 Amadeus - New Flight Flow - Round trip leg pricing display
  As a corporate traveler
  I want to see "Starting from" on the outbound brand card and incremental delta on the inbound brand card
  So that I can clearly understand the incremental cost of each fare option per leg

  Scenario: Round trip non-separated - outbound brand cards show "Starting from", inbound brand cards show incremental delta
    Given I am logged in as "corp.amadeus.nff@amsalem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "LON"
    Then flight results should be available
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    And the outbound leg brand cards should display full price with "Starting from" label
    When I select the outbound first option from pricing options new flight flow
    Then the flight selection footer should display a total price per traveller
    And the inbound leg brand cards should be visible
    And the inbound leg brand cards should display incremental price delta
    When I select the inbound first option from pricing options new flight flow
    Then the flight selection footer should display a total price per traveller
