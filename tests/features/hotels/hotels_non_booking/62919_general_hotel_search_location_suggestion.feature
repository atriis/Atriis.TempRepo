# Test Name: 62919 Hotels - 'Woking' location appears as a suggested location
# Description: 
# Status: Active
# Labels: Hotel,general,search,location,Regression,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-06-04T03:50:49Z
# Updated: 2025-06-04T07:28:24Z

@regression @provider:general
Feature: 62919 Hotels - 'Woking' location appears as a suggested location
  As a corporate traveler
  I want to start typing word in the hotel search field and see all the relevant locations in the dropdown

  @priority:low
  Scenario: 'Woking' location appears as a suggested location
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I type "Woking" in the hotel search location field
    Then "Woking" should appear as a location suggestion in the dropdown