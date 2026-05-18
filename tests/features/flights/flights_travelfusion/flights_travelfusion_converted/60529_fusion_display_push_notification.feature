# Test Name: 60529 Fusion - Display Push notification
# Status: Active
# Labels: Fusion,Flights,Regression,push notifications,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-30T01:58:14Z
# Updated: 2025-10-30T02:10:25Z

@regression @flights @fusion @push-notifications @priority:medium
Feature: 60529 Fusion - Display push notification on redirect to cart
  As a corporate traveler adding a Fusion EasyJet flight to my trip
  I want a push notification to be displayed when redirected to the cart
  So that I am notified about important booking information

  Scenario: Push notification is displayed when redirected to cart after adding flight
    Given I am logged in as "pushNote@fusion.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MIL"
    Then flight results should be available
    When I filter results by carrier "U2"
    # TODO: implement 'I add the first flight to cart and verify push notification on redirect' — see Display_push_notification_on_redirect_to_cart() in Testim source (test 60529)
    Then a push notification should be displayed
