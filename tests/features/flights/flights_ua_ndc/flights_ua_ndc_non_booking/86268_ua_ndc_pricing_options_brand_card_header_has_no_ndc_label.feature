# Test Name: 86268 United NDC - Pricing options brand cards show no NDC label or untranslated key in the header
#
# Regression for bug 85762: AB#85404 put a plane icon + the raw key "flight.ndc" in the top-right of
# every NDC brand card; Atriis.App PR #477 removed it. Reads every card of both legs and every cabin tab.
# The bottom-right Direct Rate badge must stay (same check as 85799).

# ADO Test Case ID: 86268
@ado:86268
@regression @flights @ndc @united @nff
Feature: 86268 United NDC - Pricing options brand cards show no NDC label or untranslated key in the header
  As a corporate traveller
  I want the NDC fare cards to show only translated text
  So that the pricing options screen never shows a raw "flight.ndc" label

  @priority:medium
  Scenario: No brand card header of an NDC result shows the NDC label or an untranslated key
    Given I am logged in as "corp.uandc.nff@amsalem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LHR" to "JFK"
    Then flight results should be available
    When I filter airline results by "United" checkbox
    And I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    And no brand card header should show the NDC label
    And no untranslated text key should be shown on the pricing options screen
    And every brand card should show the "Direct Rate" label in the bottom-right corner
