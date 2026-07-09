# Test Name: 36579 Shared quote flight GDS
# Description:
# Status: Active
# Labels: CR7,Regression,No Amadeus Hotel Book,2026 plan 1
# Owner: Unassigned
# Created: 2023-08-17T01:51:04Z
# Updated: 2025-09-08T09:18:36Z

@regression @shell @gds
Feature: 36579 - Shared quote flight GDS

  As a travel agent
  I want to share multiple GDS flight quotes from the search results page
  So that the traveler receives a price offer email listing each flight offer as pending booking

  Scenario: Share three GDS flight quotes and verify the price offer email preview
    Given I am logged in as "ruimendes@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "london" to "istanbul"
    And I click on the "Share" button
    And I click on the 1 share button in results page
    And I click on the 2 share button in results page
    And I click on the 3 share button in results page
    And I click on the "Share" button to open the share dialog
    Then "Flight Offer # 1 Pending booking" should be displayed in the share email preview
    And "Flight Offer # 2 Pending booking" should be displayed in the share email preview
    And "Flight Offer # 3 Pending booking" should be displayed in the share email preview
    And I close the share dialog
