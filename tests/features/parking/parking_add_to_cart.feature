@regression @provider:ukparking
Feature: UK Parking Add To Cart
  As a corporate traveler
  I want to search and add UK airport parking to my cart
  So that I can reserve parking for my trip

  @priority:critical
  Scenario: Search UK parking and add to cart
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for UK parking at "LHR"
    And I add the first result to trip
    Then the booking status should be "Pending booking"
