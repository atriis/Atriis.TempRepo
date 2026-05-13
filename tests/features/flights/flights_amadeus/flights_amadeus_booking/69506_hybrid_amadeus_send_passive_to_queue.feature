# Test Name: Hybrid for 69506: Amadeus - Send passive to queue
# Status: Active
# Labels: AFKL NDC Regression,Passive Pnr,Send to Queue,Club,Flights,2026 plan 2
# Owner: Noam Miller
# Created: 2025-10-26T09:44:16Z

@regression @amadeus @flights @hybrid @passive_pnr
Feature: 69506 Amadeus - Send passive to queue
  As a corporate traveler
  I want to book a round trip flight
  So that a passive PNR is sent to the queue

  # NOTE: This is a hybrid test — the actual "send passive to queue" verification
  # requires backend/API validation that is not covered by this UI scenario.

  Scenario: Booking a round trip flight that sends passive to queue
    Given I am logged in as "sendToQCorp@club.com" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "LON" to "PAR"
    And flight results should be available
    And I log the trip number from the URL
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
