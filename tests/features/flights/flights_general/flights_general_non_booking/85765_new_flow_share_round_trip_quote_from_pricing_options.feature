# Test Name: 85765 Flights New Flow - Share and unshare a round-trip quote from the new pricing options screen
# Source: ADO User Story #84674 - [Flights new flow][Complete search] - Share from pricing options page new flow
# Needs flag Atriis.App.OBT.IsFlightShareButtonEnabled on and the CanViewPriceOffer privilege.

# ADO Test Case ID: 85765
@ado:85765
@regression @flights @general @nff @price-offer @share
Feature: 85765 Flights New Flow - Share and unshare a round-trip quote from the new pricing options screen
  As a corporate traveler on the new flight flow
  I want Share to wait for every leg and Added to undo the share
  So that only complete quotes reach the share bar and I can take one back without leaving the screen

  @priority:high
  Scenario: Share needs both legs, Added and the banner slot both remove the quote, and the quote reaches the email
    Given I am logged in as "corp.amadeus.nff@amsalem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "LON"
    Then flight results should be available
    When I click on the "Share" button
    And I open pricing options for flight result 1
    Then the outbound leg brand cards are displayed
    And the pricing options Share button should be disabled
    When I select the outbound first option from pricing options new flight flow
    Then the inbound leg brand cards should be visible
    And the pricing options Share button should be disabled
    When I select the inbound first option from pricing options new flight flow
    Then the pricing options Share button should be enabled
    When I share the selection from pricing options
    Then the pricing options footer should offer "Added" instead of "Share"
    And the inbound leg brand cards should be visible
    And the share bar should show 1 of 4 quotes selected
    When I remove the shared selection from the pricing options footer
    Then the pricing options footer should offer "Share" instead of "Added"
    And the share bar should show 0 of 4 quotes selected
    When I share the selection from pricing options
    And I click share slot 1
    Then the pricing options footer should offer "Share" instead of "Added"
    And the share bar should show 0 of 4 quotes selected
    When I share the selection from pricing options
    Then share slot 1 price should match the pricing options footer total
    When I click on the "Share" button to open the share dialog
    Then the share email preview should contain every quote in the share bar
