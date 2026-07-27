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
    Given I am logged in as "tree@tree.com"
    When I book a new trip
    And I add a traveler by name "test dont remove" from the search autocomplete
    And I search for a car at "lhr"
    # TODO: I handle the reference fields popup (reuse "I select the mandatory reference field option in the popup" + "I click proceed on the reference fields popup" in tests/steps/dynamic_fields.steps.js)
    And I handle the reference fields popup
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    # TODO: I fill in the out of policy justification if required (Cart.fillOOPJustificationIfRequired in tests/steps/cart.steps.js)
    When I fill in the out of policy justification if required
    And I proceed to checkout
    # TODO: the mandatory unread notifications message should be displayed (Notifications.verifyMandatoryUnreadMessageDisplayed in tests/steps/push_notifications.steps.js)
    Then the mandatory unread notifications message should be displayed
    # TODO: I open the notification center (Notifications.openNotificationCenter in tests/steps/push_notifications.steps.js)
    When I open the notification center
    # TODO: I open the mandatory notification message (Notifications.openMandatoryMessage in tests/steps/push_notifications.steps.js)
    And I open the mandatory notification message
    # TODO: I close the notification message (Notifications.closeNotificationMessage in tests/steps/push_notifications.steps.js)
    And I close the notification message
    And I click the proceed to checkout button
    # TODO: the checkout reference questions section should be displayed (Checkout.verifyReferenceQuestionsSectionVisible in tests/steps/checkout.steps.js)
    Then the checkout reference questions section should be displayed
    When I navigate to cart from checkout
    Then the booking status should be "Pending booking"
    And I successfully cancel the quote
