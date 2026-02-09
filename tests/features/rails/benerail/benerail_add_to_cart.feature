@regression @provider:benerail
Feature: Benerail Add To Cart
  As a corporate traveler
  I want to search and add Benerail trains to my cart
  So that I can review EU rail options before booking

  @priority:critical
  Scenario: Add round trip Benerail train to cart
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for a round trip Benerail train from "default"
    And I select and add round trip journey to trip
    Then the booking status should be "Pending booking"

  @priority:critical
  Scenario: Add one way Benerail train to cart
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "default"
    And I select and add one way journey to trip
    Then the booking status should be "Pending booking"
