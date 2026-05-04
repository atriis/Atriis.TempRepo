# Test Name: 66004 Sabre - Complete Trip - Corporate Role 'Use New Flight Booking Flow' added
# Description: The privilege 'Must Use Flights Pricing Options' must be assigned to the Booker role in administration.
# Status: Active
# Labels: Regression,results,Role,Complete trip,Sabre,2026 plan 2
# Owner: Sónia Sousa
# Created: 2025-08-25T06:22:16Z
# Updated: 2025-09-23T02:07:28Z

@regression @flights @sabre @complete-trip @role
Feature: 66004 Sabre - Complete Trip with corporate role Use New Flight Booking Flow
  As a corporate traveler with the Use New Flight Booking Flow privilege
  I want to complete a trip and see pricing options for both legs
  So that I can select the appropriate fare before adding to trip

  Scenario: Complete trip flow shows pricing options for outbound and inbound
    Given I am logged in as "sabreuser_soniatest" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "AMS" to "CDG"
    And flight results should be available
    # Select outbound - triggers pricing options
    When I click to open first pricing options
    And I select the first option from pricing options
    # Select inbound - triggers pricing options
    When I click to open first pricing options
    And I select the first option from pricing options
    And I add to trip from pricing options
