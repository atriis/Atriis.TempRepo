# Test Name: 35188 [Merge] Amadeus - Fare Rules refundable can't change to non-refundable after adding hotel to cart and hotels chain codes are being displayed
# Description: 
# Status: Active
# Labels: Regression,Fare Rules,Amadeus,Hotel,hotel chain codes,2026 plan 1
# Owner: Unassigned
# Created: 2023-06-09T04:23:36Z
# Updated: 2025-09-14T08:41:57Z

@regression @provider:amadeus
Feature: 35188 Amadeus - Hotel chain codes and loyalty program are expandable in cart
  As a corporate traveler
  I want to see hotel chain codes and expand the loyalty program section in the cart
  So that I can add my loyalty number before completing the booking

  @priority:medium
  Scenario: Chain codes are visible and loyalty section is expandable in cart
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    When I expand the loyalty number extras section
    And I select the first hotel chain in the loyalty section
    Then the selected hotel chain should contain a chain code

