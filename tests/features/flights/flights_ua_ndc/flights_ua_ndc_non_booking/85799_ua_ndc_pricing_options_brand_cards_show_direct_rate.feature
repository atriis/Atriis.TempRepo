# Test Name: 85799 United NDC - Pricing options brand cards show the Direct Rate badge
#
# Checks the bottom-right Direct Rate badge only, not the top-right NDC label.
# Pinned to United NDC: every UA result must be NDC, and the results are filtered to United.

# ADO Test Case ID: 85799
@ado:85799
@regression @flights @ndc @united @nff
Feature: 85799 United NDC - Pricing options brand cards show the Direct Rate badge
  As a corporate traveller
  I want every NDC fare card to show that it is a Direct Rate
  So that I can tell the NDC fares apart on the pricing options screen

  @priority:medium
  Scenario: Every brand card of an NDC result shows Direct Rate in its bottom-right corner
    Given I am logged in as "corp.uandc.nff@amsalem.com" booking a new trip
    And I have added myself as the traveler
    And I start intercepting the "flightSearch" API response
    When I search for a round trip flight from "LHR" to "JFK"
    Then flight results should be available
    And every "UA" result in the flight search response should be NDC
    When I filter airline results by "United" checkbox
    And I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    And every brand card should show the "Direct Rate" label in the bottom-right corner
