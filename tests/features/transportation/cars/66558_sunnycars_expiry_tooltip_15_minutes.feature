# Test Name: 66558- SunnyCars> expiry fix number of minutes in the tool tip- 15
# Labels: Cars, SunnyCars Regression, location, Regression
# Owner: pini harush
# Created: 2025-09-07T01:23:06Z
# Updated: 2026-01-06T01:10:34Z

@regression @cars @sunnycars
Feature: 66558 SunnyCars expiry tooltip minutes validation

  As a SunnyCars traveler
  I want the expiry tooltip to show the correct number of minutes
  So that I know when my quote will expire

  Background:
    Given I am logged in as "kaylesun" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Verify SunnyCars expiry tooltip shows 15 minutes
    When I search for a car at "Palma de Mallorca, (PMI) Spain"
    And I complete reference fields and proceed
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    # TODO: Verify expiry tooltip displays 15 minutes countdown
