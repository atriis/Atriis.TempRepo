# Test Name: 62008 Benerail Moove - Ticket is refundable in itinerary after booking
# Description:
# Status: Active
# Labels: Rail,Benerail Moove Regression,Full Purchase,Share Itinerary,progress page,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-09T09:56:34Z
# Updated: 2026-01-21T09:41:06Z
@transportation @rails @benerail @regression @priority:critical
Feature: 62008 Benerail - Ticket is refundable in itinerary after booking
  As a corporate traveler
  I want to see the refundable status on the Benerail ticket in the trip overview after booking
  So that I know I can cancel and receive a refund

  Scenario: Benerail refundable ticket status is shown in itinerary after booking
    Given I am logged in as "pmac@bene.ral" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "debhfToBebmi" on the 3 "monday" of next month
    And I wait for select text to be visible
    Then I verify that the first train company of the route for the first result is "InterCity Express"
    When I expand more options for the first result
    And I add a Benerail fare "full flex" one way to the trip
    And the booking status should be "Pending booking"
    Then I verify that the first train company of the route is "InterCity Express"
    Then the fare rules should be accessible in the Benerail cart and contain "100% refund"
    When I click Benerail seating in extras
    And I select continue without reserving seats
    And I click the save button
    And the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the trip overview should show the journey details button
    When I click the share quote button
    Then the fare rules "Refundable Before Departure" and its content should be visible in the Benerail share quote email
    When I close the share dialog
    And I click the share itinerary button
    Then the fare rules "Refundable Before Departure" and its content should be visible in the Benerail share itinerary email