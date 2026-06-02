# Test Name: 53437 Travel Policy - Outbound and inbound flights are differentiated on a Travel Policy
# Description:
# Status: Active
# Labels: Regression,Travel policy,Administration,OOP,Flights,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-03-13T09:27:09Z
# Updated: 2025-11-26T05:46:11Z

@regression @travel_policy @oop @flights @administration @shell
Feature: 53437 Travel Policy - Outbound and inbound flights differentiation

  As a corporate traveler
  I want the system to differentiate outbound and inbound flights in travel policy rules
  So that policies can be applied to specific flight directions

  Scenario: OOP triggered shows correct flight direction and admin confirms rule options
    Given I am logged in as "emma@iberiaoop.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "MAD"
    # TODO: Sort results by earliest departure
    Then the out of policy indicator should be visible in results
    And the out of policy tooltip in results should be "Any Flight"
    When I navigate to the administration page
    # TODO: Navigate to Travel Policies section
    # TODO: Search for policy "TESTIM_7"
    # TODO: Open the first travel policy rule
    # TODO: Verify the flight direction dropdown contains "Any Flight", "Inbound Flight", "Outbound Flight"
