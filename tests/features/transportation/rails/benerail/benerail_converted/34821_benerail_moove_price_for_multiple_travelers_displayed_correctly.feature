# Test Name: 34821 - benerail moove, price for multiple travelers displayed correctly
# Description:
# Status: Active
# Labels: Full Purchase,NL government,Keeps failing,Benerail Moove Regression,Bene seats,Daily Transportation,Transportation,2026 plan 1,02
# Owner: Shani Hadar
# Created: 2024-03-10T10:22:19Z
# Updated: 2025-12-19T03:00:57Z
@transportation @rails @benerail @regression
Feature: 34821 Benerail - Price for multiple travelers displayed correctly
  As a corporate traveler booking for two people
  I want the total Benerail price to correctly reflect the cost for both travelers
  So that the displayed price is accurate before proceeding to checkout

  Scenario: Benerail price for two travelers is calculated and displayed correctly
    Given I am logged in as "pmac@bene.ral" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    When I search for a round trip Benerail train from "bebmiToNlban"
    And I wait for select text to be visible
    Then the total price should reflect both travelers correctly
    And I extract the Benerail outbound total price for both travelers in results
    When I select the first Benerail option
    And I wait for select text to be visible
    Then the total price should reflect both travelers correctly
    And I extract the Benerail inbound total price for both travelers in results
    When I select the first Benerail option
    And I add the first result to trip
    And the booking status should be "Pending booking"
    Then the total price in cart should equal the sum of the outbound and inbound totals for both travelers
