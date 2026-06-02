# Test Name: 49287 Flight - Travel Policy - Can select the flight with travel policy with specific time
# Description:
# Status: Active
# Labels: Travel policy,Regression,Flights,time,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-02-07T07:53:09Z
# Updated: 2025-06-17T11:33:57Z

@regression @travel_policy @flights @shell
Feature: 49287 Travel Policy - OOP triggered for specific departure time

  As a corporate traveler
  I want the system to trigger OOP when a flight departs before the allowed time
  So that time-based travel policies are correctly enforced

  Scenario: OOP badge and tooltip show time-based policy violation
    Given I am logged in as "jeffsan@travelpolicy.com" booking a new trip
    And I have added myself as the traveler
    # TODO: Need new step "I search for a one way flight from {string} to {string} with departure time {string}" — searches with time preference "Early (04:00-08:00)"
    When I search for a one way flight from "LON" to "MAD"
    Then the out of policy indicator should be visible in results
    And the out of policy tooltip in results should be "Hour of departure Is Before 11:00 Inbound Flight"
    When I add the first flight to cart
    Then I successfully cancel the trip
