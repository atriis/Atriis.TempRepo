# Test Name: 57185 Avis: Arrival flight info mandatory for specific locations
# Labels: Gray Dawes, Galileo, Cars, Cart, Flights, Regression
# Owner: Noam Miller
# Created: 2025-01-21T08:12:14Z
# Updated: 2026-02-16T05:07:50Z

@regression @cars @flights @galileo @hybrid
Feature: 57185 Avis arrival flight info mandatory for specific locations

  As a multi-product traveler using Avis rentals
  I want to provide arrival flight information for specific rental locations
  So that the rental company can coordinate pick-up with my flight

  Background:
    Given I am logged in as "carCorp" booking a new trip

  @priority:high
  Scenario: Verify Avis arrival flight info required for specific locations
    # TODO: Case 1: Validate arrival flight info is mandatory for specific Avis locations
    # TODO: Case 2: Validate alternative scenarios for arrival flight info
