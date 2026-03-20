# Test Name: 73871 Expedia - In case of booking error we show the error and the status is not in progress
# Description: 
# Status: Active
# Labels: Regression,Expedia,FOP,Booking error,Hotel
# Owner: Shani Hadar
# Created: 2026-02-15T08:54:54Z
# Updated: 2026-02-15T09:16:08Z

@regression @provider:expedia
Feature: 73871 Expedia - In case of booking error we show the error and the status is not in progress
  As a corporate traveler
  I want to see a meaningful error message when a hotel booking fails
  So that I know the booking did not go through and can try again

  @priority:critical
  Scenario: In case of booking error we show the error and the status is not in progress
    Given I am logged in as "vered" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    And I fill credit card cvv if needed
    When I proceed to checkout
    When I complete the booking without navigating to trip overview
    Then a booking error message should be displayed
    When I click back to trip
    Then the booking status should be "Pending booking"