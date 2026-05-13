# Test Name: 72058: Flights - Disable 'cancel' when quote status is Finalizing
# Status: Active
# Labels: Amsalem,trip cancelation,Flights,item cancellation,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2026-01-01T09:13:05Z
# Updated: 2026-01-01T10:49:40Z

@regression @flights @general @cancellation
Feature: 72058 Flights - Disable cancel when quote status is Finalizing
  As the system
  I want the cancel button to be disabled when a quote is in Finalizing status
  So that bookings in progress are not accidentally cancelled

  Scenario: Cancel button is disabled when quote status is Finalizing
    Given I am logged in as "noCancel@corp.ams" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "GRU" to "DFW"
    And I add the first result to trip
    Then the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Finalizing"
    And the cancel trip button should be disabled
