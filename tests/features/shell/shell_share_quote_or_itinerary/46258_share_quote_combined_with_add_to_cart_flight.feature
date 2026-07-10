# Test Name: 46258 Share quote combined with add to cart - flight
# Description:
# Status: Active
# Labels: share quote,results,Role,Cart,No Amadeus Hotel Book,Flights,Regression,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-05-21T11:28:25Z
# Updated: 2025-01-09T11:56:34Z

@regression @shell
Feature: 46258 Share quote combined with add to cart - flight

  As a travel agent
  I want to share a flight price offer from the search results page
  So that the shared flight is also added to the trip cart

  Scenario: Share a flight quote from results and verify the flight is added to the cart
    Given I am logged in as "sher@adto.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "MAD" to "LIS"
    And I fill in NL reference fields education and courses
    And flight results should be available
    And I extract the price from first flight result
    And I click on the "Share" button
    And I click on the 1 share button in results page
    And I click on the "Share" button to open the share dialog
    Then the share quote preview should show "Price Offer - Summary"
    When I send the share and see success notification
    Then the cart badge should show "1" item
    And I navigate to the trip cart
    And the cart should contain 1 flight quote
    And the cart flight should depart from "MAD"
    And the cart flight should arrive at "LIS"
    And the cart total price should match the last extracted price
