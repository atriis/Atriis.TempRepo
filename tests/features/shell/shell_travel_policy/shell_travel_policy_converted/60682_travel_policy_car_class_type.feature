# Test Name: 60682 Travel Policy - Car - Sabre - "Car class and type" policy works as expected
# Description:
# Status: Active
# Labels: Travel policy,Regression,Cars,Sabre,OOP,results,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-04-10T07:30:17Z
# Updated: 2025-08-20T10:55:01Z

@regression @travel_policy @cars @sabre @oop @shell
Feature: 60682 Travel Policy - Car class and type policy works as expected

  As a corporate traveler
  I want the car class and type policy to correctly identify allowed car categories
  So that OOP is not triggered when booking an allowed car class

  Scenario: Mini car class does not trigger OOP for Sabre car with Enterprise
    Given I am logged in as "monteirolobato@cartravelpolicygdgsabre.com" booking a new trip
    And I have added myself as the traveler
    When I select rental agency "Enterprise"
    And I search for a car at "LHR"
    # TODO: Wait for car results to display "Showing" text
    And I filter results by "Mini" checkbox
    Then the out of policy indicator should not be visible in results
