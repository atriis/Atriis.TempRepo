@regression
Feature: Add Flight to Cart
  As a corporate traveler
  I want to add flights to my cart
  So that I can review them before booking

  @priority:critical
  Scenario: Add one-way flight to cart
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "lhrToDoh"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"

  @priority:critical
  Scenario: Add round trip flight to cart
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "PAR" to "AMS"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"

  @priority:critical
  Scenario: Add flight by schedule to cart
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "LON" to "AMS"
    And I select flight segments by schedule
    And I add the selected fare to cart
    Then the booking status should be "Pending booking"