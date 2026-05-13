# Test Name: 39426 Expedia - Can see correct billback
# Description: 
# Status: Active
# Labels: Amsalem,conferma,FOP,Billback,Hotel,Expedia,Regression,Daily Hotels,2026 plan 1
# Owner: Noam Miller
# Created: 2025-03-03T08:26:29Z
# Updated: 2025-03-03T08:55:26Z

@regression @provider:expedia
Feature: 39426 Expedia - Can see correct billback
  As a corporate traveler using Expedia with billback enabled
  I want to select a virtual credit card for hotel payment
  So that hotel costs are billed back to the company automatically

  @priority:high
  Scenario: Can see correct billback in cart
    Given I am logged in as "shani@bill.com" booking a new trip
    And I have added traveler by name "Bill Bakerman"
    When I search for a hotel in "Leuven" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I click add payment method button
    Then the card "vcc hotels billback" should be visible
    When I click the card "vcc hotels billback" checkbox
    Then payment restriction text should be visible
    When I click payment restriction field
    Then payment restriction options should include "exp1 ug a" and "exp2 ug a"


