@regression @provider:expedia @provider:sabre @provider:amadeus @provider:premierinn
#Blocked by supplier - no results found for Amadeus Value search
Feature: 75362 Amadeus Value Hotel E2E Booking
  As a travel arranger
  I want to book a hotel for 2 travelers for 2 nights
  So that both travelers are accommodated in the same booking

  @priority:critical
  Scenario Outline: Booking Amadeus Value Hotel
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added traveler by name "amos one"
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
