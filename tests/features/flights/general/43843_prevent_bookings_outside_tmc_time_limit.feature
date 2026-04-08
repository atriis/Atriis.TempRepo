# Test Name: 43843 Prevent bookings outside of TMC time limit + Search Defaults
# Status: Active
# Labels: Regression,Flights,Cart,Search Flight,2026 plan 1
# Owner: pini harush
# Created: 2024-03-19T07:37:54Z
# Updated: 2026-01-20T02:01:22Z

@regression @flights @general @time-limit
Feature: 43843 Flights - Prevent bookings outside of TMC time limit
  As the system
  I want to prevent bookings outside of TMC office hours
  So that flights are not booked when support is unavailable

  Scenario: Booking restricted message is displayed outside TMC time limit
    Given I am logged in as "john_tlmt" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "LON" to "CAI"
    And flight results should be available
    When I hover over time limit icon and verify booking restricted message
    Then I verify message contains "Booking restricted due to office hours"
