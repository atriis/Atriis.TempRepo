# Test Name: 48696 Ypsilon - Correct price per ticket in Pricing Options, when separate tickets for multi travelers
# Description:
# Status: Active
# Labels: Regression,Ypsilon,separate tickets,Pricing Options,multi PTC,multi pax,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-07-17T10:25:49Z
# Updated: 2026-01-09T01:59:28Z

@regression @flights @ypsilon @pricing-options @multi-pax @separate-tickets
Feature: 48696 Ypsilon - Correct price per ticket in pricing options for multi travelers
  As a corporate traveler using Ypsilon
  I want to see correct per-ticket pricing in pricing options with separate tickets
  So that prices are consistent between results and pricing options for single and multi pax

  Scenario: Results and pricing option prices match for 1 pax
    Given I am logged in as "ypsilon@corp.ams" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "AMS" to "BCN" with outbound on a "thursday" and inbound the next day
    Then flight results should be available
    When I filter airline results by "Multi carrier" checkbox
    When I extract the price from first flight result
    And I click to open first pricing options
    And I extract the price from first pricing option
    And I close pricing options modal
    Then the extracted price at index 0 should equal the extracted price at index 1 within tolerance

  Scenario: Results and pricing option prices match for 2 pax
    Given I am logged in as "ypsilon@corp.ams" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a round trip flight from "AMS" to "BCN" with outbound on a "thursday" and inbound the next day
    Then flight results should be available
    When I filter airline results by "Multi carrier" checkbox
    When I extract the price from first flight result
    And I click to open first pricing options
    And I extract the price from first pricing option
    Then the extracted price at index 0 should equal the extracted price at index 1 within tolerance
