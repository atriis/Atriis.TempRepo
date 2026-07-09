# Test Name: 59213 Travel Plan - Travel plan is sent when aircraft model is missing
# Description:
# Status: Active
# Labels: Regression,Share Itinerary,Flights,general,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-11T01:05:08Z
# Updated: 2025-08-20T12:52:10Z

@regression @shell
Feature: 59213 - Travel Plan - Travel plan is sent when aircraft model is missing

  As a travel agent booking a flight whose aircraft model data is missing
  I want to share the trip itinerary (travel plan) by email
  So that the traveler receives the travel plan even when the aircraft model is unavailable

  Scenario: Travel plan itinerary is sent when the selected flight has a missing aircraft model
    Given I am logged in as "ypsilon@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "DUB" to "CDG"
    And I filter results by carrier "Aer Lingus"
    And I add the first result to trip
    And I handle conflicting quotes if visible
    Then the cart status should be Pending booking
    When I click the share itinerary button
    And I send the share
