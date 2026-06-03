# Test Name: 33937 Line with product details is displayed after checkout
# Description:
# Status: Active
# Labels: Regression,Hotel,UI,No Amadeus Hotel Book,progress page,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-07-06T11:05:24Z
# Updated: 2025-07-11T11:20:36Z

@regression @shell @hotels
Feature: 33937 - Line with product details is displayed after checkout
  As a corporate traveler booking a hotel
  I want the product details line to be displayed on the trip overview after checkout
  So that I can confirm my booked hotel stay details after completing the booking

  Scenario: Hotel product details line is displayed on the trip overview after checkout
    Given I am logged in as "brunasantosnl@testim.com" booking a new trip
    And I have added a random guest traveler
    When I initiate a hotel search in "London, UK" for 1 night
    And I click proceed button if visible
    And I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    And I add a refundable room to my cart
    # TODO: fill_free_text_justification_in_cart_if_needed() — conditional OOP free-text justification only if "Out of policy" / "Please save your justification" appears.
    #       Proposed step: When I fill in the OOP justification text "abc" if needed -> Cart.fillInOOPJustificationTextAndSaveIfNeeded(page, text)
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    And I complete the booking
    # TODO: Making_sure_trip_overview_page_is_fully_loaded() — wait for the product details line showing nights (/Night/) on the trip overview.
    #       Proposed step: Then the hotel product details line should be displayed in the trip overview -> Cart.verifyHotelNightsLineVisibleInTripOverview(page)
    Then I successfully cancel the trip
