# Test Name: 59292 Cars - Agreement logo is displayed when hovering over agreement
# Labels: Cars, Regression, Agreement, general
# Owner: Bruna Santos
# Created: 2025-03-13T11:31:02Z
# Updated: 2025-07-07T09:43:23Z

@regression @cars @agreement
Feature: 59292 Agreement logo displays on hover

  As a traveler viewing car agreements
  I want to see the agreement logo when hovering over the agreement text
  So that I can identify which rental company the agreement is with

  Background:
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Verify agreement logo displays on hover in car results
    When I search for a car at "Zurich, (ZRH) Switzerland" with Avis rental agency
    # TODO: Verify agreement logo displays when hovering over agreement in results
