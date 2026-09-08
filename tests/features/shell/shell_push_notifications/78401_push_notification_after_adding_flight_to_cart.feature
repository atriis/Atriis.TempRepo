@regression @flights @general @push-notifications
Feature: 78401 Flights - Push notification displayed after adding a flight to cart
  As a corporate traveler
  I want to see a push notification after adding a flight to cart
  So that I am notified about my trip activity

  @priority:critical
  Scenario: Push notification is displayed after adding a LON-MAD flight to cart
    Given I am logged in as "push@notif.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MAD"
    And I add the first flight to cart
    Then a push notification should be displayed
