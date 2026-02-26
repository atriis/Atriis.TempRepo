# Test Name: 61574 expedia hotel - book for 2 travelers and 2 nights
# Description: 
# Status: Active
# Labels: Regression,Hotel,Full Purchase,more than 1 night,No Amadeus Hotel Book,multi pax,Daily Hotels,Expedia,progress page,66444 hotel results,Pre Prod,Giata,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-05-04T06:20:12Z
# Updated: 2026-02-09T12:54:32Z

@regression @provider:expedia
Feature: 61574 Expedia - Book hotel for 2 travelers 2 nights
  As a travel arranger
  I want to book an Expedia hotel for 2 travelers for 2 nights
  So that both travelers are accommodated in the same booking

  @priority:critical
  Scenario: 2 travelers booked in Expedia hotel for 2 nights
    Given I am logged in as "expedia" "user_one" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "shani car"
    When I search for a hotel in "London" for 2 nights
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    Then the hotel should appear as refundable in cart
    And I fill credit card cvv if needed
    When I extract the price at index 0 from "cart"
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    When I extract the price at index 0 from "cart"
    Then the extracted price at index 0 should equal the extracted price at index 1 within tolerance
    Then I successfully cancel the trip
