@daily_cars @provider:sabre
Feature: Sabre Car Booking Flow
  As a corporate traveler using Sabre
  I want to book cars through the Sabre provider

  @priority:critical
  Scenario: Add car and complete booking
    Given I am logged in as "sabre" "user_one" booking a new trip
    And I have added a random guest traveler
    When I search for a car in "LHR"
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip