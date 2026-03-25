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
    # TODO: Add third traveler by name
    # Testim: add_third_traveller('Brunao Oliveira')
    # Existing step handles one additional traveler — need to add a second
    # Reuse: Given I have added traveler by name "Brunao Oliveira"
    And I have added traveler by name "Brunao Oliveira"
    When I search for a one way flight from "LON" to "BER"
    And I wait for add to trip text to be visible
    # TODO: Type price filter value "500" in results
    # Testim: page.type("#el-id-5422-414", '500')
    # TODO: Verify no OOP for price under threshold (negative element validation)
    # Testim: Converting a 'negative-element-validation' step — manual
    And I click to open first pricing options
    # TODO: Verify no OOP in pricing options (negative element validation)
    # Testim: Converting a 'negative-element-validation' step — manual
