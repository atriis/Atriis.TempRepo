# Test Name: 77807 Sabre - New Flight Flow - Multi-city leg pricing: "Starting from" on first leg, delta on subsequent
# Status: Active
# Labels: Regression,Flights,Sabre,New Flight Flow,Leg Pricing,Multi City

@regression @flights @sabre @nff @leg-pricing @multi-city
Feature: 77807 Sabre - New Flight Flow - Multi-city leg pricing display
  As a corporate traveler booking multi-city flights via Sabre
  I want to see "Starting from" on the first leg brand card and incremental delta on subsequent leg brand cards
  So that I can clearly compare the incremental cost across multi-city fare options

  Scenario: Multi-city non-separated - first leg shows "Starting from", subsequent legs show delta
    Given I am logged in as "corp.sabre.nff@frosch.com" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city flight with legs "LIS-LON" and "LON-FRA" and "FRA-LIS"
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
    And the third leg brand cards should be visible
    And the third leg brand cards should display incremental price delta
    When I select the third leg first option from pricing options new flight flow
    Then the flight selection footer should display a total price per traveller
