# Test Name: 72504: OBT - Unused Tickets - Hide type MCO
# Status: Active
# Labels: Sabre,unused tickets,Regression,Flights,2026 plan 2,Frosch
# Owner: Noam Miller
# Created: 2026-01-12T11:21:29Z
# Updated: 2026-02-15T08:36:46Z

@regression @flights @sabre @unused-tickets
Feature: 72504 Sabre - Unused tickets hide type MCO
  As a corporate traveler
  I want MCO type unused tickets to be hidden
  So that only relevant unused tickets are displayed

 # BLOCKED: could not finish checkout part because of booking errors
  Scenario: MCO type unused tickets are hidden in search, results and booking details pages
    Given I am logged in as "unusedTkt@corp.frosch" booking a new trip
    And I have added myself as the traveler
    When I click the airplane icon next to the traveler to view unused tickets
    Then MCO unused tickets should be hidden
    When I close the unused tickets modal
    When I search for a one way flight from "AUS" to "ORD"
    And flight results should be available
    When I click the airplane icon in the results header to view unused tickets
    Then MCO unused tickets should be hidden
    When I close the unused tickets modal
    When I click "View details" on the unused tickets banner
    Then MCO unused tickets should be hidden
    When I close the unused tickets modal
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    When I check the unused ticket checkbox on checkout
    Then MCO unused tickets should be hidden on checkout
    Then the quote destination should contain "Flight to"
    Then I successfully cancel the trip
