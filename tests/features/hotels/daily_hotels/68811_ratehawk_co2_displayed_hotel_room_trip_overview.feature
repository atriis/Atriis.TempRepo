# Test Name: 68811 Ratehawk - Co2 is display with value in room level, hotel level and trip overview
# Description: 
# Status: Active
# Labels: Hotel,CO2,room level,hotel level,Cart,general,Ratehawk Regression,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-09T11:54:17Z
# Updated: 2025-10-30T03:28:13Z

@regression @provider:ratehawk
Feature: 68811 Ratehawk - CO2 emissions displayed in hotel level, room level, and trip overview
  As an environmentally-conscious corporate traveler using Ratehawk
  I want to see CO2 emission data at hotel level, room level, and in the trip overview
  So that I can make sustainable booking choices

  @priority:high
  Scenario: CO2 data is visible throughout the Ratehawk hotel booking flow
    Given I am logged in as "ratehawk" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    Then the CO2 emissions should be displayed in hotel level results
    And I select the first hotel result
    Then the CO2 emissions should be displayed in room level results
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    And the CO2 emissions should be displayed in the trip overview


