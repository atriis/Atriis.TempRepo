@regression @provider:amtrak
Feature: Amtrak Add To Cart
  As a corporate traveler
  I want to search and add Amtrak trains to my cart
  So that I can review rail options before booking

  @priority:critical
  Scenario: Add round trip Amtrak train to cart
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for a round trip Amtrak train from "nypToWas"
    And I select and add round trip journey to trip
    Then the booking status should be "Pending booking"

  @priority:critical
  Scenario: Add one way Amtrak train to cart
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for a one way Amtrak train from "nypToWas"
    And I select and add one way journey to trip
    Then the booking status should be "Pending booking"
