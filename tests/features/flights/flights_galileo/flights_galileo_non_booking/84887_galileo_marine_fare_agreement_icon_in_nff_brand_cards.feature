# ADO Test Case ID: 84887
# Test Name: Galileo - Flights - Marine fare agreement icon is displayed on the New Flight Flow brand cards
# Status: Active
# Labels: Regression,Flights,Galileo,Marine Fares,NFF
# Owner: Bruna Santos

@ado:84887
@regression @flights @galileo @nff @marine-fares
Feature: 84887 Galileo - Marine fare agreement icon on the New Flight Flow brand cards

  As a corporate traveler with a SEA agreement
  I want the marine fare badge to stay visible on the brand cards of the new flight flow
  So that I can tell which fare is priced under the marine agreement before I select it

  Scenario: A marine fare brand card carries the agreement icon after selecting a filtered result
    Given I am logged in as "marin@fare.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "NYC"
    Then flight results should be available
    And I filter results by "Marine fare" checkbox
    And the "Marine Fare" indicator should be visible in results
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    And at least one brand card on the "outbound" leg should display the Marine Fare icon
