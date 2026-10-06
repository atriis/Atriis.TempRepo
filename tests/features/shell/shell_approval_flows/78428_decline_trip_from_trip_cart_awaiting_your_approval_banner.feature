# ADO Test Case ID: 78428
@ado:78428
@regression @shell @approval_flow @cars @manual_quote @priority:high
Feature: 78428 Approval Flow - Decline trip from Trip Cart "Trip awaiting your approval" banner (Desktop)
  As an approver
  I want to decline a pending trip from the "Trip awaiting your approval" banner in its trip cart
  So that the traveler's trip moves to Declined with my reason

  # The ADO steps expect a "Declined successfully" toast, but only the homepage approval card
  # (trip-preview-home) raises it. Declining from the trip cart banner shows no toast; the banner
  # title switches to "Trip was declined" instead, so that is what is asserted here.
  # "wait@tothe.app" must have a single-approver flow ("app@rov.er").
  Scenario: Approver declines a pending trip from the trip cart approval banner
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
    When I click "Decline" on the trip approvals bar
    Then the decline reason dialog should be displayed
    When I decline the trip with reason "Trip not aligned with travel policy"
    Then the trip approvals bar title should be "Trip was declined"
