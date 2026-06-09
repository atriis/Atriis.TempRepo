@regression @flights @afkl-ndc @nff @agreement-combinability
Feature: 78480 AFKL NDC - New Flight Flow - Agreement fare combinability restriction

  Scenario: Selecting non-agreement outbound restricts inbound to non-agreement fares only
    Given I am logged in as "corp.afklndc.nff@amsalem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "CDG" to "AMS"
    Then flight results should be available
    And I filter airline results by "Air France" checkbox
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    When I select the outbound first non-agreement brand card from pricing options new flight flow
    Then the flight selection footer should display a total price per traveller
    And the inbound leg brand cards should be visible
    And the inbound leg brand cards should only display non-agreement fares
    When I select the inbound first option from pricing options new flight flow
    Then the flight selection footer should display a total price per traveller
