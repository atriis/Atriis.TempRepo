# Test Name: 42737 Booking.com - Meal type info is displayed on more details and save pay method
# Description:
# Status: Active
# Labels: Regression,Hotel,meal,booking.com 3.1,Daily Hotels,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-02-15T01:57:47Z
# Updated: 2024-11-28T01:25:24Z

# ADO Test Case ID: 42737
@ado:42737
@regression @provider:bookingcom
Feature: 42737 Booking.com - Meal type info is displayed on more details and payment method is saved
  As a corporate traveler booking a Booking.com hotel with breakfast included
  I want to see the meal type in the More Details drawer and save the payment method extra
  So that I can confirm breakfast is included and choose how to pay before booking

  @priority:medium
  Scenario: Meal type is displayed in more details and the payment method extra is saved
    Given I am logged in as "Bookingonly@Testim.corp" booking a new trip
    And I have added a random guest traveler
    When I search for a hotel in "LHR" for 1 night
    And I select the first hotel result
    And I filter room results by breakfast included
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I fill credit card cvv if needed
    And I click more details in cart
    Then the more details should show "Breakfast: Breakfast incl."
    When I close more details in cart
    And I click to edit extras at index 0
    Then the "Pay on departure" payment option should be displayed
    When I select the "Pay on departure" payment option
    Then I should see a success notification
