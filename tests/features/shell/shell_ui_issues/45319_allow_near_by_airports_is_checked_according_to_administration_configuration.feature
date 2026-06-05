# Test Name: 45319 "Allow near by airports" is checked according to administration configuration
# Description:
# Status: Active
# Labels: Regression,Flights,Administration,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-04-26T08:23:20Z
# Updated: 2024-04-26T08:33:39Z

@regression @shell @flights @administration
Feature: 45319 - "Allow near by airports" is checked according to administration configuration
  As a corporate traveler
  I want the "Allow nearby airports" checkbox in the flight search advanced options to reflect the administration configuration
  So that the search behaviour is consistent with the settings configured by the administrator

  Scenario: Allow nearby airports checkbox is checked when enabled in administration
    Given I am logged in as "ruimendes@amadeus.com" booking a new trip
    When I click on the flight tab
    Then the "Allow nearby airports" checkbox in the advanced flight search should be checked
