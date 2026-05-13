@daily_hotels @provider:amadeus_value_hotel
Feature: 34527 Amadeus Value Hotels - Cancellation policy does not change when adding hotel to cart
  As a corporate traveler using Amadeus Value Hotels
  I want to add a refundable hotel room to my cart
  So that the cancellation policy shown in room results matches what appears in the cart

  @priority:critical
  Scenario: Cancellation policy does not change when adding hotel to cart
    Given I am logged in as "papatinhosantos@amadeusvalue.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Design Hotel Artemins" for 1 night
    And I select the first hotel result
    And I extract cancellation policy from first room level results
    And I add the first available room to my cart
    Then the booking status should be "Pending booking"
    And I extract cancellation policy from cart
    Then the cancellation policy in the cart should match the cancellation policy from room level results
