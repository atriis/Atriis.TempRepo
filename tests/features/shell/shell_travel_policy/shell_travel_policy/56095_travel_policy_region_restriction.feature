# Test Name: 56095 Travel Policy - Restricting specific region works as expected
# Description:
# Status: Active
# Labels: Regression,Travel policy,restriction,Flights,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-12-30T09:51:27Z
# Updated: 2024-12-30T10:47:03Z

@regression @travel_policy @flights @restriction @shell
Feature: 56095 Travel Policy - Region restriction works as expected

  As a corporate traveler
  I want the system to restrict travel to specific banned regions
  So that I cannot book flights to restricted destinations

  Scenario: Flights to restricted region show no OOP badge but results are available
    Given I am logged in as "iancurtis@bannedregionoop.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LHR" to "SVD"
    And flight results should be available
    Then the out of policy indicator should not be visible in results