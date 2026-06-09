# Test Name: 78652 BA NDC - New Flight Flow - One-way: no "Starting from" and no delta on brand cards
# Status: Active
# Labels: Regression,Flights,BA NDC,New Flight Flow,Leg Pricing,One Way

@regression @flights @ndc @ba-ndc @nff @leg-pricing @one-way
Feature: 78652 BA NDC - New Flight Flow - One-way leg pricing shows price without "Starting from" or delta
  As a corporate traveler on a one-way trip
  I want to see just the fare price on brand cards without "Starting from" prefix or incremental delta
  So that I understand the exact cost for my single leg without confusion

  Scenario: One-way - brand cards display price without "Starting from" label and without delta
    Given I am logged in as "corp.bandc.nff@gdg.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "GVA"
    Then flight results should be available
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    And the brand cards should display price without "Starting from" label
    And the brand cards should not display incremental price delta
    When I select the outbound first option from pricing options new flight flow
    Then the flight selection footer should display a total price per traveller
