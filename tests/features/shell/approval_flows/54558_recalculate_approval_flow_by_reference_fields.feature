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
    And I add a flight manual quote from "LON" to "MAD"
    And I click proceed on the reference fields popup
    Then I should see a quote with status "On hold"
    And I click the proceed to checkout button
    Then the checkout should display the Recalculate Approval Flow section
    And the finalize button should read "Book and Finalize"
    When I select the "Recalculate Approval Flow" reference field as "Approver needed"
    Then the finalize button should read "Submit for Approval"
    When I select the "Recalculate Approval Flow" reference field as "We'll see"
    Then the finalize button should read "Book and Finalize"
    And the reference field should be linked to Recalculate Approval Flow
    When I select the "Recalculate Approval Flow" reference field as "Approver needed"
    Then the finalize button should read "Submit for Approval"
    When I select the "Recalculate Approval Flow" reference field as "We'll see"
    Then the finalize button should read "Book and Finalize"
