# Test Name: 41518 Amadeus - can add hotel from terms and conditions*
# Description:
# Status: Closed
# Labels: TESTIM
# Owner: Bruna Santos
# Created: 2024-01-19T11:11:34Z
# Updated: 2026-06-17T09:53:48Z
# ADO Test Case ID: 41518

@regression @provider:amadeus @ado:41518
Feature: 41518 Amadeus - Add hotel to cart from the terms and conditions dialog
  As a corporate traveler using Amadeus
  I want to open the terms and conditions of a room and add that room to my trip from the dialog
  So that I can review the terms and add the hotel to my cart without leaving the dialog

  @priority:medium
  Scenario: Terms and conditions are available on room level and the room can be added to cart from the dialog
    Given I am logged in as "brunasantosnl@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I select the first hotel result
    And I filter room results by refundable
    When I check terms and conditions in room level
    Then terms and conditions are displayed
    And the room level terms and conditions should include "Rate Description"
    When I add the first room to my cart from the terms and conditions dialog
    Then the booking status should be "Pending booking"
