# Test Name: 54558 Recalculate approval flow by reference fields
# Description:
# Status: Active
# Labels: Regression,Reference Fields,Approval flow,Daily Shell,2026 plan 1
# Owner: pini harush
# Created: 2024-11-21T12:27:09Z
# Updated: 2025-12-10T09:36:50Z

@regression @shell @approval_flow @manual_quote @reference_fields
Feature: 54558 - Recalculate approval flow by reference fields
  As a travel arranger on an approval-flow profile
  I want changing checkout reference fields to recalculate the approval flow
  So that the finalize button toggles between direct booking and submitting for approval

  Scenario: Reference field changes recalculate the approval flow at checkout
    Given I am logged in as "testim@approval.ref" booking a new trip
    And I have added myself as the traveler
    When I add a "Handling Fee" other manual quote with comment "" and base fare 567
    And I click the proceed to checkout button
    # TODO: assert the checkout shows the RF section named "Recalculate Approval Flow" -> Checkout.verifyRecalculateApprovalFlowSectionDisplayed (waitForText ".general-section .label" == 'Recalculate Approval Flow')
    Then the checkout should display the Recalculate Approval Flow section
    # TODO: assert finalize button text -> Checkout.verifyFinalizeButtonText (waitForText "[class^='btn--width']" matches /(Book and Finalize)|(Finalize)/)
    And the finalize button should read "Book and Finalize"
    # TODO: expand collapse section + set an approval-flow reference-field dropdown value -> Checkout.changeReferenceFieldToRecalculateApprovalFlow
    When I change a reference field value to trigger approval recalculation
    # TODO: assert finalize button text -> Checkout.verifyFinalizeButtonText (matches /(Submit for Approval)|(Send For Approvals)/)
    Then the finalize button should read "Submit for Approval"
    # TODO: expand collapse section + set an approval-flow reference-field dropdown value -> Checkout.changeReferenceFieldToRecalculateApprovalFlow
    When I change a reference field value to trigger approval recalculation
    # TODO: assert finalize button text -> Checkout.verifyFinalizeButtonText (matches /(Book and Finalize)|(Finalize)/)
    Then the finalize button should read "Book and Finalize"
    # TODO: assert a reference field is linked to the recalculation -> Checkout.verifyReferenceFieldLinkedToRecalculateApprovalFlow (waitForText label == 'linked to Recalculate Approval Flow')
    And the reference field should be linked to Recalculate Approval Flow
    # TODO: expand collapse section + set an approval-flow reference-field dropdown value -> Checkout.changeReferenceFieldToRecalculateApprovalFlow
    When I change a reference field value to trigger approval recalculation
    # TODO: assert finalize button text -> Checkout.verifyFinalizeButtonText (matches /(Submit for Approval)|(Send For Approvals)/)
    Then the finalize button should read "Submit for Approval"
    # TODO: expand collapse section + set an approval-flow reference-field dropdown value -> Checkout.changeReferenceFieldToRecalculateApprovalFlow
    When I change a reference field value to trigger approval recalculation
    # TODO: assert finalize button text -> Checkout.verifyFinalizeButtonText (matches /(Book and Finalize)|(Finalize)/)
    Then the finalize button should read "Book and Finalize"
