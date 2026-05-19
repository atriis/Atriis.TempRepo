# Test Name: 62735 Fusion - Title mandatory before checkout when traveler title is missing and user permission prevents editing profile
# Status: Active
# Labels: Fusion,Regression,Gray Dawes,Role,passenger info,2026 plan 2
# Owner: Noam Miller
# Created: 2025-05-25T01:45:34Z
# Updated: 2025-05-26T06:08:03Z

@regression @flights @fusion @passenger-info @role @priority:high
Feature: 62735 Fusion - Title is mandatory before checkout when traveler title is missing
  As a corporate traveler with a missing title and no permission to edit profile
  I want the title to be enforced as mandatory before checkout
  So that booking cannot proceed without a valid title

  Scenario: Title is enforced as mandatory before checkout when missing and profile editing is blocked
    Given I am logged in as "title@fusion.gdg" booking a new trip
    And I have added traveler by name "Finn Brodie"
    When I search for a round trip flight from "EDI" to "AMS"
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    Then the passenger title status should show "Title0/1"
    When I accept Terms & Conditions
    And I fill credit card cvv if needed
    And I click the proceed to checkout button
    Then the cart should show the in order to proceed warning
    Then the passenger title should have a red error border
