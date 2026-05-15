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

  Scenario: Results and pricing option prices match for 1 pax and 2 pax
    Given I am logged in as "ypsilon@club.com" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "AMS" to "BCN"
    Then flight results should be available
    When I filter airline results by "Vueling Airline" checkbox
    Then flight results should be available
    # Verify prices match for 1 pax
    When I extract the price from first pricing option
    # TODO: Extract price from results page first flight and compare with pricing options price (tolerance 0.98)
    And I click to open first pricing options
    And I extract the price from first pricing option
    And I close pricing options modal
    # TODO: Verify the results price and pricing options price are equal within tolerance
    # Now add a second traveler and search again
    # TODO: Navigate back to search via breadcrumbs and add a second random guest traveler
    # TODO: Click search button again
    Then flight results should be available
    When I filter airline results by "Vueling Airline" checkbox
    Then flight results should be available
    # Verify prices match for 2 pax
    # TODO: Extract prices from results and pricing options for 2 pax and compare (tolerance 0.98)
