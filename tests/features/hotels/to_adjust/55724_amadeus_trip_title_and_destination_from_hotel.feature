# Test Name: 55724 Only hotel in the trip- calculate the destination
# Description: 
# Status: Active
# Labels: Amadeus,Hotel,Regression,2026 plan 1
# Owner: pini harush
# Created: 2024-12-26T12:04:28Z
# Updated: 2026-01-06T09:25:43Z

@regression @provider:amadeus
Feature: 55724 Amadeus - Trip title and destination set from hotel booking
  As a corporate traveler
  I want the trip title and destination to be automatically set from the hotel I book
  So that my trip is properly labelled with the hotel's city

  @priority:medium
  Scenario: Trip title and destination are populated from hotel booking
    Given I am logged in as "amadeus" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Leonardo Plana Ashdod" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    # TODO: Create step "Then the trip title should contain the hotel city" that calls DSL verifyTripTitle in Trip.js
    # TODO: Create step "Then the trip destination should be set to the hotel city" that calls DSL verifyTripDestination in Trip.js

