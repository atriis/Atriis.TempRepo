# Test Name: 56122 Amadeus - Travel Policy - Multipax - OOP is triggered correctly for multipax
# Description:
# Status: Active
# Labels: Regression,Amadeus,Travel policy,multi pax,Flights,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-12-31T08:37:43Z
# Updated: 2024-12-31T09:34:51Z

@regression @flights @amadeus @travel-policy @multi-pax @oop
Feature: 56122 Amadeus - Multi-pax OOP triggered correctly
  As a corporate traveler
  I want OOP to be triggered correctly when booking for multiple passengers
  So that the travel policy applies to all travelers in the trip

  Scenario: OOP is triggered for multi-pax flight search
    Given I am logged in as "bruninaita" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "Bruna Samara"
    And I have added traveler by name "Brunao Oliveira"
    When I search for a one way flight from "LON" to "BER"
    And I wait for add to trip text to be visible
    Then the out of policy indicator should not be visible in results
    And I click to open first pricing options
    Then the out of policy indicator should not be visible in results
