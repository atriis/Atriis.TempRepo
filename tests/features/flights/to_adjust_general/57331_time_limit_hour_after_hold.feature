# Test Name: 57331 Flights - Time limit hour is displayed in flight details after holding the flight
# Status: Active
# Labels: Flights,general,hold flight,time,time limit,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-27T10:49:10Z
# Updated: 2026-01-11T03:31:01Z

@regression @flights @general @hold @time-limit
Feature: 57331 Flights - Time limit hour displayed in flight details after hold
  As a corporate traveler
  I want to see the time limit hour in flight details after holding a flight
  So that I know when the hold expires

  Scenario: Time limit hour is displayed after holding a flight
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LIS" to "RAK"
    And I add the first flight to cart
    And I accept Terms & Conditions
    And I hold the trip
    # TODO: Step needed for "Click 'Flight details' / 'more details' button"
    # TODO: Step needed for "Verify time limit hour is displayed in HH:MM format"
