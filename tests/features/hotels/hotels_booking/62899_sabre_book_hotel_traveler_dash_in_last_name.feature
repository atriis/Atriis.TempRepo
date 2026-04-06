# Test Name: 62899 Sabre - Hotel - Booking is successful for a passenger with last name that has a dash (-)
# Description: 
# Status: Active
# Labels: Sabre,Hotel,Regression,Full Purchase,name,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-06-04T07:14:03Z
# Updated: 2025-11-10T01:37:06Z

@regression @provider:sabre
Feature: 62899 Sabre - Book hotel for traveler with dash in last name
  As a travel arranger
  I want to book a hotel for a traveler whose last name contains a dash
  So that traveler names with special characters are handled correctly

  @priority:medium
  Scenario: Hotel booking succeeds for traveler with hyphenated last name
    Given I am logged in as "robsoncruz" booking a new trip
    And I have added traveler by name "Ana Antonoli-Carto"
    When I search for a hotel in "Denver" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip