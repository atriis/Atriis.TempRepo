# Test Name: 85622 Flights New Flow - Share mode adds the cheapest priced option and it reaches the price offer email
# Source: ADO User Story #84219 - [Flights new flow][Complete search] Reintroduce Share functionality - Search results
# Needs flag Atriis.App.OBT.IsFlightShareButtonEnabled on and the CanViewPriceOffer privilege.

# ADO Test Case ID: 85622
@ado:85622
@regression @flights @general @nff @price-offer @share
Feature: 85622 Flights New Flow - Share mode adds the cheapest priced option and it reaches the price offer email
  As a corporate traveler on the new flight flow
  I want to share flight options straight from the complete-search results
  So that the cheapest priced option of each package is what the traveller receives in the price offer

  @priority:high
  Scenario: Share mode adds the cheapest priced option of each package and the price offer email carries them
    Given I am logged in as "corp.amadeus.nff@amsalem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "LON"
    Then flight results should be available
    When I click on the "Share" button
    Then every flight result should offer "Share" and "Pricing Options" instead of its booking action
    And the share bar should show 0 of 4 quotes selected
    And the share bar Share button should be disabled
    When I start intercepting the flight pricing selection response
    And I add flight result 1 to the share bar
    Then flight result 1 should show "Added" on its share button
    And the share bar should show 1 of 4 quotes selected
    And share slot 1 price should match the cheapest option in the intercepted pricing selection response
    When I hover share slot 1
    Then the share slot tooltip should show the route, times and price of share slot 1
    When I add flight result 2 to the share bar
    Then the share bar should show 2 of 4 quotes selected
    And the share bar Share button should be enabled
    When I click on the "Share" button to open the share dialog
    Then the share email preview should contain every quote in the share bar
