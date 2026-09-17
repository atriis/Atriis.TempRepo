# Test Name: 78890 - Separate PNR created when adding flight to a non-Hold booking
# Status: Active
# Labels: Regression,Flights,booking,separate ticket,PNR
# Owner: Noam Miller
# Created: 2026-06-07

@regression @flights @booking @separate-pnr @ado:78890 @priority:high
Feature: 78890 - Separate PNR created when adding flight to a non-Hold booking
  As a corporate traveler
  I want to add a second flight to a trip where the first flight is already Finalizing
  So that the new flight is booked in a separate PNR, not added to the existing one

  Scenario: Adding a second flight after booking creates a separate PNR
    Given I am logged in as "newPnr@sabre.corp" booking a new trip
    And I have added a random guest traveler with phone type "Mobile"
    When I search for a one way flight from "FRA" to "WAW"
    And flight results should be available
    And I filter results by "No stops" checkbox
    And I filter results by carrier "Lufthansa"
    And I add the first flight to cart
    When I proceed to checkout
    And I complete the booking
    Then the last quote status should be "Finalising"
    When I click to add a flight to my trip from cart
    And I search for a one way flight from "KRK" to "FRA"
    And flight results should be available
    And I filter results by "No stops" checkbox
    And I filter results by carrier "Lufthansa"
    And I add the first flight to cart
    When I proceed to checkout
    And I complete the booking
    Then the last quote status should be "Finalising"
    When I store the first quote PNR code
    And I store the second quote PNR code
    Then the stored quote PNR codes should not match
