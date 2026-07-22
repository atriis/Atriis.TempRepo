# Test Name: 37327 Approval flow according to user group - Guest, Copy settings from User Group
# Description:
# Status: Active
# Labels: Regression,Approval flow,2026 plan 1
# Owner: Noam Miller
# Created: 2023-10-25T01:06:49Z
# Updated: 2026-02-16T01:44:55Z

@regression @shell @approval_flow @cars
Feature: 37327 - Approval flow according to user group - Guest, Copy settings from User Group
  As an agent booking on behalf of a guest traveler
  I want to add a guest whose settings are copied from a user group and book a car requiring approval
  So that the approval flow assigns the correct approvers from that user group

  Scenario: Book a car for a guest copying settings from the user group and send for approval
    Given I am logged in as "fabian@apflow.mx" booking a new trip
    # TODO: add a random guest traveler with a generated name whose settings are copied from a user group, filling detailed personal/contact fields (Search.addRandomGuestCopyingSettingsFromUserGroup)
    And I have added a random guest traveler copying settings from the user group
    When I search for a car at "ORD"
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I click the proceed to checkout button
    And I click the submit for approval button
    Then the pre-booking approval success message should be displayed
    When I click go to trip button
    And I view the approvers in the trip overview
    # TODO: verify the approvals dialog shows ACTIVE status (Cart.verifyApprovalFlowActive)
    Then the approval flow should be active
    # TODO: verify each named approver appears in the trip approvals dialog approver list (Cart.verifyApproverAssigned)
    Then the approver "Fabian Jaimes" should be assigned to the approval flow
    And the approver "Victor Alvarez" should be assigned to the approval flow
    Then I successfully cancel the trip
