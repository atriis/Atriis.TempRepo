# ADO Test Case ID: 85351
@ado:85351
@regression @shell @approval_flow @cars
Feature: 85351 Approval Flow - Validate pre book approval w/o approval steps
  As a corporate traveler whose approval flow has pre-booking enabled but no approval steps
  I want the cart to still route my trip through pre-booking approval
  So that the looser pre-booking validation (US 84058) does not skip the approval request

  @priority:high
  Scenario: Cart shows the Send For Approvals button for a car when pre-booking has no approval steps
    Given I am logged in as "dont@change.com" booking a new trip
    And I have added myself as the traveler
    When I initiate a car search at "LHR"
    And I click proceed on the reference fields popup
    And I add the first car to cart
    Then the cart checkout button should display the text "Send For Approvals"
