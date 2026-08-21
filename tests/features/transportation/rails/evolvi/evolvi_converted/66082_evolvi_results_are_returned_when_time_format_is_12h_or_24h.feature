# Test Name: 66082 Evolvi - Results are returned when time format is 12h or 24h
# Description:
# Status: Active
# Labels: Regression,Rail,Evolvi,time hour,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-08-27T02:12:21Z
# Updated: 2025-09-28T06:56:02Z
@transportation @rails @evolvi @regression
Feature: 66082 Evolvi - Results are returned when time format is 12h or 24h
  As a rail traveler
  I want to run an Evolvi round trip search under both the 12 hour and the 24 hour time format
  So that train results are returned whichever time format my profile is set to

  Scenario: Evolvi results are returned under both the 12 hour and the 24 hour profile time format
    Given I am logged in as "thiagosantos@evolvi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Evolvi train from "bthToPad"
    And I dismiss the mandatory notifications popup if displayed
    Then I should see the Evolvi round trip results page returned train results
    When I navigate to my user profile
    And I set the time format to "12 Hours" in my profile
    And I save the personal details
    Then I should see a success notification
    When I close tab 2
    And I book a new trip
    And I have added myself as the traveler
    And I search for a round trip Evolvi train from "bthToPad"
    And I dismiss the mandatory notifications popup if displayed
    Then I should see the Evolvi round trip results page returned train results
    When I navigate to my user profile
    And I set the time format to "24 Hours" in my profile
    And I save the personal details
    Then I should see a success notification
