# Test Name: [#78464] Amadeus NDC + Edifact - Both quotes confirmed when booking CPH-FRA round trip as separate tickets
# Status: Active
# Labels: Amadeus,NDC,Edifact,separate tickets,complete trip,Flights,Regression,Full Purchase
# Owner: Noam Miller
# Created: 2026-06-02

@regression @flights @amadeus @ndc @edifact @separate-tickets @full-purchase
Feature: 78464 Amadeus NDC + Edifact - Both quotes confirmed for CPH-FRA separate ticket booking
  As a corporate traveler
  I want to book a CPH-FRA round trip where one quote is NDC and the other is Edifact
  So that both quotes are confirmed and displayed correctly after finalization

  Scenario: Both NDC and Edifact quotes are confirmed for CPH-FRA separate ticket booking
    Given I am logged in as "mix@NdcEdifact.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "CPH" to "FRA"
    And flight results should be available
    And I filter airline results by "Multi carrier" checkbox
    Then the "Separated Tickets" indicator should be visible in results
    And the "NDC Direct Rate" indicator should be visible in results
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    And the first quote destination should contain "Frankfurt"
    And the last quote destination should contain "Copenhagen"
    And I accept all Terms & Conditions on the page
    And I click the proceed to checkout button
    And I wait for booking details in checkout
    Then "Flight to Frankfurt" should be displayed in the checkout page
    And "Flight to Copenhagen" should be displayed in the checkout page
    When I complete the booking
    Then the booking status should be "Finalising"
    And the first quote destination should contain "Frankfurt"
    And the last quote destination should contain "Copenhagen"
    And I attempt to cancel the trip safely
