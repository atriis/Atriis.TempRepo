# Test Name: 51524 Bene rail Moove> results and seats improvements
# Description: check improvements on results page (earlier and later) and seats
# Status: Active
# Labels: No Amadeus Hotel Book,Benerail Moove Regression,Bene seats,Rail,Transportation,2026 plan 1
# Owner: pini harush
# Created: 2024-09-08T02:15:43Z
# Updated: 2025-09-02T05:00:45Z
@transportation @rails @benerail @regression
Feature: 51524 Benerail - Results and seat improvements
  As a corporate traveler
  I want to navigate earlier/later results and verify seat selection improvements
  So that I can confirm results pagination and seating UI work correctly

  Scenario: Benerail results and seat improvements
    Given I am logged in as "pmac@bene.ral" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Benerail train from "defraToBebmi"
    And I wait for select text to be visible
    Then the Benerail journey stepper "outbound" step should show one of the times "06:00, 07:00, 08:00"
    And the Benerail journey stepper "inbound" step should show one of the times "16:00, 17:00, 18:00"
    When I click Show Later Departures on the outbound results
    Then later departure results should be displayed
    When I add a Benerail round trip to the trip
    And the booking status should be "Pending booking"
    Then the seating price should not be displayed in the Benerail cart summary
    When I click Benerail seating in extras
    And I click outbound and inbound seat checkboxes
    And I extract outbound and inbound seat prices
    And I click the save button
    And the booking status should be "Pending booking"
    Then the seating price in the Benerail cart summary is the sum of outbound and inbound seats
    When I click Benerail seating in extras
    And I select continue without reserving seats
    And I click the save button
    And the booking status should be "Pending booking"
    Then the seating price should not be displayed in the Benerail cart summary
