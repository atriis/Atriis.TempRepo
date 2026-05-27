# Test Name: 29370 Show billback for user with fop role
# Description:
# Status: Active
# Labels: Regression,FOP,Hotel,No Amadeus Hotel Book,Virtual Card,Billback,Role,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-01-30T10:46:29Z
# Updated: 2024-09-24T12:17:55Z

@regression @hotels @fop @billback @virtual-card
Feature: 29370 Show billback for user with FOP role
  As a corporate traveler with FOP role
  I want to see the Request Billback checkbox and the configured payment restrictions
  So that I can request billback when booking a hotel

  @priority:medium
  Scenario: Request Billback option and payment restriction values are displayed for user with FOP role
    Given I am logged in as "billback@user.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    And the booking status should be "Pending booking"
    When I click the set billback button in cart
    And I click payment restriction field
    Then payment restriction options should include "TEST" and "TEST1"