@regression @provider:evolvi
Feature: Evolvi One Way Add To Cart
  As a corporate traveler
  I want to search and add Evolvi UK Rail trains to my cart
  So that I can review UK rail options before booking

  @priority:critical
  Scenario: Add one way Evolvi train to cart
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "licTo105"
    And I add an Evolvi one way to the trip
    Then the booking status should be "Pending booking"
