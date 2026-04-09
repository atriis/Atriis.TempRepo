# Test Name: 56625 Car billback-allow checkbox/fop
# Labels: Cars, Regression, Sanity, Car billback
# Owner: pini harush
# Created: 2025-01-09T01:31:04Z
# Updated: 2025-09-02T07:22:48Z

@regression @cars @sanity @billback
Feature: 56625 Car billback checkbox and FOP validation

  As a corporate travel manager
  I want to verify billback options are correctly displayed in cart
  So that payment methods are properly managed

  Background:
    Given I am logged in as "oop" booking a new trip
    And I have added myself as the traveler
    And I have selected Sixt as the rental agency

  @priority:high
  Scenario: Verify billback allow checkbox and FOP in cart
    When I search for a car at "LHR"
    And I proceed after car search with warning
    And I add the first car to cart
    # TODO: Request car billback and verify checkbox/FOP display in cart
