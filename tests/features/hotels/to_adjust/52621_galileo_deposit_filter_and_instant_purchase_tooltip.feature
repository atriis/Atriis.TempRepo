# Test Name: 52621 Galileo - deposit room filter and instant purchase
# Description: 
# Status: Active
# Labels: Regression,Hotel,Galileo,Travel policy,Filters,results,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-10-15T01:08:41Z
# Updated: 2024-10-15T01:45:23Z

@regression @provider:galileo
Feature: 52621 Galileo - Deposit filter shows hotels with instant purchase tooltip
  As a corporate traveler using Galileo
  I want to find hotels with deposit/instant purchase requirements using the deposit filter
  So that I understand upfront payment requirements before booking

  @priority:medium
  Scenario: Deposit filter is applied and instant purchase tooltip is visible
    Given I am logged in as "galileo" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Blue Mansion" for 1 night
    And I select the first hotel result
    # TODO: Create step "When I filter room results by deposit required" that calls DSL filterRoomsByDeposit in RoomLevelResults.js
    # TODO: Create step "Then the instant purchase tooltip should be visible on the deposit room" that calls DSL verifyInstantPurchaseTooltip in RoomLevelResults.js
