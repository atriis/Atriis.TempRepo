# Test Name: 55056 Amadeus - Split rules - After adding 2 different round trip flights and then holding them, the split rule configuration is applied correctly
# Description:
# Status: Active
# Labels: Regression,Amadeus,split ticket,split rules,Flights,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-12-03T11:24:42Z
# Updated: 2025-09-14T09:38:19Z

@regression @flights @amadeus @split-rules @hold
Feature: 55056 Amadeus - Split rules applied correctly when holding 2 round trip flights
  As a corporate traveler
  I want to add two different round trip flights and hold them
  So that the split rule configuration is applied correctly to both quotes

  Scenario: Two round trip flights held with correct split rules and PNR codes
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "MAD" to "DOH"
    And I filter results by carrier "Qatar Airways"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I hold the trip
    When I click to add a flight to my trip from cart
    When I edit the flight search from "ZRH" to "SIN"
    And flight results should be available
    And I add the first flight to cart
    # The first quote is already ON HOLD here, and the shared "booking status"
    # step reads the FIRST quote card - it would read that held quote, not the
    # one just added. Assert by status text so the new quote is the one checked.
    Then I should see a quote with status "Pending booking"
    When I accept Terms & Conditions
    And I hold the trip
    Then the last quote status should be "On hold"
    When I store the first quote PNR code
    And I store the second quote PNR code
    Then the stored quote PNR codes should not match
    Then I successfully cancel the trip
