# Test Name: Push notification displayed after adding a flight to cart
# Description: Verify that a push notification appears in the header after
#              a user hot-books a new trip and adds a LON-MAD flight to cart.
# Status: Active
# Labels: Regression,Flights,General,Push Notification

@regression @flights @general @push-notification
Feature: Push notification displayed after adding a flight to cart
  As a corporate traveler
  I want to see a push notification after adding a flight to cart
  So that I am notified about my trip activity

  @priority:critical
  Scenario: Push notification is displayed after adding a LON-MAD flight to cart
    Given I am logged in as "PUSH@NOTIF.COM" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MAD"
    And I add the first flight to cart
    Then a push notification should be displayed
