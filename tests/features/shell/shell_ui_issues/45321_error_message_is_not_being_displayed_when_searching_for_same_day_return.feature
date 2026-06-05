# Test Name: 45321 Error message is not being displayed when searching for same day return
# Description:
# Status: Active
# Labels: Regression,UI,Flights,general,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-04-26T08:59:12Z
# Updated: 2025-08-19T01:30:03Z

@regression @shell @flights @ui
Feature: 45321 - Error message should not be displayed when searching for same day return
  As a corporate traveler
  I want to see a validation error message when I search for a round trip flight with the same day as departure and return
  So that I am informed that same-day return flights are not allowed before the search is submitted

  Scenario: An error message is not displayed when searching for a round trip flight with same day return
    Given I am logged in as "ruimendes@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a same day round trip flight from "AMS" to "GVA"
    Then "This field is required" message should not be displayed anywhere in search page