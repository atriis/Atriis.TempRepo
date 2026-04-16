# Test Name: 54024 Galileo - Flight - Display Rules - Hiding carrier results works
# Status: Active
# Labels: Galileo,Regression,Flights,carrier,display rules,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-02-12T07:14:13Z
# Updated: 2025-06-17T11:44:56Z

@regression @galileo @flights @display_rules
Feature: 54024 Galileo - Display rules hiding carrier results works

  As a corporate traveler
  I want restricted carriers to be disabled in search results
  So that company display rules are enforced

  Scenario: Restricted carriers show disabled selection and allowed carrier can be added to cart
    Given I am logged in as "beatrizpamplonacorp" booking a new trip
    And I have added myself as the traveler
    # TODO: Search_flights_one_way___nonstop — search one way with nonstop filter from "DUB" to "MAD"
    # Need new step: When I search for a one way nonstop flight from "DUB" to "MAD"
    When I search for a one way flight from "DUB" to "MAD"
    And I filter results by carrier "FR"
    # TODO: Hover over Add to trip button and verify tooltip "Selection is disabled due to your company settings"
    And I filter results by carrier "EI"
    # TODO: Hover over Add to trip button and verify tooltip "Selection is disabled due to your company settings"
    And I filter results by carrier "IB"
    And I add the first flight to cart
