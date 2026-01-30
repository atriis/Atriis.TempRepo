@regression
Feature: Add Flight to Cart and Share via Email
  As a corporate traveler
  I want to add flights to my cart
  So that I can review them before booking

  @priority:critical
  Scenario: Add one-way flight to cart and Share Quote
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "lhrToDoh"
    And I add the first flight to cart
    When I click the share quote button
    And I send the share
    Then I should see a success notification

  @priority:critical
  Scenario: Add round-trip flight to cart and Share Itinerary
      Given I am logged in and ready to book a new trip
      And I have added myself as the traveler
      When I search for a round trip flight from "LON" to "PAR"
      And I add the first flight to cart
      When I click the share itinerary button
      And I send the share
      Then I should see a success notification