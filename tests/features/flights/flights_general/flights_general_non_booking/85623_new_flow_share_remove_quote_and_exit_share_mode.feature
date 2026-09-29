# Test Name: 85623 Flights New Flow - Removing a shared quote and leaving share mode
# Source: ADO User Story #84219 - [Flights new flow][Complete search] Reintroduce Share functionality - Search results
# Needs flag Atriis.App.OBT.IsFlightShareButtonEnabled on and the CanViewPriceOffer privilege.

# ADO Test Case ID: 85623
@ado:85623
@regression @flights @general @nff @price-offer @share
Feature: 85623 Flights New Flow - Removing a shared quote and leaving share mode
  As a corporate traveler on the new flight flow
  I want to remove a quote from the share bar and leave share mode
  So that only the options I choose are shared and the results go back to normal afterwards

  @priority:high
  Scenario: A filled slot is emptied on click, and leaving share mode discards every selection
    Given I am logged in as "corp.amadeus.nff@amsalem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "LON"
    Then flight results should be available
    When I click on the "Share" button
    And I add flight result 1 to the share bar
    And I add flight result 2 to the share bar
    Then the share bar should show 2 of 4 quotes selected
    When I click share slot 1
    Then the share bar should show 1 of 4 quotes selected
    And flight result 1 should show "Share" on its share button
    And flight result 2 should show "Added" on its share button
    When I exit share mode
    Then the share bar should not be displayed
    And every flight result should show "Select flight" as its booking action
    When I click on the "Share" button
    Then the share bar should show 0 of 4 quotes selected
