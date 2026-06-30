# Test Name: 79521 LH NDC - New Flight Flow - Round trip: different brand rules between outbound and inbound shows warning
# Status: Active
# Labels: Regression,Flights,LH NDC,New Flight Flow,Brands,Mixed Fare Rules

@regression @flights @ndc @lufthansa @nff @brands @mixed-fare-rules
Feature: 79521 LH NDC - New Flight Flow - Round trip: selecting different brand rules triggers mixed fare rules warning
  As a corporate traveler on a round trip via LH NDC
  I want to be warned when I select fares with different change and cancellation rules across legs
  So that I understand the most restrictive rules will apply

  Scenario: Round trip - selecting different brands for outbound and inbound shows mixed fare rules warning
    Given I am logged in as "corp.lhndc.nff@amsalem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "FRA"
    Then flight results should be available
    When I filter results by carrier "LH"
    And I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    When I select outbound and inbound brands with different cancellation and change rules from pricing options new flight flow
    Then the flight selection footer should display a total price per traveller
    And the change and cancellation rules warning is displayed with message "You selected fares with different change and cancellation rules. The most restrictive rules apply."
