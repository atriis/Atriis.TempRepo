# Test Name: 67455 Share Price Offer from search by schedule results
# Status: Active
# Labels: Amsalem,Amadeus Light Ticketing,price offer,search,by schedule,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-09-21T12:48:56Z
# Updated: 2025-09-30T10:44:42Z

@regression @flights @general @by-schedule @price-offer
Feature: 67455 Flights - Share price offer from search by schedule results
  As a corporate traveler
  I want to share a price offer from search by schedule results
  So that I can send flight options to travelers for selection

  Scenario: Share price offer from search by schedule results
    Given I am logged in as "ryanair_ams" booking a new trip
    And I have added a random guest traveler
    When I search for a flight by schedule from "DUB" to "LON"
    And I wait for select text to be visible  
    And I click on the "Share" button
    And I click on the 1 share button in results page
    And I click on the 2 flight in by schedule stepper
    And I click on the 1 share button in results page
    And I click on the "Share" button to open the share dialog
    Then I wait to see "Subject" field in share dialog
