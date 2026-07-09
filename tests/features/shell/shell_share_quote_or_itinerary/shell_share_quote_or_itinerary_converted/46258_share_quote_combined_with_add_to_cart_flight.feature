# Test Name: 46258 Share quote combined with add to cart - flight
# Description:
# Status: Active
# Labels: share quote,results,Role,Cart,No Amadeus Hotel Book,Flights,Regression,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-05-21T11:28:25Z
# Updated: 2025-01-09T11:56:34Z

@regression @shell
Feature: Share quote combined with add to cart - flight

  As a travel agent
  I want to share a flight price offer from the search results page
  So that the shared flight is also added to the trip cart

  Scenario: Share a flight quote from results and verify the flight is added to the cart
    Given I am logged in as "sher@adto.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD"
    And I fill in NL reference fields education and courses
    And I click on the "Share" button
    And I click on the 1 share button in results page
    And I click on the "Share" button to open the share dialog
    Then the share quote preview should show "Price Offer - Summary"
    When I send the share and see success notification
    And I navigate to the trip cart
    # TODO: the cart quantity badge should equal "1" - the key "combined with add to cart" assertion (share also adds the flight to cart). No catalog phrase exists for the cart item-count badge.
    Then the cart badge should show "1" item
    # TODO: source compared the cart flight origin against a value captured in take_flight_details() but never stored (fromAirport was undefined). Verify against the searched origin.
    And the cart flight should depart from "LON"
    # TODO: source compared the cart flight destination against a value captured in take_flight_details() but never stored (toAirport was undefined). Verify against the searched destination.
    And the cart flight should arrive at "MAD"
    # TODO: source compared the cart price against a value captured in take_flight_details() but never stored (price was undefined). Verify the cart flight price matches the shared flight price.
    And the cart flight price should match the shared flight price
