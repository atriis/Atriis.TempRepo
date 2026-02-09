@regression @provider:groundscope
Feature: Ground Transport Search and Add To Cart
  As a corporate traveler
  I want to search and add ground transport to my cart
  So that I can arrange airport transfers

  @priority:critical
  Scenario: Search ground transport from airport to specific address and add to cart
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for ground transport from "default"
    And I add the first result to trip
    Then the booking status should be "Pending booking"
