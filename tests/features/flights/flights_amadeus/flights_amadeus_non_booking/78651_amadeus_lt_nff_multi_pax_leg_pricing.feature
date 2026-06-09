# Test Name: 78651 Amadeus Light Ticketing - New Flight Flow - Multi pax: outbound full price, inbound visible, footer shows total per traveller
# Status: Active
# Labels: Regression,Flights,Amadeus Light Ticketing,New Flight Flow,Leg Pricing,Multi Pax

@regression @flights @amadeus @nff @leg-pricing @multi-pax
Feature: 78651 Amadeus Light Ticketing - New Flight Flow - Multi pax round trip leg pricing display
  As a corporate traveler booking for multiple passengers
  I want to see "Starting from" on the outbound brand card and incremental delta on the inbound brand card
  So that I can understand the per-traveler incremental cost per leg when booking round trip

  Scenario: Round trip multi pax - outbound shows full price, inbound visible, footer shows total per traveller
    Given I am logged in as "corp.amadeusligth.nff@amsalem.com" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    When I search for a round trip flight from "DUB" to "BUD"
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
