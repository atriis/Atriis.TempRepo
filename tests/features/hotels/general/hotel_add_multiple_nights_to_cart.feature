@regression
Feature: Hotel Add To Cart
  As a corporate traveler
  I want to add hotels to my cart
  So that I can review them before booking

  @priority:critical
  Scenario: Add hotel for multiple nights to cart
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 3 nights
    And I select the first available hotel
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"