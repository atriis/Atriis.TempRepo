# Test Name: 46043 [Merge] Approval Flow - Button "Send for approval" has the correct text and approval message is displayed after sending for approval
# Description:
# Status: Active
# Labels: Approval flow,Regression,UI,Checkout,merge,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-10T01:52:34Z
# Updated: 2025-04-14T06:58:46Z

@regression @shell @approval_flow @flights
Feature: 46043 - Send for approval button has the correct text and approval message is displayed
  As a corporate traveler whose trips require pre-booking approval
  I want the "Send For Approvals" button to be clearly labelled and a confirmation shown after submitting
  So that I know my order was sent to my approver and I will be kept up to date on its progress

  Scenario: Sending a flight trip for approval shows the correct button text and approval confirmation message
    Given I am logged in as "victor@approvalflow.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "NYC"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I add a credit card as payment method
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    # TODO: verify the send-for-approval button text; implement Checkout.verifySendForApprovalButtonText(this.page, expected) asserting the ".is-hidden-mobile" button reads the given text
    Then the send for approval button should display the text "Send For Approvals"
    When I click the submit for approval button
    Then the pre-booking approval success message should be displayed
    # TODO: verify the approval-progress email line; implement Checkout.verifyApprovalProgressEmailMessageDisplayed(this.page) asserting ".success-message__email" reads "We will keep you up to date with the approval progress"
    And the approval progress email message should be displayed
    When I click go to trip button
    Then I successfully cancel the trip
