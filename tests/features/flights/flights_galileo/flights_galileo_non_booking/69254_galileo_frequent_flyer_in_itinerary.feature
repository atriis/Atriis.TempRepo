# Test Name: 69254 Galileo - Flight - Frequent Flyer number is displayed in Itinerary
# Status: Active
# Labels: Flights,Galileo,GDS,Regression,Frequent flyer,Share Itinerary,FQTV,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-24T05:33:56Z
# Updated: 2025-10-27T12:57:48Z

@regression @galileo @flights @frequent_flyer @share_itinerary
Feature: 69254 Galileo - Frequent flyer number displayed in itinerary

  As a corporate traveler
  I want my frequent flyer number to appear in the shared itinerary
  So that loyalty information is included when sharing

  Scenario: Frequent flyer number is visible in shared itinerary
    Given I am logged in as "bsgalileoflight" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "LIS" to "ATH"
    And flight results should be available
    And I filter airline results by "Aegean Airlines" checkbox
    And I add the first flight to cart
    When I click frequent flyer in extras
    And I add loyalty number "BB10101010" using airline "Aegean Airlines"
    Then I should see a success notification
    And I click the share itinerary button
    Then "***1010" should be displayed in the share email preview
