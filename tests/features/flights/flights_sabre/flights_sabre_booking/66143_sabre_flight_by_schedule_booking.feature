# Test Name: 66143 Sabre - Flight - By Schedule booking
# Status: Active
# Labels: Flights,Full Purchase,by schedule,Regression,Sabre,Cancel by process,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-08-29T07:54:42Z
# Updated: 2026-01-19T07:49:30Z

@regression @flights @sabre @by-schedule @full-purchase @cancel-by-process
Feature: 66143 Sabre - Flight by schedule booking
  As a corporate traveler
  I want to book a Sabre flight using the by schedule search
  So that I can select specific segments and complete the booking

  Scenario: Sabre flight by schedule booking is successful
    Given I am logged in as "brunasabre@froschbrunaautomation.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "LAS" to "SAN"
    And flight results should be available
    When I select flight segments by schedule
    And I wait for "Your Selection" text to be visible
    And I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
