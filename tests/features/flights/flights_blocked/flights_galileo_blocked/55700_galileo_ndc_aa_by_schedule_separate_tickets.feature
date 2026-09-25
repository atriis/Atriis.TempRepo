# Test Name: 55700 - Galileo NDC - AA, Search by schedule, booked as separate tickets
# Status: Active
# Labels: Gray Dawes,Galileo NDC,Flights,Fare Rules,Regression,2026 plan 1
# Owner: Noam Miller
# Created: 2024-12-22T08:12:19Z
# Updated: 2025-11-26T06:53:20Z

@regression @galileo @ndc @flights @fare_rules @separated_tickets
Feature: 55700 Galileo NDC - AA search by schedule booked as separate tickets

  As a corporate traveler
  I want to search AA flights by schedule and book them as separate tickets
  So that each direction is held as its own quote with its own PNR

  Scenario: AA NDC by schedule search held as separate tickets with different PNRs
    Given I am logged in as "corpNDC@gdg.com" booking a new trip
    And I have added a random guest traveler
    When I search for a flight by schedule from "DFW" to "ORD"
    And I filter results by carrier "AA"
    And I click to open first pricing options
    And I select the third fare from pricing options
    And I confirm the pricing option for the current segment
    And I wait for the change flight button to be visible
    And I filter results by carrier "AA"
    And I click to open first pricing options
    And I select the third fare from pricing options
    And I confirm the pricing option for the current segment
    Then the "Separated Tickets" indicator should be visible in the pricing page
    When I wait for "Your Selection" text to be visible
    And I add "Your Selection" fare to trip
    Then the cart should contain 2 flight quotes
    When I click add payment method button
    And I click the card "Flight Invoice" checkbox
    And I save the card selection
    Then quote 1 payment type should be "Paid by TMC"
    When I accept all Terms & Conditions on the page
    And I hold quote 1
    And I click add payment method button
    And I click the card "Flight Invoice" checkbox
    And I save the card selection
    Then quote 2 payment type should be "Paid by TMC"
    When I accept all Terms & Conditions on the page
    And I hold quote 2
    Then quote 1 status should be "On hold"
    And quote 2 status should be "On hold"
    When I store the first quote PNR code
    And I store the second quote PNR code
    Then the stored quote PNR codes should not match
    Then I successfully cancel the trip
