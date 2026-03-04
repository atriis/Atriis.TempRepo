# Test Name: 42737 Booking.com - Meal type info is displayed on more details and save pay method
# Description: 
# Status: Active
# Labels: Regression,Hotel,meal,booking.com 3.1,Daily Hotels,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-02-15T01:57:47Z
# Updated: 2024-11-28T01:25:24Z

@regression @provider:bookingcom
Feature: 42737 Booking.com - Book hotel with breakfast and meal type displayed
  As a corporate traveler using Booking.com
  I want to book a hotel with breakfast included and see the meal type displayed
  So that I can confirm my meal preferences are part of the booking

  @priority:high
  Scenario: Booking.com hotel with breakfast meal type shown and pay on departure selected
    Given I am logged in as "bookingcom" "user_one" booking a new trip
    And I have added a random guest traveler
    When I search for a hotel in "LHR" for 1 night
    And I select the first hotel result
    # TODO: Create step "When I add a room with breakfast included to my cart" that calls DSL addRoomWithBreakfast in RoomLevelResults.js
    Then the booking status should be "Pending booking"
    # TODO: Create step "Then the meal type should be displayed in cart" that calls DSL verifyMealType in Cart.js
    # TODO: Create step "When I select the "Pay on departure" payment option" that calls DSL selectPaymentOption in CartFop.js
