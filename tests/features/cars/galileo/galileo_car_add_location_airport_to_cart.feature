@regression @provider:galileo
Feature: Galileo - Add Car From Airport Location To Cart
  As a corporate traveler using Galileo
  I want to search and add cars from airport locations to my cart
  So that I can review car rental options

  @priority:critical
  Scenario: Add car from airport location to cart
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for a car in "LHR"
    And I add the first car to cart
    Then the booking status should be "Pending booking"