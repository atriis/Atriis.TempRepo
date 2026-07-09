# Test Name: 26965 Share GDS flight from results page
# Description: On search results page able to click on Share button, add till 4 quotes and share it.
# Status: Active
# Labels: Regression,Flights,GDS,No Amadeus Hotel Book,Fit for Prod,Search Flight,never failed,2026 plan 1
# Owner: pini harush
# Created: 2023-03-30T11:12:52Z
# Updated: 2024-02-11T07:01:52Z

@regression @shell @gds
Feature: 26965 Share GDS flight from results page

  As a travel agent
  I want to share a GDS flight quote directly from the search results page
  So that I can send a price offer to the traveler from the results page

  Scenario: Share a GDS flight quote from the results page without pricing
    Given I am logged in as "am@amsalem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "AMS" to "CDG"
    And I click on the "Share" button
    And I click on the 1 share button in results page
    And I click on the "Share" button to open the share dialog
    Then I wait to see "Include in price offer" field in share dialog
    And I send the share and see success notification
