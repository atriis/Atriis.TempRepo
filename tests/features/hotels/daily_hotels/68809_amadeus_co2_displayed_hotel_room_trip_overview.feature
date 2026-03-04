# Test Name: 68809 Amadeus - Co2 is display with value in room level, hotel level and trip overview
# Description: 
# Status: Active
# Labels: Amadeus,Hotel,Regression,CO2,room level,hotel level,Cart,general,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-09T12:22:41Z
# Updated: 2025-10-09T02:05:35Z

@regression @provider:amadeus
Feature: 68809 Amadeus - CO2 emissions displayed in hotel level, room level, and trip overview
  As an environmentally-conscious corporate traveler using Amadeus
  I want to see CO2 emission data at hotel level, room level, and in the trip overview
  So that I can make sustainable booking choices

  @priority:high
  Scenario: CO2 data is visible throughout the Amadeus hotel booking flow
    Given I am logged in as "amadeus" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Amsterdam" for 1 night
    Then the CO2 emissions should be displayed in hotel level results
    And I select the first hotel result
    Then the CO2 emissions should be displayed in room level results
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    And the CO2 emissions should be displayed in the trip overview

