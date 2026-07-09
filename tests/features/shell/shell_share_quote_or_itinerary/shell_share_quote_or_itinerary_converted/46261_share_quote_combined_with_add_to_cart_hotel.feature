# Test Name: 46261 Share quote combined with add to cart - hotel
# Description:
# Status: Active
# Labels: share quote,results,Role,Cart,No Amadeus Hotel Book,Hotel,Regression,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-05-21T11:53:11Z
# Updated: 2024-08-20T06:30:57Z

@regression @shell
Feature: Share quote combined with add to cart - hotel

  As a user booking a hotel
  I want to share a hotel room price offer by email and have that quote added to my trip
  So that the shared hotel quote appears in my cart with a pending booking status

  Scenario: Share a hotel room price offer by email and verify the quote is added to the cart
    Given I am logged in as "sher@adto.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LON" for 1 night
    And I fill in NL reference fields education and courses
    And I wait to see view rates text in results page
    And I select the first hotel result
    # TODO: no catalog phrase for sharing a hotel room price offer by email from room-level results (select the room share button, open the share bar email option, and wait for the "Price Offer - Summary" email dialog)
    And I share the hotel room price offer by email from room level results
    And I send the share and see success notification
    When I handle conflicting quotes if visible
    Then the cart status should be Pending booking
