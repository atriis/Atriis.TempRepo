# Test Name: 34941 When the car search is added in admin it must appear selected in the UI by default
# Status: Active
# Labels: Regression,CR7,No Amadeus Hotel Book,2026 plan 1
# Owner: Unassigned
# Created: 2023-08-22T06:00:21Z
# Updated: 2023-12-28T12:19:27Z

@regression @flights @general @admin
Feature: 34941 Flights - Car search checkbox is selected by default when configured in admin
  As a corporate traveler
  I want the car search checkbox to be pre-selected when configured by admin
  So that I don't have to manually enable it each time

  Scenario: Car search checkbox is selected by default in flight search
    Given I am logged in as "carolinaferreira" booking a new trip
    When I click on the flight tab
    Then the car search checkbox should be checked by default
