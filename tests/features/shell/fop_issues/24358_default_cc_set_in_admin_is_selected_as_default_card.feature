# Test Name: 24358 Default CC that was set in admin is selected as default card
# Description:
# Status: Active
# Labels: Regression,Flights,FOP,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-03-11T01:21:47Z
# Updated: 2025-03-11T01:35:55Z

@regression @flights @fop @credit-card @default-card
Feature: 24358 Default CC that was set in admin is selected as default card
  As a corporate traveler whose company configured a default credit card in admin
  I want the default credit card to be pre-selected in the cart payment options
  So that I don't need to manually pick it on every booking

  @priority:high
  Scenario: Default credit card from admin is pre-selected in the cart
    Given I am logged in as "boaz@ron.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "TLV"
    And I click proceed button if visible
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to edit the card
    Then the card "default card flight" should be visible
    And the card "default card flight" checkbox should be checked
