# Test Name: 46261 Share quote combined with add to cart - hotel
# Description:
# Status: Active
# Labels: share quote,results,Role,Cart,No Amadeus Hotel Book,Hotel,Regression,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-05-21T11:53:11Z
# Updated: 2024-08-20T06:30:57Z

@regression @shell
Feature: 46261 Share quote combined with add to cart - hotel

  As a user booking a hotel
  I want to share a hotel room price offer by email and have that quote added to my trip
  So that the shared hotel quote appears in my cart with a pending booking status

  Scenario: Share a hotel room price offer by email and verify the quote is added to the cart
    Given I am logged in as "sher@adto.com" booking a new trip
    And I have added myself as the traveler
    When I initiate a hotel search in "LON" for 1 night
    And I fill in NL reference fields education and courses
    And I wait to see view rates text in results page
    And I enter share mode on hotel results
    And I select the first hotel result
    And I wait for view hotel on map button to be visible in room level results
    And I extract the price from room level results
    And I click on the 1 share button in results page
    And I click on the "Share" button to open the share dialog
    And I send the share and see success notification
    Then the cart badge should show "1" item
    And I navigate to the trip cart
    Then the booking status should be "Pending booking"
    And the cart total price should match the last extracted price
