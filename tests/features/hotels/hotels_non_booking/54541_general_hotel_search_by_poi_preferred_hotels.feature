# Test Name: 54541 - Preferred Hotel linked to Point of Interest
# Description: 
# Status: Active
# Labels: Club,Hotel,Preferred Hotels,search,Regression,Point of interest,2026 plan 1
# Owner: Noam Miller
# Created: 2024-11-21T06:58:46Z
# Updated: 2025-09-14T09:35:59Z

@regression @provider:general
Feature: 54541 General - Hotel search by Point of Interest shows preferred hotels
  As a corporate traveler
  I want to search for hotels near a point of interest
  So that I can find preferred hotels in convenient locations

  @priority:medium
  Scenario: Hotel search by POI returns preferred hotels
    Given I am logged in as "poicorp@club.com" booking a new trip
    When I search for a hotel by point of interest
    And I wait to see view rates text in results page
    Then the first 2 hotels should have the corporate preferred badge
    And the first 2 hotels should match /(Beverly Hills Marriott)|(The Tangerine)/