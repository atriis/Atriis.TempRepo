# Test Name: 59292 Cars - Agreement logo is displayed when hovering over agreement
# Labels: Cars, Regression, Agreement, general
# Owner: Bruna Santos
# Created: 2025-03-13T11:31:02Z
# Updated: 2025-07-07T09:43:23Z

@regression @cars @agreement
Feature: 59292 Cars - Agreement logo is displayed when hovering over agreement

  As a traveler viewing car agreements
  I want to see the agreement logo when hovering over the agreement text
  So that I can identify which rental company the agreement is with

  @priority:high
  Scenario: Verify agreement logo displays on hover in car results
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "Zurich, (ZRH) Switzerland" with rental agency "Avis"
    And I wait for add to trip text to be visible
    And I hover over the agreement in the first car result
    Then the car results agreement tooltip should display the logo for "Avis Europack Rate - TESTIM - do not touch"
