# Test Name: 74486 Amadeus EDIFACT - Selected flights are the ones booked
# Status: Design
# Labels: BTP eBusiness Travel,Amadeus EDIFACT,Flights,Regression,TESTIM
# Owner: Noam Miller
# Created: 2026-03-02

@regression @flights @amadeus @edifact
Feature: 74486 Amadeus EDIFACT - Selected flights are the ones booked
  As a corporate traveler
  I want the flight I add to cart to still be the one that gets held
  So that the EDIFACT offer isn't silently substituted for a different flight

  Scenario: KLM EDIFACT flight numbers match after holding
    Given I am logged in as "corp@amaEdifact.btp" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "AMS" to "KRK"
    And I filter results by carrier "KLM"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I store the second booked flight number
    And I accept Terms & Conditions
    And I hold the trip
    Then the flight numbers in cart should match the stored flight numbers
    And I successfully cancel the trip
