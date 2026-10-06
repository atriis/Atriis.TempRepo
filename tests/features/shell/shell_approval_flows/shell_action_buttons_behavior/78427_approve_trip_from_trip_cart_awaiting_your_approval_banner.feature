# ADO Test Case ID: 78427
@ado:78427
@regression @shell @approval_flow @cart @cars @manual_quote @priority:high
Feature: 78427 Approval Flow - Approve trip from Trip Cart "Trip awaiting your approval" banner (Desktop)
  As an approver
  I want to approve a pending trip from the banner in its trip cart
  So that the traveler's trip moves to Approved

  # The ADO steps log in as "wait@tothe.app" to approve, but that is the traveler; the approver in
  # the flow is "app@rov.er", so the approval is done as "app@rov.er". The approver opens the trip
  # cart directly by its trip id. In the trip cart, approving shows no toast: the banner's title
  # switches to "Approved successfully" (approvals-bar.vue approvalBarTitle), which is what the ADO
  # "Approved successfully" check is asserted against. "wait@tothe.app" must have a single-approver
  # flow ("app@rov.er").
  Scenario: Approver approves a pending trip from the Trip Cart approval banner
    Given I am logged in as "wait@tothe.app" booking a new trip
    And I have added myself as the traveler
    When I navigate to the manual quote search page
    And I add a car manual quote with pick up in "Portland" and drop off in "San Francisco"
    And I click proceed on the reference fields popup
    And I click the proceed to checkout button
    And I send booking for approval
    And I logout from the application
    And I am logged in as "app@rov.er"
    And I navigate to the scenario trip
    Then the trip approval bar should show "Trip awaiting your approval" with "Decline" and "Approve" buttons
    When I approve the trip from the approvals bar
    Then the trip approvals bar title should be "Approved successfully"
