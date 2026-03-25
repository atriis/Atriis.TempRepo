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
    And I filter results by carrier "DL"
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I filter results by carrier "BA"
    And I select one flight segment by schedule
    # TODO: Verify "Separated Tickets" indicator is visible in pricing options
    # Testim: waitForText(page, "[aria-describedby='...'] > :nth-child(2)", 'Separated Tickets')
    And I add to trip from pricing options
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    # TODO: Verify SECOND quote also shows "Pending booking" status
    # Testim: scrollTo bottom → waitForText(page, "[aria-describedby='el-tooltip-4725']", 'Pending booking')
    # Need a step like: Then the second quote booking status should be "Pending booking"
    And I successfully cancel the trip
