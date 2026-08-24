# Test Name: 37290 [Merge] Evolvi - Can select "NCL" location and departure city is correct on Delivery Method (TOD) section
# Description:
# Status: Active
# Labels: Regression,merge,Rail,Evolvi,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-10-23T03:22:12Z
# Updated: 2025-09-14T08:45:49Z
@transportation @rails @evolvi @regression
Feature: 37290 [Merge] Evolvi - Can select "NCL" location and departure city is correct on Delivery Method (TOD) section
  As a corporate traveler
  I want to search Evolvi with NCL location
  So that departure city appears correctly in the delivery method section

  Scenario: NCL search and TOD departure city validation
    Given I am logged in as "thiagosantos@evolvi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "nclTo105"
    And I acknowledge the push notification
    And I add an Evolvi one way to the trip
    Then I should see route that contains "Newcastle" to "Lichfield"
    When I expand delivery method in extras section
    Then "Newcastle" is displayed in "Atriis - Ticket on Departure (Collect at Station)" field
