# ADO Test Case ID: 78425
@ado:78425
@regression @shell @approval_flow @homepage @cars @manual_quote @priority:high
Feature: 78425 Approval Flow - Approve trip from Home Page "Awaiting my approval" tab (Desktop)
  As an approver
  I want to approve a pending trip straight from the homepage "Awaiting my approval" tab
  So that the traveler's trip moves to Approved without me searching for it

  # The ADO steps log in as "pini@gov.nl", but the approver in the flow is "app@rov.er", so the
  # approval is done as "app@rov.er". It is a pre-booking approval, so once approved the trip goes
  # back to the traveler's cart with no "Approved" status label; the approval (and the traveler's
  # confirmation, which the framework has no inbox access for) is checked through the approvals
  # dialog history instead. "wait@tothe.app" must have a single-approver flow ("app@rov.er").
  Scenario: Approver approves a pending trip from the homepage Awaiting my approval tab
    Given I am logged in as "wait@tothe.app" booking a new trip
    And I have added myself as the traveler
    When I navigate to the manual quote search page
    And I add a car manual quote with pick up in "Portland" and drop off in "San Francisco"
    And I click proceed on the reference fields popup
    And I click the proceed to checkout button
    And I send booking for approval
    And I logout from the application
    And I am logged in as "app@rov.er"
    And I open the trip awaiting my approval from the homepage
    Then the trip approval bar should show "Trip awaiting your approval" with "Decline" and "Approve" buttons
    When I approve the trip from the approvals bar
    And I view the approvers in the trip overview
    Then the approval history should list 1 approvals each with an approved on date
