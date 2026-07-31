# Test Name: 66047 Amadeus - Car - 'All-inclusive rate' link is not displayed for Amadeus supplier
# Labels: Amadeus, Cars, Regression
# Owner: Bruna Santos
# Created: 2025-08-26T11:39:56Z
# Updated: 2026-01-21T08:58:32Z

@regression @cars @amadeus
Feature: 66047 Amadeus - Car - 'All-inclusive rate' link is not displayed for Amadeus supplier

  As an Amadeus car traveler
  I want all-inclusive rate links to be hidden
  So that only standard rates are visible

  @priority:high
  Scenario: Verify all-inclusive rate link is hidden for Amadeus
    Given I am logged in as "brunasantosnl@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with rental agency "Budget" and 1 months ahead
    And I filter results by "Compact" checkbox
    And I add the first car to cart
    And the booking status should be "Pending booking"
    Then the all-inclusive rate link should not be visible in cart
