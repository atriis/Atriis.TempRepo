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
    Given I am logged in as "inessa" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Blue Mansion" for 1 night
    And I select the first hotel result
    When I wait for the first add to trip button to be visible in room level results
    And I filter room results by deposit not required
    Then the out of policy indicator should be visible in results
    Then the out of policy tooltip in results should be "Hotel is instant purchase"