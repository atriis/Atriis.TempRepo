# Test Name: 56159 - Rail / Bus advisory for mixed transportation itinerary, equipment in detailed offer email
# Status: Active
# Labels: NL government,results,Advisory,price offer,Flights,Amadeus,Regression,2026 plan 1
# Owner: Noam Miller
# Created: 2025-01-02T05:39:45Z
# Updated: 2025-02-04T11:49:28Z

@regression @flights @general @advisory
Feature: 56159 Flights - Rail Bus advisory for mixed transportation itinerary
  As a corporate traveler
  I want to see rail/bus advisory for mixed transportation itineraries
  So that I am aware of non-flight segments in my journey

  Scenario: Rail bus advisory is displayed in results and offer email for mixed itinerary
    Given I am logged in as "copytrip" booking a new trip
    And I have added a random guest traveler
    When I click on the flight tab and check Allow nearby airports
    And I search for a round trip flight from "BUD" to "QKL"
    And flight results should be available
    Then I hover over the advisory icon and verify tooltip text "Mixed transportation"
    When I click to open flight details
    Then the flight details should show connection advisory with transport change
    And I close flight details window
    When I click on the "Share" button
    And I click on the 1 share button in results page
    And I click on the "Share" button to open the share dialog
    Then I wait to see "Subject" field in share dialog
    And I switch the share email preview to detailed view
    Then "BUD" should be displayed in the share email preview
    And the share email preview should contain equipment for flight segments
    And I close the share dialog
    When I click on the "Share" button
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I open flight details in cart
    Then the flight details should show connection advisory with transport change
    And I close flight details window
    And I click the share quote button
    Then I wait to see "Subject" field in share dialog
    And I switch the share email preview to detailed view
    Then "BUD" should be displayed in the share email preview
    And the share email preview should contain equipment for flight segments