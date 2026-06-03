# Test Name: 29132 edit FOP after saving
# Description: Cart page - edit FOP after saving
# Status: Active
# Labels: Regression,FOP,No Amadeus Hotel Book,v3,2026 plan 1
# Owner: pini harush
# Created: 2023-04-18T02:09:32Z
# Updated: 2026-02-10T05:17:05Z

@regression @flights @fop @edit-fop
Feature: 29132 Edit FOP after saving
  As a corporate traveler with multiple saved credit cards
  I want to change the FOP on the cart after I already saved one
  So that I can switch between traveler and TMC payment before booking

  @priority:medium
  Scenario: Edit the FOP from a personal card to a TMC card after saving
    Given I am logged in as "fop@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MAD"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click add payment method button
    And I select card 1 and save
    Then the payment type should be "Paid by Traveller"
    When I click to edit the card
    And I select card 2 and save
    Then the payment type should be "Paid by TMC"
