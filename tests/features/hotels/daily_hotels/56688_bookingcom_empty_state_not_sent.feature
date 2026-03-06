# Test Name: HYBRID for 56688 Booking.com - Empty state is not being sent when passanger's location is a country that does not have a state
# Description: 
# Status: Active
# Labels: Booking.com,Regression,hybrid,Hotel,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-01-13T07:39:11Z
# Updated: 2025-06-23T07:37:33Z

@regression @provider:bookingcom
Feature: 56688 Booking.com - Empty state is not sent when passenger location has no state field
  As a corporate traveler from a country that does not use a state field in addresses
  I want to book a Booking.com hotel without a state in my location
  So that the booking request does not send an empty state value to Booking.com

  @priority:medium
  Scenario: Booking.com hotel search succeeds without empty state field in passenger location
    Given I am logged in as "bookingcom" "user_specific" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I wait to see view rates text in results page
