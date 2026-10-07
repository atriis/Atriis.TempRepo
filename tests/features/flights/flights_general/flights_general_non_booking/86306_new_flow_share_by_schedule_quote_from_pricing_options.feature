# Test Name: 86306 Flights New Flow - By-schedule share mode shares one quote per combination from pricing options
# Source: ADO User Story #85522 - [Flights new flow][Schedule search] Reintroduce Share functionality - Search results
# Needs flag Atriis.App.OBT.IsFlightShareButtonEnabled on and the CanViewPriceOffer privilege. Desktop only.
# The old-flow by-schedule share (one quote per leg from the card) is 67455.

# ADO Test Case ID: 86306
@ado:86306
@regression @flights @general @nff @by-schedule @price-offer @share
Feature: 86306 Flights New Flow - By-schedule share mode shares one quote per combination from pricing options
  As a corporate traveler on the new flight flow searching by schedule
  I want each leg's "+ Share" to move me on and the quote to be shared from pricing options
  So that one quote covers every leg and two combinations stay two quotes in the price offer

  @priority:high
  Scenario: Leg CTAs read "+ Share", pricing options shares the whole combination, and a second combination is a separate quote
    Given I am logged in as "corp.amadeus.nff@amsalem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "LIS" to "LON"
    Then flight results should be available
    And every flight result should show "Select flight" as its booking action
    When I click on the "Share" button
    Then the share bar should show 0 of 4 quotes selected
    And every by-schedule leg result should offer "Share" instead of its booking action
    # "+ Share" on a leg only moves on to the next leg: nothing is shared before pricing options.
    When I share by-schedule leg result 1
    Then the share bar should show 0 of 4 quotes selected
    And every by-schedule leg result should offer "Share" instead of its booking action
    When I share by-schedule leg result 1
    Then the outbound leg brand cards are displayed
    And the share bar should show 0 of 4 quotes selected
    And the pricing options Share button should be disabled
    When I select the outbound first option from pricing options new flight flow
    Then the pricing options Share button should be disabled
    When I select the inbound first option from pricing options new flight flow
    Then the pricing options Share button should be enabled
    When I share the selection from pricing options
    Then the pricing options footer should offer "Added" instead of "Share"
    And the share bar should show 1 of 4 quotes selected
    And share slot 1 price should match the pricing options footer total
    When I remove the shared selection from the pricing options footer
    Then the pricing options footer should offer "Share" instead of "Added"
    And the share bar should show 0 of 4 quotes selected
    When I share the selection from pricing options
    And I click share slot 1
    Then the pricing options footer should offer "Share" instead of "Added"
    And the share bar should show 0 of 4 quotes selected
    When I share the selection from pricing options
    Then the share bar should show 1 of 4 quotes selected
    # Same outbound, another return flight: the quote identity covers every leg, so this is a second quote.
    # The return stays on TAP: a mixed-carrier separated-ticket return prices differently in the footer,
    # the cart and the email, which is not what this test is about.
    When I close pricing options and start over
    Then the share bar should show 1 of 4 quotes selected
    And every by-schedule leg result should offer "Share" instead of its booking action
    When I share by-schedule leg result 1
    And I filter results by carrier "Tap Air Portugal"
    And I share by-schedule leg result 2
    Then the outbound leg brand cards are displayed
    When I select the outbound first option from pricing options new flight flow
    And I select the inbound first option from pricing options new flight flow
    And I share the selection from pricing options
    Then the share bar should show 2 of 4 quotes selected
    And the share bar should hold 2 different quotes
    When I click on the "Share" button to open the share dialog
    Then the share email preview should contain every quote in the share bar
