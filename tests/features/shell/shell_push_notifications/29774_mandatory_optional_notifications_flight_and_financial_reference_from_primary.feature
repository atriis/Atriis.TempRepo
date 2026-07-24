# Test Name: 29774 MERGED mandatory and optional notifications for flight by destination and carrier + Financial reference codes are taken from the user group of the primary traveler - 2 users, second is the primary
# Description: mandatory and optional notifications appear in case searching for flight to zimbabwe,
#   and in case adding emirates flight to zimbabwe to the cart
# Status: Active
# Labels: push notifications,Flights,No Amadeus Hotel Book,Pre Prod,Sanity,Financial Reference Code,NL government,Regression,Search Flight,Daily Shell,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-01-30T11:31:33Z
# Updated: 2026-02-11T02:16:21Z
#
# Source: tests/testim/active/regression_set_new_front/shell/push_notifications/
#   29774_merged_mandatory_and_optional_notifications_for_flight_by_destination_and_carrier+financial_reference_codes_are_taken_from_the_user_group_of_the.js
# MERGED test — two subjects:
#   A) mandatory + optional notifications appear by destination (Zimbabwe) at search and by carrier (Emirates) when adding to cart.
#   B) financial reference codes come from the user group of the primary traveler (olga, the second/primary of two travelers).

@regression @shell @push-notifications @notification-center @flights @financial-reference
Feature: 29774 - Merged flight notifications by destination and carrier, and financial reference codes from the primary traveler
  As a traveler booking a flight with mandatory notifications
  I want destination and carrier notifications to appear and to be listed in the notification center
  And the financial reference codes to be taken from the primary traveler's user group
  So that required information is surfaced and the correct codes are offered at checkout

  Scenario: Destination and carrier notifications appear and merge in the notification center, with financial codes from the primary traveler
    Given I am logged in as "shani@testimcorpnl.com"
    When I book a new trip
    And I have added traveler by name "pini"
    And I have added "olga" as primary traveler
    And I search for a round trip flight from "ams" to "zimbabwe"
    And I select the "Type of Trip" reference field as "Education and courses" and proceed
    Then the mandatory notifications popup should be displayed
    When I acknowledge the push notification
    And I wait for add to trip text to be visible
    And I filter results by carrier "Emirates"
    And I add the first flight to cart
    Then the mandatory notifications popup should be displayed
    When I acknowledge the push notification
    And I refresh the page
    And I open the notification center
    Then the notification center should display the following notifications:
      | optional notification for flight to Zimbabw ...   |
      | optional notification for emirates flight t ...   |
      | mandatory notification for flight to Zimbab ...   |
      | mandatory notification for emirates flight  ...   |
    When I close the notification center
    And I fill credit card cvv if needed
    And I fill in the OOP justification text "abc"
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    Then the financial reference dropdown should contain the following options:
      | uploadname7 (uploadcode7) |
      | uploadname5 (uploadcode5) |
      | uploadname6 (uploadcode6) |
    When I close the financial reference dialog in the trip overview
    Then I successfully cancel the quote
