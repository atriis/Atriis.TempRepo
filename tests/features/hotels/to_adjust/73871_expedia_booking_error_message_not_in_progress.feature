# Test Name: 73871 Expedia - In case of booking error we show the error and the status is not in progress
# Description: 
# Status: Active
# Labels: Regression,Expedia,FOP,Booking error,Hotel
# Owner: Shani Hadar
# Created: 2026-02-15T08:54:54Z
# Updated: 2026-02-15T09:16:08Z

@regression @provider:expedia
Feature: 73871 Expedia - Booking error message displayed and status not set to in-progress
  As a corporate traveler
  I want to see a meaningful error message when a hotel booking fails
  So that I know the booking did not go through and can try again

  @priority:critical
  Scenario: Booking error message is displayed and booking status is not "In Progress"
    Given I am logged in as "expedia" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I add the first available room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "When I set the CVV for the selected payment card" that calls DSL setCVVForCard in CartFop.js
    When I proceed to checkout
    And I complete the booking
    # TODO: Create step "Then a booking error message should be displayed" that calls DSL verifyBookingErrorMessage in Checkout.js
    # TODO: Create step "Then the booking status should not be "In Progress"" that calls DSL verifyStatusNotInProgress in Cart.js
    When I attempt to cancel the trip safely
