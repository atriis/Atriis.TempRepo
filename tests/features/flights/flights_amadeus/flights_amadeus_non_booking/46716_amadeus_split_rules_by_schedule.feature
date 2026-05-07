# Test Name: 46716 Amadeus - Flights - Split Rules - Search by schedule - Quote is being splited correctly
# Description:
# Status: Active
# Labels: Regression,Amadeus,Flights,by schedule,split ticket,Pre Prod,Daily Flights,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-29T10:55:31Z
# Updated: 2025-09-11T07:12:49Z

@regression @flights @amadeus @split-rules @by-schedule
Feature: 46716 Amadeus - Split rules by schedule quote is split correctly
  As a corporate traveler
  I want to search by schedule with different carriers per segment
  So that the system splits the quote into separated tickets correctly

  Scenario: Search by schedule with different carriers produces separated tickets
    Given I am logged in as "ruimendes" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "NYC" to "LON"
    And flight results should be available
    And I filter results by carrier "DL"
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I filter results by carrier "BA"
    And I select one flight segment by schedule
    And I wait for "Your Selection" text to be visible
    Then the "Separated Tickets" indicator should be visible in results
    And I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"
    Then the first quote destination should contain "London"
    And the last quote destination should contain "New York"