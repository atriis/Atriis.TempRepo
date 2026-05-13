# Test Name: 62893 Galileo - Advanced Search - "Search" button works for multicity flight and hotel search
# Status: Active
# Labels: Regression,Galileo,Flights,Advanced search,multi city,Hotel,multiproducts,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-06-03T07:47:33Z
# Updated: 2025-09-14T12:47:02Z

@regression @galileo @flights @multi_city @advanced_search
Feature: 62893 Galileo - Search button works for multicity flight and hotel

  As a corporate traveler
  I want the search button to work for multi-city flights with hotel
  So that I can search complex itineraries

  Scenario: Multi-city flight search with 3 legs and parallel hotel returns results
    Given I am logged in as "bsgalileoflight@galileoflight.com" booking a new trip
    And I have added myself as the traveler
    And I click on the flight tab and check Add hotel to this trip
    When I search for a multi-city flight with legs "SAL-MEX" and "MEX-GDL" and "GDL-SAL"
    Then flight results should be available
