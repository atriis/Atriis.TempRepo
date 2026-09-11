# Test Name: 66564 Copy to clipboard works as expected
# Description:
# Status: Active
# Labels: Regression,Daily Shell,2026 plan 2
# Owner: Yael
# Created: 2025-09-08T08:52:23Z
# Updated: 2026-02-16T02:41:36Z

@regression @shell @flights @share-itinerary
Feature: 66564 Copy to clipboard works as expected
  As a travel booker
  I want the "Copy to clipboard" action in the results-page share dialog to work
  So that I can successfully share a price offer

  @priority:medium
  Scenario: Copy to clipboard in the results page share dialog works as expected
    Given I am logged in as "brunasantosnl@testim.com" booking a new trip
    And I have added myself as the traveler
    And I dismiss the mandatory notifications popup if displayed
    When I search for a round trip flight from "EWR" to "LAX"
    And flight results should be available
    And I click on the "Share" button
    And I click on the 1 share button in results page
    And I click on the "Share" button to open the share dialog
    Then I wait to see "Include in price offer" field in share dialog
    When I click the copy to clipboard button in the share dialog
    Then I should see a success notification 
