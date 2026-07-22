# Test Name: 37321 Approval flow according to traveler - I'm the traveler
# Description:
# Status: Active
# Labels: Regression,Approval flow,2026 plan 1
# Owner: Noam Miller
# Created: 2023-10-25T11:20:57Z
# Updated: 2026-02-16T01:43:18Z

@regression @shell @approval_flow @cars
Feature: 37321 - Approval flow according to traveler - I'm the traveler
  As a travel arranger who is also the traveler
  I want to book a car that triggers an approval flow based on the traveler
  So that the trip is sent to the correct approver and shows an active approval

  Scenario: Book a car as the traveler and validate the traveler-based approval flow
    Given I am logged in as "fabian@apflow.mx" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "ORD"
    And I add the first car to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I click the proceed to checkout button
    And I click the submit for approval button
    Then the pre-booking approval success message should be displayed
    When I click go to trip button
    And I view the approvers in the trip overview
    # TODO: verify the approval flow is ACTIVE — add Cart.verifyApprovalFlowActive wrapping the approvals-dialog ".active"='ACTIVE' status (test 37321)
    Then the approval flow should be active
    # TODO: verify a specific approver is assigned and close the approvals dialog — add Cart.verifyApproverAssigned(page, name) matching ".approver-name" then closeApprovalsDialog (test 37321)
    And the approver "Jacqueline Luna-Castro" should be assigned to the approval flow
    Then I successfully cancel the trip
