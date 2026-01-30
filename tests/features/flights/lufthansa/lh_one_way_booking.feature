@regression @provider:lufthansa
Feature: Lufthansa NDC - One Way Flight Booking
  As a corporate traveler using Lufthansa NDC
  I want to search and book one-way flights
  So that I can complete my flight booking end-to-end

  @priority:critical
  Scenario: Complete one-way flight booking end-to-end
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "mucToFra"
    And I add the first flight to cart
    And I accept the terms and conditions
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Ticketing Complete"