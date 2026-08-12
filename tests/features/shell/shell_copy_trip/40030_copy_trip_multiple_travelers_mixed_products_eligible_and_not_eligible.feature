# Test Name: 40030 Copy trip for multiple travelers, mixed products (eligible and not eligible for copy)
# Description:
# Status: Active
# Labels: Flights,Copy Trip,Adding Passengers,Amadeus,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1
# Owner: Noam Miller
# Created: 2023-12-07T01:31:02Z
# Updated: 2026-02-16T01:58:54Z

@regression @shell @copy-trip @flights @rails
Feature: 40030 - Copy trip for multiple travelers with mixed eligible and non-eligible products
  As a corporate travel booker with multiple travelers
  I want to copy a trip that contains both copy-eligible and non-eligible products
  So that only the eligible products are copied and the non-eligible ones are excluded

  Scenario: Copy a trip with a flight (eligible) and EU rail (not eligible) for two guest travelers
    Given I am logged in as "copytrip@corp.com" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a round trip flight from "BOS" to "LHR"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    # Capture the flight so the copy can be compared against the original
    When I store the first booked flight number
    And I store the outbound and return flight details
    # Add the EU rail — not eligible for copy trip
    When I click to add an EU rail to my trip from cart
    And I search for a one way Benerail train from "bebmiToNlaho" from the cart drawer
    And I add a Benerail one way to the trip
    Then the booking status should be "Pending booking"
    # Copy the trip: only the flight is eligible
    When I open the copy trip dialog
    Then the copy trip dialog should show the message "The following items will be copied to a new trip"
    And the copy trip dialog item "Flight" should show status "Pending booking"
    And the copy trip dialog item "EU Rail" should show "This item can not be copied"
    # Validate the copied trip: flight copied, rail excluded. The copy opens in a new browser tab;
    # every "copied trip" step below addresses that tab itself, so no tab switch is needed here.
    When I confirm the copy trip
    Then the copied trip should show a to pay amount
    And the copied trip should not contain the EU rail product
    And the trip is created successfully with the same flight
    And the copied trip flight details should match the stored outbound and return details
    # Clean up both trips — the flight is a GDS quote and must not be left behind
    When I work on the copied trip
    Then I successfully cancel the trip
    When I work on the original trip
    Then the booking status should be "Pending booking"
    And I successfully cancel the trip
