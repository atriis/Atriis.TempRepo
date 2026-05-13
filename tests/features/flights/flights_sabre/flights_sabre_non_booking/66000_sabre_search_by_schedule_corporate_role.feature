# Test Name: 66000 Sabre - Search By Schedule - Corporate Role 'Use New Flight Booking Flow' added
# Description: The privilege 'Must Use Flights Pricing Options' must be assigned to the Booker role in administration.
# Status: Active
# Labels: Regression,Sabre,results,Role,2026 plan 2
# Owner: Sónia Sousa
# Created: 2025-08-25T12:48:29Z
# Updated: 2025-09-23T02:21:43Z

@regression @flights @sabre @by-schedule @role
Feature: 66000 Sabre - Search By Schedule with corporate role Use New Flight Booking Flow
  As a corporate traveler with the Use New Flight Booking Flow privilege
  I want to search by schedule and see pricing options after selecting a flight
  So that I can select fares from pricing options before adding to trip

  Scenario: Search by schedule shows Select Flight button and pricing options after selection
    Given I am logged in as "sabreuser@soniatest.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "AMS" to "CDG"
    And flight results should be available
    Then the Select Flight button should be visible in results
    And the Add to trip and Pricing Options buttons should not be visible in results
    When I select one flight segment by schedule
    And I select the first option from pricing options
    And I confirm the pricing option for the current segment
    Then the Select Flight button should be visible in results
    And the Add to trip and Pricing Options buttons should not be visible in results
    When I select one flight segment by schedule
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I wait for "Your Selection" text to be visible
    And I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"
