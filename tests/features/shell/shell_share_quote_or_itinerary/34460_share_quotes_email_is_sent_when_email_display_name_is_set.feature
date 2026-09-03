# Test Name: 34460 Share quotes email is sent when email display name is set
# Description:
# Status: Active
# Labels: Share Itinerary,Regression,No Amadeus Hotel Book,2026 plan 1
# Owner: Noam Miller
# Created: 2023-08-14T08:08:27Z
# Updated: 2025-03-04T01:20:04Z

@regression @shell
Feature: 34460 - Share quotes email is sent when email display name is set
  As a user sharing flight quotes with a traveler
  I want the share-quotes email to be delivered when an email display name is configured
  So that the traveler receives the price offer email with the correct sender display name

  Scenario: Share-quotes email is sent to the traveler when an email display name is set
    Given I am logged in as "sharequote@club.com" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "SFO" to "LAX"
    And I click on the "Share" button
    And I click on the 1 share button in results page
    And I click on the 2 share button in results page
    And I click on the "Share" button to open the share dialog
    And I wait to see "Subject" field in share dialog
    When I add a generated email address as the itinerary recipient
    And I send the email and see success notification
    Then the received share quotes email should contain "Flight Offer # 1 Pending booking"
    And the received share quotes email should contain subject "Share quotes for"
