# Test Name: 47724 Galileo - Car images displayed correctly in results page
# Labels: Galileo, Cars, Regression, GDS, hybrid, results
# Owner: Bruna Santos
# Created: 2025-09-05T02:46:55Z
# Updated: 2025-09-05T02:57:27Z

@regression @cars @galileo @gds @hybrid
Feature: 47724 Galileo car images display in results

  As a Galileo car traveler
  I want to see car images displayed correctly in search results
  So that I can visually identify the rental car options

  Background:
    Given I am logged in as "beatrizpamplonacorp@galileo.com" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Verify car images display correctly in Galileo results
    When I search for a car at "Zurich, (ZRH) Switzerland"
    # TODO: Verify car images are displayed correctly in results page
