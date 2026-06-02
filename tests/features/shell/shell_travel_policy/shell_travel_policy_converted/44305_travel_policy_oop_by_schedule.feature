# Test Name: 44305 Travel Policy - OOP indication is displayed in flight search by schedule pricing options
# Description:
# Status: Active
# Labels: Regression,Travel policy,Search Flight,Flights,by schedule,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-03-28T10:36:34Z
# Updated: 2024-09-12T11:34:38Z

@regression @travel_policy @flights @by_schedule @shell
Feature: 44305 Travel Policy - OOP indication in by-schedule pricing options

  As a corporate traveler
  I want to see the OOP indicator when selecting flights by schedule that violate policy
  So that I am aware of policy violations before proceeding

  Scenario: OOP badge is displayed after selecting outbound and inbound by schedule
    Given I am logged in as "viniciusjusten@oop.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "LIS" to "AMS"
    And I select one flight segment by schedule
    And I select one flight segment by schedule
    Then the out of policy indicator should be visible in results
