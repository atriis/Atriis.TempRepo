# Test Name: 62151 Ratehawk hotel - book for 2 travelers and 2 nights
# Description: 
# Status: Active
# Labels: Hotel,Full Purchase,more than 1 night,No Amadeus Hotel Book,multi pax,Daily Hotels,Ratehawk Regression,progress page,66444 hotel results,Giata,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-05-18T10:28:29Z
# Updated: 2026-02-09T12:56:47Z

@regression @provider:ratehawk
Feature: 62151 Ratehawk - Book hotel for 2 travelers 2 nights with price match
  As a travel arranger
  I want to book a Ratehawk hotel for 2 travelers for 2 nights
  So that both travelers are accommodated and the price is consistent from cart to confirmation

  @priority:critical
  Scenario: 2 travelers booked for 2 nights via Ratehawk with price match and cancel
    Given I am logged in as "lidi" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    When I search for a hotel in "London" for 2 nights
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
    Then I successfully cancel the trip
