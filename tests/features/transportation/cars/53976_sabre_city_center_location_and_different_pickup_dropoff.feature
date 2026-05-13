# Test Name: 53976 [Merge] Sabre - Car - When searching for can in city center, location name and address are displayed, and pick up and drop off locations are different when searching for different locations
# Description:
# Status: Active
# Labels: Regression,Sabre,Cars,merge,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-11-06T01:48:33Z
# Updated: 2025-07-16T05:58:08Z
@regression @cars @provider:sabre
Feature: 53976 Sabre city-center station details and different pickup and drop-off locations
  As a corporate traveler
  I want city-center search results to show station details and distinct locations
  So that different-location Sabre searches remain correct

  @priority:high
  Scenario: Search different pickup and drop-off locations and validate city-center station details
    Given I am logged in as "penelopecruz@sabre.car" booking a new trip
    And I have added myself as the traveler
    When I search for a car from "London,United Kingdom,(LON)" to "Oxford, UK"
    # TODO: Map Testim precondition Car___Results___Wait_for__Select__text() to an existing city-center wait step if required.
    # TODO: Map the station name/address assertions from the first vendor station list row.
    When I select the first city center pickup location
    # TODO: Preserve the second Select action and CSS-prop validation from the Testim flow.
    # TODO: Map the pickup location text assertion on results after selection.
