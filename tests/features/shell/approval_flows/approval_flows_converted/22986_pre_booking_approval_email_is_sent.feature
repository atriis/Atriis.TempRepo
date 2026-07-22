# Test Name: 22986 pre booking approval email is sent
# Description:
# Status: Active
# Labels: Regression,Approval flow,Email,Daily Shell,2026 plan 1
# Owner: Noam Miller
# Created: 2023-10-24T02:57:07Z
# Updated: 2026-02-11T02:09:05Z

@regression @shell @approval_flow @email
Feature: 22986 - Pre-booking approval email is sent
  As a corporate traveler whose trips require pre-booking approval
  I want my order submitted to my approver when I proceed to checkout
  So that an approval email is sent before the booking is finalized

  Scenario: Submitting a flight trip for pre-booking approval sends the approval email
    Given I am logged in as "pre@booking.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "lon" to "mad"
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    # TODO: verify the pre-booking approval success message is displayed (collapses the two Testim clicks on ".success-message__title"); implement Checkout.verifyApprovalSuccessMessageDisplayed wrapping CheckoutPage.getApprovalSuccessMessageText / APPROVAL_SUCCESS_MESSAGE
    Then the pre-booking approval success message should be displayed
