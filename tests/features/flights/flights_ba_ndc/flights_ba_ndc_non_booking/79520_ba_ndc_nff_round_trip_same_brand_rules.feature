# Test Name: 79520 BA NDC - New Flight Flow - Round trip: same brand rules for outbound and inbound
# Status: Active
# Labels: Regression,Flights,BA NDC,New Flight Flow,Brands,Mixed Fare Rules

@regression @flights @ndc @ba-ndc @nff @brands @mixed-fare-rules
Feature: 79520 BA NDC - New Flight Flow - Round trip: selecting same cancellation and change brand rules for outbound and inbound shows no warning
  As a corporate traveler on a round trip via BA NDC
  I want to select the same cancellation and change brand rules for outbound and inbound legs
  So that no warning is shown

  Scenario: Round trip - selecting same cancellation and change brand rules for outbound and inbound shows no warning
    Given I am logged in as "corp.bandc.nff@gdg.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "NYC"
    Then flight results should be available
    When I filter results by carrier "BA"
    And I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    When I select the outbound first option from pricing options new flight flow
    Then the flight selection footer should display a total price per traveller
    And the inbound leg brand cards should be visible
    When I select the inbound brand with same cancellation and change rules as outbound from pricing options new flight flow
    Then the flight selection footer should display a total price per traveller
    And the change and cancellation rules warning is not displayed
