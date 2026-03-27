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

  # TODO: New user needed — noCancel@corp.ams → USER_NOCANCEL
  # Add to .env: USER_NOCANCEL="noCancel@corp.ams"

  Scenario: Cancel button is disabled when quote status is Finalizing
    Given I am logged in as "nocancel" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "WAW" to "DFW"
    And flight results should be available
    And I add the first result to trip
    And I proceed to checkout
    And I complete the booking without navigating to trip overview
    # TODO: Step needed for "Wait for Finalizing status"
    # TODO: Step needed for "Verify cancel button is disabled during Finalizing status"
