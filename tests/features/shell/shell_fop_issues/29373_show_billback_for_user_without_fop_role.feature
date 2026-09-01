# Test Name: 29373 Show billback for user without fop role
# Description:
# Status: Active
# Labels: Hotel,Virtual Card,Billback,Regression,No Amadeus Hotel Book,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-05-26T10:03:25Z
# Updated: 2025-01-20T12:01:39Z

@regression @hotels @fop @billback @virtual-card
Feature: 29373 Show billback for user without FOP role
  As a corporate traveler without FOP role
  I want to see the configured payment restriction values when opening payment options
  So that I can still see billback information without the role

  @priority:medium
  Scenario: Payment restriction values are displayed for user without FOP role
    Given I am logged in as "billback@nofoprole.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    And the booking status should be "Pending booking"
    When I click the set billback button in cart
    And I click payment restriction field
    Then payment restriction options should include "TEST" and "TEST1"
