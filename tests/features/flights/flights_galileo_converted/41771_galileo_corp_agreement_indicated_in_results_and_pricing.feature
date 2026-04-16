# Test Name: 41771 Galileo - Flights - Corp agreement is indicated in results page and pricing options
# Status: Active
# Labels: Regression,Galileo,Filters,Agreement,Flights,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-03-13T08:48:10Z
# Updated: 2025-08-19T12:58:26Z

@regression @galileo @flights @agreement
Feature: 41771 Galileo - Corp agreement indicated in results and pricing options

  As a corporate traveler
  I want to see corporate agreement indicators in results and pricing options
  So that I can identify negotiated rates

  Scenario: Corporate agreement indicator is visible in results and pricing options
    Given I am logged in as "victorvinicius" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LAX" to "BOS"
    And I wait for flight results to be available
    And I filter results by carrier "DL"
    # TODO: Verify agreement indicator is visible in results (Testim: isVisible(page, ".flight-list > :nth-child(1) [draggable='true']"))
    And I click on "Pricing Options" for the first result
    # TODO: Verify agreement indicator is visible in pricing options (Testim: isVisible(page, ".flicking-camera > :nth-child(1) [draggable='true']"))
    Then the agreement indicator should be visible in the pricing page
