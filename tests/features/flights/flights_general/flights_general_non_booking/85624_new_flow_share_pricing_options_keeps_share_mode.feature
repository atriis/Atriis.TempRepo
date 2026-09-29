# Test Name: 85624 Flights New Flow - Pricing Options in share mode opens the new pricing options screen
# Source: ADO User Story #84219 - [Flights new flow][Complete search] Reintroduce Share functionality - Search results
# Needs flag Atriis.App.OBT.IsFlightShareButtonEnabled on and the CanViewPriceOffer privilege.

# ADO Test Case ID: 85624
@ado:85624
@regression @flights @general @nff @price-offer @share
Feature: 85624 Flights New Flow - Pricing Options in share mode opens the new pricing options screen
  As a corporate traveler on the new flight flow
  I want Pricing Options to keep me in share mode
  So that I can pick a specific fare to share instead of booking it

  @priority:high
  Scenario: Pricing Options in share mode opens the new pricing options screen with share mode intact
    Given I am logged in as "corp.amadeus.nff@amsalem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "LON"
    Then flight results should be available
    When I click on the "Share" button
    And I click to open first pricing options
    Then the outbound leg brand cards are displayed
    And the share bar should be displayed
    And the pricing options footer should offer "Share" instead of "Add to cart"
