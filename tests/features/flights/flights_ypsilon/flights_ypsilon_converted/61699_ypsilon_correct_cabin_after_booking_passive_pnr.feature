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
    When I click to open first pricing options
    When I select "Premium" fare from pricing options top section
    Then I should see the heading "Flight To"
    And I select the first option from pricing options
    When I select "Premium" fare from pricing options top section
    And I select the first option from pricing options
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
    When I fill credit card cvv if needed
    And I proceed to checkout
    When I complete the booking with Ypsilon credit card verification
    Then the booking status should be "Ticketing Complete"
    When I open flight details in cart
    Then "Premium Economy (P)" should be displayed for the "outbound" flight leg in flight details
    When I scroll down in the flight details drawer
    Then "Premium Economy (P)" should be displayed for the "return" flight leg in flight details
