# Test Name: 45609 FOP is saved to trip
# Description:
# Status: Active
# Labels: Regression,Flights,FOP,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-02T10:00:59Z
# Updated: 2025-02-03T02:15:33Z

@regression @flights @fop @save-to-trip
Feature: 45609 FOP is saved to trip
  As a corporate traveler
  I want the FOP I select in the cart to be saved to the trip
  So that the payment method persists with the trip after I save it

  @priority:high
  Scenario: Selected FOP card is saved and "Paid by" label is shown
    Given I am logged in as "brunocaze@brunocaze.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "EDI" to "LGW"
    And I add the first flight to cart
    When I click add payment method button
    And I select card 1 and save
    Then the payment type should be "Paid by Corporate"
