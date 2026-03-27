# Test Name: 64455 Flights - Corporate content limitation 'Only Search With' is applied
# Status: Active
# Labels: Flights,general,Regression,Administration,results,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-07-16T09:23:13Z
# Updated: 2025-07-16T10:01:21Z

@regression @flights @general @admin
Feature: 64455 Flights - Corporate content limitation Only Search With is applied
  As a TMC administrator
  I want the 'Only Search With' content limitation to restrict airline results
  So that only approved airlines appear in search results

  # TODO: New user needed — brunasantos@corptlcsabre.com → USER_BRUNATLS
  # Add to .env: USER_BRUNATLS="brunasantos@corptlcsabre.com"

  Scenario: Only configured airline results are displayed when content limitation is applied
    Given I am logged in as "brunatls" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "NYC"
    And flight results should be available
    # TODO: Step needed for "Verify only BA airline icon is displayed in the results grid"
    # TODO: Step needed for "Verify all results are from BA only"
