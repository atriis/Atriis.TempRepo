@regression @provider:travelodge
Feature: 85776 Travelodge - Book hotel
  As a corporate traveler
  I want to book a refundable Travelodge room
  So that the booking is submitted and shown as in progress

  @priority:critical
  Scenario: Booking a refundable Travelodge room sets the booking status to In progress
    Given I am logged in as "pluto@travelodgecorp.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I extract the total price of quote 1
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "In progress"
    When I extract the total price of quote 1
    Then the extracted price at index 0 should equal the extracted price at index 1 within tolerance
