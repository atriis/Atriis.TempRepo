# Test Name: 37326 Approval flow according to traveler - Guest, Copy settings from My Profile
# Description:
# Status: Active
# Labels: Regression,Hotel,guest,Approval flow,Full Purchase,Dynamic fields,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-11-06T12:35:05Z
# Updated: 2025-07-30T03:23:51Z

@regression @shell @hotels @approval_flow
Feature: 37326 - Approval flow according to traveler - Guest, Copy settings from My Profile
  As an agent booking on behalf of a guest traveler
  I want to add a specific guest whose settings are copied from my profile and book a refundable hotel requiring approval
  So that the approval flow assigns the correct approver according to the traveler

  Scenario: Book a refundable hotel for a specific guest copying settings from my profile and send for approval
    Given I am logged in as "fabian@apflow.mx" booking a new trip
    # TODO: add the specific guest Israel Yakov Israeli (personal + contact fields) copying settings from My Profile (Search.addSpecificGuestCopyingSettingsFromMyProfile)
    And I add a specific guest copying settings from my profile
    When I search for a hotel in "LON" for 1 night
    And I select the first hotel result
    And I filter room results by refundable
    And I add a refundable room to my cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    And the hotel should appear as refundable in cart
    When I add a credit card as payment method
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    And I click the submit for approval button
    And I click go to trip button
    When I view the approvers in the trip overview
    # TODO: verify the named approver appears in the trip approvals dialog approver list, then close it (Cart.verifyApproverAssigned)
    Then the approver "Jacqueline Luna-Castro" should be assigned to the approval flow
    Then I successfully cancel the trip
