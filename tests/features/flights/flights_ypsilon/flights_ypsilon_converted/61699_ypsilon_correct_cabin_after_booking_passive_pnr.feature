# Test Name: Hybrid for 61699: Ypsilon - Correct cabin displayed after booking, Correct cabin code sent when creating passive PNR
# Description:
# Status: Active
# Labels: Sabre,Club,Ypsilon,Passive Pnr,Regression,hybrid,Flights,Advanced search,progress page,2026 plan 2
# Owner: Noam Miller
# Created: 2025-05-08T07:26:55Z
# Updated: 2026-02-10T05:08:29Z

@regression @flights @ypsilon @cabin @passive-pnr @hybrid @advanced-search
Feature: 61699 Ypsilon - Correct cabin displayed after booking and correct cabin code in passive PNR
  As a corporate traveler using Ypsilon
  I want the correct cabin class to be displayed after booking
  So that the passive PNR is created with the right cabin code

  Scenario: Premium Economy cabin is displayed correctly after booking with Ypsilon
    Given I am logged in as "ypsilonCorp@club.com" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "DUB" to "PAR" with preferred carrier "Aer Lingus"
    Then flight results should be available
    # Select Premium Economy from pricing options
    When I click to open first pricing options
    Then the cabin class displayed in pricing options should be "Premium"
    When I select the second fare from pricing options
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
    When I fill credit card cvv if needed
    And I proceed to checkout
    # TODO: Implement Ypsilon 3DS card verification step (Card verification dialog → type '555' → submit → wait → click Go to trip)
    # Validate cabin after booking
    # TODO: Click "Go to trip" button and verify booking status
    When I open flight details in cart
    # TODO: Verify "Premium Economy (P)" is displayed for the outbound flight leg in flight details
    # TODO: Scroll down in the flight details drawer
    # TODO: Verify "Premium Economy (P)" is displayed for the return flight leg in flight details
