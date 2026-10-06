# ADO Test Case ID: 78426
@ado:78426
@regression @shell @approval_flow @homepage @cars @manual_quote @priority:high
Feature: 78426 Approval Flow - Decline trip from Home Page "Awaiting my approval" tab (Desktop)
  As an approver
  I want to decline a pending trip straight from the homepage "Awaiting my approval" tab
  So that the traveler's trip moves to Declined with my reason

  # The framework has no inbox access, so the traveler's decline e-mail is not checked, and the
  # approvals UI never shows the decline reason back. The cart's Trip overview has no "Declined"
  # badge (only Pre-Trip Approval / Trip planning / In approval / Cancelled / Assistance
  # requested), so the Declined status is verified on the traveler's Trips page instead. That list
  # lags the decision by a few minutes (the trip keeps showing "In Approvals"), so the check polls.
  # "wait@tothe.app" must have a single-approver flow ("app@rov.er").
  Scenario: Approver declines a pending trip from the homepage Awaiting my approval tab
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
    When I click "Decline" on the trip approvals bar
    Then the decline reason dialog should be displayed
    When I decline the trip with reason "Trip not aligned with travel policy"
    Then the trip approvals bar title should be "Trip was declined"
    When I logout from the application
    And I am logged in as "wait@tothe.app"
    And I navigate to the trips page
    And I search the trips page for the scenario trip
    And I submit the trips search
    Then the scenario trip should show the "Declined" status in the trips search results
