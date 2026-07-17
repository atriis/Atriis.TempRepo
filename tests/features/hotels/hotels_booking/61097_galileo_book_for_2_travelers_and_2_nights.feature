# Test Name: 61097 Galileo hotel - book for 2 travelers and 2 nights
# Description:
# Status: Active
# Labels: Regression,Hotel,Galileo,Full Purchase,more than 1 night,No Amadeus Hotel Book,multi pax,Daily Hotels,progress page,66444 hotel results,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-04-20T09:24:55Z
# Updated: 2026-02-09T12:47:28Z

@regression @provider:galileo
Feature: 61097 Galileo - Book hotel for 2 travelers 2 nights
  As a travel arranger
  I want to book a hotel for 2 travelers for 2 nights
  So that both travelers are accommodated in the same booking

  @priority:critical
  Scenario: 2 travelers booked in hotel for 2 nights
    Given I am logged in as "gal@leo.com" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    When I search for a hotel in "Amsterdam" for 2 nights
    And I wait to see view rates text in results page
    When I sort hotel results by "Price"
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the cart should show 2 rooms badge
    And I fill credit card cvv if needed
    When I extract the price at index 0 from "cart"
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    When I extract the price at index 0 from "cart"
    Then the extracted price at index 0 should equal the extracted price at index 1 within tolerance
    Then I successfully cancel the trip with 60 seconds wait
