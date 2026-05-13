# Test Name: 19201 MERGED Sabre hotel E2E + send hotel price offer from results page
# Description: book for Sabre E2E
# Status: Active
# Labels: Hotel,Sabre,GDS,No Amadeus Hotel Book,Full Purchase,share quote,merge,Club,price offer,Results page hotel,Regression,Pre Prod,Daily Hotels,progress page,Giata,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-15T10:06:30Z
# Updated: 2025-11-10T01:30:47Z

@regression @provider:sabre
Feature: 19201 MERGED Sabre hotel E2E + send hotel price offer from results page
  As a corporate traveler using Sabre
  I want to share a hotel price offer and then book and delete the quote
  So that I can manage hotel quotes from search to completion

  @priority:high
  Scenario: Share hotel price offer from results, book and delete quote
    Given I am logged in as "sabrin@orly.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Denver" for 1 night
    And I wait to see view rates text in results page
    When I sort hotel results by "Price"
    And I select the first hotel result
    And I add a refundable room to my cart
    When I click the share quote button
    And I send the share
    When I proceed to checkout
    And I complete the booking
    Then the hotel should appear as refundable in cart
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip with 60 seconds wait
