@regression @provider:amadeus
Feature: 72982 Amadeus - Can book for multi pax with GDS profile
  As a corporate travel arranger
  I want to add multiple travelers and hold a flight booking
  So that I can reserve flights without immediate payment

  @priority:critical
  Scenario: Can book for multi pax with GDS profile
    Given I am logged in as "amadeus_gds" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "MAD" to "LIS"
    And I add the first flight to cart
    And I accept Terms & Conditions
    When I hold the trip
    Then the booking status should be "On Hold"
    Then I successfully cancel the trip
