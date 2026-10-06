# Test Name: 85833 Flights New Flow - The results card does not share again a fare already shared from pricing options
# Source: ADO Bug #85761 - Same fare can be shared twice: added from Pricing Options, then + Share on the results card
# Needs flag Atriis.App.OBT.IsFlightShareButtonEnabled on and the CanViewPriceOffer privilege.

# ADO Test Case ID: 85833
@ado:85833
@regression @flights @general @nff @price-offer @share
Feature: 85833 Flights New Flow - The results card does not share again a fare already shared from pricing options
  As a corporate traveler on the new flight flow
  I want the results card to recognise the fare I already shared from pricing options
  So that the price offer lists that offer only once

  @priority:high
  Scenario: Share on the results card keeps one quote for the cheapest fare already shared from pricing options
    Given I am logged in as "corp.amadeus.nff@amsalem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LIS" to "LON"
    Then flight results should be available
    When I click on the "Share" button
    And I start intercepting the flight pricing selection response
    And I open pricing options for flight result 1
    Then the outbound leg brand cards are displayed
    When I select the outbound first option from pricing options new flight flow
    And I share the selection from pricing options
    Then the pricing options footer should offer "Added" instead of "Share"
    And the share bar should show 1 of 4 quotes selected
    And share slot 1 price should match the cheapest option in the intercepted pricing selection response
    When I close the pricing options screen
    Then flight result 1 should show "Share" on its share button
    When I click Share on flight result 1 for a fare already in the share bar
    Then the share bar should show 1 of 4 quotes selected
    And flight result 1 should show "Added" on its share button
    When I hover share slot 1
    Then the share slot tooltip should show the route, times and price of share slot 1
    When I click on the "Share" button to open the share dialog
    Then the share email preview should contain every quote in the share bar
    When I close the share dialog
    And I open pricing options for flight result 1
    And I select the outbound first option from pricing options new flight flow
    Then the pricing options footer should offer "Added" instead of "Share"
    And the share bar should show 1 of 4 quotes selected
    When I close the pricing options screen
    Then flight result 1 should show "Added" on its share button
    When I remove flight result 1 from the share bar with its Added button
    Then the share bar should show 0 of 4 quotes selected
    And flight result 1 should show "Share" on its share button
    When I add flight result 1 to the share bar
    Then the share bar should show 1 of 4 quotes selected
    And flight result 1 should show "Added" on its share button
