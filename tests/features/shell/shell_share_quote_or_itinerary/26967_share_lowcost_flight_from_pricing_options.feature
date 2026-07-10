# Test Name: 26967 Share Low-Cost flight from pricing options
# Description: On search results page able to click on Share button, add till 4 quotes and share it.
# Status: Active
# Labels: Regression,Flights,GDS,No Amadeus Hotel Book,Fit for Prod,Search Flight,FailedFusion,2026 plan 1
# Owner: pini harush
# Created: 2023-03-30T11:12:52Z
# Updated: 2025-12-24T06:27:51Z

@regression @shell @lcc
Feature: 26967 Share Low-Cost flight from pricing options

  As a travel agent
  I want to select flight fares from pricing options and share them as quotes
  So that I can send a price offer with several quotes to the traveler

  Scenario: Share two low-cost flight quotes selected from pricing options
    Given I am logged in as "low@cost.mail" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "DUB"
    When I click on the "Share" button
    And I filter results by carrier "Aer Lingus"
    And I click to open first pricing options
    And I extract the price from first pricing option
    And I "Select to share" first option from pricing options
    And I click share from pricing options
    And I filter results by carrier "Aer Lingus"
    And I click to open second pricing options
    And I extract the price from first pricing option
    And I "Select to share" first option from pricing options
    And I click share from pricing options
    When I click on the "Share" button to open the share dialog
    And I scroll into offers and get prices
    Then The shared price for carrier "Aer Lingus" should match the price from pricing options
    And The shared price for carrier "Aer Lingus" should match the price from pricing options
