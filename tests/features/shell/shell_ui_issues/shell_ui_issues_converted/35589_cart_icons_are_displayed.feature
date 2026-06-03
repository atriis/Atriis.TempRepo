# Test Name: 35589 Cart - Icons are displayed
# Description:
# Status: Active
# Labels: Regression,UI,Flights,Hotel,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-09-05T02:25:54Z
# Updated: 2024-04-16T02:50:55Z

@regression @shell @flights @hotels @ui
Feature: 35589 - Cart icons are displayed
  As a corporate traveler
  I want the product icons to be visible in the cart and trip overview after adding a flight and a hotel
  So that I can quickly identify each booked product at a glance

  Scenario: Flight and hotel icons are displayed in the cart after adding both products
    Given I am logged in as "ruimendes@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LIS" to "LON"
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    When I click to add a hotel to my trip from cart
    Then the hotel destination autocomplete should show "London,United Kingdom,(LON)"
    # TODO: click the hotel search submit button in the cart drawer — no existing step covers page.click(".btn--size-large")
    #       Proposed step: When I search for a hotel from the cart drawer -> HotelSearch.searchHotelByNights(page, { fromDrawer: true })
    And I wait for hotel results to load
    And I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    And I add a refundable room to my cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    And the hotel should appear as refundable in cart
    # TODO: verify flight icon is visible in the quote summary list — no existing step covers page.waitForSelector(".quote-summary-list > :nth-child(1) .icon-img-wrapper", {state: "visible"})
    #       Proposed step: Then the flight icon should be visible in the trip overview -> Cart.verifyFlightIconVisibleInTripOverview(page)
    # TODO: verify hotel icon is visible in the flight quote summary — no existing step covers page.waitForSelector(".flight-quote-summary .icon-img-wrapper", {state: "visible"})
    #       Proposed step: Then the hotel icon should be visible in the quote summary -> Cart.verifyHotelIconVisibleInQuoteSummary(page)
    And I successfully cancel the trip
