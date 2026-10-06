@regression @provider:amadeus_value_hotel
Feature: 75362 Amadeus Value Hotel E2E Booking
  As a travel arranger
  I want to book a hotel for 2 travelers for 2 nights
  So that both travelers are accommodated in the same booking

  @priority:critical
  Scenario Outline: Booking Amadeus Value Hotel
    Given I am logged in as "joao@amadeusvaluehotel.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I wait to see view rates text in results page
    And I select the first hotel result
    And I add a refundable room to my cart
    And the booking status should be "Pending booking"
    When I extract the total price of quote 1
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    When I extract the total price of quote 1
    Then the extracted price at index 0 should equal the extracted price at index 1 within tolerance
    Then I successfully cancel the trip
