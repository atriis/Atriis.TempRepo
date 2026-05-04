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

  # TODO: This test requires step implementations for unused tickets MCO validation
  Scenario: MCO type unused tickets are hidden in search, results and booking details pages
    Given I am logged in as "unusedtkt" booking a new trip
    And I have added myself as the traveler
    # TODO: Step needed: "Then MCO unused tickets should be hidden on search page"
    When I search for a one way flight from "AUS" to "ORD"
    And flight results should be available
    # TODO: Step needed: "Then MCO unused tickets should be hidden on results page"
    When I add the first flight to cart
    When I proceed to checkout
    # TODO: Step needed: "Then MCO unused tickets should be hidden on booking details page"
    Then I successfully cancel the trip
