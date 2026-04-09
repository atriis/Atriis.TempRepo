# Test Name: 67021 City Center Search -  Stations status
# Labels: Cars, SunnyCars Regression, location, Regression
# Owner: Pedro Carneiro
# Created: 2025-09-12T04:33:06Z
# Updated: 2026-02-03T02:38:47Z

@regression @cars @sunnycars
Feature: 67021 City center stations status validation

  As a SunnyCars traveler searching city center locations
  I want to see the status of available rental stations
  So that I can understand which stations are operational

  Background:
    Given I am logged in as "kaylesun" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Verify city center stations status display
    When I search for a car at "Barcelona, Spain (BCN)"
    And I complete reference fields and proceed
    # TODO: Verify stations status is displayed correctly for city center locations
