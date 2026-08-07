# Test Name: 47577 Galileo - Results are displayed in the map for Enterprise rental agency
# Description:
# Status: Active
# Labels: Regression,Galileo,Cars,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-06-14T10:39:56Z
# Updated: 2026-01-06T11:50:28Z
@regression @cars @provider:galileo
Feature: 47577 Galileo Enterprise car results are displayed in the map
  As a corporate traveler
  I want map results for Enterprise car searches
  So that city-center content can be validated visually

  @priority:high
  Scenario: Search Enterprise cars and verify the map displays results
    Given I am logged in as "renato@cargalileocitycenter.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "Skipton, UK" with rental agency "Enterprise"
    And I wait for select text to be visible
    Then the car results should be displayed in the map matching the results on the page
