# Test Name: 85625 Flights Old Flow - Share from results keeps working as before
# Source: ADO User Story #84219 - [Flights new flow][Complete search] Reintroduce Share functionality - Search results
# Regression for users still on the old flight flow: sharing works as it did before the story.

# ADO Test Case ID: 85625
@ado:85625
@regression @flights @general @price-offer @share
Feature: 85625 Flights Old Flow - Share from results keeps working as before
  As a corporate traveler on the old flight flow
  I want sharing from the results screen to behave as it always did
  So that the new flow's share mode does not change my price offers

  @priority:high
  Scenario: Old-flow share mode adds the search result, opens the legacy pricing options and reaches the price offer email
    Given I am logged in as "am@amsalem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "LON"
    Then flight results should be available
    When I click on the "Share" button
    Then every flight result should offer "Share" and "Pricing Options" instead of its booking action
    When I add flight result 1 to the share bar
    Then flight result 1 should show "Added" on its share button
    And share slot 1 price should match the price of flight result 1
    When I hover share slot 1
    Then the share slot tooltip should show the route, times and price of share slot 1
    When I add flight result 2 to the share bar
    And I click to open second pricing options
    Then pricing options are displayed
    And the share bar should be displayed
    When I close pricing options modal
    And I click on the "Share" button to open the share dialog
    Then the share email preview should contain every quote in the share bar
