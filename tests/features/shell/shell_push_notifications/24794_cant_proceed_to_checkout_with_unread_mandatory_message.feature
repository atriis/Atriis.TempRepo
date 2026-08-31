# Test Name: 24794 cant proceed to checkout with unread mandatory message
# Description: cant proceed to checkout with unread mandatory notification.
#   can proceed if all the mandatory notifications are marked as read
# Status: Active
# Labels: notification center,Regression,Cars,Adding Passengers,Daily Shell,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-02-16T02:20:08Z
# Updated: 2025-09-21T03:19:07Z
#
# Source: tests/testim/active/regression_set_new_front/shell/push_notifications/
#   24794_cant_proceed_to_checkout_with_unread_mandatory_message.js
# Subject under test: the notification-center mandatory-unread gate at checkout
#   (a car search is only the vehicle to reach checkout).

@regression @shell @push-notifications @notification-center @cars
Feature: 24794 - Cannot proceed to checkout with an unread mandatory notification
  As a traveler who has mandatory notifications
  I want checkout to stay blocked until every mandatory message is read
  So that I cannot skip required travel information before booking

  Scenario: Cannot proceed to checkout while a mandatory message is unread, then proceed once it is read
    Given I am logged in as "Pini@tree.com"
    When I book a new trip
    And I have added myself as the traveler
    # "Initiate", not "search for": the New trip reference fields popup opens on top of the results and
    # blocks them from loading, so a step that waits for cars here would always time out. The
    # add-to-cart step below does the results wait, once the popup is out of the way.
    And I initiate a car search at "lhr"
    And I select the mandatory reference field option in the popup
    And I click proceed on the reference fields popup
    # The mandatory notifications must stay UNREAD, so the popup is dismissed by reloading the page
    # rather than by its "Got it" button — acknowledging it would mark the messages read and the
    # checkout gate under test would never engage.
    Then the mandatory notifications popup should be displayed
    When I refresh the page
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    When I fill in the OOP justification text "abc"
    # Deliberately NOT "I proceed to checkout": checkout is expected to stay blocked here, so the click
    # must not wait for a checkout page that never loads.
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    Then the mandatory unread notifications message should be displayed
    When I open the notification center
    And I mark all unread notifications as read
    And I close the notification center
    # "once enabled": the CTA is still disabled at this point and only flips after Vue re-renders the
    # cart on the cleared hasUnreadMandatoryNotifications flag — clicking immediately is a no-op.
    And I click the proceed to checkout button once enabled
    Then the "Travellers Reference Questions" reference section is displayed
    # Teardown — the car is a real GDS quote, so it must not be left pending in the cart.
    When I navigate to the trip cart
    Then the booking status should be "Pending booking"
    And I successfully cancel the quote
