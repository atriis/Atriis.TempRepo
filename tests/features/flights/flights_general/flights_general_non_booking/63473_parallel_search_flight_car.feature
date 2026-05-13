# Test Name: 63473: Parallel Search - Flight with Car - User redirected to car results after selecting from pricing options
# Status: Active
# Labels: Gray Dawes,Parallel,Flights,Cars,Galileo,Regression,Transportation,2026 plan 2
# Owner: Noam Miller
# Created: 2025-06-19T04:05:07Z
# Updated: 2025-06-22T08:49:01Z

@regression @flights @general @parallel-search @cars
Feature: 63473 Flights - Parallel search redirect to car results after pricing options
  As a corporate traveler searching for flights with parallel car search
  I want to be redirected to car results after selecting from pricing options
  So that I can complete both bookings efficiently

  Scenario: User redirected to car results after selecting from flight pricing options
    Given I am logged in as "carCorp@gdg.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "PAR" with parallel car search
    And flight results should be available
    And I click to open first pricing options
    And I select the first option from pricing options
    Then I should see the heading "Flight To London"
    And I select the first option from pricing options
    And I add to trip from pricing options
    Then the "Rental Agency" filter should be visible in car results