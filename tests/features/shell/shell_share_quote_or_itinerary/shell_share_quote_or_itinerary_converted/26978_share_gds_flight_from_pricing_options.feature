# Test Name: 26978 Share GDS flight from pricing options
# Description: On search results page able to click on Share button, add till 4 quotes and share it.
# Status: Active
# Labels: Regression,Flights,GDS,No Amadeus Hotel Book,Fit for Prod,Search Flight,2026 plan 1
# Owner: pini harush
# Created: 2023-03-30T11:12:52Z
# Updated: 2024-02-26T02:15:51Z

@regression @shell @gds
Feature: Share GDS flight from pricing options

  As a travel agent
  I want to share a GDS flight quote built from the pricing options of several flights
  So that I can send the traveler a price offer with specific fare options

  Scenario: Share a GDS flight quote by adding fares from the pricing options page
    Given I am logged in as "pini@gov2.nl" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "AMS" to "CDG"
    And I handle conflicting quotes if visible
    And I click on the "Share" button
    And I click to open first pricing options
    # TODO: no exact catalog phrase — source selects a fare option (.pricing-options-section :nth-child(4) .desktop-btn) then clicks .add-btn to add it as a share quote
    And I select a fare from pricing options and add it to the share
    And I close pricing options modal
    # TODO: no exact catalog phrase — source opens pricing options for the second flight via its price link (.flight-list :nth-child(2) .is-bold)
    And I click to open pricing options for the second flight result
    # TODO: no exact catalog phrase — source selects a fare option (.pricing-options-section :nth-child(4) .desktop-btn) then clicks .add-btn to add it as a share quote
    And I select a fare from pricing options and add it to the share
    And I close pricing options modal
    And I click on the "Share" button to open the share dialog
    # TODO: no exact catalog phrase — source clicks the focused quote checkbox in the share dialog (.is-focus .el-checkbox__inner)
    And I check the quote include checkbox in the share dialog
    Then I wait to see "Include in price offer" field in share dialog
    When I send the share and see success notification
    Then I should see a success notification
