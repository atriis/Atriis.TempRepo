# Test Name: 58633 Cars - Travel Policy - In case car initiator is corporate user, restrict result (CITY CENTER search)
# Labels: Cars, general, Regression, Travel policy, OOP
# Owner: Bruna Santos
# Created: 2025-02-25T10:08:35Z
# Updated: 2026-02-03T01:49:09Z

@regression @cars @travel-policy @oop
Feature: 58633 Corporate user travel policy OOP restriction city center

  As a corporate traveler with travel policy restrictions
  I want to see OOP indicators for city-center car searches
  So that I understand when cars don't meet corporate policy

  Background:
    Given I am logged in as "michaelburt@sabre.car" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Verify OOP indicator on city-center car search results
    When I have selected a rental agency
    And I search for a car at "London, UK"
    And I proceed after car search
    And I select one flight segment by schedule
    Then the out of policy indicator should be visible in results
