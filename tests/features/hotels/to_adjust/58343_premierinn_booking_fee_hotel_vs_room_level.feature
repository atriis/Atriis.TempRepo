# Test Name: 58343 Premier Inn - Booking fee corresponds to the one configured in administration
# Description: 
# Status: Active
# Labels: Premier Inn Regression,Hotel,booking fee,room level,hotel level,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-02-14T07:42:36Z
# Updated: 2025-02-14T08:22:14Z

@regression @provider:premierinn
Feature: 58343 Premier Inn - Booking fee consistent between hotel level and room level
  As a corporate traveler booking a Premier Inn
  I want the booking fee shown in hotel level to match the booking fee in room level
  So that I have accurate pricing information throughout the booking flow

  @priority:medium
  Scenario: Booking fee shown in hotel level matches booking fee in room level
    Given I am logged in as "bruna_premier" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LHR" for 1 night
    # TODO: Create step "When I extract the booking fee from hotel level results" that calls DSL extractBookingFeeHotelLevel in HotelSearch.js
    And I select the first hotel result
    # TODO: Create step "Then the booking fee in room level should match the hotel level booking fee" that calls DSL compareBookingFees in RoomLevelResults.js
