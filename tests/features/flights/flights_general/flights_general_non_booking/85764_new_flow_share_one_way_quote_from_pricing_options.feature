# Test Name: 85764 Flights New Flow - Share a one-way quote from the new pricing options screen
# Source: ADO User Story #84674 - [Flights new flow][Complete search] - Share from pricing options page new flow
# Needs flag Atriis.App.OBT.IsFlightShareButtonEnabled on and the CanViewPriceOffer privilege.

# ADO Test Case ID: 85764
@ado:85764
@regression @flights @general @nff @price-offer @share
Feature: 85764 Flights New Flow - Share a one-way quote from the new pricing options screen
  As a corporate traveler on the new flight flow
  I want to share the fare I pick on the pricing options screen
  So that the traveller receives exactly that fare in the price offer

  @priority:high
  Scenario: A one-way fare can be shared as soon as it is selected and reaches the price offer email
    Given I am logged in as "corp.amadeus.nff@amsalem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LIS" to "LON"
    Then flight results should be available
    When I click on the "Share" button
    And I open pricing options for flight result 1
    Then the outbound leg brand cards are displayed
    And the pricing options footer should offer "Share" instead of "Add to cart"
    And the pricing options Share button should be disabled
    When I select the outbound first option from pricing options new flight flow
    Then the pricing options Share button should be enabled
    When I share the selection from pricing options
    Then the pricing options footer should offer "Added" instead of "Share"
    And the outbound leg brand cards are displayed
    And the share bar should show 1 of 4 quotes selected
    And share slot 1 price should match the pricing options footer total
    When I click on the "Share" button to open the share dialog
    Then the share email preview should contain every quote in the share bar
