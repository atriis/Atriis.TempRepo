# Test Name: 66127 United NDC - Flight - By Schedule booking from Pricing Options
# Description:
# Status: Active
# Labels: UA ndc,United,by schedule,Flights,Regression,Pricing Options,additional pricing options,NDC,Full Purchase,2026 plan 2,03
# Owner: Bruna Santos
# Created: 2024-08-01T09:08:10Z
# Updated: 2025-09-29T06:17:38Z

@regression @flights @ndc @united @by-schedule @pricing-options @full-purchase
Feature: 66127 United NDC - By Schedule booking from Pricing Options

  As a corporate traveler
  I want to book a United NDC flight by schedule selecting from pricing options
  So that I can choose specific flight segments for my round trip

  Scenario: Book a round trip by schedule selecting segments from pricing options
    Given I am logged in as "bsua@bsua.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "LAX" to "EWR"
    And I click to open first pricing options
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I wait for the change flight button to be visible
    And I click to open first pricing options
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I wait for "Your Selection" text to be visible
    And I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I hold the trip
    Then I successfully cancel the trip
