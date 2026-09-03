# Test Name: 37145 MERGED send hotel price offer and itinerary from cart + mandatory and optional notifications on GDS hotel + Financial references are taken from the primary traveler - booker
# Description:
# Status: Active
# Labels: Share Itinerary,share quote,Hotel,No Amadeus Hotel Book,Regression,push notifications,Financial Reference Code,NL government,Amadeus Value hotel,Daily Hotels,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-01-30T12:15:44Z
# Updated: 2025-12-08T02:00:47Z

@regression @provider:general
Feature: 37145 Send hotel price offer and itinerary from cart with GDS hotel notifications and primary-traveler financial references

  As a user booking a GDS hotel and sharing it from the cart
  I want the mandatory and optional hotel notifications shown and acknowledged, the price offer and itinerary emails sent, and the financial references sourced from the primary traveler
  So that quotes and itineraries can be shared with the correct notifications and financial reference codes

  Scenario: Send hotel price offer and itinerary from cart, acknowledge GDS hotel notifications, and verify financial references are taken from the primary traveler
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added myself as the traveler
    When I initiate a hotel search in "rome" for 1 night
    And I fill in NL reference fields education and courses
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the mandatory notifications popup should be displayed
    And I should see mandatory notifications with message "mandatory message for GDS hotel in italy"
    And mandatory notifications close button is disabled
    And I acknowledge the push notification
    And I refresh the page
    When I open the notification center
    Then the notification center should display the following notifications:
      | optional message for GDS hotel in Italy Mark as read   |
      | optional message for GDS hotel in Italy   |
      | mandatory message for GDS hotel in Italy   |
    Then the notification center displays 3 notifications
    When I click mark as read in the notification center
    Then the notification center displays 2 notifications
    And I close the notification center
    And the booking status should be "Pending booking"
    When I click the share quote button
    And I wait to see "Subject" field in share dialog
    Then I send the share and see success notification
    And I click the share itinerary button
    Then I wait to see "Subject" field in share dialog
    Then I send the share and see success notification
    When I accept Terms & Conditions
    And I click the proceed to checkout button
    Then the financial reference dropdown should contain the following options:
    | uploadname10 (uploadcode10) |
    | uploadname9 (uploadcode9) |
    | uploadname8 (uploadcode8) |
    When I close the financial reference dialog in the trip overview
    And I successfully cancel the trip
