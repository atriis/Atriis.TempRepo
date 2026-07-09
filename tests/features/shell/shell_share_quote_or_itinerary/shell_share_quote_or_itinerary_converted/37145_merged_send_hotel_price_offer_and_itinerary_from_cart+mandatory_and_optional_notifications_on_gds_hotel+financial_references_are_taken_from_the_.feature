# Test Name: 37145 MERGED send hotel price offer and itinerary from cart + mandatory and optional notifications on GDS hotel + Financial references are taken from the primary traveler - booker
# Description:
# Status: Active
# Labels: Share Itinerary,share quote,Hotel,No Amadeus Hotel Book,Regression,push notifications,Financial Reference Code,NL government,Amadeus Value hotel,Daily Hotels,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-01-30T12:15:44Z
# Updated: 2025-12-08T02:00:47Z

@regression @shell
Feature: Send hotel price offer and itinerary from cart with GDS hotel notifications and primary-traveler financial references

  As a user booking a GDS hotel and sharing it from the cart
  I want the mandatory and optional hotel notifications shown and acknowledged, the price offer and itinerary emails sent, and the financial references sourced from the primary traveler
  So that quotes and itineraries can be shared with the correct notifications and financial reference codes

  Scenario: Send hotel price offer and itinerary from cart, acknowledge GDS hotel notifications, and verify financial references are taken from the primary traveler
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "zimbabwe" for 1 night
    And I fill in NL reference fields education and courses
    And I filter hotel results by hotel name "Bulawayo Central" or skip if unavailable
    And I select the first hotel result
    And I add the first available room to my cart
    # TODO: no catalog phrase for validating the mandatory and optional GDS hotel notification messages shown on screen
    Then the on-screen hotel notification should show the optional message "optional message for GDS hotel in zimbabwe" and the mandatory message "mandatory message for GDS hotel in zimbabwe"
    # TODO: no catalog phrase for acknowledging the mandatory hotel notification popup (tick acknowledgement checkbox and confirm)
    When I acknowledge the mandatory hotel notification and close the popup
    # TODO: no catalog phrase for opening the notification center
    And I open the notification center
    # TODO: no catalog phrase for validating the GDS hotel notification messages in the notification center
    Then the notification center should show the optional message "optional message for GDS hotel in zimbabwe" and the mandatory message "mandatory message for GDS hotel in zimbabwe"
    # TODO: no catalog phrase for marking notifications as read and closing the notification center
    When I mark the notifications as read and close the notification center
    And I click the share quote button
    And I send the share
    Then the cart status should be Pending booking
    And the hotel should appear as refundable in cart
    When I click the share itinerary button
    And I send the share
    And I proceed to checkout
    # TODO: no catalog phrase for opening the financial reference dropdown on the checkout page
    And I open the financial reference dropdown at checkout
    # TODO: no catalog phrase for validating the checkout financial reference dropdown options are taken from the primary traveler
    Then the financial reference dropdown at checkout should contain the following options:
      | uploadname10 (uploadcode10) |
      | uploadname9 (uploadcode9) |
      | uploadname8 (uploadcode8) |
    # TODO: no catalog phrase for closing the checkout financial reference dialog
    When I close the financial reference dialog at checkout
    Then I successfully cancel the trip
