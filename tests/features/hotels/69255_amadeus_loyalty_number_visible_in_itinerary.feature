# Test Name: 69255 Amadeus - Hotel - Loyalty Number is displayed in Itinerary
# Description: 
# Status: Active
# Labels: Hotel loyalty number,Regression,Amadeus,Hotel,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-24T06:02:18Z
# Updated: 2025-10-27T01:58:00Z

@regression @provider:amadeus
Feature: 69255 Amadeus - Loyalty number added and visible in share itinerary
  As a corporate traveler
  I want to add my loyalty number and see it reflected in the shared itinerary
  So that my loyalty points are tracked and visible to the travel recipient

  @priority:medium
  Scenario: Loyalty number added to booking is visible in shared itinerary email
    Given I am logged in as "bruna_nlgov" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I click proceed button if visible
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I add loyalty number "BB10101010" using the first available chain
    When I click the share itinerary button
    Then "BB10101010" should be displayed in the share email preview