# Test Name: 42353 Sabre - "Holiday Inn Sutton" is displaying rates
# Description: 
# Status: Active
# Labels: Sabre,Hotel,rates,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-02-13T02:52:36Z
# Updated: 2025-11-27T11:40:10Z

@regression @provider:sabre
Feature: 42353 Sabre - Wait for hotel rates and filter results
  As a corporate traveler using Sabre
  I want to search for a hotel, wait for rates to load, filter and view rates
  So that I can see available hotel rates after content loads

  @priority:medium
  Scenario: Hotel rates load and results can be filtered in Sabre
    Given I am logged in as "sabrin@orly.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Holiday Inn London - Sutton by IHG, Gibson Road, London, UK" for 1 night
    And I wait to see view rates text in results page
    When I filter hotel results by hotel name "holiday inn.*sutton"
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"