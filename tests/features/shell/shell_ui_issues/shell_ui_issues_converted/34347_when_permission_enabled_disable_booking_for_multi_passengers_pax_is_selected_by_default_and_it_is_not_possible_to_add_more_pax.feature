# Test Name: 34347 When permission enabled "Disable booking for multi passengers", pax is selected by default and it is not possible to add more pax
# Description:
# Status: Active
# Labels: Regression,No Amadeus Hotel Book,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-08-09T08:16:12Z
# Updated: 2023-08-09T08:35:56Z

@regression @shell @ui_issues @traveler @permissions
Feature: 34347 - When permission "Disable booking for multi passengers" is enabled, the pax is selected by default and it is not possible to add more pax
  As a user belonging to a company with the "Disable booking for multi passengers" permission enabled
  I want my own profile to be selected as the traveler by default on a new trip
  So that bookings are restricted to a single passenger and I cannot add more

  Scenario: The logged-in user is preselected as the only traveler
    Given I am logged in as "jessicacasellas@disablemultipassanger.com" booking a new trip
    Then the selected traveler should be "Jessica Casellas" by default
    And the star icon should be visible
    # TODO: assert that adding more passengers is not possible — proposed step "Then it should not be possible to add more travelers" (needs Search DSL method verifying the add traveler control is hidden/disabled). The Testim script does not exercise this action, so it is left as a TODO per the test title.
