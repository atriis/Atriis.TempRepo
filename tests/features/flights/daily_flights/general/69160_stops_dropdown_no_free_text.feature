# Test Name: 69160 Flight - Advanced Search - Free text is not allowed in 'Stops' dropdown field
# Status: Active
# Labels: Regression,general,Flights,Advanced search,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-21T05:18:03Z
# Updated: 2025-10-21T05:47:12Z

@regression @flights @general @advanced-search
Feature: 69160 Flights - Free text not allowed in Stops dropdown field
  As a corporate traveler using advanced search
  I want the Stops dropdown to not accept free text input
  So that only valid stop options can be selected

  Scenario: Free text is not allowed in Stops dropdown field
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    When I click advanced search in the flight search form
    Then free text "aaaaa" should not be accepted in the flight search stops dropdown