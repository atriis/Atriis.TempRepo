# Test Name: 57361 FOP - Credit Card - Payment selection is updated after switching credit card
# Description:
# Status: Active
# Labels: Regression,FOP,credit card,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-28T06:44:59Z
# Updated: 2026-02-10T05:17:12Z

@regression @hotels @fop @credit-card @switch-card
Feature: 57361 FOP - Credit card payment selection is updated after switching credit card
  As a corporate traveler with multiple credit cards available
  I want the FOP label to update when I switch credit cards in the cart
  So that I can verify the correct payment owner is applied

  @priority:high
  Scenario: Switching credit card updates the FOP label from Corporate to Traveler
    Given I am logged in as "amyvivian@fopcreditcard.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "The Mandrake" for 1 night
    And I wait to see view rates text in results page
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    And the payment type should be "Paid by Corporate"
    When I click to edit the card
    And I select card 1 and save
    Then the payment type should be "Paid by Traveller"
