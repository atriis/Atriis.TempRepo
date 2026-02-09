@regression @provider:sabre @user:chris_tree
Feature: Complete Flight Booking with Dynamic Fields
  As a corporate traveler
  I want to complete a flight booking with trip purpose and checkout fields
  So that I can validate end-to-end booking with dynamic reference fields

  @priority:critical
  Scenario: Complete one-way flight booking with random guest and dynamic fields
    Given I am logged in and ready to book a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "dfwToNyc"
    And I select the trip purpose reference field
    And I add the first flight to cart
    And I proceed to checkout
    And I add a number checkout field
    And I complete the booking
    Then the booking status should be "Finalizing"
