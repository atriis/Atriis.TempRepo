@regression
Feature: Hotel Booking End-to-End Flow
  As a corporate traveler
  I want to search, book, and manage hotel reservations
  So that I can complete my travel arrangements

  @priority:critical
  Scenario: Complete hotel booking with refundable room and cancellation
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I select the first available hotel
    And I add a refundable room to my cart
    And I accept the terms and conditions
    And I proceed to checkout
    And I complete the booking
    Then the hotel should appear as refundable in my cart
    When I cancel the trip
    Then the trip should be successfully cancelled