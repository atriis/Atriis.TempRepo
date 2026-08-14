# Test Name: 46785 Evolvi - When adding multipax, there is no option to select only 1 traveller in search
# Description:
# Status: Active
# Labels: multi pax,multi PTC,Regression,Daily Transportation,Rail,Evolvi,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-06-05T07:51:20Z
# Updated: 2026-02-03T05:36:16Z
@transportation @rails @evolvi @regression
Feature: 46785 Evolvi - Multi traveler search should not show single traveler-only option
  As a corporate traveler
  I want to add multiple travelers in Evolvi search
  So that traveler selection options match multipax behavior

  Scenario: Multipax traveler selection validations in Evolvi search
    Given I am logged in as "corp@evolvi.com" booking a new trip
    When I select UK Rail in the search form
    And I have added myself as the traveler
    And I have added a random guest traveler
    And I have added traveler by name "Fabio Torres"
    Then the single traveler-only option should not be displayed in Evolvi search
